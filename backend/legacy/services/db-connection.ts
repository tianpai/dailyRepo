import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  setupIPForConnection,
  handleReconnectionIP,
  registerIPCleanup,
} from "./ip-allowlist-service";

dotenv.config();

let isConnected = false;

const mongooseOptions = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  bufferCommands: false,
  // Minimal options to avoid Bun TLS issues
};


async function connectToDatabaseDebug(): Promise<void> {
  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGO;
  if (!mongoUri) {
    throw new Error("MongoDB connection string not provided");
  }

  console.log("Debug mode: connecting directly to MongoDB (no IP management)");

  try {
    await mongoose.connect(mongoUri, mongooseOptions);

    isConnected = true;
    console.log("MongoDB connected successfully (debug mode)");

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("error", async (error) => {
      console.error("MongoDB connection error:", error);
      isConnected = false;

      try {
        await mongoose.connect(mongoUri, mongooseOptions);
        isConnected = true;
        console.log("MongoDB reconnected successfully (debug mode)");
      } catch (reconnectError) {
        console.error("Failed to reconnect:", reconnectError);
        process.exit(1);
      }
    });
  } catch (error) {
    //TODO:
    // prob need to handle MongodbServerSelectionError due to Ip change
    // right after the whitelist IP step (happens rarely but it happended)
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

export async function connectToDatabase(): Promise<void> {
  const isDebugMode = process.argv.includes("--debug");

  if (isDebugMode) {
    await connectToDatabaseDebug();
    return;
  }

  if (isConnected) {
    return;
  }

  const mongoUri = process.env.MONGO;
  if (!mongoUri) {
    throw new Error("MongoDB connection string not provided");
  }

  registerIPCleanup();

  try {
    await setupIPForConnection();

    await mongoose.connect(mongoUri, mongooseOptions);
    isConnected = true;
    console.log("MongoDB connected successfully");

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
      isConnected = false;
    });

    mongoose.connection.on("error", async (error) => {
      console.error("MongoDB connection error:", error);
      isConnected = false;

      try {
        await handleReconnectionIP();

        await mongoose.connect(mongoUri, mongooseOptions);
        isConnected = true;
        console.log("MongoDB reconnected successfully");
      } catch (reconnectError) {
        console.error("Failed to reconnect:", reconnectError);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

export function isConnectedToDatabase(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
