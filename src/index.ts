import axios from "axios";
import fs from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const torIpFilePath = path.join(__dirname, "torlist.txt");
const timestampFilePath = path.join(__dirname, "torlist.txt.timestamp");

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
    const urlRegex =
      /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlRegex.test(url)) {
      throw new Error("Invalid URL");
    }
    const { data } = await axios.get(url);
    return data.ip;
  } catch (error) {
    console.error("Error fetching IP address:", error);
    return "unknown";
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
const getIpListOnline = async (params?: { update?: boolean }) => {
  const update = params?.update ?? false;
  try {
    const url = "https://check.torproject.org/torbulkexitlist";
    const { data } = await axios.get(url);
    try {
      if (update) {
        const filePath = torIpFilePath;
        await fs.promises.writeFile(filePath, data);
        const date = new Date().getTime();
        const timestampFile = timestampFilePath;
        await fs.promises.writeFile(timestampFile, date.toString());
      }
    } catch (error) {
      console.error("Error updating IP list:", error);
    }
    return data
      .split("\n")
      .map((ip: string) => ip.trim())
      .filter((ip: string) => ip !== "");
  } catch (error) {
    console.error("Error fetching IP list:", error);
    return [];
  }
};

/**
 * Reads the list of IP addresses of Tor exit nodes from the local file system.
 *
 * Returns an empty array if there was an error reading the file.
 *
 * @returns The list of IP addresses, or an empty array if there was an error
 */
const getIpListOffline = async () => {
  try {
    const filePath = torIpFilePath;
    const data = await fs.promises.readFile(filePath, "utf8");
    return data
      .split("\n")
      .map((ip: string) => ip.trim())
      .filter((ip: string) => ip !== "");
  } catch (error) {
    console.error("Error fetching IP list:", error);
    return [];
  }
};

/**
 * Reads the timestamp of the last time the IP list was updated from the local file system.
 *
 * Returns 0 if there was an error reading the file.
 *
 * @returns The timestamp, or 0 if there was an error
 */
const getTimestamp = async () => {
  try {
    const filePath = timestampFilePath;
    const data = await fs.promises.readFile(filePath, "utf8");
    return parseInt(data);
  } catch (error) {
    console.error("Error fetching timestamp:", error);
    return 0;
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
 * @returns {Promise<string[]>} The list of IP addresses
 */
export async function getIpList(params?: { update?: boolean | string }) {
  const update = params?.update ?? "auto";
  let shouldUpdate = false;
  if (update === "auto") {
    const timestamp = await getTimestamp();
    const currentTime = new Date().getTime();
    shouldUpdate = currentTime - timestamp > 24 * 60 * 60 * 1000; // 1 day
  } else if (update === true) {
    shouldUpdate = true;
  }
  try {
    const filePath = torIpFilePath;
    if (fs.existsSync(filePath)) {
      return getIpListOffline();
    } else {
      return getIpListOnline({ update: shouldUpdate || false });
    }
  } catch (error) {
    console.error("Error fetching IP list:", error);
    return [];
  }
}

/**
 * Checks if a given IP address is a Tor exit node.
 *
 * @param {string} ip - The IP address to check
 * @returns {Promise<boolean>} Whether the IP address is a Tor exit node
 */
export default async function isIpTor(ip: string) {
  const ipList = await getIpList();
  return ipList.includes(ip);
}

/**
 * Checks if the current user is using Tor.
 *
 * @returns {Promise<boolean>} Whether the user is using Tor
 */
export async function amIUsingTor() {
  const ip = await getIpAddress();
  return await isIpTor(ip);
}