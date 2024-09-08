import RPCs from "../rpc.json"
import { createPublicClient, http, PublicClient } from "viem";
import { mainnet } from "viem/chains";
// @ts-ignore
import commandLineArgs from 'command-line-args';
import * as fs from 'fs';


type RPC = {
  name: string;
  rpcUrl: string;
  client: PublicClient;
};

type RPCLatency = {
  rpcName: string;
  blockNumber: number;
  latency: number;
}

const clOptions = [
  { name: 'pollingInterval', alias: 'i', type: Number, defaultValue: 0 },
  { name: 'blocks', alias: 'b', type: Number, defaultValue: 10 },
]

const main = async () => {
  const options = commandLineArgs(clOptions);
  console.log(`Config: { pollingInterval: ${options.pollingInterval}, blocks: ${options.blocks} }`);
  const rpcs: RPC[] = [];

  // Create clients for each RPC
  RPCs.forEach((rpc) => {
    console.log(`${rpc.name}: ${rpc.rpcUrl}`);

    const client = createPublicClient({
      chain: mainnet,
      transport: http(rpc.rpcUrl),
    });

    rpcs.push({ name: rpc.name, rpcUrl: rpc.rpcUrl, client });
  });

  // Subscribe to new blocks for each client
  const latencies: RPCLatency[] = [];
  const initialBlock = await rpcs[0].client.getBlockNumber()
  console.log(`Initial block: ${initialBlock}`);

  for (const rpc of rpcs) {
    let currentBlock = Number(initialBlock)
    const unwatch = rpc.client.watchBlocks(
      {
        pollingInterval: options.pollingInterval === 0 ? undefined : options.pollingInterval,
        blockTag: 'latest',
        onBlock: block => {
          if (currentBlock === Number(block.number)) {
            return
          }

          const now = Date.now()
          const latency = now - Number(block.timestamp) * 1000;
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

            const fileName = rpc.name.toLowerCase().replace(/\s+/g, '-');
            fs.writeFileSync(`./output/${fileName}.json`, JSON.stringify({
              config: {
                rpcName: rpc.name,
                rpcUrl: rpc.rpcUrl,
                pollingInterval: options.pollingInterval,
                blocks: options.blocks,
              },
              summary: {
                min,
                max,
                avg,
              },
              blocks: table,
            }))

            unwatch()
          }
        },
      }
    )
  }
};

main();
