import { describe, expect, it } from "bun:test";
import isIpTor, { amIUsingTor, getIpList } from "../dist/esm/index.js";

describe("detecttor", () => {
  it("amIUsingTor should return a boolean", async () => {
    const result = await amIUsingTor();
    expect(typeof result).toBe("boolean");
  });

  it("isIpTor should return a boolean for a given IP", async () => {
    const ip = "89.0.142.86"; // Example IP
    const result = await isIpTor(ip);
    expect(typeof result).toBe("boolean");
  });

  it("getIpList should return an array of IP addresses", async () => {
    const result = await getIpList();
    expect(Array.isArray(result)).toBe(true);
    // Optionally, check if array elements are strings (basic validation)
    if (result.length > 0) {
      expect(typeof result[0]).toBe("string");
    }
  });
});
