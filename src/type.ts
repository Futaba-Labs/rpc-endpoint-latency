import { PublicClient, WalletClient } from "viem";

export interface RPC {
  name: string;
  rpcUrl: string;
  client: PublicClient;
}

export type RPCWithWallet = RPC & {
  walletClient: WalletClient;
}

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

export type TransferLatency = {
  rpcName: string;
  blockNumber: number;
  txHash: string;
  latency: number;
}
