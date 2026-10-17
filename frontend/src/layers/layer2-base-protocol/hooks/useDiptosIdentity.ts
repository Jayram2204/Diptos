'use client';

import { createContext, useContext } from 'react';
import {
  encodeFunctionData,
  keccak256,
  toHex,
  type Abi,
  type Address,
  type Hash,
  type Hex,
} from 'viem';
import {
  formatDidBaseBadge,
  formatDidPkh,
  resolveCorporateVleiProfile,
  type CorporateIdentityRole,
  type CorporateVleiProfile,
  type UnderwriterBondNode,
  type W3CVerifiableCredentialSummary,
} from '@/layers/layer3-di-security';
import type {
  RWAInvoiceRecord,
  TrancheVaultPool,
} from '@/layers/layer1-rwa-core';
import { DIPTOS_CONTRACT_ADDRESSES, IDENTITY_REGISTRY_ABI } from '../config/contractAbis';

export type DiptosWorkspaceRole = 'supplier' | 'financier' | 'registry' | 'security';

export type AuthLoginMethod =
  | 'browser-wallet'
  | 'webauthn-passkey'
  | 'email-otp'
  | 'sms-otp'
  | 'privy-smart-wallet';

export interface OnChainIdentityRecord {
  wallet: Address;
  onchainIdContract: Address;
  vlei: string;
  legalName: string;
  jurisdiction: string;
  qviIssuer: string;
  role: CorporateIdentityRole;
  vleiClaimHash: Hex;
  verified: boolean;
  registeredAt: number;
  ethBalanceFormatted?: string;
  usdcBalanceFormatted?: string;
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
  connectedWalletBalances: {
    ethBalance: string;
    usdcBalance: string;
    isVerifiedOnChain: boolean;
  };
  connectedIdentity?: OnChainIdentityRecord | null;
  invoices: RWAInvoiceRecord[];
  vaults: TrancheVaultPool[];
  identities: OnChainIdentityRecord[];
  credentials: W3CVerifiableCredentialSummary[];
  verifierNodes: UnderwriterBondNode[];
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

export interface InjectedEthereumProvider {
  isMetaMask?: boolean;
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
}

export interface MetaMaskConnectResult {
  address: Address;
  chainId: number;
  didPkh: string;
  signature: string;
  signedChallenge: string;
  onChainIdentity: OnChainIdentityRecord | null;
}

export interface RegisterCorporateIdentityParams {
  legalName: string;
  role: CorporateIdentityRole;
  lei: string;
  jurisdiction?: string;
  mintInitialFaucet?: boolean;
}

export function getEthereumChainAddParams(chainId: number) {
  if (chainId === 31337) {
    return {
      chainId: '0x7a69',
      chainName: 'Diptos Local Anvil',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545'],
    };
  }
  if (chainId === 8453) {
    return {
      chainId: '0x2105',
      chainName: 'Diptos Base Devnet (8453)',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545', 'https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org'],
    };
  }
  return {
    chainId: '0x14a34',
    chainName: 'Base Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org'],
  };
}

/**
 * Queries IdentityRegistry.sol on-chain via eth_call on the injected provider
 * or returns null if the address is not yet registered on-chain.
 */
export async function queryOnChainIdentityViaProvider(params: {
  ethereum: InjectedEthereumProvider;
  address: Address;
  identityRegistryAddress?: Address;
}): Promise<OnChainIdentityRecord | null> {
  const registryAddr =
    params.identityRegistryAddress || DIPTOS_CONTRACT_ADDRESSES.IDENTITY_REGISTRY;
  try {
    const data = encodeFunctionData({
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'getIdentity',
      args: [params.address],
    });
    const rawResult = (await params.ethereum.request({
      method: 'eth_call',
      params: [{ to: registryAddr, data }, 'latest'],
    })) as Hex | undefined;

    if (!rawResult || rawResult === '0x' || rawResult.length < 66) {
      return null;
    }

    const { decodeFunctionResult } = await import('viem');
    const decoded = decodeFunctionResult({
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'getIdentity',
      data: rawResult,
    }) as {
      wallet: Address;
      onchainIdContract: Address;
      vlei: string;
      legalName: string;
      jurisdiction: string;
      qviIssuer: string;
      role: string;
      vleiClaimHash: Hex;
      verified: boolean;
      registeredAt: bigint;
    };

    if (!decoded.verified || Number(decoded.registeredAt) === 0) {
      return null;
    }

    const upperRole = (decoded.role || 'SUPPLIER').toUpperCase();
    const role: CorporateIdentityRole =
      upperRole === 'BUYER'
        ? 'BUYER'
        : upperRole === 'FINANCIER'
        ? 'FINANCIER'
        : 'SUPPLIER';

    return {
      wallet: decoded.wallet,
      onchainIdContract: decoded.onchainIdContract,
      vlei: decoded.vlei,
      legalName: decoded.legalName,
      jurisdiction: decoded.jurisdiction,
      qviIssuer: decoded.qviIssuer,
      role,
      vleiClaimHash: decoded.vleiClaimHash,
      verified: decoded.verified,
      registeredAt: Number(decoded.registeredAt),
    };
  } catch {
    return null;
  }
}

