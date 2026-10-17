'use client';

import React, { useState } from 'react';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { DIPTOS_TRANCHE_VAULTS } from '@/layers/layer1-rwa-core';
import { SemanticPill } from './SemanticPill';

const ARCHITECTURE_LAYERS = [
  {
    number: 'LAYER 01',
    title: 'RWA Core Engine',
    subtitle: 'Asset Origination, Deduplication & Liquidity Packaging',
    standards: ['ERC-3643 (T-REX)', 'ERC-4626 Vaults', 'Peppol BIS 3.0', 'MonetaGo Bridge', 'UNCITRAL MLETR'],
    metricLabel: 'Canonical Hash Collisions Blocked',
    metricValue: '100% Deterministic',
    accentBorder: 'border-[#047857]',
    badgeVariant: 'emerald' as const,
    zOffset: 'translate-z-12',
    description:
      'Normalizes 6 immutable invoice fields into a canonical keccak256 fingerprint, verifies NIC GSTN / Peppol / SAT CFDI tax signatures, and mints bankruptcy-remote True Sale notes.',
  },
  {
    number: 'LAYER 02',
    title: 'Base L2 Protocol Engine',
    subtitle: 'Sub-Cent Execution, EAS Attestations & Atomic DvP Settlement',
    standards: ['Base L2 (8453)', 'ERC-4337 Paymaster', 'EAS Schemas #1–#3', 'USDC / EURC', 'Virtual IBAN Oracle'],
    metricLabel: 'Lifecycle Execution Cost',
    metricValue: '< $0.01 (Gas Sponsored)',
    accentBorder: 'border-[#1D4ED8]',
    badgeVariant: 'blue' as const,
    zOffset: 'translate-z-6',
    description:
      'Anchors Supplier Origination and Buyer Acceptance on Base via Ethereum Attestation Service (EAS), abstracts private keys via Privy ERC-4337 Smart Wallets, and settles atomically.',
  },
  {
    number: 'LAYER 03',
    title: 'DI & ZK Privacy Shield',
    subtitle: 'Institutional KYB/vLEI, ONCHAINID & Zero-Knowledge Masking',
    standards: ['GLEIF vLEI', 'ONCHAINID (ERC-734/735)', 'W3C VC 2.0', 'Privado ID ZK', 'EU CBAM ISO-14064'],
    metricLabel: 'Unit Price & Margin Exposure',
    metricValue: '0 Bytes Public [ZK-MASKED]',
    accentBorder: 'border-[#0F172A]',
    badgeVariant: 'zk-masked' as const,
    zOffset: 'translate-z-0',
    description:
      'Binds corporate participants to 20-char GLEIF vLEIs and ONCHAINID contracts while using Privado ID Groth16 ZK proofs to verify Tier-1 and EU CBAM compliance privately.',
  },
];

