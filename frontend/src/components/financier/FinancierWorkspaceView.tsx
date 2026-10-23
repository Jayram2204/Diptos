'use client';

import React, { useState } from 'react';
import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';
import {
  DIPTOS_CONTRACT_ADDRESSES,
  SETTLEMENT_ESCROW_ABI,
  calculateInvoiceDiscountMath,
} from '@/layers/layer2-base-protocol';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { TrancheWaterfallSimulator } from './TrancheWaterfallSimulator';

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
        invoiceNumber: `${trancheId} Deposit ($${amountUsd.toLocaleString()})`,
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
    <div className="space-y-4">
      {/* Execution Banner */}
      {dvpReceipt && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{dvpReceipt.invoiceNumber}</span>
            <span>Confirmed on Base L2</span>
            <span className="font-mono text-[11px] text-blue-700 truncate max-w-xs">
              Tx: {dvpReceipt.hash}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDvpReceipt(null)}
            className="rounded px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Compact 2-Card Senior/Junior Tranche Summary Bar (py-3 px-4) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {liveVaults.map((vault) => (
          <div
            key={vault.id}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-none flex flex-col justify-between gap-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-900">
                    {vault.symbol}
                  </span>
                  <span className="text-[11px] text-slate-500">{vault.trancheRole}</span>
                </div>
                <div className="text-xs font-medium text-slate-700 mt-0.5">
                  {vault.name}
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-[10px] uppercase text-slate-400">Target APY</div>
                <div className="text-base font-bold text-emerald-600">
                  {vault.targetApyPercent.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 font-mono text-xs tabular-nums">
              <div>
                <div className="text-[10px] text-slate-400">TVL</div>
                <div className="font-semibold text-slate-900">
                  ${vault.tvlUsd.toLocaleString('en-US')}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Collat.</div>
                <div className="font-semibold text-slate-900">
                  {vault.collateralizationRatioPercent.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400">Tenor</div>
                <div className="font-semibold text-slate-900">
                  {vault.weightedAvgTenorDays}d
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <input
                type="number"
                value={depositAmounts[vault.id] || '250000'}
                onChange={(e) =>
                  setDepositAmounts((prev) => ({
                    ...prev,
                    [vault.id]: e.target.value,
                  }))
                }
                className="h-8 w-28 rounded-md border border-slate-300 bg-slate-50 px-2.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="Amount"
              />
              <button
                type="button"
                disabled={depositingTranche === vault.id}
                onClick={() => handleDepositVault(vault.id)}
                className="flex-1 h-8 rounded-md bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
              >
                {depositingTranche === vault.id
                  ? 'Depositing...'
                  : `Deposit into ${vault.symbol}`}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tranche Waterfall & Loss Stress-Test Simulator */}
      <TrancheWaterfallSimulator
        seniorDropTvl={liveVaults.find((v) => v.id === 'SENIOR_DROP')?.tvlUsd || 750000}
        juniorTinTvl={liveVaults.find((v) => v.id === 'JUNIOR_TIN')?.tvlUsd || 250000}
        seniorDropApy={liveVaults.find((v) => v.id === 'SENIOR_DROP')?.targetApyPercent || 8.85}
        juniorTinApy={liveVaults.find((v) => v.id === 'JUNIOR_TIN')?.targetApyPercent || 14.20}
      />

      {/* Whole-Invoice ERC-3643 Orderbook Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-none overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Whole-Invoice ERC-3643 Orderbook
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
              {invoices.length} Available
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Atomic DvP Escrow
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No invoices currently available in the orderbook.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pl-4 pr-2">Note / Obligor</th>
                  <th className="px-3 py-2.5">Trust Verification</th>
                  <th className="px-3 py-2.5 text-right">Tenor / APR</th>
                  <th className="px-3 py-2.5 text-right">Face Value</th>
                  <th className="py-2.5 pl-2 pr-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {invoices.map((invoice) => {
                  const isFunding = fundingInvoiceId === invoice.id;
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 pl-4 pr-2 align-top">
                        <div className="font-mono font-semibold text-slate-900">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="font-medium text-slate-800">{invoice.buyerName}</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate max-w-[180px]">
                          LEI: {invoice.buyerLei}
                        </div>
                      </td>

                      <td className="px-3 py-3 align-top">
                        <span className="inline-flex items-center rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-700 border border-emerald-200">
                          Trust: 3/3 Verified
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Hash ✓ • EAS ✓ • ZK CBAM ✓
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right align-top font-mono tabular-nums">
                        <div className="font-semibold text-emerald-600">
                          {(invoice.discountRateAprBps / 100).toFixed(2)}% APR
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {invoice.tenorDays}d • USDC
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right align-top font-mono tabular-nums">
                        <div className="font-semibold text-slate-900">
                          ${invoice.faceValueUsd.toLocaleString()}
                        </div>
                        <span
                          className={`inline-flex items-center rounded px-1.5 py-0.2 font-mono text-[10px] font-medium mt-0.5 ${
                            invoice.status === 'FACTORED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>

                      <td className="py-3 pl-2 pr-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspectAudit(invoice)}
                            className="rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Proof
                          </button>
                          {invoice.status === 'FACTORED' ? (
                            <button
                              type="button"
                              disabled={isFunding}
                              onClick={() => handleSettleInvoice(invoice)}
                              className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                            >
                              {isFunding ? 'Settling...' : 'Settle'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isFunding || invoice.status === 'SETTLED'}
                              onClick={() => handleFundAtomicDvP(invoice)}
                              className="rounded bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                            >
                              {invoice.status === 'SETTLED'
                                ? 'Settled'
                                : isFunding
                                ? 'Funding...'
                                : 'Fund DvP'}
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
        )}
      </div>
    </div>
  );
}