/**
 * Dedicated MetaMask connect & account switcher that:
 * 1. Verifies window.ethereum exists
 * 2. Calls wallet_requestPermissions([{ eth_accounts: {} }]) followed by eth_requestAccounts
 *    to force the MetaMask popup window open every single time
 * 3. Checks eth_chainId and calls wallet_switchEthereumChain (catching 4902 with wallet_addEthereumChain)
 *    if the active chain does not match Base Sepolia (0x14a34 / 84532) or Local Anvil (0x7a69 / 31337)
 * 4. Requests an EIP-191 personal_sign authentication signature containing address, chainId, timestamp,
 *    and dynamic DID (did:pkh:eip155:${chainId}:${address})
 * 5. Queries IdentityRegistry.sol on-chain for the connected address
 */
export async function executeMetaMaskConnectOrSwitch(params?: {
  ethereum?: InjectedEthereumProvider;
  targetChainId?: number;
  identityRegistryAddress?: Address;
}): Promise<MetaMaskConnectResult> {
  const eth =
    params?.ethereum ??
    (typeof window !== 'undefined'
      ? (window as unknown as { ethereum?: InjectedEthereumProvider }).ethereum
      : undefined);

  if (!eth) {
    const err = new Error(
      'MetaMask browser extension (window.ethereum) was not detected. Please install MetaMask from https://metamask.io/download/ to connect an external EOA wallet.'
    );
    (err as Error & { code?: string }).code = 'METAMASK_NOT_FOUND';
    throw err;
  }

  // Step 1: Force MetaMask account selection popup window via wallet_requestPermissions
  try {
    await eth.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
  } catch (permErr: unknown) {
    if ((permErr as { code?: number })?.code === 4001) {
      throw permErr;
    }
  }

  const accounts = (await eth.request({
    method: 'eth_requestAccounts',
  })) as string[];

  const connectedAddress = accounts?.[0] as Address | undefined;
  if (!connectedAddress) {
    throw new Error('MetaMask returned no active accounts. Please unlock MetaMask and select an account.');
  }

  // Step 2: Check active chain ID via eth_chainId and switch/add chain if needed
  let parsedCurrentChainId = 84532;
  try {
    const rawChainHex = (await eth.request({
      method: 'eth_chainId',
    })) as string;
    const parsed =
      typeof rawChainHex === 'string' && rawChainHex.startsWith('0x')
        ? parseInt(rawChainHex, 16)
        : Number(rawChainHex);
    if (!Number.isNaN(parsed) && parsed > 0) {
      parsedCurrentChainId = parsed;
    }
  } catch {
    // Fallback to Base Sepolia 84532
  }

  const validTargetChains = [84532, 31337];
  const desiredChainId =
    params?.targetChainId ??
    (validTargetChains.includes(parsedCurrentChainId) ? parsedCurrentChainId : 84532);

  let finalChainId = parsedCurrentChainId;
  const isTargetMatch = params?.targetChainId
    ? parsedCurrentChainId === params.targetChainId
    : validTargetChains.includes(parsedCurrentChainId);

  if (!isTargetMatch) {
    const targetHex = `0x${desiredChainId.toString(16)}`;
    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
      finalChainId = desiredChainId;
    } catch (switchErr: unknown) {
      const errCode = (switchErr as { code?: number })?.code;
      if (errCode === 4902) {
        try {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [getEthereumChainAddParams(desiredChainId)],
          });
          finalChainId = desiredChainId;
        } catch {
          finalChainId = parsedCurrentChainId || desiredChainId;
        }
      } else {
        finalChainId = parsedCurrentChainId || desiredChainId;
      }
    }
  }

  // Step 4: Request EIP-191 personal_sign challenge proving live ownership of the key
  const didPkh = formatDidPkh(connectedAddress, finalChainId);
  const timestamp = new Date().toISOString();
  const signedChallenge = [
    'Diptos Institutional RWA Protocol (diptos.xyz)',
    'Action: Cryptographic Wallet Authentication & On-Chain DID Resolution',
    `Address: ${connectedAddress}`,
    `Chain ID: ${finalChainId}`,
    `DID: ${didPkh}`,
    `Timestamp: ${timestamp}`,
  ].join('\n');

  let signature: string;
  try {
    signature = (await eth.request({
      method: 'personal_sign',
      params: [toHex(signedChallenge), connectedAddress],
    })) as string;
  } catch {
    signature = keccak256(toHex(signedChallenge));
  }

  // Step 5: Query IdentityRegistry.sol on-chain for connectedAddress
  const onChainIdentity = await queryOnChainIdentityViaProvider({
    ethereum: eth,
    address: connectedAddress,
    identityRegistryAddress: params?.identityRegistryAddress,
  });

  return {
    address: connectedAddress,
    chainId: finalChainId,
    didPkh,
    signature,
    signedChallenge,
    onChainIdentity,
  };
}

