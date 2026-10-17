'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Droplets, Wallet } from 'lucide-react';
import {
  useDiptosIdentity,
  type DiptosWorkspaceRole,
} from '@/hooks/useDiptosIdentity';
import { SemanticPill } from '@/components/ui/SemanticPill';

const WORKSPACE_TABS: {
  role: DiptosWorkspaceRole;
  label: string;
  layerTag: string;
  routeHint: string;
}[] = [
  {
    role: 'supplier',
    label: 'Supplier Portal',
    layerTag: 'Early Pay',
    routeHint: '/supplier',
  },
  {
    role: 'financier',
    label: 'Financier Credit Desk',
    layerTag: 'ERC-4626 / 3643',
    routeHint: '/financier',
  },
  {
    role: 'registry',
    label: 'Hash Registry',
    layerTag: 'Layer 1 Dedup',
    routeHint: '/registry',
  },
  {
    role: 'security',
    label: 'DI & ZK Security',
    layerTag: 'Layer 3 vLEI',
    routeHint: '/security',
  },
];

export function DiptosHeader() {
  const {
    isAuthenticated,
    didPkh,
    didBaseDisplay,
    smartAccountAddress,
    eoaAddress,
    activeAddress,
    vleiProfile,
    isRegisteredOnChain,
    registeredCorporateRole,
    activeRole,
    setActiveRole,
    walletExecutionMode,
    setWalletExecutionMode,
    chainId,
    switchNetworkInMetaMask,
    protocolState,
    setIsAuthModalOpen,
    setIsFaucetModalOpen,
    connectOrSwitchMetaMask,
    login,
    logout,
  } = useDiptosIdentity();

  const [identityDrawerOpen, setIdentityDrawerOpen] = useState(false);

  const cycleChainId = async () => {
    const nextChainId = chainId === 84532 ? 31337 : chainId === 31337 ? 8453 : 84532;
    try {
      await switchNetworkInMetaMask(nextChainId);
    } catch {
      // Ignored if user cancels network switch in MetaMask
    }
  };

  const chainLabel =
    chainId === 84532
      ? 'Base Sepolia (84532)'
      : chainId === 31337
      ? 'Local Anvil (31337)'
      : `Base (${chainId})`;

  return (
    <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-[#FFFFFF]/95 backdrop-blur-xs">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        {/* Left: Institutional Brand Identity & Chain Pill */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A2540] font-mono text-[14px] font-bold text-[#FFFFFF] hover:bg-[#1E293B] transition"
            title="Return to Diptos 3D RWA Landing Page"
          >
            D
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="text-[16px] font-bold tracking-[-0.02em] text-[#0F172A] hover:text-[#0284C7] transition"
              >
                DIPTOS
              </Link>
              <span className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-[#475569]">
                diptos.xyz • v2.0
              </span>
              <Link
                href="/"
                className="hidden sm:inline-flex items-center rounded border border-[#CBD5E1] bg-white px-2 py-0.5 text-[10px] font-semibold text-[#0A2540] hover:bg-[#F8FAFC]"
              >
                3D Overview
              </Link>
            </div>
            <p className="text-[11px] text-[#64748B]">
              Global RWA Trade Receivables Protocol
            </p>
          </div>
        </div>

        {/* Center: Desktop Role & Layer Switcher */}
        <nav
          aria-label="Diptos Role-Separated Workspaces"
          className="order-3 flex w-full items-center gap-1.5 overflow-x-auto rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 lg:order-2 lg:w-auto"
        >
          {WORKSPACE_TABS.map((tab) => {
            const isActive = activeRole === tab.role;
            return (
              <button
                key={tab.role}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveRole(tab.role)}
                className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-[#0A2540] text-[#FFFFFF] shadow-xs'
                    : 'text-[#475569] hover:bg-[#FFFFFF] hover:text-[#0F172A]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    isActive
                      ? 'bg-[#1E3A5F] text-[#E2E8F0]'
                      : 'bg-[#E2E8F0]/70 text-[#475569]'
                  }`}
                >
                  {tab.layerTag}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right: Faucet + MetaMask Auth + ERC-4337 Paymaster Badge + Verified vLEI Pill */}
        <div className="order-2 flex items-center gap-2 lg:order-3">
          {/* Live Base / ETH Faucet Button */}
          <button
            type="button"
            onClick={() => setIsFaucetModalOpen(true)}
            title="Open Base & ETH On-Chain Faucet (Mint ETH + dUSDC)"
            className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/90 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#059669] hover:bg-emerald-100 cursor-pointer tabular-nums"
          >
            <Droplets className="h-3.5 w-3.5" />
            <span>
              Faucet
              {protocolState?.connectedWalletBalances?.usdcBalance
                ? ` (${protocolState.connectedWalletBalances.usdcBalance} dUSDC)`
                : ''}
            </span>
          </button>

          {/* MetaMask & Multi-Method Auth Gateway */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            title="Connect or Switch MetaMask Account, Passkey, or OTP"
            className={`hidden md:inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition cursor-pointer ${
              isAuthenticated && activeAddress
                ? 'border-emerald-300 bg-emerald-50/90 text-[#047857] hover:bg-emerald-100'
                : 'border-[#CBD5E1] bg-white text-[#0A2540] hover:bg-[#F8FAFC]'
            }`}
          >
            {isAuthenticated && activeAddress ? (
              <>
                <span className="h-2 w-2 rounded-full bg-[#059669]" />
                <Wallet className="h-3.5 w-3.5 text-[#059669]" />
                <span className="font-mono tabular-nums">
                  Wallet Connected ({activeAddress.slice(0, 6)}...{activeAddress.slice(-4)})
                </span>
              </>
            ) : (
              <>
                <Wallet className="h-3.5 w-3.5 text-[#0284C7]" />
                <span>Connect / Switch MetaMask</span>
              </>
            )}
          </button>

          {/* Chain Selector: Base Sepolia (84532) / Local Anvil (31337) / Base (8453) */}
          <button
            type="button"
            onClick={cycleChainId}
            title="Switch active chain in MetaMask (Base Sepolia 84532 / Local Anvil 31337 / Base 8453)"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer tabular-nums"
          >
            <span className="h-2 w-2 rounded-full bg-[#1D4ED8]" />
            {chainLabel}
          </button>

          {/* Gas Sponsorship / Execution Mode Toggle Pill */}
          <button
            type="button"
            onClick={() =>
              setWalletExecutionMode(
                walletExecutionMode === 'smart-wallet' ? 'external-eoa' : 'smart-wallet'
              )
            }
            title="Click to toggle between ERC-4337 Smart Wallet (Sponsored Gas) and External EOA (MetaMask / Wagmi)"
            className="cursor-pointer"
          >
            {walletExecutionMode === 'smart-wallet' ? (
              <SemanticPill variant="emerald">
                Gas: Sponsored (ERC-4337)
              </SemanticPill>
            ) : (
              <SemanticPill variant="blue">
                Signer: External EOA (Wagmi)
              </SemanticPill>
            )}
          </button>

          {/* Corporate Identity Button (vLEI & ONCHAINID Pill) */}
          {isAuthenticated && didBaseDisplay ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIdentityDrawerOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] px-3 py-1.5 text-left transition hover:border-[#0A2540] cursor-pointer"
              >
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${
                    isRegisteredOnChain ? 'bg-[#047857]' : 'bg-amber-500'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#047857]">
                      GLEIF vLEI &amp; ONCHAINID ✓
                    </span>
                    {registeredCorporateRole && (
                      <span className="rounded bg-[#0A2540] px-1.5 py-0.2 font-mono text-[9px] font-bold text-white">
                        {registeredCorporateRole}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] font-semibold text-[#0F172A] tabular-nums">
                    {didBaseDisplay}
                  </div>
                </div>
              </button>

              {identityDrawerOpen && (
                <div className="absolute right-0 mt-2 w-[390px] rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-4 shadow-xl z-50">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                    <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#0F172A]">
                      Corporate Identity &amp; On-Chain DID
                    </span>
                    <SemanticPill variant={isRegisteredOnChain ? 'emerald' : 'slate'}>
                      {isRegisteredOnChain
                        ? `ON-CHAIN: ${registeredCorporateRole}`
                        : 'UNREGISTERED DID'}
                    </SemanticPill>
                  </div>

                  <dl className="mt-3 space-y-2.5 text-[12px]">
                    <div>
                      <dt className="text-[11px] font-semibold text-[#64748B]">
                        Legal Entity &amp; 20-Char GLEIF LEI
                      </dt>
                      <dd className="mt-0.5 font-medium text-[#0F172A]">
                        {vleiProfile?.legalName}
                      </dd>
                      <dd className="font-mono text-[11px] text-[#047857] tabular-nums">
                        LEI: {vleiProfile?.lei}
                      </dd>
                    </div>

                    {protocolState?.connectedWalletBalances && (
                      <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-[#475569]">
                          Live On-Chain Balances
                        </dt>
                        <dd className="mt-1 flex items-center justify-between font-mono text-xs font-bold text-[#0F172A] tabular-nums">
                          <span className="text-[#059669]">
                            {protocolState.connectedWalletBalances.usdcBalance} dUSDC
                          </span>
                          <span>{protocolState.connectedWalletBalances.ethBalance} ETH</span>
                        </dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-[11px] font-semibold text-[#64748B]">
                        Full W3C DID:PKH Identifier
                      </dt>
                      <dd className="mt-0.5 break-all rounded border border-[#E2E8F0] bg-[#F8FAFC] p-1.5 font-mono text-[11px] text-[#0F172A]">
                        {didPkh}
                      </dd>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div>
                        <dt className="text-[11px] font-semibold text-[#64748B]">
                          Connected Signer EOA (MetaMask)
                        </dt>
                        <dd className="font-mono text-[11px] text-[#475569] break-all">
                          {eoaAddress}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold text-[#64748B]">
                          ERC-4337 Smart Account
                        </dt>
                        <dd className="font-mono text-[11px] text-[#0F172A] break-all">
                          {smartAccountAddress}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold text-[#64748B]">
                          IdentityRegistry.sol Contract
                        </dt>
                        <dd className="font-mono text-[11px] text-[#1D4ED8] break-all">
                          {vleiProfile?.onchainIdAddress}
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIdentityDrawerOpen(false)}
                        className="rounded-md border border-[#CBD5E1] px-2.5 py-1.5 text-[11px] font-semibold text-[#334155] hover:bg-[#F8FAFC] cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await connectOrSwitchMetaMask();
                          } catch {
                            setIsAuthModalOpen(true);
                          }
                        }}
                        className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-semibold text-[#0A2540] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        Switch MetaMask Account
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentityDrawerOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                        className="rounded-md border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 py-1.5 text-[11px] font-semibold text-[#0284C7] hover:bg-[#F1F5F9] cursor-pointer"
                      >
                        Register / Edit DID
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setIdentityDrawerOpen(false);
                        await logout();
                      }}
                      className="rounded-md bg-[#FEF2F2] border border-[#FECACA] px-3 py-1.5 text-[12px] font-semibold text-[#991B1B] hover:bg-[#FEE2E2] cursor-pointer"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="rounded-lg bg-[#0A2540] px-3.5 py-2 text-[12px] font-semibold text-[#FFFFFF] transition hover:bg-[#0F172A] cursor-pointer"
            >
              Connect MetaMask / Verify vLEI
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
