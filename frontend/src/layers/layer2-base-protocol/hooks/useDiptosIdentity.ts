'use client';

import { createContext, useContext } from 'react';
import { encodeFunctionData, type Abi, type Address, type Hash, type Hex } from 'viem';
import {
  formatDidBaseBadge,
  formatDidPkh,
  resolveCorporateVleiProfile,
  type CorporateVleiProfile,
} from '@/layers/layer3-di-security';

export type DiptosWorkspaceRole = 'supplier' | 'financier' | 'registry' | 'security';

export interface ExecuteSponsoredTxParams {
  to: Address;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}

export interface ExecuteSponsoredTxResult {
  hash: Hash;
  executionMode: 'erc4337-sponsored' | 'wagmi-eoa';
  chainId: number;
  gasSponsored: boolean;
}

export interface SmartWalletLikeClient {
  account?: { address: Address };
  sendTransaction: (args: {
    to: Address;
    data?: Hex;
    value?: bigint;
  }) => Promise<Hash>;
}

export type WagmiWriteContractAsyncFn = (args: {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}) => Promise<Hash>;

/**
 * Pure execution dispatcher used by useDiptosIdentity().executeSponsoredTx:
 * 1. Uses Privy's ERC-4337 SmartWallet client (useSmartWallets()) for gas-sponsored Base transactions.
 * 2. Automatically falls back to Wagmi's writeContractAsync for external institutional wallets.
 */
export async function executeTxWithSmartWalletOrWagmi(params: {
  txParams: ExecuteSponsoredTxParams;
  smartWalletClient: SmartWalletLikeClient | null | undefined;
  writeContractAsync: WagmiWriteContractAsyncFn;
  preferSmartWallet?: boolean;
  chainId?: number;
}): Promise<ExecuteSponsoredTxResult> {
  const {
    txParams,
    smartWalletClient,
    writeContractAsync,
    preferSmartWallet = true,
    chainId = 8453,
  } = params;

  const callData = encodeFunctionData({
    abi: txParams.abi as Abi,
    functionName: txParams.functionName,
    args: txParams.args ? [...txParams.args] : [],
  });

  if (smartWalletClient && preferSmartWallet) {
    const hash = await smartWalletClient.sendTransaction({
      to: txParams.to,
      data: callData,
      value: txParams.value ?? 0n,
    });

    return {
      hash,
      executionMode: 'erc4337-sponsored',
      chainId,
      gasSponsored: true,
    };
  }

  const hash = await writeContractAsync({
    address: txParams.to,
    abi: txParams.abi as Abi,
    functionName: txParams.functionName,
    args: txParams.args ? [...txParams.args] : [],
    value: txParams.value,
  });

  return {
    hash,
    executionMode: 'wagmi-eoa',
    chainId,
    gasSponsored: false,
  };
}

export interface DiptosIdentityContextValue {
  isAuthenticated: boolean;
  isReady: boolean;
  isLivePrivyConfigured: boolean;
  chainId: 8453 | 84532;
  setChainId: (chainId: 8453 | 84532) => void;
  smartAccountAddress: Address | null;
  eoaAddress: Address | null;
  activeAddress: Address | null;
  didPkh: string | null;
  didBaseDisplay: string | null;
  vleiProfile: CorporateVleiProfile | null;
  activeRole: DiptosWorkspaceRole;
  setActiveRole: (role: DiptosWorkspaceRole) => void;
  walletExecutionMode: 'smart-wallet' | 'external-eoa';
  setWalletExecutionMode: (mode: 'smart-wallet' | 'external-eoa') => void;
  lastTxReceipt: ExecuteSponsoredTxResult | null;
  login: () => void;
  logout: () => Promise<void>;
  executeSponsoredTx: (params: ExecuteSponsoredTxParams) => Promise<ExecuteSponsoredTxResult>;
}

const DEFAULT_SMART_ACCOUNT: Address = '0x71C95911E9a5D330f4D621842EC243EE134329A2';
const DEFAULT_EOA_ACCOUNT: Address = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

export const DiptosIdentityContext = createContext<DiptosIdentityContextValue>({
  isAuthenticated: true,
  isReady: true,
  isLivePrivyConfigured: false,
  chainId: 8453,
  setChainId: () => undefined,
  smartAccountAddress: DEFAULT_SMART_ACCOUNT,
  eoaAddress: DEFAULT_EOA_ACCOUNT,
  activeAddress: DEFAULT_SMART_ACCOUNT,
  didPkh: formatDidPkh(DEFAULT_SMART_ACCOUNT, 8453),
  didBaseDisplay: formatDidBaseBadge(DEFAULT_SMART_ACCOUNT),
  vleiProfile: resolveCorporateVleiProfile(DEFAULT_SMART_ACCOUNT, 8453),
  activeRole: 'supplier',
  setActiveRole: () => undefined,
  walletExecutionMode: 'smart-wallet',
  setWalletExecutionMode: () => undefined,
  lastTxReceipt: null,
  login: () => undefined,
  logout: async () => undefined,
  executeSponsoredTx: async () => ({
    hash: '0x8f4e2c9a71b3d04f00000000000000000000000000000000000000009941a2b8',
    executionMode: 'erc4337-sponsored',
    chainId: 8453,
    gasSponsored: true,
  }),
});

/**
 * Custom hook returning Diptos corporate decentralized identity (vLEI + ONCHAINID + did:pkh:eip155:8453:${address}),
 * ERC-4337 Smart Account & EOA addresses, login/logout controls, and executeSponsoredTx().
 */
export function useDiptosIdentity(): DiptosIdentityContextValue {
  return useContext(DiptosIdentityContext);
}