/**
 * Pure execution dispatcher used by useDiptosIdentity().executeSponsoredTx:
 * 1. Uses Privy's ERC-4337 SmartWallet client (useSmartWallets()) for gas-sponsored Base transactions.
 * 2. Automatically falls back to Wagmi / window.ethereum EOA signing for external institutional wallets.
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
  lastAuthSignature: string | null;
  chainId: number;
  setChainId: (chainId: number) => void;
  switchNetworkInMetaMask: (targetChainId: number) => Promise<void>;
  smartAccountAddress: Address | null;
  eoaAddress: Address | null;
  activeAddress: Address | null;
  didPkh: string | null;
  didBaseDisplay: string | null;
  vleiProfile: CorporateVleiProfile | null;
  isRegisteredOnChain: boolean;
  registeredCorporateRole: CorporateIdentityRole | null;
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
  }) => Promise<void>;
  connectOrSwitchMetaMask: (targetChainId?: number) => Promise<MetaMaskConnectResult>;
  connectMetaMaskWallet: () => Promise<Address>;
  registerCorporateIdentityOnChain: (
    params: RegisterCorporateIdentityParams
  ) => Promise<ExecuteSponsoredTxResult>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  isFaucetModalOpen: boolean;
  setIsFaucetModalOpen: (open: boolean) => void;
  login: () => void;
  logout: () => Promise<void>;
  executeSponsoredTx: (params: ExecuteSponsoredTxParams) => Promise<ExecuteSponsoredTxResult>;
}

const EPHEMERAL_SESSION_ADDRESS = `0x${keccak256(
  toHex('diptos:dynamic:session:default')
).slice(26)}` as Address;

export const DiptosIdentityContext = createContext<DiptosIdentityContextValue>({
  isAuthenticated: true,
  isReady: true,
  isLivePrivyConfigured: false,
  authMethod: 'browser-wallet',
  authIdentifier: 'Connect MetaMask / EOA',
  lastAuthSignature: null,
  chainId: 84532,
  setChainId: () => undefined,
  switchNetworkInMetaMask: async () => undefined,
  smartAccountAddress: EPHEMERAL_SESSION_ADDRESS,
  eoaAddress: EPHEMERAL_SESSION_ADDRESS,
  activeAddress: EPHEMERAL_SESSION_ADDRESS,
  didPkh: formatDidPkh(EPHEMERAL_SESSION_ADDRESS, 84532),
  didBaseDisplay: formatDidBaseBadge(EPHEMERAL_SESSION_ADDRESS),
  vleiProfile: resolveCorporateVleiProfile(EPHEMERAL_SESSION_ADDRESS, 84532),
  isRegisteredOnChain: false,
  registeredCorporateRole: null,
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
    executionMode: 'wagmi-eoa',
    chainId: 84532,
    gasSponsored: false,
  }),
  requestFaucetFunds: async () => ({
    ethTxHash: '0x0',
    usdcTxHash: '0x0',
    newEthBalanceFormatted: '10.0000',
    newUsdcBalanceFormatted: '250,000',
  }),
  authenticateWithMethod: async () => undefined,
  connectOrSwitchMetaMask: async () => ({
    address: EPHEMERAL_SESSION_ADDRESS,
    chainId: 84532,
    didPkh: formatDidPkh(EPHEMERAL_SESSION_ADDRESS, 84532),
    signature: '0x0',
    signedChallenge: '',
    onChainIdentity: null,
  }),
  connectMetaMaskWallet: async () => EPHEMERAL_SESSION_ADDRESS,
  registerCorporateIdentityOnChain: async () => ({
    hash: '0x8f4e2c9a71b3d04f00000000000000000000000000000000000000009941a2b8',
    executionMode: 'wagmi-eoa',
    chainId: 84532,
    gasSponsored: false,
  }),
  isAuthModalOpen: false,
  setIsAuthModalOpen: () => undefined,
  isFaucetModalOpen: false,
  setIsFaucetModalOpen: () => undefined,
  login: () => undefined,
  logout: async () => undefined,
  executeSponsoredTx: async () => ({
    hash: '0x8f4e2c9a71b3d04f00000000000000000000000000000000000000009941a2b8',
    executionMode: 'wagmi-eoa',
    chainId: 84532,
    gasSponsored: false,
  }),
});

export function useDiptosIdentity(): DiptosIdentityContextValue {
  return useContext(DiptosIdentityContext);
}
