import {
  amIUsingTor,
  FileSystemPersistence,
  getIpList,
  InMemoryPersistence,
  isIpTor,
} from "../dist/esm/index";

// Utility function for measuring execution time
const measureTime = async (label, iterations, func) => {
  console.log(`\n${label} Benchmark (${iterations} iterations):`);
  console.log("-".repeat(50));

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    await func();
  }
  const end = performance.now();

  const totalTime = end - start;
  const averageTime = totalTime / iterations;

  console.log(`Total time: ${totalTime.toFixed(2)} ms`);
  console.log(`Average time per call: ${averageTime.toFixed(2)} ms`);
  console.log(`Operations per second: ${(1000 / averageTime).toFixed(2)}`);
  return { totalTime, averageTime };
};

const knownTorIp = "185.220.101.33";
const nonTorIp = "8.8.8.8";

const runBenchmarks = async () => {
  console.log("========================================");
  console.log("DETECTTOR PERFORMANCE BENCHMARK");
  console.log("========================================");

  // Benchmark initial getIpList to warm up and load file
  console.log("\nWarming up cache by loading IP list...");
  const ipList = await getIpList({ update: false });
  console.log(`Loaded ${ipList.length} IPs from the list`);

  // Using file system persistence (default)
  console.log("\n## FILE SYSTEM PERSISTENCE (DEFAULT) ##");
  const fsPersistence = new FileSystemPersistence();

  // Benchmark isIpTor with known Tor IP
  await measureTime(
    `isIpTor with known Tor IP (${knownTorIp})`,
    100,
    async () => {
      const result = await isIpTor(knownTorIp, fsPersistence);
      // Make sure to not optimize out the result
      if (process.env.DEBUG) console.log(result);
    },
  );

  // Benchmark isIpTor with non-Tor IP
  await measureTime(`isIpTor with non-Tor IP (${nonTorIp})`, 100, async () => {
    const result = await isIpTor(nonTorIp, fsPersistence);
    if (process.env.DEBUG) console.log(result);
  });

  // Benchmark amIUsingTor
  await measureTime("amIUsingTor", 10, async () => {
    const result = await amIUsingTor(fsPersistence);
    if (process.env.DEBUG) console.log(result);
  });

  // Using in-memory persistence
  console.log("\n## IN-MEMORY PERSISTENCE ##");

  // Initialize in-memory persistence with data
  const memPersistence = new InMemoryPersistence();
  await memPersistence.saveIpList(ipList);
  await memPersistence.saveTimestamp(Date.now());

  // Benchmark isIpTor with known Tor IP (in-memory)
  await measureTime(
    `isIpTor with known Tor IP (${knownTorIp}) (in-memory)`,
    100,
    async () => {
      const result = await isIpTor(knownTorIp, memPersistence);
      if (process.env.DEBUG) console.log(result);
    },
  );

  // Benchmark isIpTor with non-Tor IP (in-memory)
  await measureTime(
    `isIpTor with non-Tor IP (${nonTorIp}) (in-memory)`,
    100,
    async () => {
      const result = await isIpTor(nonTorIp, memPersistence);
      if (process.env.DEBUG) console.log(result);
    },
  );

  // Benchmark amIUsingTor (in-memory)
  await measureTime("amIUsingTor (in-memory)", 10, async () => {
    const result = await amIUsingTor(memPersistence);
    if (process.env.DEBUG) console.log(result);
  });

  // Test online fetching performance
  console.log("\n## NETWORK OPERATIONS ##");
  await measureTime(
    "getIpList with update=true (fetch from web)",
    1,
    async () => {
      const ipList = await getIpList({ update: true });
      console.log(`Fetched ${ipList.length} IPs from the online source`);
    },
  );
};

// Run the benchmarks
runBenchmarks()
  .then(() => console.log("\nBenchmarks completed!"))
  .catch((error) => {
    console.error("Error during benchmarks:", error);
    process.exit(1);
  });
