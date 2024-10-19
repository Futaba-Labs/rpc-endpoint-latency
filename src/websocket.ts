import RPCs from "../rpc.json"
import { createPublicClient, http, webSocket } from "viem";
// @ts-ignore
import commandLineArgs from 'command-line-args';
import { ProviderOption, RPC } from "./type";
import { measure } from "./measure";
import { getChain } from "./util";

const clOptions = [
  { name: 'pollingInterval', alias: 'i', type: Number, defaultValue: 0 },
  { name: 'blocks', alias: 'b', type: Number, defaultValue: 10 },
  { name: 'chain', alias: 'c', type: String, defaultValue: 'mainnet' }
]

const main = async () => {
  const options = commandLineArgs(clOptions);
  console.log(`Config: { pollingInterval: ${options.pollingInterval}, blocks: ${options.blocks}, websocket: ${options.wss} }`);

  const providerOption: ProviderOption = {
    pollingInterval: options.pollingInterval,
    blocks: options.blocks,
    wss: options.wss,
    chain: options.chain,
  };

  const rpcs: RPC[] = [];

  // Create clients for each RPC
  RPCs.provider[options.chain as keyof typeof RPCs.provider].forEach((rpc) => {
    const name = `${options.chain}-${rpc.name}`
    console.log(`${name}: ${rpc.rpcUrl}`);
    console.log(`${name}: ${rpc.wssUrl}`);

    const httpClient = createPublicClient({
      chain: getChain(options.chain),
      pollingInterval: options.pollingInterval === 0 ? undefined : options.pollingInterval,
      cacheTime: 10000,
      transport: http(rpc.rpcUrl),
    });

    rpcs.push({ name: `${name}-http`, rpcUrl: rpc.rpcUrl, client: httpClient });

    const wsClient = createPublicClient({
      chain: getChain(options.chain),
      cacheTime: 10000,
      transport: webSocket(rpc.wssUrl),
    });

    rpcs.push({ name: `${name}-ws`, rpcUrl: rpc.wssUrl, client: wsClient });
  });

  await measure(rpcs, providerOption);
};

main();
