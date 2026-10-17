'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useDiptosIdentity,
  type DiptosWorkspaceRole,
} from '@/hooks/useDiptosIdentity';

const WORKSPACE_TABS: {
  role: DiptosWorkspaceRole;
  label: string;
}[] = [
  { role: 'supplier', label: 'Supplier Portal' },
  { role: 'financier', label: 'Financier Desk' },
  { role: 'registry', label: 'Hash Registry' },
  { role: 'security', label: 'DI & Security' },
];

export function DiptosHeader() {
  const {
    isAuthenticated,
    authMethod,
    authIdentifier,
    activeAddress,
    activeRole,
    setActiveRole,
    setIsAuthModalOpen,
    setIsFaucetModalOpen,
    connectOrSwitchMetaMask,
  } = useDiptosIdentity();

  const [isConnecting, setIsConnecting] = useState(false);

  const isWalletConnected = Boolean(
    isAuthenticated &&
      activeAddress &&
      (authIdentifier?.startsWith('MetaMask (') || authMethod !== 'browser-wallet')
  );

  const handleWalletClick = async () => {
    setIsConnecting(true);
    try {
      if (
        typeof window !== 'undefined' &&
        !(window as unknown as { ethereum?: unknown }).ethereum
      ) {
        setIsAuthModalOpen(true);
        return;
      }
      await connectOrSwitchMetaMask();
    } catch (err: unknown) {
      const errCode = (err as { code?: string | number })?.code;
      if (errCode === 'METAMASK_NOT_FOUND') {
        setIsAuthModalOpen(true);
      } else {
        console.warn('MetaMask connect or switch account:', err);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-white border-b border-slate-200 px-4 lg:px-6">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
        {/* Left: Compact D monogram + Diptos title */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 font-mono text-xs font-bold text-white transition hover:bg-slate-800"
            title="Diptos"
          >
            D
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-slate-900 transition hover:text-slate-700"
          >
            Diptos
          </Link>
        </div>

        {/* Center: Single-line segmented workspace switcher */}
        <nav
          aria-label="Workspace Switcher"
          className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {WORKSPACE_TABS.map((tab) => {
            const isActive = activeRole === tab.role;
            return (
              <button
                key={tab.role}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveRole(tab.role)}
                className={`rounded-md px-3 py-1 text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Exactly 3 compact controls in a single horizontal row */}
        <div className="flex items-center gap-2 shrink-0">
          {/* 1. Network & Gas status dot */}
          <div className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Base Sepolia • Sponsored</span>
          </div>

          {/* 2. One subtle ghost button: Faucet */}
          <button
            type="button"
            onClick={() => setIsFaucetModalOpen(true)}
            className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Faucet
          </button>

          {/* 3. One unified Wallet & DID button */}
          <button
            type="button"
            onClick={handleWalletClick}
            disabled={isConnecting}
            className={`rounded-md px-3 py-1.5 text-xs font-mono font-medium transition cursor-pointer ${
              isWalletConnected && activeAddress
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
            }`}
          >
            {isConnecting ? (
              <span>Connecting...</span>
            ) : isWalletConnected && activeAddress ? (
              <span>
                {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)} • Switch Account
              </span>
            ) : (
              <span>Connect MetaMask</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
