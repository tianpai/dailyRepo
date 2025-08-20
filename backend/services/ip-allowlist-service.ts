import needle from "needle";
import dotenv from "dotenv";

dotenv.config();

let addedIPs: string[] = [];
let isCleanupRegistered = false;

export async function getCurrentIP(): Promise<string> {
  const response = await fetch("https://ipinfo.io/ip", {
    method: "GET",
    headers: { "User-Agent": "DailyRepo-IPManager/1.0" },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Failed to get IP: ${response.status}`);
  }

  const ip = (await response.text()).trim();
  console.log(`Current IP: ${ip}`);
  return ip;
}

export async function addIPToAllowlist(ip: string): Promise<void> {
  const publicKey = process.env.ATLAS_PUBLIC_KEY;
  const privateKey = process.env.ATLAS_PRIVATE_KEY;
  const projectId = process.env.ATLAS_PROJECT_ID;

  if (!publicKey || !privateKey || !projectId) {
    throw new Error("Missing Atlas environment variables");
  }

  console.log(`Adding ${ip} to Atlas allowlist`);

  const response = await needle(
    "post",
    `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/accessList`,
    [{ ipAddress: ip, comment: "auto-added by app" }],
    {
      username: publicKey,
      password: privateKey,
      auth: "digest",
      json: true,
      timeout: 10000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  if (response.statusCode !== 201) {
    throw new Error(`Atlas API error: ${response.statusCode}`);
  }

  console.log(`Successfully added ${ip} to Atlas allowlist`);
  addedIPs.push(ip);
}

export async function removeIPFromAllowlist(ip: string): Promise<void> {
  const publicKey = process.env.ATLAS_PUBLIC_KEY;
  const privateKey = process.env.ATLAS_PRIVATE_KEY;
  const projectId = process.env.ATLAS_PROJECT_ID;

  if (!publicKey || !privateKey || !projectId) {
    return;
  }

  console.log(`Removing ${ip} from Atlas allowlist`);

  const encodedIP = `${ip}/32`.replace("/", "%2F");

  try {
    await needle(
      "delete",
      `https://cloud.mongodb.com/api/atlas/v1.0/groups/${projectId}/accessList/${encodedIP}`,
      null,
      {
        username: publicKey,
        password: privateKey,
        auth: "digest",
        timeout: 10000,
        headers: { Accept: "application/json" },
      },
    );

    console.log(`Successfully removed ${ip} from Atlas allowlist`);
  } catch (error) {
    console.error(`Failed to remove IP ${ip}:`, error.message);
  }
}

export async function setupIPForConnection(): Promise<void> {
  const currentIP = await getCurrentIP();
  await addIPToAllowlist(currentIP);
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

export async function handleReconnectionIP(): Promise<void> {
  const newIP = await getCurrentIP();
  await addIPToAllowlist(newIP);

  for (const oldIP of addedIPs.slice(0, -1)) {
    await removeIPFromAllowlist(oldIP);
  }

  addedIPs = [newIP];
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

async function removeAllAddedIPs(): Promise<void> {
  if (addedIPs.length === 0) {
    return;
  }

  console.log(`Cleaning up ${addedIPs.length} added IPs`);

  for (const ip of addedIPs) {
    await removeIPFromAllowlist(ip);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  addedIPs = [];
}

export function registerIPCleanup(): void {
  if (isCleanupRegistered) {
    return;
  }

  const cleanup = async (signal: string) => {
    console.log(`\nReceived ${signal}. Cleaning up...`);

    const isDebugMode = process.argv.includes("--debug");

    if (!isDebugMode) {
      await removeAllAddedIPs();
    } else {
      console.log("Debug mode: keeping IPs in allowlist");
    }

    process.exit(0);
  };

  process.on("SIGINT", () => cleanup("SIGINT"));
  process.on("SIGTERM", () => cleanup("SIGTERM"));

  isCleanupRegistered = true;
}