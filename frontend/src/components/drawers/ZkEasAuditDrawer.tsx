'use client';

import React from 'react';
import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';
import { buildInvoiceEasTimeline } from '@/layers/layer2-base-protocol';
import { generateZkSelectiveDisclosureView } from '@/layers/layer3-di-security';
import { SemanticPill } from '@/components/ui/SemanticPill';

export interface ZkEasAuditDrawerProps {
  invoice: RWAInvoiceRecord | null;
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
      className="fixed inset-0 z-50 flex justify-end bg-[#0F172A]/40 backdrop-blur-[1px]"
    >
      <div className="flex h-full w-full max-w-[540px] flex-col border-l border-[#CBD5E1] bg-[#FFFFFF] shadow-2xl overflow-y-auto">
        {/* Drawer Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E2E8F0] bg-[#FFFFFF] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <SemanticPill variant="emerald">3-LAYER PROVENANCE VERIFIED</SemanticPill>
              <span className="font-mono text-[11px] font-semibold text-[#64748B]">
                {invoice.id}
              </span>
            </div>
            <h2 className="mt-1 text-[17px] font-bold tracking-[-0.01em] text-[#0F172A]">
              Cryptographic Audit &amp; ZK Selective Disclosure
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-semibold text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
          >
            Close ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Layer 1: ERC-3643 Canonical Invoice Fingerprint */}
          <section className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
                Layer 1 — Canonical Invoice Fingerprint
              </span>
              <SemanticPill variant="emerald">MONETAGO + BASE UNIQUE ✓</SemanticPill>
            </div>

            <div className="mt-3 space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Invoice &amp; Corridor:</span>
                <span className="font-mono font-semibold text-[#0F172A]">
                  {invoice.invoiceNumber} ({invoice.corridor})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Tax Portal Clearance:</span>
                <span className="font-mono text-[11px] text-[#0F172A]">
                  {invoice.governmentClearanceRef}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-[#64748B]">
                  Canonical Hash (InvoiceRegistry.sol):
                </span>
                <code className="mt-1 block break-all rounded border border-[#E2E8F0] bg-[#FFFFFF] p-2 font-mono text-[11px] text-[#0F172A]">
                  {invoice.canonicalHash}
                </code>
              </div>
            </div>
          </section>

          {/* Layer 2: Base L2 Ethereum Attestation Service (EAS) Timeline */}
          <section className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
                Layer 2 — Base EAS Attestation Timeline
              </span>
              <SemanticPill variant="blue">CHAIN ID: 8453 (BASE)</SemanticPill>
            </div>

            <div className="mt-3 space-y-3">
              {easTimeline.map((step) => (
                <div
                  key={step.schemaNumber}
                  className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[#0F172A]">
                      {step.schemaTitle}
                    </span>
                    <SemanticPill
                      variant={step.status === 'ATTESTED_ON_BASE' ? 'emerald' : 'slate'}
                    >
                      {step.status === 'ATTESTED_ON_BASE' ? 'ATTESTED ✓' : 'AT MATURITY'}
                    </SemanticPill>
                  </div>
                  <div className="mt-1.5 text-[11px] text-[#334155]">
                    Signer: <span className="font-medium">{step.signerRole}</span>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-[#64748B] break-all">
                    UID: {step.attestationUid}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Layer 3: Privado ID Zero-Knowledge Selective Disclosure & ZK-MASKED Fields */}
          <section className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
                Layer 3 — Privado ID Zero-Knowledge Shield
              </span>
              <SemanticPill variant="emerald">ZK PROVEN (ISO-14064) ✓</SemanticPill>
            </div>

            <div className="mt-3 space-y-2.5">
              {zkDisclosure.publicProofs.map((proof) => (
                <div
                  key={proof.claimLabel}
                  className="rounded-lg border border-[#A7F3D0] bg-[#ECFDF5]/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#0F172A]">
                      {proof.claimLabel}
                    </span>
                    <SemanticPill variant="emerald">{proof.badgeText}</SemanticPill>
                  </div>
                  <p className="mt-1 text-[12px] text-[#334155]">{proof.publicStatement}</p>
                </div>
              ))}
            </div>

            {/* Explicitly Masked Commercial Secrets */}
            <div className="mt-4 border-t border-[#E2E8F0] pt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#0F172A]">
                  Confidential Commercial Line Items (Off-Chain Encrypted)
                </span>
                <SemanticPill variant="zk-masked">ZK-MASKED (PRIVATE)</SemanticPill>
              </div>

              <div className="space-y-2">
                {invoice.privateLineItems.map((item) => (
                  <div
                    key={item.skuCode}
                    className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-[#0F172A]">
                        SKU: {item.skuCode}
                      </span>
                      <SemanticPill variant="zk-masked">
                        {item.unitPriceMasked}
                      </SemanticPill>
                    </div>
                    <div className="mt-1 text-[12px] text-[#334155]">{item.description}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="font-mono text-[10px] text-[#64748B]">
                        Unit Price: <strong className="text-[#0F172A]">[ZK-MASKED]</strong>
                      </span>
                      <span className="font-mono text-[10px] text-[#64748B]">
                        Supplier Margin: <strong className="text-[#0F172A]">[ZK-MASKED]</strong>
                      </span>
                      <span className="font-mono text-[10px] text-[#64748B]">
                        Rebates: <strong className="text-[#0F172A]">[ZK-MASKED]</strong>
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
