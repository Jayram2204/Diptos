import { createConfig } from '@privy-io/wagmi';
import { http } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export const DIPTOS_SUPPORTED_CHAINS = [base, baseSepolia] as const;

export const diptosWagmiConfig = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
});
