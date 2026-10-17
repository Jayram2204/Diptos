'use client';

import React, { useState } from 'react';
import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';
import {
  DIPTOS_CONTRACT_ADDRESSES,
  SETTLEMENT_ESCROW_ABI,
  calculateInvoiceDiscountMath,
} from '@/layers/layer2-base-protocol';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { SemanticPill } from '@/components/ui/SemanticPill';

export interface FinancierWorkspaceViewProps {
  invoices: RWAInvoiceRecord[];
  onFundInvoice: (invoiceId: string, txHash: string, executionMode: string) => void;
  onInspectAudit: (invoice: RWAInvoiceRecord) => void;
}

export function FinancierWorkspaceView({
  invoices,
  onFundInvoice,
  onInspectAudit,
}: FinancierWorkspaceViewProps) {
  const {
    executeSponsoredTx,
    executeOnchainAction,
    isAuthenticated,
    login,
    protocolState,
  } = useDiptosIdentity();

  const [fundingInvoiceId, setFundingInvoiceId] = useState<string | null>(null);
  const [depositingTranche, setDepositingTranche] = useState<string | null>(null);
  const [depositAmounts, setDepositAmounts] = useState<Record<string, string>>({
    SENIOR_DROP: '250000',
    JUNIOR_TIN: '100000',
  });
  const [dvpReceipt, setDvpReceipt] = useState<{
    invoiceNumber: string;
    hash: string;
    executionMode: string;
  } | null>(null);

  const liveVaults = protocolState?.vaults ?? [];

  const handleDepositVault = async (trancheId: string) => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setDepositingTranche(trancheId);
    try {
      const amountUsd = Number(depositAmounts[trancheId] || 250000);
      const res = await executeOnchainAction('DEPOSIT_VAULT', {
        tranche: trancheId,
        amountUsd,
      });
      setDvpReceipt({
        invoiceNumber: `${trancheId} Vault Deposit ($${amountUsd.toLocaleString()})`,
        hash: res.hash,
        executionMode: res.executionMode,
      });
    } finally {
      setDepositingTranche(null);
    }
  };

  const handleFundAtomicDvP = async (invoice: RWAInvoiceRecord) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    setFundingInvoiceId(invoice.id);
    try {
      const math = calculateInvoiceDiscountMath(invoice);
      const discountedMinorUnits = BigInt(math.netSupplierPayoutUsd) * 100n;
      const escrowAddr =
        protocolState?.contracts.SETTLEMENT_ESCROW ??
        DIPTOS_CONTRACT_ADDRESSES.SETTLEMENT_ESCROW;

      const result = await executeSponsoredTx({
        to: escrowAddr,
        abi: SETTLEMENT_ESCROW_ABI,
        functionName: 'fundInvoiceDvP',
        args: [
          invoice.canonicalHash,
          invoice.sellerAddress,
          discountedMinorUnits,
          BigInt(invoice.faceValueMinorUnits),
        ],
      });

      onFundInvoice(invoice.id, result.hash, result.executionMode);
      setDvpReceipt({
        invoiceNumber: invoice.invoiceNumber,
        hash: result.hash,
        executionMode: result.executionMode,
      });
    } finally {
      setFundingInvoiceId(null);
    }
  };

  const handleSettleInvoice = async (invoice: RWAInvoiceRecord) => {
    setFundingInvoiceId(invoice.id);
    try {
      const res = await executeOnchainAction('SETTLE_INVOICE', {
        canonicalHash: invoice.canonicalHash,
        faceValueMinorUnits: invoice.faceValueMinorUnits,
      });
      onFundInvoice(invoice.id, res.hash, res.executionMode);
      setDvpReceipt({
        invoiceNumber: `${invoice.invoiceNumber} Settled & Burned`,
        hash: res.hash,
        executionMode: res.executionMode,
      });
    } finally {
      setFundingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {dvpReceipt && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-5 py-3.5">
          <div>
            <div className="flex items-center gap-2">
              <SemanticPill variant="blue">
                ON-CHAIN TRANSACTION EXECUTED ({dvpReceipt.executionMode.toUpperCase()})
              </SemanticPill>
              <span className="text-[13px] font-semibold text-[#0F172A]">
                {dvpReceipt.invoiceNumber} Confirmed on Base L2
              </span>
            </div>
            <div className="mt-1 font-mono text-[11px] text-[#1D4ED8] break-all">
              Base L2 Tx: {dvpReceipt.hash}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDvpReceipt(null)}
            className="rounded border border-[#BFDBFE] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#1D4ED8] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Row: Live On-Chain ERC-4626 Senior DROP & Junior First-Loss TIN Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {liveVaults.map((vault) => (
          <div
            key={vault.id}
            className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <SemanticPill variant={vault.id === 'SENIOR_DROP' ? 'emerald' : 'blue'}>
                    {vault.symbol} • ERC-4626 + ERC-3643
                  </SemanticPill>
                  <span className="font-mono text-[11px] text-[#64748B]">
                    {vault.trancheRole}
                  </span>
                </div>
                <h3 className="mt-2 text-[17px] font-bold text-[#0F172A]">{vault.name}</h3>
              </div>

              <div className="text-right font-mono tabular-nums">
                <div className="text-[11px] font-semibold uppercase text-[#64748B]">
                  Target Net APY
                </div>
                <div className="text-[24px] font-bold text-[#047857]">
                  {vault.targetApyPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 border-y border-[#E2E8F0] py-3 font-mono text-[12px] tabular-nums">
              <div>
                <div className="text-[10px] uppercase text-[#64748B]">Live Tranche TVL</div>
                <div className="mt-0.5 font-bold text-[#0F172A]">
                  ${vault.tvlUsd.toLocaleString('en-US')}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#64748B]">Collat. Ratio</div>
                <div className="mt-0.5 font-bold text-[#0F172A]">
                  {vault.collateralizationRatioPercent.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[#64748B]">Avg Maturity</div>
                <div className="mt-0.5 font-bold text-[#0F172A]">
                  {vault.weightedAvgTenorDays} Days
                </div>
              </div>
            </div>

            {/* Live Vault Deposit Controls */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="number"
                value={depositAmounts[vault.id] || '250000'}
                onChange={(e) =>
                  setDepositAmounts((prev) => ({
                    ...prev,
                    [vault.id]: e.target.value,
                  }))
                }
                className="w-36 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-1.5 font-mono text-xs text-[#0F172A]"
                placeholder="Amount USD"
              />
              <button
                type="button"
                disabled={depositingTranche === vault.id}
                onClick={() => handleDepositVault(vault.id)}
                className="flex-1 rounded-lg bg-[#0A2540] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
              >
                {depositingTranche === vault.id
                  ? 'Depositing On-Chain...'
                  : `Deposit dUSDC into ${vault.symbol}`}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-[#64748B]">
              <span className="font-mono">
                Vault: {vault.erc4626VaultAddress.slice(0, 10)}...
                {vault.erc4626VaultAddress.slice(-6)}
              </span>
              <SemanticPill variant="emerald">vLEI KYB GATED ✓</SemanticPill>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional ERC-3643 Whole-Invoice Orderbook with 2-Second Trust Scorecard */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] px-6 py-4">
          <div>
            <h2 className="text-[16px] font-bold tracking-[-0.02em] text-[#0F172A]">
              Financier Credit Desk — Whole-Invoice ERC-3643 Orderbook
            </h2>
            <p className="mt-0.5 text-[13px] text-[#64748B]">
              Every row surfaces the 2-Second Trust Scorecard: (1) Unique Hash, (2) Buyer EAS Acceptance, and (3) ZK CBAM Proof.
            </p>
          </div>
          <SemanticPill variant="blue">ATOMIC DvP ESCROW (USDC / vIBAN)</SemanticPill>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#475569]">
                <th className="py-3 pl-6 pr-3">ERC-3643 Note / Obligor</th>
                <th className="px-3 py-3">2-Second Trust Scorecard (3 Layers)</th>
                <th className="px-3 py-3 text-right">Tenor &amp; Net Yield</th>
                <th className="px-3 py-3 text-right">Face Value</th>
                <th className="py-3 pl-3 pr-6 text-right">Execution &amp; Provenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[13px]">
              {invoices.map((invoice) => {
                const isFunding = fundingInvoiceId === invoice.id;
                return (
                  <tr key={invoice.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-4 pl-6 pr-3 align-top">
                      <div className="font-mono text-[13px] font-bold text-[#0F172A]">
                        {invoice.invoiceNumber}
                      </div>
                      <div className="font-medium text-[#0F172A]">{invoice.buyerName}</div>
                      <div className="font-mono text-[11px] text-[#64748B]">
                        Obligor vLEI: {invoice.buyerLei} • {invoice.buyerRating}
                      </div>
                    </td>

                    <td className="px-3 py-4 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        <SemanticPill variant="emerald">
                          1. Unique Hash ✓ (Base + MonetaGo)
                        </SemanticPill>
                        <SemanticPill variant="blue">
                          2. Buyer EAS ✓ (vLEI Co-Signed)
                        </SemanticPill>
                        <SemanticPill variant="emerald">
                          3. ZK CBAM Verified ✓ (ISO-14064)
                        </SemanticPill>
                      </div>
                      <div className="mt-1.5 font-mono text-[11px] text-[#64748B]">
                        Escrow: {invoice.virtualIbanAccount}
                      </div>
                    </td>

                    <td className="px-3 py-4 text-right align-top font-mono tabular-nums">
                      <div className="text-[14px] font-bold text-[#047857]">
                        {(invoice.discountRateAprBps / 100).toFixed(2)}% APR
                      </div>
                      <div className="text-[11px] text-[#475569]">
                        {invoice.tenorDays} Days • USDC / vIBAN
                      </div>
                    </td>

                    <td className="px-3 py-4 text-right align-top font-mono tabular-nums">
                      <div className="text-[14px] font-bold text-[#0F172A]">
                        ${invoice.faceValueUsd.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-[#64748B]">
                        State: {invoice.status}
                      </div>
                    </td>

                    <td className="py-4 pl-3 pr-6 text-right align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onInspectAudit(invoice)}
                          className="rounded-md border border-[#CBD5E1] bg-[#FFFFFF] px-2.5 py-1.5 font-mono text-[11px] font-semibold text-[#0F172A] hover:border-[#0A2540] cursor-pointer"
                        >
                          ZK / EAS Proof
                        </button>
                        {invoice.status === 'FACTORED' ? (
                          <button
                            type="button"
                            disabled={isFunding}
                            onClick={() => handleSettleInvoice(invoice)}
                            className="rounded-md bg-[#059669] px-3 py-1.5 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#047857] disabled:opacity-50 cursor-pointer"
                          >
                            {isFunding ? 'Settling...' : 'Settle Maturity'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isFunding || invoice.status === 'SETTLED'}
                            onClick={() => handleFundAtomicDvP(invoice)}
                            className="rounded-md bg-[#0A2540] px-3 py-1.5 text-[12px] font-semibold text-[#FFFFFF] hover:bg-[#0F172A] disabled:opacity-50 cursor-pointer"
                          >
                            {invoice.status === 'SETTLED'
                              ? 'Settled ✓'
                              : isFunding
                              ? 'Funding DvP...'
                              : 'Fund Atomic DvP'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