export function Rwa3dArchitectureHero() {
  const { setActiveRole } = useDiptosIdentity();
  const [rightPanelMode, setRightPanelMode] = useState<'3d-stack' | 'maple-returns'>('3d-stack');
  const [activeLayerIndex, setActiveLayerIndex] = useState<number>(0);
  const [selectedTrancheIndex, setSelectedTrancheIndex] = useState<0 | 1>(0);

  const selectedTranche = DIPTOS_TRANCHE_VAULTS[selectedTrancheIndex];

  return (
    <section
      aria-label="Diptos Institutional RWA Overview and 3D Architecture"
      className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-12"
    >
      {/* Left Card: Maple Institutional-Inspired Executive Summary */}
      <div className="flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] lg:col-span-5">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <SemanticPill variant="emerald">MLETR & UCC ART. 12 TRUE SALE</SemanticPill>
            <SemanticPill variant="blue">BASE MAINNET (8453)</SemanticPill>
          </div>

          <h1 className="font-serif text-[28px] font-semibold tracking-[-0.02em] text-[#0F172A] sm:text-[32px] leading-[1.18]">
            Diptos Institutional —<br />
            Tokenized Trade Receivables
          </h1>

          <p className="mt-3 text-[14px] leading-[1.6] text-[#334155]">
            Short-duration (30–90 day), self-liquidating B2B trade invoices backed by cryptographic
            Buyer Acceptance (<span className="font-mono text-[12px] font-medium text-[#0F172A]">EAS</span>),
            cross-registry deduplication (<span className="font-mono text-[12px] font-medium text-[#0F172A]">MonetaGo</span>),
            and zero-knowledge corporate identity (<span className="font-mono text-[12px] font-medium text-[#0F172A]">GLEIF vLEI + Privado ID</span>).
          </p>

          {/* 4-Metric Institutional Grid modeled after Maple Institutional */}
          <div className="mt-6 grid grid-cols-2 gap-y-5 gap-x-6 border-y border-[#E2E8F0] py-5">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                Active Pool AUM
              </div>
              <div className="mt-1 font-mono text-[28px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
                $53.3M
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[#64748B] tabular-nums">
                684 Verified Invoices
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                Overcollateralization
              </div>
              <div className="mt-1 font-mono text-[28px] font-semibold tracking-tight text-[#0F172A] tabular-nums">
                124.5%
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[#047857] tabular-nums">
                20% Junior First-Loss + Slasher Bond
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                Real-Economy Net APY
              </div>
              <div className="mt-1 font-mono text-[28px] font-semibold tracking-tight text-[#047857] tabular-nums">
                8.85%–14.2%
              </div>
              <div className="mt-0.5 font-mono text-[11px] text-[#64748B] tabular-nums">
                Senior DROP / Junior TIN
              </div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                Settlement Rails
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex h-7 items-center rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 font-mono text-[11px] font-semibold text-[#0F172A]">
                  USDC
                </span>
                <span className="inline-flex h-7 items-center rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 font-mono text-[11px] font-semibold text-[#0F172A]">
                  EURC
                </span>
                <span className="inline-flex h-7 items-center rounded-full border border-[#CBD5E1] bg-[#F8FAFC] px-2.5 font-mono text-[11px] font-semibold text-[#0F172A]">
                  vIBAN
                </span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-[#64748B]">
                Atomic DvP • &lt;12h SLA
              </div>
            </div>
          </div>
        </div>

        {/* Primary & Secondary Action Buttons */}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => setActiveRole('financier')}
            className="flex-1 rounded-lg bg-[#0A2540] px-4 py-3 text-center text-[13px] font-semibold text-[#FFFFFF] transition hover:bg-[#0F172A] cursor-pointer"
          >
            Allocate Capital (Credit Desk)
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('supplier')}
            className="flex-1 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-4 py-3 text-center text-[13px] font-semibold text-[#0F172A] transition hover:bg-[#F1F5F9] cursor-pointer"
          >
            Accelerate Receivables (24h Cash)
          </button>
        </div>
      </div>

      {/* Right Card: Interactive 3D RWA Three-Layer Visualizer + Maple Returns & Performance */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] lg:col-span-7">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2 className="font-serif text-[20px] font-semibold tracking-[-0.02em] text-[#0F172A]">
              {rightPanelMode === '3d-stack'
                ? 'Interactive 3D Three-Layer RWA Architecture'
                : 'Institutional Returns & Tranche Performance'}
            </h2>
            <p className="text-[12px] text-[#64748B]">
              {rightPanelMode === '3d-stack'
                ? 'Inspect how each invoice traverses Origination, Base L2 Execution, and Zero-Knowledge DI.'
                : 'Historical compounding and monthly realized yield across Senior DROP and Junior TIN vaults.'}
            </p>
          </div>

          <div className="inline-flex rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1">
            <button
              type="button"
              onClick={() => setRightPanelMode('3d-stack')}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
                rightPanelMode === '3d-stack'
                  ? 'bg-[#0A2540] text-[#FFFFFF] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              3D Architecture Stack
            </button>
            <button
              type="button"
              onClick={() => setRightPanelMode('maple-returns')}
              className={`rounded-md px-3 py-1.5 text-[12px] font-semibold transition cursor-pointer ${
                rightPanelMode === 'maple-returns'
                  ? 'bg-[#0A2540] text-[#FFFFFF] shadow-xs'
                  : 'text-[#475569] hover:text-[#0F172A]'
              }`}
            >
              Returns &amp; Performance
            </button>
          </div>
        </div>

        {rightPanelMode === '3d-stack' ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12 items-center">
            {/* 3D Isometric Interactive Stack */}
            <div className="md:col-span-7">
              <div className="relative rounded-xl border border-[#E2E8F0] bg-gradient-to-b from-[#F8FAFC] to-[#F1F5F9] p-5 overflow-hidden">
                {/* Architectural Grid Background */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-45"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, #CBD5E1 1px, transparent 1px), linear-gradient(to bottom, #CBD5E1 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }}
                />

                <div className="relative z-10 flex flex-col gap-3">
                  {ARCHITECTURE_LAYERS.map((layer, idx) => {
                    const isSelected = activeLayerIndex === idx;
                    return (
                      <button
                        key={layer.number}
                        type="button"
                        onClick={() => setActiveLayerIndex(idx)}
                        className={`group relative w-full text-left rounded-lg border bg-[#FFFFFF] p-3.5 transition-all duration-300 cursor-pointer ${
                          isSelected
                            ? `${layer.accentBorder} border-l-4 shadow-md -translate-y-0.5`
                            : 'border-[#E2E8F0] hover:border-[#94A3B8]'
                        }`}
                        style={{
                          transform: isSelected
                            ? 'perspective(900px) rotateX(2deg) rotateY(-2deg) translateZ(6px)'
                            : 'perspective(900px) rotateX(2deg) rotateY(-2deg) translateZ(0px)',
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.06em] text-[#475569]">
                            {layer.number} • {layer.title}
                          </span>
                          <SemanticPill variant={layer.badgeVariant}>
                            {layer.metricValue}
                          </SemanticPill>
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-[#0F172A]">
                          {layer.subtitle}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {layer.standards.map((std) => (
                            <span
                              key={std}
                              className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#334155]"
                            >
                              {std}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Active 3D Layer Inspector Panel */}
            <div className="md:col-span-5 flex flex-col justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                    {ARCHITECTURE_LAYERS[activeLayerIndex].number} SPECIFICATION
                  </span>
                  <span className="inline-block h-2 w-2 rounded-full bg-[#047857]" />
                </div>

                <h3 className="mt-2 text-[16px] font-bold text-[#0F172A]">
                  {ARCHITECTURE_LAYERS[activeLayerIndex].title}
                </h3>

                <p className="mt-2 text-[13px] leading-[1.55] text-[#334155]">
                  {ARCHITECTURE_LAYERS[activeLayerIndex].description}
                </p>

                <div className="mt-4 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#64748B]">
                    {ARCHITECTURE_LAYERS[activeLayerIndex].metricLabel}
                  </div>
                  <div className="mt-1 font-mono text-[15px] font-bold text-[#0F172A] tabular-nums">
                    {ARCHITECTURE_LAYERS[activeLayerIndex].metricValue}
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-[#E2E8F0] pt-3">
                <div className="font-mono text-[11px] text-[#475569]">
                  Isolated Repo Path:
                </div>
                <code className="mt-1 block rounded bg-[#FFFFFF] border border-[#E2E8F0] px-2 py-1 font-mono text-[11px] text-[#0F172A]">
                  {activeLayerIndex === 0 && 'src/layers/layer1-rwa-core/'}
                  {activeLayerIndex === 1 && 'src/layers/layer2-base-protocol/'}
                  {activeLayerIndex === 2 && 'src/layers/layer3-di-security/'}
                </code>
              </div>
            </div>
          </div>
        ) : (
          /* Maple Institutional-Style Returns & Monthly Performance View */
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {/* Growth of $1M Chart Card */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:col-span-7 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[12px] font-medium text-[#64748B]">
                    Growth of $1,000,000 deposited (12M)
                  </div>
                  <div className="mt-1 font-mono text-[26px] font-bold text-[#0F172A] tabular-nums">
                    {selectedTranche.id === 'SENIOR_DROP' ? '$1,088,500' : '$1,142,000'}
                  </div>
                </div>
                <div className="inline-flex rounded-md border border-[#E2E8F0] bg-[#FFFFFF] p-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedTrancheIndex(0)}
                    className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold cursor-pointer ${
                      selectedTrancheIndex === 0
                        ? 'bg-[#0A2540] text-[#FFFFFF]'
                        : 'text-[#475569]'
                    }`}
                  >
                    Senior DROP (8.85%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTrancheIndex(1)}
                    className={`rounded px-2.5 py-1 font-mono text-[11px] font-semibold cursor-pointer ${
                      selectedTrancheIndex === 1
                        ? 'bg-[#0A2540] text-[#FFFFFF]'
                        : 'text-[#475569]'
                    }`}
                  >
                    Junior TIN (14.2%)
                  </button>
                </div>
              </div>

              {/* Clean SVG Compounding Curve */}
              <div className="my-4">
                <svg
                  viewBox="0 0 360 130"
                  className="w-full h-32 overflow-visible"
                  role="img"
                  aria-label="Compounding NAV growth chart"
                >
                  <defs>
                    <linearGradient id="diptosYieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#047857" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <line x1="0" y1="20" x2="360" y2="20" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="0" y1="65" x2="360" y2="65" stroke="#E2E8F0" strokeDasharray="3 3" />
                  <line x1="0" y1="110" x2="360" y2="110" stroke="#CBD5E1" />
                  <path
                    d="M 10 110 L 65 96 L 120 82 L 175 68 L 230 52 L 285 35 L 350 16 L 350 110 Z"
                    fill="url(#diptosYieldGrad)"
                  />
                  <path
                    d="M 10 110 L 65 96 L 120 82 L 175 68 L 230 52 L 285 35 L 350 16"
                    fill="none"
                    stroke="#047857"
                    strokeWidth="2.5"
                  />
                </svg>
                <div className="flex justify-between font-mono text-[10px] text-[#64748B] tabular-nums">
                  <span>Oct 25 ($1.00M)</span>
                  <span>Feb 26</span>
                  <span>Jun 26</span>
                  <span>Oct 26 ({selectedTranche.id === 'SENIOR_DROP' ? '$1.088M' : '$1.142M'})</span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-2.5 text-[11px] text-[#475569]">
                <span>Zero correlation to crypto token volatility</span>
                <span className="font-mono font-semibold text-[#047857] tabular-nums">
                  0.00% Historical Default
                </span>
              </div>
            </div>

            {/* Monthly Performance Matrix */}
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 md:col-span-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#0F172A]">
                    Monthly Performance (2026)
                  </span>
                  <span className="rounded bg-[#FFFFFF] border border-[#E2E8F0] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#0F172A]">
                    {selectedTranche.symbol}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {selectedTranche.monthlyPerformance2026.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1.5"
                    >
                      <span className="text-[11px] text-[#64748B]">{item.month}</span>
                      <span className="font-mono text-[12px] font-semibold text-[#0F172A] tabular-nums">
                        {item.returnPercent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between rounded-lg border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-2">
                <span className="text-[12px] font-semibold text-[#047857]">
                  Annualized Net APY
                </span>
                <span className="font-mono text-[14px] font-bold text-[#047857] tabular-nums">
                  {selectedTranche.targetApyPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
