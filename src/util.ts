import { arbitrum, base, Chain, mainnet } from "viem/chains"

export const getChain = (chain: string): Chain => {
  switch (chain) {
    case 'mainnet':
      return mainnet
    case 'arbitrum':
      return arbitrum
    case 'base':
      return base
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}
