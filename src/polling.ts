import RPCs from "../rpc.json"
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
// @ts-ignore
import commandLineArgs from 'command-line-args';
import { PollingOption, RPC } from "./type";
import { measure } from "./measure";
import { getChain } from "./util";


const clOptions = [
  { name: 'blocks', alias: 'b', type: Number, defaultValue: 10 },
  { name: 'chain', alias: 'c', type: String, defaultValue: 'mainnet' }
]

const main = async () => {
  const options = commandLineArgs(clOptions);
  console.log(`Config: { blocks: ${options.blocks}, chain: ${options.chain} }`);

  const pollingOption: PollingOption = {
    blocks: options.blocks,
    chain: options.chain,
  };

  const rpcs: RPC[] = [];

  // Create clients for each RPC
  RPCs.polling[options.chain as keyof typeof RPCs.polling].forEach((rpc) => {
    const name = `${options.chain}-${rpc.interval}ms`
    console.log(`${name}: ${rpc.rpcUrl}`);

    const client = createPublicClient({
      chain: getChain(options.chain),
      pollingInterval: rpc.interval,
      cacheTime: 10000,
      transport: http(rpc.rpcUrl),
    });

    rpcs.push({ name, rpcUrl: rpc.rpcUrl, client });
  });

  await measure(rpcs, pollingOption);
};

main();
