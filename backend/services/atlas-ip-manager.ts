/*
 * check if changing of IP while running the app
 * will cause issues with the MongoDB Atlas connection
 * then add that new current IP to the allowlist
 * and be bale to remove all added IPs on exit
 *
 */
import AxiosDigestAuth from "@mhoc/axios-digest-auth";

export class AtlasIPManager {
  private static addedIPs: Set<string> = new Set();
  private static isCleanupRegistered = false;
  private digestAuth: AxiosDigestAuth;

  constructor(
    private publicKey: string,
    private privateKey: string,
    private projectId: string,
  ) {
    this.digestAuth = new AxiosDigestAuth({
      username: this.publicKey,
      password: this.privateKey,
    });
    this.registerCleanup();
  }

  /**
   * Gets current public IP using ipinfo.io (same as GitHub Actions)
   */
  async getCurrentIP(): Promise<string> {
    try {
      const response = await this.digestAuth.request({
        method: "GET",
        url: "https://ipinfo.io/ip",
        timeout: 5000,
        headers: { "User-Agent": "DailyRepo-IPManager/1.0" },
      });
      const ip = response.data;
      console.log(`Current IP: ${ip}`);
      return ip;
    } catch (error) {
      throw new Error(`Failed to get current IP: ${error.message}`);
    }
  }

  /**
   * Adds current IP to MongoDB Atlas project access list
   */
  async addCurrentIPToAllowlist(
    comment: string = "auto-added",
  ): Promise<string> {
    const ip = await this.getCurrentIP();
    await this.addIPToAllowlist(ip, comment);
    return ip;
  }

  /**
   * Adds specific IP to MongoDB Atlas project access list
   */
  async addIPToAllowlist(
    ip: string,
    comment: string = "auto-added",
  ): Promise<void> {
    try {
      console.log(`Adding ${ip} to Atlas project access list`);

      const response = await this.digestAuth.request({
        method: "POST",
        url: `https://cloud.mongodb.com/api/atlas/v1.0/groups/${this.projectId}/accessList`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        data: [{ ipAddress: ip, comment }],
        timeout: 10000,
      });
      // only 201 is returned on successful addition from Atlas API. no need to
      // check status code since anything else will throw an error
      console.log(`Successfully added ${ip} to Atlas allowlist`);
      // add IP to this.addedIPs only if it was successfully added to Atlas
      AtlasIPManager.addedIPs.add(ip);
    } catch (error) {
      throw new Error(
        `Failed to add IP to Atlas: ${error.response?.data?.detail || error.message}`,
      );
    }
  }

  /**
   * Removes current IP from MongoDB Atlas project access list
   */
  async removeCurrentIPFromAllowlist(): Promise<void> {
    const ip = await this.getCurrentIP();
    await this.removeIPFromAllowlist(ip);
  }

  /**
   * Removes specific IP from MongoDB Atlas project access list
   */
  async removeIPFromAllowlist(ip: string): Promise<void> {
    try {
      console.log(`Removing ${ip} from Atlas project access list`);

      // Format IP for Atlas API - single IPs are stored as IP/32 in CIDR format
      // The /32 needs to be URL encoded as %2F32
      const formattedIP = ip.includes("/") ? ip : `${ip}/32`;
      const encodedIP = formattedIP.replace("/", "%2F");

      console.log(`Formatted IP for deletion: ${encodedIP}`);

      const response = await this.digestAuth.request({
        method: "DELETE",
        url: `https://cloud.mongodb.com/api/atlas/v1.0/groups/${this.projectId}/accessList/${encodedIP}`,
        headers: {
          Accept: "application/json",
        },
        timeout: 10000,
      });

      if (response.status === 200 || response.status === 204) {
        console.log(`Successfully removed ${ip} from Atlas allowlist`);
        AtlasIPManager.addedIPs.delete(ip);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(
          `IP ${ip} not found in allowlist (may have been removed already)`,
        );
        AtlasIPManager.addedIPs.delete(ip);
      } else {
        console.error(
          `Failed to remove IP from Atlas: ${error.response?.data?.detail || error.message}`,
        );
        console.error(`Full error response:`, error.response?.data);
      }
    }
  }

  /**
   * Removes all IPs that were added by this instance
   */
  async removeAllAddedIPs(): Promise<void> {
    const ipsToRemove = Array.from(AtlasIPManager.addedIPs);

    if (ipsToRemove.length === 0) {
      console.log("No IPs to clean up");
      return;
    }

    console.log(
      `Cleaning up ${ipsToRemove.length} added IPs: ${ipsToRemove.join(", ")}`,
    );

    // Remove IPs sequentially to avoid overwhelming the API
    for (const ip of ipsToRemove) {
      try {
        await this.removeIPFromAllowlist(ip);
        // Small delay between requests to be API-friendly
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to remove IP ${ip}:`, error.message);
      }
    }

    AtlasIPManager.addedIPs.clear();
    console.log("IP cleanup completed");
  }

  /**
   * Registers cleanup handlers for graceful shutdown
   */
  private registerCleanup(): void {
    if (AtlasIPManager.isCleanupRegistered) {
      return;
    }

    const cleanup = async (signal?: string) => {
      console.log(
        `\n${signal ? `Received ${signal}. ` : ""}Cleaning up Atlas IP allowlist...`,
      );
      try {
        await this.removeAllAddedIPs();
        console.log("Cleanup completed successfully");
      } catch (error) {
        console.error("Cleanup failed:", error.message);
      }

      if (signal) {
        process.exit(0);
      }
    };

    // Handle SIGINT (Ctrl+C) and SIGTERM
    process.on("SIGINT", () => cleanup("SIGINT"));
    process.on("SIGTERM", () => cleanup("SIGTERM"));

    // Note: Removing uncaught exception handlers to prevent infinite loops
    // The TLS error should be handled at the MongoDB connection level

    AtlasIPManager.isCleanupRegistered = true;
  }

  /**
   * Factory method to create AtlasIPManager from environment variables
   */
  static fromEnvironment(): AtlasIPManager {
    const publicKey = process.env.ATLAS_PUBLIC_KEY;
    const privateKey = process.env.ATLAS_PRIVATE_KEY;
    const projectId = process.env.ATLAS_PROJECT_ID;

    if (!publicKey || !privateKey || !projectId) {
      throw new Error(
        "Missing required Atlas environment variables: ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, ATLAS_PROJECT_ID",
      );
    }

    return new AtlasIPManager(publicKey, privateKey, projectId);
  }
}
