'use client';

import React, { useMemo, useState } from 'react';
import { keccak256, toHex } from 'viem';
import {
  checkInvoiceDeduplication,
  type RWAInvoiceRecord,
} from '@/layers/layer1-rwa-core';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';

export interface RegistryWorkspaceViewProps {
  invoices: RWAInvoiceRecord[];
}

export function RegistryWorkspaceView({ invoices }: RegistryWorkspaceViewProps) {
  const { executeOnchainAction, protocolState, vleiProfile, activeAddress } = useDiptosIdentity();

  const [sellerId, setSellerId] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [issueDate, setIssueDate] = useState('');
  const [faceValueUsd, setFaceValueUsd] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const existingHashes = useMemo(
    () => invoices.map((inv) => inv.canonicalHash),
    [invoices]
  );

  const simulationResult = useMemo(() => {
    if (!sellerId.trim() || !buyerId.trim() || !invoiceNumber.trim() || !issueDate.trim() || !faceValueUsd.trim()) {
      return null;
    }
    try {
      const numericUsd = Number(faceValueUsd.replace(/[^0-9.]/g, '')) || 0;
      const minorUnits = BigInt(Math.round(numericUsd * 100));
      return checkInvoiceDeduplication(
        {
          sellerTaxIdOrLei: sellerId,
          buyerTaxIdOrLei: buyerId,
          officialInvoiceNumber: invoiceNumber,
          currencyCode,
          issueDateYYYYMMDD: issueDate,
          faceValueMinorUnits: minorUnits,
        },
        existingHashes
      );
    } catch {
      return null;
    }
  }, [sellerId, buyerId, invoiceNumber, currencyCode, issueDate, faceValueUsd, existingHashes]);

  const handleRegisterUniqueHashOnChain = async () => {
    if (!simulationResult || simulationResult.isDuplicate) return;
    setIsRegistering(true);
    try {
      const numericUsd = Number(faceValueUsd.replace(/[^0-9.]/g, '')) || 0;
      const minorUnits = BigInt(Math.round(numericUsd * 100)).toString();
      const dueUnix = Math.floor(Date.now() / 1000) + 60 * 86400;
      const dueDate = new Date(dueUnix * 1000).toISOString().slice(0, 10);

      const res = await executeOnchainAction('REGISTER_INVOICE', {
        canonicalHash: simulationResult.canonicalHash,
        invoiceNumber: simulationResult.normalizedPayload.invoiceNumber,
        corridor: 'Base L2 Registry',
        eInvoiceStandard: 'PEPPOL_BIS_3_0',
        governmentClearanceRef: `REG-${Date.now().toString().slice(-6)}`,
        sellerName: vleiProfile?.legalName || `Seller (${activeAddress?.slice(0, 6)})`,
        sellerLei: simulationResult.normalizedPayload.sellerId,
        buyerName: `Buyer (${simulationResult.normalizedPayload.buyerId.slice(0, 8)})`,
        buyerLei: simulationResult.normalizedPayload.buyerId,
        buyerRating: 'Verified Obligor',
        currency: simulationResult.normalizedPayload.currency,
        faceValueMinorUnits: minorUnits,
        discountRateAprBps: 900,
        tenorDays: 60,
        issueDate: issueDate.trim(),
        dueDate,
        dueDateUnix: dueUnix,
        easOriginationUid: keccak256(
          toHex(`eas:orig:${simulationResult.canonicalHash}:${Date.now()}`)
        ),
        easAcceptanceUid: keccak256(
          toHex(`eas:accept:${simulationResult.canonicalHash}:${Date.now()}`)
        ),
        zkProofHash: keccak256(toHex(`zk:proof:${simulationResult.canonicalHash}`)),
        cbamEmissionsKgCo2e: 500,
        cbamStandard: 'EU CBAM • ISO-14064-1',
        virtualIbanAccount: `vIBAN-${simulationResult.canonicalHash.slice(2, 10).toUpperCase()}`,
      });
      setLastTxHash(res.hash);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
      {/* Left 5 Columns: Canonical Hash Simulator */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-none lg:col-span-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Canonical Hash Simulator
            </h2>
            <p className="text-[11px] text-slate-500">
              Deterministic Keccak256 Anti-Double-Financing
            </p>
          </div>
          <span className="font-mono text-[10px] text-slate-500">
            InvoiceRegistry.sol
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Seller LEI / Tax ID
            </label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              placeholder="Seller LEI"
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Buyer LEI / Tax ID
            </label>
            <input
              type="text"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              placeholder="Buyer LEI"
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-2026-001"
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Issue Date
            </label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              placeholder="YYYY-MM-DD"
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Currency
            </label>
            <input
              type="text"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              placeholder="USD"
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              Face Value (USD)
            </label>
            <input
              type="text"
              value={faceValueUsd}
              onChange={(e) => setFaceValueUsd(e.target.value)}
              placeholder="150000"
              className="h-9 w-full rounded-md border border-slate-300 px-2.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {simulationResult && (
          <div
            className={`rounded-md border p-3 ${
              simulationResult.isDuplicate
                ? 'border-red-200 bg-red-50 text-red-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {simulationResult.isDuplicate
                  ? 'Duplicate Hash Collision'
                  : 'Unique Canonical Fingerprint'}
              </span>
              <span
                className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-medium ${
                  simulationResult.isDuplicate
                    ? 'bg-red-200 text-red-800'
                    : 'bg-emerald-200 text-emerald-800'
                }`}
              >
                {simulationResult.isDuplicate ? 'COLLISION' : 'CLEAR'}
              </span>
            </div>

            <code className="mt-2 block break-all rounded border border-slate-200 bg-white p-2 font-mono text-[11px] text-slate-900">
              {simulationResult.canonicalHash}
            </code>

            {!simulationResult.isDuplicate && (
              <button
                type="button"
                disabled={isRegistering}
                onClick={handleRegisterUniqueHashOnChain}
                className="mt-2.5 w-full rounded-md bg-slate-900 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition cursor-pointer"
              >
                {isRegistering
                  ? 'Registering Hash on Base...'
                  : 'Commit Hash to InvoiceRegistry.sol'}
              </button>
            )}

            {lastTxHash && (
              <div className="mt-2 font-mono text-[11px] text-emerald-700 truncate">
                Tx: {lastTxHash}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right 7 Columns: Live Registered Canonical Fingerprints */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-none lg:col-span-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Registered Fingerprints
            </h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
              {invoices.length} Hashes
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {protocolState?.contracts.INVOICE_REGISTRY
              ? `${protocolState.contracts.INVOICE_REGISTRY.slice(0, 8)}...${protocolState.contracts.INVOICE_REGISTRY.slice(-6)}`
              : 'Base L2'}
          </span>
        </div>

        <div className="mt-3 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {invoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No fingerprints registered yet. Test a canonical hash on the left.
            </div>
          ) : (
            invoices.map((inv) => (
              <div
                key={inv.id}
                className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 text-xs transition hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-900">
                    {inv.invoiceNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-900 tabular-nums">
                      ${inv.faceValueUsd.toLocaleString()}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-medium ${
                        inv.status === 'FACTORED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {inv.sellerName} → {inv.buyerName}
                </div>
                <div className="mt-1 font-mono text-[10px] text-slate-600 break-all bg-white rounded border border-slate-200 px-2 py-1">
                  {inv.canonicalHash}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
