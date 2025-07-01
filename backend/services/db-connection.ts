import mongoose from "mongoose";
import dotenv from "dotenv";
import { AtlasIPManager } from "./atlas-ip-manager";

dotenv.config();

export class DatabaseConnection {
  private static isConnected = false;
  private static connectionPromise: Promise<void> | null = null;
  private static atlasManager: AtlasIPManager | null = null;

  /**
   * Connects to MongoDB with automatic IP allowlisting for Atlas
   */
  static async connect(
    connectionString?: string,
    options?: mongoose.ConnectOptions,
  ): Promise<void> {
    // Return existing connection if already connected
    if (this.isConnected) {
      return;
    }

    // Return existing connection promise if already connecting
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    const mongoUri = connectionString || process.env.MONGO;
    if (!mongoUri) {
      throw new Error("MongoDB connection string not provided");
    }

    this.connectionPromise = this.performConnection(mongoUri, options);
    return this.connectionPromise;
  }

  private static async performConnection(
    mongoUri: string,
    options?: mongoose.ConnectOptions,
  ): Promise<void> {
    const isAtlas =
      mongoUri.includes("mongodb.net") || mongoUri.includes("mongodb+srv");
    const autoManageIP = process.env.DISABLE_AUTO_IP_MANAGEMENT !== "true";
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    if (isAtlas && autoManageIP) {
      console.log("Atlas connection detected - managing IP allowlist");

      try {
        this.atlasManager = AtlasIPManager.fromEnvironment();
        await this.atlasManager.addCurrentIPToAllowlist("auto-added by app");

        // Wait a moment for IP to propagate
        await sleep(2000);
      } catch (error) {
        console.warn("Failed to manage Atlas IP allowlist:", error.message);
        console.log("Attempting connection anyway...");
      }
    }

    const mongoOpts: mongoose.ConnectOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // Improve TLS configuration for Atlas
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      // Add buffer settings
      bufferCommands: false,
      ...options,
    };

    try {
      await mongoose.connect(mongoUri, mongoOpts);

      this.isConnected = true;
      console.log("MongoDB connected successfully");

      // Set up disconnect handlers
      mongoose.connection.on("disconnected", () => {
        console.log("MongoDB disconnected");
        this.isConnected = false;
        this.connectionPromise = null;
      });

      mongoose.connection.on("error", (error) => {
        console.error("MongoDB connection error:", error);
        this.isConnected = false;
        this.connectionPromise = null;
      });
    } catch (error) {
      this.connectionPromise = null;

      if (isAtlas && error.message.includes("IP") && autoManageIP) {
        console.error(
          "Connection failed - possibly IP not yet allowlisted. Retrying in 5 seconds...",
        );
        await sleep(5000);

        try {
          await mongoose.connect(mongoUri, mongoOpts);
          this.isConnected = true;
          console.log("MongoDB connected successfully on retry");
        } catch (retryError) {
          throw new Error(
            `MongoDB connection failed after retry: ${retryError.message}`,
          );
        }
      } else {
        throw new Error(`MongoDB connection failed: ${error.message}`);
      }
    }
  }

  /**
   * Disconnects from MongoDB and cleans up IP allowlist
   */
  static async disconnect(): Promise<void> {
    if (this.atlasManager) {
      try {
        await this.atlasManager.removeAllAddedIPs();
      } catch (error) {
        console.error("Failed to cleanup Atlas IPs:", error.message);
      }
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    this.isConnected = false;
    this.connectionPromise = null;
    this.atlasManager = null;
  }

  /**
   * Gets the current connection status
   */
  static getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  /**
   * Manually adds current IP to Atlas allowlist
   */
  static async addCurrentIPToAllowlist(comment?: string): Promise<void> {
    if (!this.atlasManager) {
      this.atlasManager = AtlasIPManager.fromEnvironment();
    }
    await this.atlasManager.addCurrentIPToAllowlist(comment);
  }

  /**
   * Manually removes current IP from Atlas allowlist
   */
  static async removeCurrentIPFromAllowlist(): Promise<void> {
    if (!this.atlasManager) {
      this.atlasManager = AtlasIPManager.fromEnvironment();
    }
    await this.atlasManager.removeCurrentIPFromAllowlist();
  }
}
