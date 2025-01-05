import RPCs from "../rpc.json"
import { createPublicClient, createWalletClient, http, parseEther, PublicClient, WalletClient } from "viem";
import { mainnet } from "viem/chains";
// @ts-ignore
import commandLineArgs from 'command-line-args';
import { PollingOption, ProviderOption, RPC, RPCWithWallet, TransferLatency } from "./type";
import { measure } from "./measure";
import { getChain, sleep } from "./util";
import { privateKeyToAccount } from "viem/accounts";

import dotenv from 'dotenv';
dotenv.config();


const clOptions = [
  { name: 'chain', alias: 'c', type: String, defaultValue: 'arbitrum-sepolia' },
  { name: 'iteration', alias: 'i', type: Number, defaultValue: 10 }
]

const main = async () => {
  const options = commandLineArgs(clOptions);
  console.log(`Config: ${JSON.stringify(options)}`);

  const rpcs: RPCWithWallet[] = [];

  const privateKeys = JSON.parse(process.env.PRIVATE_KEYS || '[]') as string[]
  if (!privateKeys) {
    throw new Error('PRIVATE_KEYS is not set')
  }

  const accounts = privateKeys.map((privateKey) => privateKeyToAccount(privateKey as `0x${string}`))

  // Create clients for each RPC
  RPCs.transfer[options.chain as keyof typeof RPCs.transfer].forEach((rpc) => {
    const name = `${options.chain}-${rpc.name}`

    const client = createPublicClient({
      chain: getChain(options.chain),
      transport: http(rpc.rpcUrl),
    });

    const account = accounts.find(account => account.address === rpc.account)
    if (!account) {
      throw new Error('Account not found')
    }

    const walletClient = createWalletClient({
      account,
      chain: getChain(options.chain),
      transport: http(rpc.rpcUrl),
    });

    rpcs.push({ name, rpcUrl: rpc.rpcUrl, client, walletClient });
  });

  console.log(`RPC: ${JSON.stringify(rpcs.map(rpc => ({ name: rpc.name, rpcUrl: rpc.rpcUrl, account: rpc.walletClient.account!.address })), null, 2)}`)
  

  const latencies = await (async () => {
    const promises = []
    const latencies: TransferLatency[] = []

  for (let i = 0; i < options.iteration; i++) {
    console.log(`Iteration ${i + 1}`)
    const pros = []

    for (const rpc of rpcs) {
      pros.push(prepareTransfer(rpc, options))
    }
    const serializedTransactions = await Promise.all(pros)
    for (const serializedTransaction of serializedTransactions) {
      promises.push(transfer(serializedTransaction.rpc, serializedTransaction.serializedTransaction))
    }

    const results = await Promise.all(promises)
    for (const result of results) {
      if (result) {
          latencies.push(result)
        }
      }
      await sleep(1000)
    }
    return latencies.filter((l, i, self) => self.findIndex(t => t.txHash === l.txHash) === i)
  })()


  for (const rpc of rpcs) {
    const filteredLatencies = latencies.filter(latency => latency.rpcName === rpc.name);

    const min = Math.min(...filteredLatencies.map(l => l.latency))
    const max = Math.max(...filteredLatencies.map(l => l.latency))
    const avg = filteredLatencies.reduce((sum, l) => sum + l.latency, 0) / filteredLatencies.length

    console.log(`[${rpc.name}] Summary: { min: ${min}ms, max: ${max}ms, avg: ${avg}ms}`)
    const table = filteredLatencies.map(l => ({
        blockNumber: l.blockNumber,
        latency: l.latency,
        txHash: l.txHash,
      }))

    console.table(table)
  }
};

const prepareTransfer = async (rpc: RPCWithWallet, options: ProviderOption)=> {
    const request = await rpc.walletClient.prepareTransactionRequest({
        to: rpc.walletClient.account!.address,
        value: parseEther('0.000001'),
        chain: getChain(options.chain),
      })
    
      const serializedTransaction = await rpc.walletClient.signTransaction({
        ...request,
        account: rpc.walletClient.account!,
      })
      return { rpc, serializedTransaction }
}

const transfer = async (rpc: RPCWithWallet, serializedTransaction: `0x${string}`): Promise<TransferLatency | null> => {
  const beforeTransfer = performance.now()
  const hash = await rpc.walletClient.sendRawTransaction({ serializedTransaction })
  const afterTransfer = performance.now()
  const latency = afterTransfer - beforeTransfer

  const transaction = await rpc.client.waitForTransactionReceipt({ hash });
  if (transaction.status !== 'success') {
    console.log(`Transaction failed: ${hash}`);
    return null;
  } else {
    console.log(`Transaction successful: ${hash}`);
    console.log(`${rpc.name} transfer latency: ${latency}ms`)
    console.log(`${rpc.name} transfer block: ${transaction.blockNumber}`)
  }

  return {
    rpcName: rpc.name,
    blockNumber: Number(transaction.blockNumber),
    txHash: hash,
    latency,
  }
}

main();
