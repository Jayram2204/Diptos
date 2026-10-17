'use client';

import { createContext, useContext } from 'react';
import { encodeFunctionData, type Abi, type Address, type Hash, type Hex } from 'viem';
import {
  formatDidBaseBadge,
  formatDidPkh,
  resolveCorporateVleiProfile,
  type CorporateVleiProfile,
  type UnderwriterNodeProfile,
  type W3cVerifiableCredentialRecord,
} from '@/layers/layer3-di-security';
import type {
  DiptosInvoiceAsset,
  Erc4626TrancheVault,
} from '@/layers/layer1-rwa-core';

export type DiptosWorkspaceRole = 'supplier' | 'financier' | 'registry' | 'security';

export type AuthLoginMethod =
  | 'env-wallet'
  | 'email-otp'
  | 'sms-otp'
  | 'webauthn-passkey'
  | 'browser-wallet'
  | 'privy-smart-wallet';

export interface EnvWalletLiveSummary {
  keyId: 'supplier' | 'buyer' | 'financier';
  label: string;
  address: Address;
  vlei: string;
  legalName: string;
  jurisdiction: string;
  ethBalanceFormatted: string;
  usdcBalanceFormatted: string;
}

export interface OnChainIdentityRecord {
  wallet: Address;
  onchainIdContract: Address;
  vlei: string;
  legalName: string;
  jurisdiction: string;
  qviIssuer: string;
  verified: boolean;
  registeredAt: number;
}

export interface LiveProtocolState {
  chainId: number;
  rpcUrl: string;
  blockNumber: string;
  totalUsdcSupplyFormatted: string;
  contracts: {
    TEST_USDC: Address;
    IDENTITY_REGISTRY: Address;
    SLASHER: Address;
    INVOICE_REGISTRY: Address;
    RWA_INVOICE_3643: Address;
    RWA_VAULT_4626: Address;
    SETTLEMENT_ESCROW: Address;
  };
  envWallets: EnvWalletLiveSummary[];
  connectedWalletBalances: {
    ethBalance: string;
    usdcBalance: string;
    isVerifiedOnChain: boolean;
  };
  invoices: DiptosInvoiceAsset[];
  vaults: Erc4626TrancheVault[];
  identities: OnChainIdentityRecord[];
  credentials: W3cVerifiableCredentialRecord[];
  verifierNodes: UnderwriterNodeProfile[];
}

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
  blockNumber?: string;
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
  authMethod: AuthLoginMethod;
  authIdentifier: string | null;
  activeEnvKeyId: 'supplier' | 'buyer' | 'financier';
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
  protocolState: LiveProtocolState | null;
  isProtocolStateLoading: boolean;
  refreshProtocolState: () => Promise<void>;
  executeOnchainAction: (
    action: string,
    data?: Record<string, unknown>
  ) => Promise<ExecuteSponsoredTxResult>;
  requestFaucetFunds: (params?: {
    recipientAddress?: Address;
    ethAmount?: string;
    usdcAmount?: string;
  }) => Promise<{
    ethTxHash: string;
    usdcTxHash: string;
    newEthBalanceFormatted: string;
    newUsdcBalanceFormatted: string;
  }>;
  authenticateWithMethod: (params: {
    method: AuthLoginMethod;
    identifier?: string;
    envKeyId?: 'supplier' | 'buyer' | 'financier';
  }) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isFaucetModalOpen: boolean;
  setIsFaucetModalOpen: (open: boolean) => void;
  login: () => void;
  logout: () => Promise<void>;
  executeSponsoredTx: (params: ExecuteSponsoredTxParams) => Promise<ExecuteSponsoredTxResult>;
}

const DEFAULT_SUPPLIER_ENV_WALLET = (process.env.NEXT_PUBLIC_SUPPLIER_WALLET_ADDRESS ||
  '0x89A9314d76ef6EF3E1DC1efE40b704373B2f709b') as Address;
const DEFAULT_BUYER_ENV_WALLET = (process.env.NEXT_PUBLIC_BUYER_WALLET_ADDRESS ||
  '0x8c12f05ad5030A1F7B27464A99D4800C17D23A0C') as Address;

export const DiptosIdentityContext = createContext<DiptosIdentityContextValue>({
  isAuthenticated: true,
  isReady: true,
  isLivePrivyConfigured: false,
  authMethod: 'env-wallet',
  authIdentifier: 'Supplier (.env Base/ETH Wallet)',
  activeEnvKeyId: 'supplier',
  chainId: 8453,
  setChainId: () => undefined,
  smartAccountAddress: DEFAULT_SUPPLIER_ENV_WALLET,
  eoaAddress: DEFAULT_BUYER_ENV_WALLET,
  activeAddress: DEFAULT_SUPPLIER_ENV_WALLET,
  didPkh: formatDidPkh(DEFAULT_SUPPLIER_ENV_WALLET, 8453),
  didBaseDisplay: formatDidBaseBadge(DEFAULT_SUPPLIER_ENV_WALLET),
  vleiProfile: resolveCorporateVleiProfile(DEFAULT_SUPPLIER_ENV_WALLET, 8453),
  activeRole: 'supplier',
  setActiveRole: () => undefined,
  walletExecutionMode: 'smart-wallet',
  setWalletExecutionMode: () => undefined,
  lastTxReceipt: null,
  protocolState: null,
  isProtocolStateLoading: false,
  refreshProtocolState: async () => undefined,
  executeOnchainAction: async () => ({
    hash: '0x8f4e2c9a71b3d04f00000000000000000000000000000000000000009941a2b8',
    executionMode: 'erc4337-sponsored',
    chainId: 8453,
    gasSponsored: true,
  }),
  requestFaucetFunds: async () => ({
    ethTxHash: '0x0',
    usdcTxHash: '0x0',
    newEthBalanceFormatted: '25.0000',
    newUsdcBalanceFormatted: '500,000',
  }),
  authenticateWithMethod: async () => undefined,
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => undefined,
  isFaucetModalOpen: false,
  setIsFaucetModalOpen: () => undefined,
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
 * live dynamic protocol state from Base L2 contracts, multi-method auth controls, Faucet disbursement, and executeSponsoredTx().
 */
export function useDiptosIdentity(): DiptosIdentityContextValue {
  return useContext(DiptosIdentityContext);
}
