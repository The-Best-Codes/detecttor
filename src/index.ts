import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface IpResponse {
  ip: string;
}

// Cache for validated URLs
const validatedUrls = new Map<string, boolean>();

/**
 * Retrieves the current IP address of the user.
 *
 * Uses the first parameter as the URL to query for the IP address.
 * If none is provided, it uses a default URL.
 *
 * @throws Error if the URL is invalid
 * @returns The IP address, or "unknown" if there was an error
 */
export async function getIpAddress(params?: {
  overrideUrl?: string;
}): Promise<string> {
  const overrideUrl = params?.overrideUrl || undefined;
  try {
    const url = overrideUrl || "https://postman-echo.com/ip";

    // Check URL cache first
    if (!validatedUrls.has(url)) {
      try {
        new URL(url); // This will throw if invalid
        validatedUrls.set(url, true);
      } catch (error) {
        validatedUrls.set(url, false);
        throw new Error(`Invalid URL: ${url}`);
      }
    } else if (validatedUrls.get(url) === false) {
      throw new Error(`Invalid URL: ${url}`);
    }
    const response = await fetch(url);
    const data = (await response.json()) as IpResponse;
    return data.ip;
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "unknown";
  }
}

// Define an interface for IP List Persistence
export interface IpListPersistence {
  /**
   * Retrieves the IP list from persistence.
   * @returns Promise<Set<string>> The set of IPs or an empty set if not found/error.
   */
  getIpList(): Promise<Set<string>>;

  /**
   * Saves the IP list to persistence.
   * @param ipList Set<string> The set of IPs to save.
   * @returns Promise<void>
   */
  saveIpList(ipList: Set<string>): Promise<void>;

  /**
   * Retrieves the timestamp of the last update.
   * @returns Promise<number> The timestamp or 0 if not found/error.
   */
  getTimestamp(): Promise<number>;

  /**
   * Saves the timestamp of the last update.
   * @param timestamp number The timestamp to save.
   * @returns Promise<void>
   */
  saveTimestamp(timestamp: number): Promise<void>;
}

// Default File System Persistence Implementation
export class FileSystemPersistence implements IpListPersistence {
  private torIpFilePath: string;
  private timestampFilePath: string;

  constructor(
    options: { torIpFilePath?: string; timestampFilePath?: string } = {},
  ) {
    this.torIpFilePath =
      options.torIpFilePath || path.join(__dirname, "torlist.txt");
    this.timestampFilePath =
      options.timestampFilePath ||
      path.join(__dirname, "torlist.txt.timestamp");
  }

  async getIpList(): Promise<Set<string>> {
    try {
      const data = await fs.promises.readFile(this.torIpFilePath, "utf8");
      return new Set(
        data
          .split("\n")
          .map((ip: string) => ip.trim())
          .filter((ip: string) => ip !== ""),
      );
    } catch (error) {
      console.debug("Error fetching IP list from file:", error);
      return new Set();
    }
  }

  async saveIpList(ipList: Set<string>): Promise<void> {
    try {
      await fs.promises.writeFile(
        this.torIpFilePath,
        Array.from(ipList).join("\n"),
      );
    } catch (error) {
      console.error("Error saving IP list to file:", error);
      throw error;
    }
  }

  async getTimestamp(): Promise<number> {
    try {
      const data = await fs.promises.readFile(this.timestampFilePath, "utf8");
      return parseInt(data, 10);
    } catch (error) {
      console.debug("Error fetching timestamp from file:", error);
      return 0;
    }
  }

  async saveTimestamp(timestamp: number): Promise<void> {
    try {
      await fs.promises.writeFile(this.timestampFilePath, timestamp.toString());
    } catch (error) {
      console.error("Error saving timestamp to file:", error);
      throw error;
    }
  }
}

// In-Memory Persistence Implementation (for testing or non-persistent use)
export class InMemoryPersistence implements IpListPersistence {
  private ipList: Set<string> = new Set();
  private timestamp: number = 0;

  async getIpList(): Promise<Set<string>> {
    return new Set(this.ipList); // Return a copy
  }

