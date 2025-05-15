import { describe, expect, it } from "bun:test";
import isIpTor, { amIUsingTor, getIpList } from "../src/index";

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

  it("getIpList should return a Set of IP addresses", async () => {
    const result = await getIpList();
    expect(result instanceof Set).toBe(true);
    if (result.size > 0) {
      const firstElement = result.values().next().value;
      expect(typeof firstElement).toBe("string");
    }
  });
});
