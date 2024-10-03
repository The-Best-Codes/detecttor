/**
 * Retrieves the current IP address of the user.
 *
 * Uses the first parameter as the URL to query for the IP address.
 * If none is provided, it uses a default URL.
 *
 * @throws Error if the URL is invalid
 * @returns The IP address, or "unknown" if there was an error
 */
export declare function getIpAddress(params?: {
    overrideUrl?: string;
}): Promise<string>;
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
export declare function getIpList(params?: {
    update?: boolean | string;
}): Promise<any>;
/**
 * Checks if a given IP address is a Tor exit node.
 *
 * @param {string} ip - The IP address to check
 * @returns {Promise<boolean>} Whether the IP address is a Tor exit node
 */
export default function isIpTor(ip: string): Promise<any>;
/**
 * Checks if the current user is using Tor.
 *
 * @returns {Promise<boolean>} Whether the user is using Tor
 */
export declare function amIUsingTor(): Promise<any>;
