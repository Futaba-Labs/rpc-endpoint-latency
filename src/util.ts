import { arbitrum, base, blast, Chain, mainnet, optimism, scroll } from "viem/chains"

export const getChain = (chain: string): Chain => {
  switch (chain) {
    case 'mainnet':
      return mainnet
    case 'arbitrum':
      return arbitrum
    case 'optimism':
      return optimism
    case 'base':
      return base
    case 'blast':
      return blast
    case 'scroll':
      return scroll
    default:
      throw new Error(`Unsupported chain: ${chain}`)
  }
}
