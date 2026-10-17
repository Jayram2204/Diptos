import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { base, baseSepolia, foundry } from 'viem/chains';

export const DIPTOS_SUPPORTED_CHAINS = [baseSepolia, foundry, base] as const;

const localRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';

export const diptosWagmiConfig = createConfig({
  chains: [baseSepolia, foundry, base],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [foundry.id]: http(localRpcUrl),
    [base.id]: http(localRpcUrl),
  },
});
