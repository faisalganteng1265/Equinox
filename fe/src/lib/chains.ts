import { defineChain } from 'viem';

const rpcUrl = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || 'https://rpc.sepolia.mantle.xyz';
const explorerUrl = process.env.NEXT_PUBLIC_MANTLE_EXPLORER_URL || 'https://explorer.sepolia.mantle.xyz';

export const mantleSepolia = defineChain({
  id: 5003,
  name: 'Mantle Sepolia',
  nativeCurrency: {
    name: 'MNT',
    symbol: 'MNT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [rpcUrl],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: explorerUrl,
    },
  },
  testnet: true,
});

export const expectedChainId = mantleSepolia.id;
