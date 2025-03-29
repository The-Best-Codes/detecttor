import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface IpResponse {
  ip: string;
}

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
    try {
      const urlTest = new URL(url);
    } catch (error) {
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
   * @returns Promise<string[]> The list of IPs or an empty array if not found/error.
   */
  getIpList(): Promise<string[]>;

  /**
   * Saves the IP list to persistence.
   * @param ipList string[] The list of IPs to save.
   * @returns Promise<void>
   */
  saveIpList(ipList: string[]): Promise<void>;

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

  async getIpList(): Promise<string[]> {
    try {
      const data = await fs.promises.readFile(this.torIpFilePath, "utf8");
      return data
        .split("\n")
        .map((ip: string) => ip.trim())
        .filter((ip: string) => ip !== "");
    } catch (error) {
      console.debug("Error fetching IP list from file:", error); // Use debug for non-critical errors
      return [];
    }
  }

  async saveIpList(ipList: string[]): Promise<void> {
    try {
      await fs.promises.writeFile(this.torIpFilePath, ipList.join("\n"));
    } catch (error) {
      console.error("Error saving IP list to file:", error);
      throw error; // Re-throw for the caller to handle
    }
  }

  async getTimestamp(): Promise<number> {
    try {
      const data = await fs.promises.readFile(this.timestampFilePath, "utf8");
      return parseInt(data, 10);
    } catch (error) {
      console.debug("Error fetching timestamp from file:", error); // Use debug for non-critical errors
      return 0;
    }
  }

  async saveTimestamp(timestamp: number): Promise<void> {
    try {
      await fs.promises.writeFile(this.timestampFilePath, timestamp.toString());
    } catch (error) {
      console.error("Error saving timestamp to file:", error);
      throw error; // Re-throw for the caller to handle
    }
  }
}

// In-Memory Persistence Implementation (for testing or non-persistent use)
export class InMemoryPersistence implements IpListPersistence {
  private ipList: string[] = [];
  private timestamp: number = 0;

  async getIpList(): Promise<string[]> {
    return [...this.ipList]; // Return a copy to prevent external modification
  }

  async saveIpList(ipList: string[]): Promise<void> {
    this.ipList = [...ipList]; // Store a copy
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
 *
 * If the `update` parameter is set to `true`, the function will update the local
 * copy of the IP list.
 *
 * @throws Error if there was an error fetching the IP list
 * @returns The list of IP addresses, or an empty array if there was an error
 */
const getIpListOnline = async (persistence: IpListPersistence) => {
  try {
    const url = "https://check.torproject.org/torbulkexitlist";
    const response = await fetch(url);
    const data = await response.text();

    // Split the data into lines and validate each IP
    const ips = data.split("\n").filter((line: string) => line.trim() !== "");
    const validIPs = ips.every((ip: string) => {
      const parts = ip.split(".");
      return (
        parts.length === 4 &&
        parts.every((part: string) => {
          const num = parseInt(part, 10);
          return num >= 0 && num <= 255;
        })
      );
    });

    if (!validIPs) {
      throw new Error("Invalid IP list from TorProject.");
    }
    await persistence.saveIpList(ips);
    const date = new Date().getTime();
    await persistence.saveTimestamp(date);
    return ips;
  } catch (error) {
    console.error("Error fetching IP list:", error);
    return [];
  }
};

/**
 * Retrieves the list of IP addresses of Tor exit nodes.
 *
 * The list of IP addresses can be retrieved from either the local file system or
 * from the Tor Project's website. The first time this function is called, it will
 * attempt to read the list from the local file system. If the file does not exist,
 * it will fetch the list from the Tor Project's website and store it on the local
 * file system. Subsequent calls will use the cached list unless the `update`
 * parameter is set to `true` or `"auto"`.
 *
 * If `update` is set to `"auto"`, the list will be updated if the last update was
 * more than one day ago. If `update` is set to `true`, the list will be updated
 * regardless of when the last update was. If `update` is set to `false`, the list
 * will not be updated.
 *
 * @param {Object} [params] - Optional parameters
 * @param {boolean|string} [params.update] - The update strategy
 * @param {IpListPersistence} [params.persistence] -  Persistence mechanism.  Defaults to FileSystemPersistence.
 * @returns {Promise<string[]>} The list of IP addresses
 */
export async function getIpList(params?: {
  update?: boolean | string;
  persistence?: IpListPersistence;
}): Promise<string[]> {
  const update = params?.update ?? "auto";
  const persistence: IpListPersistence =
    params?.persistence || new FileSystemPersistence();

  let shouldUpdate = false;
  if (update === "auto") {
    const timestamp = await persistence.getTimestamp();
    const currentTime = new Date().getTime();
    shouldUpdate = currentTime - timestamp > 24 * 60 * 60 * 1000; // 1 day
  } else if (update === true) {
    shouldUpdate = true;
  }

  try {
    let ipList = await persistence.getIpList();

    if (ipList.length === 0 || shouldUpdate) {
      ipList = await getIpListOnline(persistence);
    }

    return ipList;
  } catch (error) {
    console.error("Error fetching IP list:", error);
    return [];
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
  const ipList = await getIpList({ persistence });
  return ipList.includes(ip);
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
  return await isIpTor(ip, persistence);
}

export default isIpTor;