  async saveIpList(ipList: Set<string>): Promise<void> {
    this.ipList = new Set(ipList); // Store a copy
  }

  async getTimestamp(): Promise<number> {
    return this.timestamp;
  }

  async saveTimestamp(timestamp: number): Promise<void> {
    this.timestamp = timestamp;
  }
}

/**
 * Fetches the list of IP addresses of Tor exit nodes from the Tor Project website.
 */
const getIpListOnline = async (persistence: IpListPersistence) => {
  try {
    const url = "https://check.torproject.org/torbulkexitlist";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.text();

      // Process the data more efficiently
      const ipSet = new Set<string>();
      const lines = data.split("\n");

      for (const line of lines) {
        const ip = line.trim();
        if (ip === "") continue;

        // Basic validation - more efficient than regex
        const parts = ip.split(".");
        if (parts.length !== 4) continue;

        let valid = true;
        for (let i = 0; i < 4; i++) {
          const num = parseInt(parts[i], 10);
          if (isNaN(num) || num < 0 || num > 255) {
            valid = false;
            break;
          }
        }

        if (valid) ipSet.add(ip);
      }

      if (ipSet.size === 0) {
        throw new Error("No valid IPs found in the response");
      }

      await persistence.saveIpList(ipSet);
      await persistence.saveTimestamp(Date.now()); // Date.now() is more efficient than new Date().getTime()
      return ipSet;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    console.error("Error fetching IP list:", error);
    return new Set<string>();
  }
};

// Simple memoization for getIpList
let cachedIpList: Set<string> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Retrieves the list of IP addresses of Tor exit nodes.
 *
 * @param {Object} [params] - Optional parameters
 * @param {boolean|string} [params.update] - The update strategy
 * @param {IpListPersistence} [params.persistence] -  Persistence mechanism.  Defaults to FileSystemPersistence.
 * @returns {Promise<Set<string>>} The set of IP addresses
 */
export async function getIpList(params?: {
  update?: boolean | string;
  persistence?: IpListPersistence;
}): Promise<Set<string>> {
  const update = params?.update ?? "auto";
  const persistence: IpListPersistence =
    params?.persistence || new FileSystemPersistence();

  let shouldUpdate = false;
  if (update === "auto") {
    const timestamp = await persistence.getTimestamp();
    const currentTime = Date.now();
    shouldUpdate = currentTime - timestamp > 24 * 60 * 60 * 1000; // 1 day
  } else if (update === true) {
    shouldUpdate = true;
  }

  if (
    cachedIpList &&
    !shouldUpdate &&
    Date.now() - cacheTimestamp < CACHE_TTL
  ) {
    return cachedIpList;
  }

  try {
    let ipList = await persistence.getIpList();

    if (ipList.size === 0 || shouldUpdate) {
      ipList = await getIpListOnline(persistence);
    }

    cachedIpList = ipList;
    cacheTimestamp = Date.now();
    return ipList;
  } catch (error) {
    console.error("Error fetching IP list:", error);
    return new Set<string>();
  }
}

/**
 * Checks if a given IP address is a Tor exit node.
 *
 * @param {string} ip - The IP address to check
 * @param {IpListPersistence} [persistence] - The persistence mechanism to use. Defaults to FileSystemPersistence.
 * @returns {Promise<boolean>} Whether the IP address is a Tor exit node
 */
export async function isIpTor(
  ip: string,
  persistence?: IpListPersistence,
): Promise<boolean> {
  const ipSet = await getIpList({ persistence });
  return ipSet.has(ip); // O(1) lookup with Set
}

/**
 * Checks if the current user is using Tor.
 *
 * @param {IpListPersistence} [persistence] - The persistence mechanism to use. Defaults to FileSystemPersistence.
 * @returns {Promise<boolean>} Whether the user is using Tor
 */
export async function amIUsingTor(
  persistence?: IpListPersistence,
): Promise<boolean> {
  const ip = await getIpAddress();
  return isIpTor(ip, persistence);
}

export default isIpTor;
