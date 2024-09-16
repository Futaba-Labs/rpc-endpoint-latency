import { PublicClient } from "viem";

export type RPC = {
  name: string;
  rpcUrl: string;
  client: PublicClient;
};

export type RPCLatency = {
  rpcName: string;
  blockNumber: number;
  latency: number;
}

export type ProviderOption = {
  pollingInterval: number;
  blocks: number;
  chain: string;
  wss: boolean;
}

export type PollingOption = {
  blocks: number;
  chain: string;
}
