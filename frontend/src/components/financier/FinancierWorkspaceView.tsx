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
import { Layers, ShieldCheck, CheckCircle2, DollarSign, ArrowUpRight } from 'lucide-react';
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
  const seniorVault = liveVaults.find((v) => v.id === 'SENIOR_DROP');
  const juniorVault = liveVaults.find((v) => v.id === 'JUNIOR_TIN');

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
        invoiceNumber: `${trancheId} Liquidity Deposit ($${amountUsd.toLocaleString()})`,
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
        invoiceNumber: `${invoice.invoiceNumber} Settled & Discharged`,
        hash: res.hash,
        executionMode: res.executionMode,
      });
    } finally {
      setFundingInvoiceId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Execution Confirmation Banner */}
      {dvpReceipt && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-white">{dvpReceipt.invoiceNumber}</span>
            <span>Confirmed on Base L2 ({dvpReceipt.executionMode})</span>
            <span className="font-mono text-[11px] text-emerald-400 truncate max-w-xs">
              Tx: {dvpReceipt.hash}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDvpReceipt(null)}
            className="rounded px-2 py-0.5 text-xs font-mono text-emerald-400 hover:text-white cursor-pointer"
          >
            [Dismiss]
          </button>
        </div>
      )}

      {/* 2-Card Senior / Junior Tranche Vault Summary */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {liveVaults.map((vault) => {
          const isSenior = vault.id === 'SENIOR_DROP';
          return (
            <div
              key={vault.id}
              className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between gap-4 ${
                isSenior
                  ? 'border-sky-500/30 bg-gradient-to-br from-[#0C1527] to-[#0A0E1A]'
                  : 'border-amber-500/30 bg-gradient-to-br from-[#1C160C] to-[#0A0E1A]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                        isSenior ? 'bg-sky-950 text-sky-400 border border-sky-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {vault.symbol}
                    </span>
                    <span className="text-xs text-slate-400">{vault.trancheRole}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mt-1.5">
                    {vault.name}
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <div className="text-[10px] uppercase text-slate-400">Target Net APY</div>
                  <div
                    className={`text-xl font-bold ${
                      isSenior ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {vault.targetApyPercent.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Live Metric Row */}
              <div className="grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-3 font-mono text-xs tabular-nums">
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Live TVL</div>
                  <div className="font-semibold text-white mt-0.5">
                    ${vault.tvlUsd.toLocaleString('en-US')}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Overcollat.</div>
                  <div className="font-semibold text-white mt-0.5">
                    {vault.collateralizationRatioPercent.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-slate-500">Avg Tenor</div>
                  <div className="font-semibold text-white mt-0.5">
                    {vault.weightedAvgTenorDays} Days
                  </div>
                </div>
              </div>

              {/* Deposit Action */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                <div className="relative">
                  <span className="absolute left-2.5 top-2 text-xs font-mono text-slate-500">$</span>
                  <input
                    type="number"
                    value={depositAmounts[vault.id] || '250000'}
                    onChange={(e) =>
                      setDepositAmounts((prev) => ({
                        ...prev,
                        [vault.id]: e.target.value,
                      }))
                    }
                    className="h-9 w-32 rounded-lg border border-slate-700 bg-slate-950 pl-6 pr-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Amount"
                  />
                </div>
                <button
                  type="button"
                  disabled={depositingTranche === vault.id}
                  onClick={() => handleDepositVault(vault.id)}
                  className={`flex-1 h-9 rounded-lg px-4 text-xs font-semibold text-white transition disabled:opacity-50 cursor-pointer ${
                    isSenior
                      ? 'bg-sky-600 hover:bg-sky-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  }`}
                >
                  {depositingTranche === vault.id
                    ? 'Depositing on Base L2...'
                    : `Deposit dUSDC into ${vault.symbol}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tranche Waterfall & Loss Stress-Test Simulator */}
      <TrancheWaterfallSimulator
        seniorDropTvl={seniorVault?.tvlUsd ?? 0}
        juniorTinTvl={juniorVault?.tvlUsd ?? 0}
        seniorDropApy={seniorVault?.targetApyPercent ?? 8.85}
        juniorTinApy={juniorVault?.targetApyPercent ?? 14.20}
      />

      {/* Whole-Invoice ERC-3643 Orderbook Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-semibold text-white">
              Whole-Invoice ERC-3643 Orderbook
            </h2>
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-300">
              {invoices.length} Notes Available
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Atomic DvP Settlement Engine
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Layers className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No active whole-invoices in orderbook.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Originate or ingest e-invoices from the Supplier portal to populate the orderbook for institutional allocation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-5 pr-2">Note / Obligor</th>
                  <th className="px-3 py-3">Trust Verification</th>
                  <th className="px-3 py-3 text-right">Tenor / APR</th>
                  <th className="px-3 py-3 text-right">Face Value</th>
                  <th className="py-3 pl-2 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {invoices.map((invoice) => {
                  const isFunding = fundingInvoiceId === invoice.id;
                  const isFactored = invoice.status === 'FACTORED';
                  return (
                    <tr key={invoice.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 pl-5 pr-2 align-top">
                        <div className="font-mono font-semibold text-white">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="font-medium text-slate-300">{invoice.buyerName}</div>
                        <div className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                          vLEI: {invoice.buyerLei}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 align-top">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <SemanticPill variant="emerald">EAS CO-SIGNED</SemanticPill>
                          <SemanticPill variant="zk-masked">ZK-MASKED</SemanticPill>
                        </div>
                        <div className="font-mono text-[11px] text-slate-400">
                          Corridor: {invoice.corridor}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right align-top font-mono tabular-nums">
                        <div className="font-medium text-white">{invoice.tenorDays}d</div>
                        <div className="text-emerald-400 font-semibold">
                          {(invoice.discountRateAprBps / 100).toFixed(2)}% APY
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-right align-top font-mono tabular-nums">
                        <div className="font-bold text-white">
                          ${invoice.faceValueUsd.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-slate-400">Due {invoice.dueDate}</div>
                      </td>

                      <td className="py-3.5 pl-2 pr-5 text-right align-top">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onInspectAudit(invoice)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 font-mono text-[11px] text-slate-300 hover:text-white hover:border-slate-600 transition cursor-pointer"
                          >
                            Inspect ZK
                          </button>

                          {isFactored ? (
                            <button
                              type="button"
                              disabled={isFunding}
                              onClick={() => handleSettleInvoice(invoice)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
                            >
                              {isFunding ? 'Settling...' : 'Settle & Burn'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isFunding}
                              onClick={() => handleFundAtomicDvP(invoice)}
                              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              {isFunding ? 'Funding DvP...' : 'Fund DvP'}
                              <ArrowUpRight className="h-3 w-3" />
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
