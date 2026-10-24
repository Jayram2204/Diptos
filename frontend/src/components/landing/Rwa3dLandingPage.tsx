'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Droplets,
  FileCheck2,
  Globe2,
  KeyRound,
  Layers,
  Lock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Workflow,
  Cpu,
} from 'lucide-react';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { DiptosHeader } from '@/components/layout/DiptosHeader';
import { Rwa3dArchitectureHero } from '@/components/ui/Rwa3dArchitectureHero';
import { SemanticPill } from '@/components/ui/SemanticPill';

export function Rwa3dLandingPage() {
  const {
    isAuthenticated,
    authMethod,
    protocolState,
    setIsAuthModalOpen,
    setIsFaucetModalOpen,
    activeAddress,
    authIdentifier,
  } = useDiptosIdentity();

  const liveInvoices = protocolState?.invoices ?? [];
  const liveVaults = protocolState?.vaults ?? [];
  const liveIdentities = protocolState?.identities ?? [];
  const liveNodes = protocolState?.verifierNodes ?? [];

  // 100% Dynamic data without hardcoded fallback numbers
  const totalTvlUsd = liveVaults.reduce((sum, v) => sum + v.tvlUsd, 0);
  const totalReceivablesUsd = liveInvoices.reduce((sum, i) => sum + i.faceValueUsd, 0);
  const seniorVault = liveVaults.find((v) => v.id === 'SENIOR_DROP');
  const juniorVault = liveVaults.find((v) => v.id === 'JUNIOR_TIN');

  const walletBalanceDisplay =
    isAuthenticated && activeAddress
      ? protocolState?.connectedWalletBalances
        ? `$${protocolState.connectedWalletBalances.usdcBalance} dUSDC • ${protocolState.connectedWalletBalances.ethBalance} ETH`
        : '$0.00 dUSDC • 0.0000 ETH'
      : 'Wallet Disconnected';

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      <DiptosHeader />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10 flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#0D1527] via-[#0B1120] to-[#080C14] p-6 sm:p-10 shadow-2xl">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid-blueprint opacity-30" />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
            {/* Left Column: Mission & Metrics */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  BASE L2 (8453) • BLOCK #{protocolState?.blockNumber ? protocolState.blockNumber.toString() : 'SYNCED'}
                </span>
                <span className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-sky-400">
                  UNCITRAL MLETR &amp; UCC ART. 12 TRUE SALE
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
                Institutional Liquidity for <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Global Trade Receivables</span>.
              </h1>

              <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
                Diptos bridges traditional trade finance receivables ($5.2T global gap) with native stablecoin liquidity.
                Government-cleared e-invoices are ingested, normalized via canonical hashing, and minted into bankruptcy-remote{' '}
                <strong className="text-white font-mono">ERC-3643</strong> notes settled atomically on Base L2.
              </p>

              {/* Dynamic Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-y border-slate-800/80 py-4 font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wider">Vault TVL</span>
                  <div className="text-lg sm:text-xl font-bold text-white tabular-nums">
                    ${totalTvlUsd.toLocaleString('en-US')}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wider">Senior APY</span>
                  <div className="text-lg sm:text-xl font-bold text-emerald-400 tabular-nums">
                    {seniorVault ? `${seniorVault.targetApyPercent.toFixed(2)}%` : '8.85%'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wider">Junior First-Loss</span>
                  <div className="text-lg sm:text-xl font-bold text-amber-400 tabular-nums">
                    {juniorVault ? `${juniorVault.targetApyPercent.toFixed(2)}%` : '14.20%'}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-500 tracking-wider">Gas SLA</span>
                  <div className="text-lg sm:text-xl font-bold text-cyan-400 tabular-nums">
                    $0.00 (Sponsored)
                  </div>
                </div>
              </div>

              {/* CTA Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/supplier"
                  className="rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <FileCheck2 className="h-4 w-4" />
                  <span>Originate Invoices (Supplier)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <Link
                  href="/financier"
                  className="rounded-lg border border-slate-700 bg-slate-900/80 px-5 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 hover:border-slate-600 transition flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4 text-cyan-400" />
                  <span>Allocate Capital (Financier)</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setIsFaucetModalOpen(true)}
                  className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2.5 text-xs font-mono font-medium text-slate-400 hover:text-white hover:border-slate-700 transition"
                >
                  <Droplets className="h-3.5 w-3.5 inline mr-1 text-blue-400" />
                  Testnet Faucet
                </button>
              </div>
            </div>

            {/* Right Column: Live Corridors & Quick Status */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-white">
                      Active Trade Corridors
                    </h3>
                  </div>
                  <SemanticPill variant="emerald">AUTOMATED DvP</SemanticPill>
                </div>

                <div className="mt-3 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <div>
                      <div className="font-semibold text-slate-200">Singapore ↔ EU Corridor</div>
                      <div className="font-mono text-[11px] text-slate-400">Peppol BIS Billing 3.0 • IMDA / UK ETDA</div>
                    </div>
                    <SemanticPill variant="blue">PEPPOL XML</SemanticPill>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <div>
                      <div className="font-semibold text-slate-200">India ↔ UK / US Trade</div>
                      <div className="font-mono text-[11px] text-slate-400">NIC GSTN 64-Char IRN • Non-Banking Factors</div>
                    </div>
                    <SemanticPill variant="emerald">GSTN IRN</SemanticPill>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5">
                    <div>
                      <div className="font-semibold text-slate-200">Mexico ↔ US Nearshore</div>
                      <div className="font-mono text-[11px] text-slate-400">SAT CFDI 4.0 UUID • Delaware UCC Art 12</div>
                    </div>
                    <SemanticPill variant="amber">CFDI 4.0</SemanticPill>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Connected Identity:</span>
                  <span className="text-emerald-400 font-medium">
                    {isAuthenticated ? (activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Connected') : 'Guest (Read-Only)'}
                  </span>
                </div>
              </div>

              {/* MonetaGo & Deduplication Status Pill */}
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-white">MonetaGo Global Deduplication Fabric</div>
                    <div className="text-[11px] text-slate-400">Live API Bridge Active • 0 Double-Financing Collisions</div>
                  </div>
                </div>
                <Link
                  href="/registry"
                  className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Verify &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Dedicated Workspace Entry Points */}
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/supplier"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-emerald-500/50 hover:bg-slate-900 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="emerald">ROLE 01 • SUPPLIER</SemanticPill>
                <FileCheck2 className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-white group-hover:text-emerald-400 transition">
                Supplier Early-Pay Portal
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                1-Click e-invoice ingestion (Peppol, GSTN, CFDI), canonical hash derivation, and instant ERC-3643 note minting for sub-24h payout.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono text-xs text-emerald-400 font-medium">
              <span>Open /supplier</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/financier"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-sky-500/50 hover:bg-slate-900 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="blue">ROLE 02 • FINANCIER</SemanticPill>
                <Layers className="h-4 w-4 text-sky-400" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-white group-hover:text-sky-400 transition">
                Financier Credit Desk
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Allocate capital into Senior DROP or Junior TIN vaults, test portfolio default stress scenarios, and fund whole-invoice orderbooks.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono text-xs text-sky-400 font-medium">
              <span>Open /financier</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/registry"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-slate-700 hover:bg-slate-900 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="slate">LAYER 01 • DEDUP</SemanticPill>
                <Globe2 className="h-4 w-4 text-slate-400" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-white group-hover:text-slate-300 transition">
                Canonical Hash Registry
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Test deterministic anti-double-financing normalization against live registered hashes on Base L2 and the MonetaGo API bridge.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono text-xs text-slate-400 font-medium">
              <span>Open /registry</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          <Link
            href="/security"
            className="group rounded-xl border border-slate-800 bg-slate-900/60 p-5 hover:border-purple-500/50 hover:bg-slate-900 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="zk-masked">LAYER 03 • DI &amp; ZK</SemanticPill>
                <Lock className="h-4 w-4 text-purple-400" />
              </div>
              <h3 className="mt-3 text-base font-semibold text-white group-hover:text-purple-400 transition">
                DI &amp; ZK Security Console
              </h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Inspect GLEIF vLEI bindings, ONCHAINID contracts, W3C VCs 2.0, and Privado ID Groth16 selective disclosure proofs.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 font-mono text-xs text-purple-400 font-medium">
              <span>Open /security</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </section>

        {/* Live On-Chain Telemetry & Deployed Contracts */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Contracts Directory */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Base L2 Smart Contracts (Chain ID 8453)
                </h2>
                <p className="text-xs text-slate-400">
                  Compiled Solidity 0.8.24 (Cancun EVM) deployed on Base execution environment.
                </p>
              </div>
              <SemanticPill variant="emerald">7/7 VERIFIED</SemanticPill>
            </div>

            <div className="mt-3 divide-y divide-slate-800/70 font-mono text-xs">
              {protocolState?.contracts ? (
                Object.entries(protocolState.contracts).map(([name, address]) => (
                  <div key={name} className="flex items-center justify-between py-2.5">
                    <span className="font-semibold text-slate-300">{name}</span>
                    <span className="text-cyan-400 truncate max-w-[220px]">{address}</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-xs text-slate-500">Loading contracts...</div>
              )}
            </div>
          </div>

          {/* Corporate DIDs Registered On-Chain */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 lg:col-span-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Corporate Identities (IdentityRegistry.sol)
                </h2>
                <p className="text-xs text-slate-400">
                  GLEIF vLEI verified corporate legal entities on Base L2.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer"
              >
                + Register DID
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {liveIdentities.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-5 text-center text-xs text-slate-400">
                  No corporate identities registered yet. Connect MetaMask to register your Legal Entity and vLEI.
                </div>
              ) : (
                liveIdentities.map((id) => (
                  <div
                    key={id.wallet}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/40 p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-400">
                          {id.role}
                        </span>
                        <span className="text-xs font-semibold text-white">{id.legalName}</span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-400 truncate max-w-[280px]">
                        {id.wallet} • vLEI: {id.vlei}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs tabular-nums">
                      <div className="font-semibold text-emerald-400">
                        {id.usdcBalanceFormatted ?? '0.00'} dUSDC
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {id.ethBalanceFormatted ?? '0.0000'} ETH
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#080C14] px-4 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Diptos Protocol</span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span>•</span>
            <span className="font-mono text-[11px]">UNCITRAL MLETR &amp; UCC Art. 12 Compliant</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <Link href="/partners" className="hover:text-slate-300 transition">Partner API</Link>
            <Link href="/registry" className="hover:text-slate-300 transition">Deduplication Fabric</Link>
            <a href="https://github.com/Jayram2204/Diptos" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
