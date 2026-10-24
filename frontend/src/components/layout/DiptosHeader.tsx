'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Boxes,
  Code2,
  Droplets,
  ExternalLink,
  Layers,
  Lock,
  Menu,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import {
  useDiptosIdentity,
  type DiptosWorkspaceRole,
} from '@/hooks/useDiptosIdentity';
import { ContractsModal } from '@/components/modals/ContractsModal';

const NAV_ROUTES: {
  role: DiptosWorkspaceRole;
  label: string;
  href: string;
  badge?: string;
}[] = [
  { role: 'supplier', label: 'Supplier Portal', href: '/supplier' },
  { role: 'financier', label: 'Financier Desk', href: '/financier' },
  { role: 'registry', label: 'Hash Registry', href: '/registry' },
  { role: 'security', label: 'DI & Security', href: '/security' },
];

export function DiptosHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isAuthenticated,
    authMethod,
    authIdentifier,
    activeAddress,
    activeRole,
    setActiveRole,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isFaucetModalOpen,
    setIsFaucetModalOpen,
    connectOrSwitchMetaMask,
    vleiProfile,
    protocolState,
  } = useDiptosIdentity();

  const [isContractsOpen, setIsContractsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Sync active role with path
  const currentRole =
    pathname === '/supplier'
      ? 'supplier'
      : pathname === '/financier'
      ? 'financier'
      : pathname === '/registry'
      ? 'registry'
      : pathname === '/security'
      ? 'security'
      : activeRole;

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

  const handleTabClick = (role: DiptosWorkspaceRole, href: string) => {
    setActiveRole(role);
    if (pathname !== href) {
      router.push(href);
    }
    setMobileMenuOpen(false);
  };

  const walletDisplayShort = activeAddress
    ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}`
    : 'Connect';

  return (
    <>
      <header className="sticky top-0 z-40 h-14 w-full border-b border-slate-800/80 bg-[#080C14]/90 backdrop-blur-md px-4 lg:px-6">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4">
          {/* Left: Brand Monogram & Name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 group"
              title="Diptos Protocol"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-mono text-sm font-bold shadow-md shadow-emerald-950/40 group-hover:from-emerald-400 group-hover:to-teal-600 transition">
                D
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-white group-hover:text-emerald-400 transition">
                  Diptos
                </span>
                <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  Global RWA Protocol
                </span>
              </div>
            </Link>

            {/* Network Pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Base Sepolia • Sponsored</span>
            </div>
          </div>

          {/* Center: Navigation Bar */}
          <nav
            aria-label="Workspace Switcher"
            className="hidden md:flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 p-1"
          >
            {NAV_ROUTES.map((tab) => {
              const isActive = currentRole === tab.role;
              return (
                <button
                  key={tab.role}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleTabClick(tab.role, tab.href)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            <Link
              href="/partners"
              className={`rounded-md px-3 py-1 text-xs font-medium transition flex items-center gap-1 ${
                pathname === '/partners'
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>Partner API</span>
              <span className="rounded bg-emerald-500/20 text-emerald-300 px-1 py-0.2 font-mono text-[9px]">v1</span>
            </Link>
          </nav>

          {/* Right: Actions (Contracts, Faucet, Wallet) */}
          <div className="flex items-center gap-2">
            {/* Contracts Modal Trigger */}
            <button
              type="button"
              onClick={() => setIsContractsOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-mono text-slate-400 hover:border-slate-700 hover:text-slate-200 transition cursor-pointer"
              title="Inspect Smart Contracts on Base L2"
            >
              <Code2 className="h-3.5 w-3.5 text-cyan-400" />
              <span>Contracts</span>
            </button>

            {/* Faucet Trigger */}
            <button
              type="button"
              onClick={() => setIsFaucetModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white transition cursor-pointer"
            >
              <Droplets className="h-3.5 w-3.5 text-blue-400" />
              <span>Faucet</span>
            </button>

            {/* Wallet & vLEI Button */}
            <button
              type="button"
              onClick={handleWalletClick}
              disabled={isConnecting}
              className={`flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-medium transition cursor-pointer ${
                isWalletConnected
                  ? 'border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-900/30'
              }`}
            >
              {isWalletConnected ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-mono">{vleiProfile ? `${vleiProfile.legalName.slice(0, 10)}... (vLEI ✓)` : walletDisplayShort}</span>
                </>
              ) : (
                <>
                  <Wallet className="h-3.5 w-3.5" />
                  <span>Connect MetaMask</span>
                </>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:bg-slate-800 transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-800 bg-[#0B0F19] px-4 py-3 space-y-2">
            <div className="flex flex-col gap-1">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Overview (Landing)
              </Link>
              {NAV_ROUTES.map((tab) => (
                <button
                  key={tab.role}
                  type="button"
                  aria-pressed={currentRole === tab.role}
                  onClick={() => handleTabClick(tab.role, tab.href)}
                  className="text-left rounded-md px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  {tab.label}
                </button>
              ))}
              <Link
                href="/partners"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800"
              >
                Partner API (v1)
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Contracts Modal */}
      <ContractsModal
        isOpen={isContractsOpen}
        onClose={() => setIsContractsOpen(false)}
      />
    </>
  );
}
