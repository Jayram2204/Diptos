'use client';

import React from 'react';
import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';
import { buildInvoiceEasTimeline } from '@/layers/layer2-base-protocol';
import { generateZkSelectiveDisclosureView } from '@/layers/layer3-di-security';
import { SemanticPill } from '@/components/ui/SemanticPill';
import { ShieldCheck, X } from 'lucide-react';

export interface ZkEasAuditDrawerProps {
  invoice: RWAInvoiceRecord | null;
  isOpen?: boolean;
  onClose: () => void;
}

export function ZkEasAuditDrawer({ invoice, onClose }: ZkEasAuditDrawerProps) {
  if (!invoice) return null;

  const easTimeline = buildInvoiceEasTimeline(invoice);
  const zkDisclosure = generateZkSelectiveDisclosureView({
    invoiceId: invoice.invoiceNumber,
    buyerRating: invoice.buyerRating,
    cbamStandard: invoice.cbamStandard,
    tierLevel: 'Authorized Tier-1 Supplier',
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Cryptographic Provenance and ZK Audit Drawer for ${invoice.invoiceNumber}`}
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm"
    >
      <div className="flex h-full w-full max-w-[560px] flex-col border-l border-slate-800 bg-[#0B111E] shadow-2xl shadow-emerald-950/30 overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-[#0B111E]/95 backdrop-blur-md px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <SemanticPill variant="emerald">3-LAYER PROVENANCE VERIFIED</SemanticPill>
              <span className="font-mono text-[11px] font-semibold text-slate-400">
                {invoice.id}
              </span>
            </div>
            <h2 className="mt-1 text-base font-bold text-white">
              Cryptographic Audit &amp; ZK Selective Disclosure
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Layer 1: ERC-3643 Canonical Invoice Fingerprint */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Layer 1 — Canonical Invoice Fingerprint
              </span>
              <SemanticPill variant="emerald">MONETAGO + BASE UNIQUE ✓</SemanticPill>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Invoice &amp; Corridor:</span>
                <span className="font-mono font-semibold text-slate-200">
                  {invoice.invoiceNumber} ({invoice.corridor})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tax Portal Clearance:</span>
                <span className="font-mono text-[11px] text-cyan-400">
                  {invoice.governmentClearanceRef}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-medium text-slate-400">
                  Canonical Hash (InvoiceRegistry.sol):
                </span>
                <code className="mt-1 block break-all rounded-lg border border-slate-800 bg-[#06090F] p-2.5 font-mono text-[11px] text-emerald-400">
                  {invoice.canonicalHash}
                </code>
              </div>
            </div>
          </section>

          {/* Layer 2: Base L2 Ethereum Attestation Service (EAS) Timeline */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Layer 2 — Base EAS Attestation Timeline
              </span>
              <SemanticPill variant="blue">CHAIN ID: 8453 (BASE)</SemanticPill>
            </div>

            <div className="space-y-2.5">
              {easTimeline.map((step) => (
                <div
                  key={step.schemaNumber}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-200">
                      {step.schemaTitle}
                    </span>
                    <SemanticPill
                      variant={step.status === 'ATTESTED_ON_BASE' ? 'emerald' : 'slate'}
                    >
                      {step.status === 'ATTESTED_ON_BASE' ? 'ATTESTED ✓' : 'AT MATURITY'}
                    </SemanticPill>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400">
                    Signer: <span className="font-medium text-slate-300">{step.signerRole}</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-slate-500 break-all">
                    UID: {step.attestationUid}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Layer 3: Privado ID Zero-Knowledge Selective Disclosure */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Layer 3 — Privado ID Zero-Knowledge Shield
              </span>
              <SemanticPill variant="emerald">ZK PROVEN (ISO-14064) ✓</SemanticPill>
            </div>

            <div className="space-y-2.5">
              {zkDisclosure.publicProofs.map((proof) => (
                <div
                  key={proof.claimLabel}
                  className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-300">
                      {proof.claimLabel}
                    </span>
                    <SemanticPill variant="emerald">{proof.badgeText}</SemanticPill>
                  </div>
                  <p className="mt-1 text-xs text-slate-300 leading-relaxed">{proof.publicStatement}</p>
                </div>
              ))}
            </div>

            {/* Explicitly Masked Commercial Secrets */}
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Confidential Commercial Line Items
                </span>
                <SemanticPill variant="zk-masked">ZK-MASKED (PRIVATE)</SemanticPill>
              </div>

              <div className="space-y-2">
                {invoice.privateLineItems.map((item) => (
                  <div
                    key={item.skuCode}
                    className="rounded-lg border border-slate-800 bg-slate-950/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-200">
                        SKU: {item.skuCode}
                      </span>
                      <SemanticPill variant="zk-masked">
                        {item.unitPriceMasked}
                      </SemanticPill>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{item.description}</div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono">
                      <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-400">
                        Unit Price: <strong className="text-amber-400">[ZK-MASKED]</strong>
                      </span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-400">
                        Margin: <strong className="text-amber-400">[ZK-MASKED]</strong>
                      </span>
                      <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-slate-400">
                        Rebates: <strong className="text-amber-400">[ZK-MASKED]</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
