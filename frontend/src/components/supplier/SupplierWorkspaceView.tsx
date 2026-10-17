'use client';

import React, { useState } from 'react';
import { keccak256, toHex } from 'viem';
import { Plus, X, ArrowRight, ShieldCheck } from 'lucide-react';
import {
  EINVOICE_ADAPTER_SPECIFICATIONS,
  computeCanonicalInvoiceHash,
  type EInvoiceStandard,
  type RWAInvoiceRecord,
  type SettlementRail,
} from '@/layers/layer1-rwa-core';
import {
  DIPTOS_CONTRACT_ADDRESSES,
  RWA_INVOICE_3643_ABI,
  calculateInvoiceDiscountMath,
} from '@/layers/layer2-base-protocol';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';

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
  const {
    executeSponsoredTx,
    executeOnchainAction,
    walletExecutionMode,
    isAuthenticated,
    login,
    protocolState,
    activeAddress,
    vleiProfile,
  } = useDiptosIdentity();

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [settlementRail, setSettlementRail] = useState<SettlementRail>('BASE_USDC_ERC4337');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOriginateDrawerOpen, setIsOriginateDrawerOpen] = useState(false);

  // 9 Dynamic Origination Inputs
  const [newInvNumber, setNewInvNumber] = useState('');
  const [newCorridor, setNewCorridor] = useState('');
  const [newStandard, setNewStandard] = useState<EInvoiceStandard>('PEPPOL_BIS_3_0');
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerLei, setNewBuyerLei] = useState('');
  const [newFaceValueUsd, setNewFaceValueUsd] = useState('');
  const [newAprBps, setNewAprBps] = useState('');
  const [newTenorDays, setNewTenorDays] = useState('');
  const [newCbamKg, setNewCbamKg] = useState('');

  const [txBanner, setTxBanner] = useState<{
    invoiceNumber: string;
    hash: string;
    executionMode: string;
    netCashUsd: number;
  } | null>(null);

  const selectedInvoice =
    invoices.find((inv) => inv.id === selectedInvoiceId) ?? invoices[0];

  const discountMath = selectedInvoice
    ? calculateInvoiceDiscountMath(selectedInvoice)
    : {
        faceValueUsd: 0,
        discountYieldUsd: 0,
        platformFeeUsd: 0,
        netSupplierPayoutUsd: 0,
        effectiveAprPercent: 0,
      };

  const handleOriginateNewInvoiceOnChain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const faceUsd = Math.max(1, Number(newFaceValueUsd));
      const faceMinorBigInt = BigInt(Math.round(faceUsd * 100));
      const issueDate = new Date().toISOString().slice(0, 10);
      const tenor = Math.max(1, Number(newTenorDays));
      const dueUnix = Math.floor(Date.now() / 1000) + tenor * 86400;
      const dueDate = new Date(dueUnix * 1000).toISOString().slice(0, 10);
      const sellerLei =
        vleiProfile?.lei ||
        `549300${(activeAddress || '0x0').slice(2, 16).toUpperCase()}`;
      const sellerName =
        vleiProfile?.legalName ||
        `Supplier (${activeAddress?.slice(0, 6)})`;

      const canonicalHash = computeCanonicalInvoiceHash({
        sellerTaxIdOrLei: sellerLei,
        buyerTaxIdOrLei: newBuyerLei.trim(),
        officialInvoiceNumber: newInvNumber.trim(),
        currencyCode: 'USD',
        faceValueMinorUnits: faceMinorBigInt,
        issueDateYYYYMMDD: issueDate,
      });

      const easOrigUid = keccak256(toHex(`eas:orig:${canonicalHash}:${Date.now()}`));
      const easAcceptUid = keccak256(toHex(`eas:accept:${canonicalHash}:${Date.now()}`));
      const zkProof = keccak256(toHex(`zk:groth16:${canonicalHash}:${newCbamKg}`));

      const res = await executeOnchainAction('REGISTER_INVOICE', {
        canonicalHash,
        invoiceNumber: newInvNumber.trim(),
        corridor: newCorridor.trim(),
        eInvoiceStandard: newStandard,
        governmentClearanceRef: `CLR-${newStandard}-${Date.now().toString().slice(-6)}`,
        sellerName,
        sellerLei,
        buyerName: newBuyerName.trim(),
        buyerLei: newBuyerLei.trim(),
        buyerRating: 'Verified Corporate Obligor',
        currency: 'USD',
        faceValueMinorUnits: faceMinorBigInt.toString(),
        discountRateAprBps: Number(newAprBps) || 900,
        tenorDays: tenor,
        issueDate,
        dueDate,
        dueDateUnix: dueUnix,
        easOriginationUid: easOrigUid,
        easAcceptanceUid: easAcceptUid,
        zkProofHash: zkProof,
        cbamEmissionsKgCo2e: Number(newCbamKg) || 0,
        cbamStandard: 'EU CBAM • ISO-14064-1',
        virtualIbanAccount: `vIBAN-${canonicalHash.slice(2, 12).toUpperCase()}`,
      });

      setIsOriginateDrawerOpen(false);
      setTxBanner({
        invoiceNumber: newInvNumber.trim(),
        hash: res.hash,
        executionMode: res.executionMode,
        netCashUsd: Math.round(faceUsd * (1 - (Number(newAprBps) / 10000) * (tenor / 365))),
      });
      setNewInvNumber('');
      setNewCorridor('');
      setNewBuyerName('');
      setNewBuyerLei('');
      setNewFaceValueUsd('');
      setNewAprBps('');
      setNewTenorDays('');
      setNewCbamKg('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMintAndAccelerate = async () => {
    if (!selectedInvoice) return;
    if (!isAuthenticated) {
      login();
      return;
    }

    setIsSubmitting(true);
    try {
      const contractAddr =
        protocolState?.contracts.RWA_INVOICE_3643 ??
        DIPTOS_CONTRACT_ADDRESSES.RWA_INVOICE_3643;

      const result = await executeSponsoredTx({
        to: contractAddr,
        abi: RWA_INVOICE_3643_ABI,
        functionName: 'mintVerifiedInvoice',
        args: [
          selectedInvoice.canonicalHash,
          BigInt(selectedInvoice.faceValueMinorUnits),
          '0x555344',
          BigInt(selectedInvoice.dueDateUnix),
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
    <div className="space-y-4">
      {/* Confirmation Banner */}
      {txBanner && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{txBanner.invoiceNumber}</span>
            <span>Minted &amp; Accelerated (${txBanner.netCashUsd.toLocaleString()} Net)</span>
            <span className="font-mono text-[11px] text-emerald-700 truncate max-w-xs">
              Tx: {txBanner.hash}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTxBanner(null)}
            className="rounded px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Table & Summary View */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* On-Chain Receivables Table */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-none lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900">
                  On-Chain Receivables
                </h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                  {invoices.length} Notes
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOriginateDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Originate E-Invoice</span>
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                <p>No trade receivables registered on-chain yet.</p>
                <button
                  type="button"
                  onClick={() => setIsOriginateDrawerOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Originate E-Invoice</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                      <th className="py-2.5 pl-4 pr-2">Invoice / Corridor</th>
                      <th className="px-3 py-2.5">Buyer / Obligor</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Tenor / APR</th>
                      <th className="px-3 py-2.5 text-right">Face Value</th>
                      <th className="py-2.5 pl-2 pr-4 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {invoices.map((invoice) => {
                      const isSelected = invoice.id === selectedInvoice?.id;
                      const adapterInfo =
                        EINVOICE_ADAPTER_SPECIFICATIONS[invoice.eInvoiceStandard] ??
                        EINVOICE_ADAPTER_SPECIFICATIONS.PEPPOL_BIS_3_0;
                      return (
                        <tr
                          key={invoice.id}
                          onClick={() => setSelectedInvoiceId(invoice.id)}
                          className={`transition cursor-pointer ${
                            isSelected ? 'bg-slate-50' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="py-3 pl-4 pr-2 align-top">
                            <div className="flex items-start gap-2">
                              <input
                                type="radio"
                                name="selectedInvoice"
                                checked={isSelected}
                                onChange={() => setSelectedInvoiceId(invoice.id)}
                                aria-label={`Select invoice ${invoice.invoiceNumber}`}
                                className="mt-0.5 h-3.5 w-3.5 accent-slate-900"
                              />
                              <div>
                                <div className="font-mono font-semibold text-slate-900">
                                  {invoice.invoiceNumber}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {invoice.corridor}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <div className="font-medium text-slate-900">{invoice.buyerName}</div>
                            <div className="font-mono text-[11px] text-slate-500 truncate max-w-[160px]">
                              LEI: {invoice.buyerLei}
                            </div>
                          </td>

                          <td className="px-3 py-3 align-top">
                            <span
                              className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-medium ${
                                invoice.status === 'FACTORED'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {invoice.status}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {adapterInfo.label}
                            </div>
                          </td>

                          <td className="px-3 py-3 text-right align-top font-mono tabular-nums">
                            <div className="font-medium text-slate-900">
                              {invoice.tenorDays}d
                            </div>
                            <div className="text-[11px] text-emerald-600">
                              {(invoice.discountRateAprBps / 100).toFixed(2)}%
                            </div>
                          </td>

                          <td className="px-3 py-3 text-right align-top font-mono tabular-nums">
                            <div className="font-semibold text-slate-900">
                              ${invoice.faceValueUsd.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Due {invoice.dueDate}
                            </div>
                          </td>

                          <td className="py-3 pl-2 pr-4 text-right align-top">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onInspectAudit(invoice);
                              }}
                              className="rounded border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                              Proof
                            </button>
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

        {/* Early-Pay Summary Card */}
        <div className="lg:col-span-4">
          {selectedInvoice ? (
            <div className="sticky top-20 rounded-lg border border-slate-200 bg-white p-4 shadow-none space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                    Early-Pay Summary
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                  True Sale
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-1.5">
                  Payout Rail
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettlementRail('BASE_USDC_ERC4337')}
                    className={`rounded-md border p-2 text-left transition cursor-pointer ${
                      settlementRail === 'BASE_USDC_ERC4337'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold text-slate-900">
                      Base USDC
                    </div>
                    <div className="text-[10px] text-slate-500">Atomic DvP</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlementRail('VIRTUAL_IBAN_FIAT')}
                    className={`rounded-md border p-2 text-left transition cursor-pointer ${
                      settlementRail === 'VIRTUAL_IBAN_FIAT'
                        ? 'border-slate-900 bg-slate-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold text-slate-900">
                      Virtual IBAN
                    </div>
                    <div className="text-[10px] text-slate-500">SEPA / Wire</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50/60 p-3 font-mono text-xs tabular-nums">
                <div className="flex justify-between text-slate-600">
                  <span>Face Value:</span>
                  <span className="font-medium text-slate-900">
                    ${discountMath.faceValueUsd.toLocaleString()}.00
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    Discount ({selectedInvoice.tenorDays}d @ {discountMath.effectiveAprPercent}%):
                  </span>
                  <span className="text-red-700">
                    -${discountMath.discountYieldUsd.toLocaleString()}.00
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee (10 bps):</span>
                  <span className="text-slate-500">
                    -${discountMath.platformFeeUsd.toLocaleString()}.00
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Gas:</span>
                  <span className="text-emerald-700 font-medium">
                    {walletExecutionMode === 'smart-wallet' ? '$0.00 (Sponsored)' : 'MetaMask EOA'}
                  </span>
                </div>

                <div className="border-t border-slate-200 pt-2 flex items-baseline justify-between font-sans">
                  <span className="text-xs font-medium text-slate-900">Net Disbursed:</span>
                  <span className="font-mono text-base font-bold text-slate-900">
                    ${discountMath.netSupplierPayoutUsd.toLocaleString()}.00
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting || selectedInvoice.status === 'FACTORED'}
                onClick={handleMintAndAccelerate}
                className="w-full rounded-md bg-slate-900 py-2.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
              >
                {selectedInvoice.status === 'FACTORED'
                  ? 'Already Factored on Base'
                  : isSubmitting
                  ? 'Minting ERC-3643 Note...'
                  : 'Accelerate Receivable (Mint ERC-3643)'}
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs text-slate-500 text-center">
              Select an invoice to view early-pay terms and mint on-chain.
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Drawer / Modal for Origination */}
      {isOriginateDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Originate E-Invoice On-Chain
                </h3>
                <p className="text-xs text-slate-500">
                  Anchors canonical hash &amp; EAS acceptance to Base L2.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOriginateDrawerOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close origination modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleOriginateNewInvoiceOnChain} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={newInvNumber}
                    onChange={(e) => setNewInvNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    required
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Trade Corridor
                  </label>
                  <input
                    type="text"
                    value={newCorridor}
                    onChange={(e) => setNewCorridor(e.target.value)}
                    placeholder="SG -> EU"
                    required
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    E-Invoice Standard
                  </label>
                  <select
                    value={newStandard}
                    onChange={(e) => setNewStandard(e.target.value as EInvoiceStandard)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  >
                    <option value="PEPPOL_BIS_3_0">Peppol BIS Billing 3.0 (EU / SG)</option>
                    <option value="INDIA_GSTN_IRN">India GSTN e-Invoice IRN</option>
                    <option value="MEXICO_SAT_CFDI">Mexico SAT CFDI 4.0</option>
                    <option value="US_ERP_3WAY_MATCH">US ERP 3-Way Match + eBL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Anchor Buyer Legal Name
                  </label>
                  <input
                    type="text"
                    value={newBuyerName}
                    onChange={(e) => setNewBuyerName(e.target.value)}
                    placeholder="Buyer Legal Name"
                    required
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Buyer 20-Char GLEIF vLEI
                  </label>
                  <input
                    type="text"
                    value={newBuyerLei}
                    onChange={(e) => setNewBuyerLei(e.target.value)}
                    placeholder="20-char LEI"
                    required
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Face Value (USD)
                  </label>
                  <input
                    type="number"
                    value={newFaceValueUsd}
                    onChange={(e) => setNewFaceValueUsd(e.target.value)}
                    placeholder="250000"
                    required
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Discount Rate (bps, 900 = 9%)
                  </label>
                  <input
                    type="number"
                    value={newAprBps}
                    onChange={(e) => setNewAprBps(e.target.value)}
                    placeholder="900"
                    required
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Tenor (Days)
                  </label>
                  <input
                    type="number"
                    value={newTenorDays}
                    onChange={(e) => setNewTenorDays(e.target.value)}
                    placeholder="60"
                    required
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    EU CBAM Carbon (kg CO2e)
                  </label>
                  <input
                    type="number"
                    value={newCbamKg}
                    onChange={(e) => setNewCbamKg(e.target.value)}
                    placeholder="650"
                    className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOriginateDrawerOpen(false)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Writing to Base L2...' : 'Register On-Chain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
