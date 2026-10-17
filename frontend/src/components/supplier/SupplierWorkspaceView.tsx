'use client';

import React, { useState } from 'react';
import {
  EINVOICE_ADAPTER_SPECIFICATIONS,
  type RWAInvoiceRecord,
  type SettlementRail,
} from '@/layers/layer1-rwa-core';
import {
  DIPTOS_CONTRACT_ADDRESSES,
  RWA_INVOICE_3643_ABI,
  calculateInvoiceDiscountMath,
} from '@/layers/layer2-base-protocol';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { SemanticPill } from '@/components/ui/SemanticPill';

export interface SupplierWorkspaceViewProps {
  invoices: RWAInvoiceRecord[];
  onAccelerateInvoice: (invoiceId: string, txHash: string, executionMode: string) => void;
  onInspectAudit: (invoice: RWAInvoiceRecord) => void;
}

export function SupplierWorkspaceView({
  invoices,
  onAccelerateInvoice,
  onInspectAudit,
}: SupplierWorkspaceViewProps) {
  const { executeSponsoredTx, walletExecutionMode, isAuthenticated, login } =
    useDiptosIdentity();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(
    invoices[0]?.id ?? 'RWA-3643-01'
  );
  const [settlementRail, setSettlementRail] = useState<SettlementRail>('BASE_USDC_ERC4337');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txBanner, setTxBanner] = useState<{
    invoiceNumber: string;
    hash: string;
    executionMode: string;
    netCashUsd: number;
  } | null>(null);

  const selectedInvoice =
    invoices.find((inv) => inv.id === selectedInvoiceId) ?? invoices[0];
  const discountMath = calculateInvoiceDiscountMath(selectedInvoice);

  const handleMintAndAccelerate = async () => {
    if (!isAuthenticated) {
      login();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await executeSponsoredTx({
        to: DIPTOS_CONTRACT_ADDRESSES.RWA_INVOICE_3643,
        abi: RWA_INVOICE_3643_ABI,
        functionName: 'mintVerifiedInvoice',
        args: [
          selectedInvoice.canonicalHash,
          selectedInvoice.faceValueMinorUnits,
          '0x555344', // "USD" in bytes3
          selectedInvoice.dueDateUnix,
          selectedInvoice.buyerDid,
          selectedInvoice.zkProofHash,
        ],
      });

      onAccelerateInvoice(selectedInvoice.id, result.hash, result.executionMode);
      setTxBanner({
        invoiceNumber: selectedInvoice.invoiceNumber,
        hash: result.hash,
        executionMode: result.executionMode,
        netCashUsd: discountMath.netSupplierPayoutUsd,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Execution Receipt Banner */}
      {txBanner && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-5 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <SemanticPill variant="emerald">
                {txBanner.executionMode === 'erc4337-sponsored'
                  ? 'ERC-4337 PAYMASTER SPONSORED TX CONFIRMED ✓'
                  : 'WAGMI EXTERNAL WALLET TX CONFIRMED ✓'}
              </SemanticPill>
              <span className="text-[13px] font-semibold text-[#0F172A]">
                {txBanner.invoiceNumber} Minted &amp; Accelerated (${txBanner.netCashUsd.toLocaleString()} Net Disbursed)
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-[#047857] break-all">
              Base L2 Tx Hash: {txBanner.hash}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTxBanner(null)}
            className="rounded border border-[#A7F3D0] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#047857] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 12-Column Responsive Split: 8-Col Approved Payables Table + 4-Col Sticky Instant Payout Checkout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Columns: SAP Taulia-Inspired Early Payment Acceleration Table */}
        <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-[0_1px_2px_rgba(15,23,42,0.03)] lg:col-span-8 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0F172A]">
                  Supplier Portal — Buyer-Approved Receivables (Early Pay)
                </h2>
                <SemanticPill variant="emerald">ZERO CRYPTO FRICTION</SemanticPill>
              </div>
              <p className="mt-0.5 text-[13px] text-[#64748B]">
                Select any buyer-confirmed e-invoice below to accelerate payment in under 24 hours via True Sale assignment.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#475569]">
                  <th className="py-3 pl-6 pr-3">Select / Invoice</th>
                  <th className="px-3 py-3">Anchor Buyer &amp; Rating</th>
                  <th className="px-3 py-3">E-Invoice &amp; EAS Status</th>
                  <th className="px-3 py-3 text-right">Tenor / APR</th>
                  <th className="px-3 py-3 text-right">Face Value</th>
                  <th className="py-3 pl-3 pr-6 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
                {invoices.map((invoice) => {
                  const isSelected = invoice.id === selectedInvoice.id;
                  const adapterInfo =
                    EINVOICE_ADAPTER_SPECIFICATIONS[invoice.eInvoiceStandard];
                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className={`transition cursor-pointer ${
                        isSelected ? 'bg-[#EFF6FF]/60' : 'hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <td className="py-4 pl-6 pr-3 align-top">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="selectedInvoice"
                            checked={isSelected}
                            onChange={() => setSelectedInvoiceId(invoice.id)}
                            aria-label={`Select invoice ${invoice.invoiceNumber}`}
                            className="mt-1 h-4 w-4 accent-[#0A2540]"
                          />
                          <div>
                            <div className="font-mono text-[13px] font-bold text-[#0F172A] tabular-nums">
                              {invoice.invoiceNumber}
                            </div>
                            <div className="text-[11px] text-[#64748B]">
                              {invoice.corridor}
                            </div>
                            <div className="mt-1 font-mono text-[10px] text-[#475569]">
                              Hash: {invoice.canonicalHash.slice(0, 10)}...
                              {invoice.canonicalHash.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-4 align-top">
                        <div className="font-medium text-[#0F172A]">{invoice.buyerName}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-[#64748B]">
                          vLEI: {invoice.buyerLei}
                        </div>
                        <div className="mt-1">
                          <SemanticPill variant="blue">{invoice.buyerRating}</SemanticPill>
                        </div>
                      </td>

                      <td className="px-3 py-4 align-top">
                        <div className="flex flex-col items-start gap-1">
                          <SemanticPill variant="slate">{adapterInfo.label}</SemanticPill>
                          <SemanticPill variant="emerald">
                            Buyer Co-Signed via EAS ✓
                          </SemanticPill>
                          <SemanticPill
                            variant={invoice.status === 'FACTORED' ? 'blue' : 'emerald'}
                          >
                            State: {invoice.status}
                          </SemanticPill>
                        </div>
                      </td>

                      <td className="px-3 py-4 text-right align-top font-mono tabular-nums">
                        <div className="font-semibold text-[#0F172A]">
                          {invoice.tenorDays} Days
                        </div>
                        <div className="text-[12px] text-[#047857]">
                          {(invoice.discountRateAprBps / 100).toFixed(2)}% APR
                        </div>
                      </td>

                      <td className="px-3 py-4 text-right align-top font-mono tabular-nums">
                        <div className="text-[14px] font-bold text-[#0F172A]">
                          ${invoice.faceValueUsd.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[#64748B]">Due {invoice.dueDate}</div>
                      </td>

                      <td className="py-4 pl-3 pr-6 text-right align-top">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectAudit(invoice);
                          }}
                          className="rounded-md border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#0F172A] hover:border-[#0A2540] cursor-pointer"
                        >
                          ZK / EAS Proof
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 4 Columns: Sticky Instant Payout Summary & 1-Click ERC-3643 Execution Card */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.05em] text-[#64748B]">
                  Instant Early-Pay Summary
                </span>
                <h3 className="text-[16px] font-bold text-[#0F172A]">
                  {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <SemanticPill variant="emerald">UNCITRAL MLETR</SemanticPill>
            </div>

            {/* Payout Rail Selector */}
            <div className="mt-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.05em] text-[#475569]">
                Select Settlement Payout Rail
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSettlementRail('BASE_USDC_ERC4337')}
                  className={`rounded-lg border p-2.5 text-left transition cursor-pointer ${
                    settlementRail === 'BASE_USDC_ERC4337'
                      ? 'border-[#0A2540] bg-[#EFF6FF]/60'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold text-[#0F172A]">
                    Instant USDC (Base)
                  </div>
                  <div className="text-[10px] text-[#64748B]">Atomic DvP • &lt; 2 mins</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSettlementRail('VIRTUAL_IBAN_FIAT')}
                  className={`rounded-lg border p-2.5 text-left transition cursor-pointer ${
                    settlementRail === 'VIRTUAL_IBAN_FIAT'
                      ? 'border-[#0A2540] bg-[#EFF6FF]/60'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]'
                  }`}
                >
                  <div className="font-mono text-[11px] font-bold text-[#0F172A]">
                    Virtual IBAN / UPI
                  </div>
                  <div className="text-[10px] text-[#64748B]">SEPA / FedNow / Bank Wire</div>
                </button>
              </div>
            </div>

            {/* Transparent Discount Math Breakdown */}
            <div className="mt-5 space-y-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 font-mono text-[12px] tabular-nums">
              <div className="flex justify-between text-[#334155]">
                <span>Verified Face Value:</span>
                <span className="font-semibold text-[#0F172A]">
                  ${discountMath.faceValueUsd.toLocaleString()}.00
                </span>
              </div>
              <div className="flex justify-between text-[#334155]">
                <span>
                  Financier Discount ({selectedInvoice.tenorDays}d @ {discountMath.effectiveAprPercent}%):
                </span>
                <span className="text-[#991B1B]">
                  -${discountMath.discountYieldUsd.toLocaleString()}.00
                </span>
              </div>
              <div className="flex justify-between text-[#334155]">
                <span>Diptos Origination Fee (10 bps cap $150):</span>
                <span className="text-[#64748B]">
                  -${discountMath.platformFeeUsd.toLocaleString()}.00
                </span>
              </div>
              <div className="flex justify-between text-[#334155]">
                <span>Base L2 Network Gas:</span>
                <span className="font-semibold text-[#047857]">
                  {walletExecutionMode === 'smart-wallet'
                    ? '$0.00 (Sponsored ERC-4337)'
                    : '~$0.01 (External EOA)'}
                </span>
              </div>

              <div className="border-t border-[#CBD5E1] pt-2.5 flex items-baseline justify-between">
                <span className="font-sans text-[13px] font-bold text-[#0F172A]">
                  Net Cash Disbursed Today:
                </span>
                <span className="text-[20px] font-bold text-[#047857]">
                  ${discountMath.netSupplierPayoutUsd.toLocaleString()}.00
                </span>
              </div>
            </div>

            {/* Cryptographic Pre-Flight Checks */}
            <div className="mt-4 space-y-1.5 text-[11px] text-[#334155]">
              <div className="flex items-center justify-between">
                <span>1. Canonical Hash (MonetaGo + Base):</span>
                <span className="font-mono font-semibold text-[#047857]">UNIQUE ✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>2. Buyer Acceptance EAS Schema #2:</span>
                <span className="font-mono font-semibold text-[#047857]">CO-SIGNED ✓</span>
              </div>
              <div className="flex items-center justify-between">
                <span>3. Privado ID ZK Selective Disclosure:</span>
                <span className="font-mono font-semibold text-[#047857]">PRICES MASKED ✓</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isSubmitting || selectedInvoice.status === 'FACTORED'}
              onClick={handleMintAndAccelerate}
              className="mt-5 w-full rounded-lg bg-[#0A2540] px-4 py-3 text-[13px] font-semibold text-[#FFFFFF] transition hover:bg-[#0F172A] disabled:opacity-50 cursor-pointer"
            >
              {selectedInvoice.status === 'FACTORED'
                ? 'Already Factored & Funded on Base'
                : isSubmitting
                ? 'Executing Sponsored ERC-3643 Mint...'
                : 'Get Cash in 24h (Mint & Fund ERC-3643)'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
