import RPCs from "../rpc.json"
import { createPublicClient, http, webSocket } from "viem";
import { mainnet } from "viem/chains";
// @ts-ignore
import commandLineArgs from 'command-line-args';
import { ProviderOption, RPC } from "./type";
import { measure } from "./measure";

const clOptions = [
  { name: 'pollingInterval', alias: 'i', type: Number, defaultValue: 0 },
  { name: 'blocks', alias: 'b', type: Number, defaultValue: 10 },
  { name: 'wss', alias: 'w', type: Boolean },
  { name: 'chain', alias: 'c', type: String, defaultValue: 'mainnet' }
]

const main = async () => {
  const options = commandLineArgs(clOptions);
  console.log(`Config: { pollingInterval: ${options.pollingInterval}, blocks: ${options.blocks}, watch: ${options.watch} }`);

  const providerOption: ProviderOption = {
    pollingInterval: options.pollingInterval,
    blocks: options.blocks,
    wss: options.wss,
    chain: options.chain,
  };

  const rpcs: RPC[] = [];

  // Create clients for each RPC
  RPCs.provider.mainnet.forEach((rpc) => {
    const name = `${options.chain}-${rpc.name}`
    console.log(`${name}: ${rpc.rpcUrl}`);

    const client = createPublicClient({
      chain: mainnet,
      pollingInterval: options.pollingInterval === 0 ? undefined : options.pollingInterval,
      cacheTime: 10000,
      transport: options.ws ? webSocket(rpc.wssUrl) : http(rpc.rpcUrl),
    });

    rpcs.push({ name, rpcUrl: rpc.rpcUrl, client });
  });

  await measure(rpcs, providerOption);
};

main();
