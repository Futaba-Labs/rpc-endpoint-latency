import { PollingOption, ProviderOption, RPC, RPCLatency } from "./type";
import * as fs from 'fs';

export const measure = async (rpcs: RPC[], options: ProviderOption | PollingOption) => {
  // Subscribe to new blocks for each client
  const latencies: RPCLatency[] = [];
  const initialBlock = await rpcs[0].client.getBlockNumber()
  console.log(`Initial block: ${initialBlock}`);

  for (const rpc of rpcs) {
    let currentBlock = Number(initialBlock)
    const unwatch = rpc.client.watchBlocks(
      {
        blockTag: 'pending',
        onBlock: block => {
          if (currentBlock === Number(block.number)) {
            return
          }

          const now = Date.now()

          // The block timestamp does not display milliseconds, so it needs to be adjusted to align with milliseconds.
          const latency = now - (Number(block.timestamp) * 1000);
          console.log(`[${rpc.name}] Current block: ${block.number}, Latency: ${latency}ms`);
          latencies.push({ rpcName: rpc.name, blockNumber: Number(block.number), latency: latency });
          currentBlock = Number(block.number)

          if (currentBlock >= Number(initialBlock) + options.blocks) {
            const filteredLatencies = latencies.filter(latency => latency.rpcName === rpc.name);

            const min = Math.min(...filteredLatencies.map(l => l.latency))
            const max = Math.max(...filteredLatencies.map(l => l.latency))
            const avg = filteredLatencies.reduce((sum, l) => sum + l.latency, 0) / filteredLatencies.length

            console.log(`[${rpc.name}] Summary: { min: ${min}ms, max: ${max}ms, avg: ${avg}ms}`)

            const table = filteredLatencies.map(l => ({
              blockNumber: l.blockNumber,
              latency: l.latency,
            }))

            console.table(table)

            writeToFile(rpc, min, max, avg, table, options)

            unwatch()
          }
        },
      }
    )
  }
}

const writeToFile = (rpc: RPC, min: number, max: number, avg: number, table: {
  blockNumber: number;
  latency: number;
}[], options: ProviderOption | PollingOption) => {
  const fileName = rpc.name.toLowerCase().replace(/\s+/g, '-');
  fs.writeFileSync(`./output/${fileName}.json`, JSON.stringify({
    config: {
      rpcName: rpc.name,
      rpcUrl: rpc.rpcUrl,
      ...options
    },
    summary: {
      min,
      max,
      avg,
    },
    blocks: table,
  }))
}