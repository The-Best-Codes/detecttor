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
export declare class FileSystemPersistence implements IpListPersistence {
    private torIpFilePath;
    private timestampFilePath;
    constructor(options?: {
        torIpFilePath?: string;
        timestampFilePath?: string;
    });
    getIpList(): Promise<string[]>;
    saveIpList(ipList: string[]): Promise<void>;
    getTimestamp(): Promise<number>;
    saveTimestamp(timestamp: number): Promise<void>;
}
export declare class InMemoryPersistence implements IpListPersistence {
    private ipList;
    private timestamp;
    getIpList(): Promise<string[]>;
    saveIpList(ipList: string[]): Promise<void>;
    getTimestamp(): Promise<number>;
    saveTimestamp(timestamp: number): Promise<void>;
}
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
export declare function getIpList(params?: {
    update?: boolean | string;
    persistence?: IpListPersistence;
}): Promise<string[]>;
/**
 * Checks if a given IP address is a Tor exit node.
 *
 * @param {string} ip - The IP address to check
 * @param {IpListPersistence} [persistence] - The persistence mechanism to use. Defaults to FileSystemPersistence.
 * @returns {Promise<boolean>} Whether the IP address is a Tor exit node
 */
export declare function isIpTor(ip: string, persistence?: IpListPersistence): Promise<boolean>;
/**
 * Checks if the current user is using Tor.
 *
 * @param {IpListPersistence} [persistence] - The persistence mechanism to use. Defaults to FileSystemPersistence.
 * @returns {Promise<boolean>} Whether the user is using Tor
 */
export declare function amIUsingTor(persistence?: IpListPersistence): Promise<boolean>;
export default isIpTor;
