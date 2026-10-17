'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { PrivyProvider, usePrivy, useWallets } from '@privy-io/react-auth';
import { SmartWalletsProvider, useSmartWallets } from '@privy-io/react-auth/smart-wallets';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAccount, useWriteContract } from 'wagmi';
import { base, baseSepolia } from 'viem/chains';
import { keccak256, toHex, type Address, type Hash } from 'viem';
import { diptosWagmiConfig } from '../config/wagmiConfig';
import {
  DiptosIdentityContext,
  executeTxWithSmartWalletOrWagmi,
  type DiptosWorkspaceRole,
  type ExecuteSponsoredTxParams,
  type ExecuteSponsoredTxResult,
} from '../hooks/useDiptosIdentity';
import {
  formatDidBaseBadge,
  formatDidPkh,
  resolveCorporateVleiProfile,
} from '@/layers/layer3-di-security';

const SANDBOX_SMART_ACCOUNT: Address = '0x71C95911E9a5D330f4D621842EC243EE134329A2';
const SANDBOX_EOA_ADDRESS: Address = '0x90F79bf6EB2c4f870365E785982E1f101E93b906';

/**
 * Inner bridge that binds live @privy-io/react-auth, @privy-io/react-auth/smart-wallets,
 * and Wagmi hooks into DiptosIdentityContext when NEXT_PUBLIC_PRIVY_APP_ID is configured.
 */
function LivePrivyIdentityBridge({
  children,
  initialRole = 'supplier',
}: {
  children: React.ReactNode;
  initialRole?: DiptosWorkspaceRole;
}) {
  const { ready, authenticated, user, login: privyLogin, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();
  const { client: smartWalletClient } = useSmartWallets();
  const { address: wagmiAddress } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [activeRole, setActiveRole] = useState<DiptosWorkspaceRole>(initialRole);
  const [chainId, setChainId] = useState<8453 | 84532>(8453);
  const [walletExecutionMode, setWalletExecutionMode] = useState<'smart-wallet' | 'external-eoa'>(
    'smart-wallet'
  );
  const [lastTxReceipt, setLastTxReceipt] = useState<ExecuteSponsoredTxResult | null>(null);

  const smartAccountAddress = useMemo<Address | null>(() => {
    if (smartWalletClient?.account?.address) {
      return smartWalletClient.account.address as Address;
    }
    const linkedSmartWallet = user?.linkedAccounts?.find(
      (account) => account.type === 'smart_wallet'
    ) as { address?: Address } | undefined;
    return linkedSmartWallet?.address ?? null;
  }, [smartWalletClient, user]);

  const eoaAddress = useMemo<Address | null>(() => {
    const primaryWallet = wallets?.[0]?.address as Address | undefined;
    return primaryWallet ?? (wagmiAddress as Address | undefined) ?? null;
  }, [wallets, wagmiAddress]);

  const activeAddress = useMemo<Address | null>(() => {
    if (walletExecutionMode === 'smart-wallet') {
      return smartAccountAddress ?? eoaAddress;
    }
    return eoaAddress ?? smartAccountAddress;
  }, [walletExecutionMode, smartAccountAddress, eoaAddress]);

  const didPkh = useMemo(
    () => (activeAddress ? formatDidPkh(activeAddress, chainId) : null),
    [activeAddress, chainId]
  );

  const didBaseDisplay = useMemo(
    () => (activeAddress ? formatDidBaseBadge(activeAddress) : null),
    [activeAddress]
  );

  const vleiProfile = useMemo(
    () => (activeAddress ? resolveCorporateVleiProfile(activeAddress, chainId) : null),
    [activeAddress, chainId]
  );

  const executeSponsoredTx = useCallback(
    async (txParams: ExecuteSponsoredTxParams): Promise<ExecuteSponsoredTxResult> => {
      const result = await executeTxWithSmartWalletOrWagmi({
        txParams,
        smartWalletClient: smartWalletClient
          ? {
              account: smartWalletClient.account
                ? { address: smartWalletClient.account.address as Address }
                : undefined,
              sendTransaction: async ({ to, data, value }) =>
                (await smartWalletClient.sendTransaction({
                  to,
                  data,
                  value,
                })) as Hash,
            }
          : null,
        writeContractAsync: async ({ address, abi, functionName, args, value }) =>
          (await writeContractAsync({
            address,
            abi,
            functionName,
            args,
            value,
          })) as Hash,
        preferSmartWallet: walletExecutionMode === 'smart-wallet',
        chainId,
      });

      setLastTxReceipt(result);
      return result;
    },
    [smartWalletClient, writeContractAsync, walletExecutionMode, chainId]
  );

  const contextValue = useMemo(
    () => ({
      isAuthenticated: Boolean(ready && authenticated),
      isReady: ready,
      isLivePrivyConfigured: true,
      chainId,
      setChainId,
      smartAccountAddress,
      eoaAddress,
      activeAddress,
      didPkh,
      didBaseDisplay,
      vleiProfile,
      activeRole,
      setActiveRole,
      walletExecutionMode,
      setWalletExecutionMode,
      lastTxReceipt,
      login: privyLogin,
      logout: privyLogout,
      executeSponsoredTx,
    }),
    [
      ready,
      authenticated,
      chainId,
      smartAccountAddress,
      eoaAddress,
      activeAddress,
      didPkh,
      didBaseDisplay,
      vleiProfile,
      activeRole,
      walletExecutionMode,
      lastTxReceipt,
      privyLogin,
      privyLogout,
      executeSponsoredTx,
    ]
  );

  return (
    <DiptosIdentityContext.Provider value={contextValue}>
      {children}
    </DiptosIdentityContext.Provider>
  );
}

/**
 * Deterministic Institutional Sandbox bridge used when NEXT_PUBLIC_PRIVY_APP_ID is not yet
 * set in .env.local. Exercises the exact same executeTxWithSmartWalletOrWagmi() pipeline
 * so both ERC-4337 Paymaster Sponsorship and Wagmi External EOA fallback work out of the box.
 */
function SandboxIdentityBridge({
  children,
  initialRole = 'supplier',
}: {
  children: React.ReactNode;
  initialRole?: DiptosWorkspaceRole;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<DiptosWorkspaceRole>(initialRole);
  const [chainId, setChainId] = useState<8453 | 84532>(8453);
  const [walletExecutionMode, setWalletExecutionMode] = useState<'smart-wallet' | 'external-eoa'>(
    'smart-wallet'
  );
  const [lastTxReceipt, setLastTxReceipt] = useState<ExecuteSponsoredTxResult | null>(null);

  const smartAccountAddress = isAuthenticated ? SANDBOX_SMART_ACCOUNT : null;
  const eoaAddress = isAuthenticated ? SANDBOX_EOA_ADDRESS : null;
  const activeAddress =
    walletExecutionMode === 'smart-wallet' ? smartAccountAddress : eoaAddress;

  const didPkh = activeAddress ? formatDidPkh(activeAddress, chainId) : null;
  const didBaseDisplay = activeAddress ? formatDidBaseBadge(activeAddress) : null;
  const vleiProfile = activeAddress ? resolveCorporateVleiProfile(activeAddress, chainId) : null;

  const login = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    setIsAuthenticated(false);
  }, []);

  const executeSponsoredTx = useCallback(
    async (txParams: ExecuteSponsoredTxParams): Promise<ExecuteSponsoredTxResult> => {
      const simulatedSmartClient =
        walletExecutionMode === 'smart-wallet'
          ? {
              account: { address: SANDBOX_SMART_ACCOUNT },
              sendTransaction: async ({ to, data }: { to: Address; data?: `0x${string}` }) =>
                keccak256(
                  toHex(`erc4337:${chainId}:${to}:${data ?? '0x'}:${Date.now()}`)
                ) as Hash,
            }
          : null;

      const simulatedWagmiWrite = async ({
        address,
        functionName,
      }: {
        address: Address;
        functionName: string;
      }) =>
        keccak256(toHex(`wagmi-eoa:${chainId}:${address}:${functionName}:${Date.now()}`)) as Hash;

      const result = await executeTxWithSmartWalletOrWagmi({
        txParams,
        smartWalletClient: simulatedSmartClient,
        writeContractAsync: simulatedWagmiWrite,
        preferSmartWallet: walletExecutionMode === 'smart-wallet',
        chainId,
      });

      setLastTxReceipt(result);
      return result;
    },
    [walletExecutionMode, chainId]
  );

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      isReady: true,
      isLivePrivyConfigured: false,
      chainId,
      setChainId,
      smartAccountAddress,
      eoaAddress,
      activeAddress,
      didPkh,
      didBaseDisplay,
      vleiProfile,
      activeRole,
      setActiveRole,
      walletExecutionMode,
      setWalletExecutionMode,
      lastTxReceipt,
      login,
      logout,
      executeSponsoredTx,
    }),
    [
      isAuthenticated,
      chainId,
      smartAccountAddress,
      eoaAddress,
      activeAddress,
      didPkh,
      didBaseDisplay,
      vleiProfile,
      activeRole,
      walletExecutionMode,
      lastTxReceipt,
      login,
      logout,
      executeSponsoredTx,
    ]
  );

  return (
    <DiptosIdentityContext.Provider value={contextValue}>
      {children}
    </DiptosIdentityContext.Provider>
  );
}

