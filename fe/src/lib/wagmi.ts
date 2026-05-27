'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';

import { mantleSepolia } from './chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'equinox-dev-placeholder';
const rpcUrl = process.env.NEXT_PUBLIC_MANTLE_RPC_URL || mantleSepolia.rpcUrls.default.http[0];

export const wagmiConfig = getDefaultConfig({
  appName: 'Equinox RWA',
  projectId,
  chains: [mantleSepolia],
  transports: {
    [mantleSepolia.id]: http(rpcUrl),
  },
  ssr: true,
});
