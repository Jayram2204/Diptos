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
} from 'lucide-react';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { DiptosHeader } from '@/components/layout/DiptosHeader';
import { Rwa3dArchitectureHero } from '@/components/ui/Rwa3dArchitectureHero';
import { SemanticPill } from '@/components/ui/SemanticPill';

export function Rwa3dLandingPage() {
  const {
    protocolState,
    setIsAuthModalOpen,
    setIsFaucetModalOpen,
    activeAddress,
    authIdentifier,
  } = useDiptosIdentity();

  const [exploded3dView, setExploded3dView] = useState<boolean>(true);
  const [hoveredPlane, setHoveredPlane] = useState<number | null>(null);

  const liveInvoices = protocolState?.invoices ?? [];
  const liveVaults = protocolState?.vaults ?? [];
  const liveIdentities = protocolState?.identities ?? [];
  const liveNodes = protocolState?.verifierNodes ?? [];
  const envWallets = protocolState?.envWallets ?? [];

  const totalTvlUsd = liveVaults.reduce((sum, v) => sum + v.tvlUsd, 0);
  const totalReceivablesUsd = liveInvoices.reduce((sum, i) => sum + i.faceValueUsd, 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <DiptosHeader />

      <main className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 space-y-10">
        {/* Top 3D RWA Website Animation Showcase Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-[#CBD5E1] bg-gradient-to-br from-[#0A2540] via-[#0F172A] to-[#1E293B] p-6 sm:p-10 text-white shadow-xl">
          {/* Isometric 3D Blueprint Grid Overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'linear-gradient(to right, #38BDF8 1px, transparent 1px), linear-gradient(to bottom, #38BDF8 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
            {/* Left 6 Cols: Editorial Copy & Multi-Route Launchpad */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-400/40 bg-teal-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#14B8A6]">
                  <Sparkles className="h-3.5 w-3.5" />
                  LIVE ON BASE L2 (8453) • BLOCK #{protocolState?.blockNumber ?? 'SYNCING'}
                </span>
                <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 font-mono text-[11px] font-semibold text-sky-300">
                  ERC-3643 • ERC-4626 • ERC-4337
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-semibold tracking-tight leading-[1.12] text-white">
                Self-Liquidating Global Trade Receivables on Base L2.
              </h1>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
                Diptos eliminates the $5.2T global trade finance gap by transforming government-cleared
                B2B e-invoices into bankruptcy-remote{' '}
                <span className="font-mono text-white">ERC-3643</span> RWA notes—backed by
                cryptographic Buyer Acceptance (<span className="font-mono text-white">EAS</span>)
                and Zero-Knowledge corporate identity (<span className="font-mono text-white">GLEIF vLEI + Privado ID</span>).
              </p>

              {/* Live On-Chain Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    On-Chain Vault TVL
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-white tabular-nums">
                    ${totalTvlUsd.toLocaleString('en-US')}
                  </div>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Active RWA Notes
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-[#14B8A6] tabular-nums">
                    {liveInvoices.length} (${totalReceivablesUsd.toLocaleString('en-US')})
                  </div>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    Verified vLEI Entities
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-sky-300 tabular-nums">
                    {liveIdentities.length} On-Chain
                  </div>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-xs">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    dUSDC Faucet Supply
                  </div>
                  <div className="mt-1 font-mono text-lg font-bold text-amber-300 tabular-nums">
                    ${protocolState?.totalUsdcSupplyFormatted ?? '0'}
                  </div>
                </div>
              </div>

              {/* Primary Navigation & Faucet/Auth CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/supplier"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#14B8A6] px-5 py-3 text-xs font-bold text-[#0F172A] shadow-lg hover:bg-teal-400 transition"
                >
                  Launch Supplier Portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/financier"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-xs font-semibold text-white hover:bg-white/20 transition"
                >
                  Financier Credit Desk
                </Link>
                <button
                  type="button"
                  onClick={() => setIsFaucetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 font-mono text-xs font-semibold text-emerald-300 hover:bg-emerald-500/25 cursor-pointer"
                >
                  <Droplets className="h-4 w-4" />
                  Claim ETH + dUSDC Faucet
                </button>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-3 font-mono text-xs font-semibold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
                >
                  <KeyRound className="h-4 w-4" />
                  Switch Auth / .env Wallet
                </button>
              </div>
            </div>

            {/* Right 6 Cols: Interactive 3D Isometric RWA Tokenization Sculpture */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-white/15 bg-[#0F172A]/80 p-5 backdrop-blur-md shadow-2xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-[#14B8A6]" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-white">
                      3D RWA Three-Layer State Machine (Live Telemetry)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExploded3dView((prev) => !prev)}
                    className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-sky-300 hover:bg-white/20 cursor-pointer"
                  >
                    {exploded3dView ? 'Compact 3D Planes' : 'Explode 3D Planes'}
                  </button>
                </div>

                {/* 3D Perspective Stack */}
                <div
                  className="relative py-4 space-y-3.5"
                  style={{ perspective: '1100px' }}
                >
                  {/* PLANE 1: RWA Core Layer */}
                  <div
                    onMouseEnter={() => setHoveredPlane(0)}
                    onMouseLeave={() => setHoveredPlane(null)}
                    className="rounded-xl border border-teal-400/50 bg-gradient-to-r from-teal-950/90 to-slate-900/90 p-4 transition-all duration-500 shadow-lg"
                    style={{
                      transform: exploded3dView
                        ? `rotateX(12deg) rotateY(-8deg) translateZ(${hoveredPlane === 0 ? '26px' : '16px'})`
                        : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#14B8A6]">
                        PLANE 01 • LAYER 1 RWA CORE ENGINE
                      </span>
                      <span className="rounded bg-teal-500/20 px-2 py-0.5 font-mono text-[10px] text-teal-300">
                        InvoiceRegistry.sol + RWAInvoice3643.sol
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-200">
                      Canonical Keccak256 Anti-Double-Financing • {liveInvoices.length} Live ERC-3643
                      Notes • Senior DROP ({liveVaults[0]?.targetApyPercent ?? 8.85}% APY) &amp;
                      Junior TIN ({liveVaults[1]?.targetApyPercent ?? 14.2}% APY)
                    </p>
                    <div className="mt-2 font-mono text-[10px] text-slate-400">
                      Contract: {protocolState?.contracts.INVOICE_REGISTRY}
                    </div>
                  </div>

                  {/* PLANE 2: Base Protocol Layer */}
                  <div
                    onMouseEnter={() => setHoveredPlane(1)}
                    onMouseLeave={() => setHoveredPlane(null)}
                    className="rounded-xl border border-sky-400/50 bg-gradient-to-r from-sky-950/90 to-slate-900/90 p-4 transition-all duration-500 shadow-lg"
                    style={{
                      transform: exploded3dView
                        ? `rotateX(12deg) rotateY(-8deg) translateZ(${hoveredPlane === 1 ? '18px' : '8px'})`
                        : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-sky-300">
                        PLANE 02 • LAYER 2 BASE PROTOCOL ENGINE
                      </span>
                      <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] text-sky-200">
                        SettlementEscrow.sol + ERC-4337 AA
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-200">
                      EAS Schemas #1–#3 Buyer Co-Signing • Gas-Sponsored ERC-4337 Smart Accounts •
                      Atomic DvP in dUSDC ({protocolState?.contracts.SETTLEMENT_ESCROW?.slice(0, 10)}...)
                    </p>
                    <div className="mt-2 font-mono text-[10px] text-slate-400">
                      Active Signer: {authIdentifier} ({activeAddress?.slice(0, 8)}...)
                    </div>
                  </div>

                  {/* PLANE 3: DI & ZK Security Layer */}
                  <div
                    onMouseEnter={() => setHoveredPlane(2)}
                    onMouseLeave={() => setHoveredPlane(null)}
                    className="rounded-xl border border-amber-400/50 bg-gradient-to-r from-slate-900/95 to-indigo-950/90 p-4 transition-all duration-500 shadow-lg"
                    style={{
                      transform: exploded3dView
                        ? `rotateX(12deg) rotateY(-8deg) translateZ(${hoveredPlane === 2 ? '12px' : '0px'})`
                        : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-amber-300">
                        PLANE 03 • LAYER 3 DI &amp; ZK PRIVACY SHIELD
                      </span>
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-200">
                        IdentityRegistry.sol + Slasher.sol
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-200">
                      GLEIF vLEI + ONCHAINID • Privado ID Groth16 ZK Selective Disclosure (0 Bytes
                      SKU Margin Leakage) • {liveNodes.length} Bonded Verifier Nodes
                    </p>
                    <div className="mt-2 font-mono text-[10px] text-slate-400">
                      Contract: {protocolState?.contracts.IDENTITY_REGISTRY}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Maple Institutional & 3D Architecture Overview */}
        <Rwa3dArchitectureHero />

        {/* 4 Role-Based Workspaces & Live Contract Directory */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/supplier"
            className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#0A2540] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="emerald">ROLE 01 • EXPORTER</SemanticPill>
                <FileCheck2 className="h-4 w-4 text-[#0A2540]" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0F172A] group-hover:text-[#0284C7]">
                Supplier Early-Pay Portal
              </h3>
              <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                Originate Peppol / GSTN / CFDI e-invoices on-chain, compute canonical hashes, and
                mint ERC-3643 notes for sub-24h USDC or vIBAN payout.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3 font-mono text-xs font-semibold text-[#0A2540]">
              <span>Open /supplier</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/financier"
            className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#0A2540] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="blue">ROLE 02 • LP / FUND</SemanticPill>
                <Layers className="h-4 w-4 text-[#0284C7]" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0F172A] group-hover:text-[#0284C7]">
                Financier Credit Desk
              </h3>
              <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                Allocate dUSDC into Senior DROP or Junior TIN ERC-4626 vaults, inspect the 2-Second
                Trust Scorecard, and execute Atomic DvP settlements.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3 font-mono text-xs font-semibold text-[#0A2540]">
              <span>Open /financier</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/registry"
            className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#0A2540] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="slate">LAYER 01 • DEDUP</SemanticPill>
                <Globe2 className="h-4 w-4 text-[#059669]" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0F172A] group-hover:text-[#0284C7]">
                Canonical Hash Registry
              </h3>
              <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                Test deterministic anti-double-financing normalization against live registered
                hashes in InvoiceRegistry.sol and commit new fingerprints.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3 font-mono text-xs font-semibold text-[#0A2540]">
              <span>Open /registry</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>

          <Link
            href="/security"
            className="group rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#0A2540] transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <SemanticPill variant="zk-masked">LAYER 03 • DI &amp; ZK</SemanticPill>
                <Lock className="h-4 w-4 text-[#0F172A]" />
              </div>
              <h3 className="mt-3 text-base font-bold text-[#0F172A] group-hover:text-[#0284C7]">
                DI &amp; ZK Security Console
              </h3>
              <p className="mt-1.5 text-xs text-[#475569] leading-relaxed">
                Inspect GLEIF vLEI bindings, issue W3C Verifiable Credentials 2.0 on-chain, and
                post slashable verifier bonds in Slasher.sol.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E2E8F0] pt-3 font-mono text-xs font-semibold text-[#0A2540]">
              <span>Open /security</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </section>

        {/* Live Deployed Smart Contracts & .env Institutional Wallets Telemetry Table */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs lg:col-span-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Live Deployed Base / ETH Smart Contracts (Chain ID 8453)
                </h2>
                <p className="text-xs text-[#64748B]">
                  All 7 contracts compiled with Solidity 0.8.24 (Cancun EVM) and verified on-chain.
                </p>
              </div>
              <SemanticPill variant="emerald">7/7 CONTRACTS LIVE</SemanticPill>
            </div>

            <div className="mt-3 divide-y divide-[#E2E8F0] font-mono text-xs">
              {protocolState?.contracts &&
                Object.entries(protocolState.contracts).map(([name, address]) => (
                  <div key={name} className="flex items-center justify-between py-2.5">
                    <span className="font-semibold text-[#0F172A]">{name}</span>
                    <span className="text-[#0284C7]">{address}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-xs lg:col-span-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A]">
                  Pre-Configured .env Base / ETH Wallets &amp; Live Faucet Balances
                </h2>
                <p className="text-xs text-[#64748B]">
                  Loaded dynamically from <code className="font-mono">.env.local</code> and funded
                  by the on-chain Faucet.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFaucetModalOpen(true)}
                className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
              >
                + Mint Faucet Funds
              </button>
            </div>

            <div className="mt-3 space-y-2.5">
              {envWallets.map((w) => (
                <div
                  key={w.keyId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#0A2540] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-white">
                        {w.keyId}
                      </span>
                      <span className="text-xs font-bold text-[#0F172A]">{w.legalName}</span>
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[#475569]">
                      {w.address} • vLEI: {w.vlei}
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums">
                    <div className="font-bold text-[#059669]">{w.usdcBalanceFormatted} dUSDC</div>
                    <div className="text-[11px] text-[#64748B]">{w.ethBalanceFormatted} ETH</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