export interface DiptosWeb3ProviderProps {
  children: React.ReactNode;
  initialRole?: DiptosWorkspaceRole;
  privyAppIdOverride?: string;
}

/**
 * DiptosWeb3Provider (Layer 2 — Base Protocol Layer)
 * Configures @privy-io/react-auth, @privy-io/react-auth/smart-wallets, and @privy-io/wagmi
 * on Base (8453) and Base Sepolia (84532) with light theme (#0A2540 institutional navy accent),
 * email, sms, passkey, and external wallet login, automatically creating embedded wallets
 * and ERC-4337 smart accounts for users without wallets.
 */
export function DiptosWeb3Provider({
  children,
  initialRole = 'supplier',
  privyAppIdOverride,
}: DiptosWeb3ProviderProps) {
  const [queryClient] = useState(() => new QueryClient());
  const rawAppId =
    privyAppIdOverride ?? process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim() ?? '';
  const hasLivePrivyAppId = rawAppId.length >= 10 && rawAppId !== 'your-privy-app-id';

  if (!hasLivePrivyAppId) {
    return (
      <QueryClientProvider client={queryClient}>
        <SandboxIdentityBridge initialRole={initialRole}>{children}</SandboxIdentityBridge>
      </QueryClientProvider>
    );
  }

  return (
    <PrivyProvider
      appId={rawAppId}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID}
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#0A2540',
          showWalletLoginFirst: false,
        },
        loginMethods: ['email', 'sms', 'passkey', 'wallet'],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: base,
        supportedChains: [base, baseSepolia],
      }}
    >
      <SmartWalletsProvider>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={diptosWagmiConfig}>
            <LivePrivyIdentityBridge initialRole={initialRole}>
              {children}
            </LivePrivyIdentityBridge>
          </WagmiProvider>
        </QueryClientProvider>
      </SmartWalletsProvider>
    </PrivyProvider>
  );
}
