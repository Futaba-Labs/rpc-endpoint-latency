import RPCs from "../rpc.json"
import { createPublicClient, http, webSocket } from "viem";
import { mainnet } from "viem/chains";
// @ts-ignore
import commandLineArgs from 'command-line-args';
import { ProviderOption, RPC } from "./type";
import { measure } from "./measure";
import { getChain } from "./util";

const clOptions = [
  { name: 'pollingInterval', alias: 'i', type: Number, defaultValue: 0 },
  { name: 'blocks', alias: 'b', type: Number, defaultValue: 10 },
  { name: 'wss', alias: 'w', type: Boolean },
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
    const url = options.wss ? rpc.wssUrl : rpc.rpcUrl;
    console.log(`${name}: ${url}`);

    const client = createPublicClient({
      chain: getChain(options.chain),
      pollingInterval: options.pollingInterval === 0 ? undefined : options.pollingInterval,
      cacheTime: 10000,
      transport: options.wss ? webSocket(url) : http(url),
    });

    rpcs.push({ name, rpcUrl: url, client });
  });

  await measure(rpcs, providerOption);
};

main();
