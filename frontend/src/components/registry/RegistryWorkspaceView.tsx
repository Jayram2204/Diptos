'use client';

import React, { useMemo, useState } from 'react';
import { keccak256, toHex } from 'viem';
import {
  checkInvoiceDeduplication,
  type RWAInvoiceRecord,
} from '@/layers/layer1-rwa-core';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { SemanticPill } from '@/components/ui/SemanticPill';

export interface RegistryWorkspaceViewProps {
  invoices: RWAInvoiceRecord[];
}

export function RegistryWorkspaceView({ invoices }: RegistryWorkspaceViewProps) {
  const { executeOnchainAction, protocolState } = useDiptosIdentity();

  const [sellerId, setSellerId] = useState('3358-0048-3291-8492-8172');
  const [buyerId, setBuyerId] = useState('529900T8BM49AURSDO55');
  const [invoiceNumber, setInvoiceNumber] = useState(' inv - 2026 / 8841 ');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [issueDate, setIssueDate] = useState('2026-10-15');
  const [faceValueUsd, setFaceValueUsd] = useState('185000');
  const [isRegistering, setIsRegistering] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const existingHashes = useMemo(
    () => invoices.map((inv) => inv.canonicalHash),
    [invoices]
  );

  const simulationResult = useMemo(() => {
    try {
      const numericUsd = Number(faceValueUsd.replace(/[^0-9.]/g, '')) || 0;
      const minorUnits = BigInt(Math.round(numericUsd * 100)).toString();
      return checkInvoiceDeduplication(
        {
          sellerId,
          buyerId,
          invoiceNumber,
          currency: currencyCode,
          issueDate,
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
      const numericUsd = Number(faceValueUsd.replace(/[^0-9.]/g, '')) || 185000;
      const minorUnits = BigInt(Math.round(numericUsd * 100)).toString();
      const dueUnix = Math.floor(Date.now() / 1000) + 60 * 86400;
      const dueDate = new Date(dueUnix * 1000).toISOString().slice(0, 10);

      const res = await executeOnchainAction('REGISTER_INVOICE', {
        canonicalHash: simulationResult.canonicalHash,
        invoiceNumber: simulationResult.normalizedPayload.invoiceNumber,
        corridor: 'Global Registry Bridge (Base L2 + MonetaGo)',
        eInvoiceStandard: 'PEPPOL_BIS_3_0',
        governmentClearanceRef: `REG-${Date.now().toString().slice(-6)}`,
        sellerName:
          protocolState?.envWallets?.[0]?.legalName || 'Apex Global Industrial Exporters Ltd.',
        sellerLei: simulationResult.normalizedPayload.sellerId,
        buyerName:
          protocolState?.envWallets?.[1]?.legalName || 'Continental Drivetrain & Mobility AG',
        buyerLei: simulationResult.normalizedPayload.buyerId,
        buyerRating: 'AA+ / Verified Obligor',
        currency: simulationResult.normalizedPayload.currency,
        faceValueMinorUnits: minorUnits,
        discountRateAprBps: 920,
        tenorDays: 60,
        issueDate: simulationResult.normalizedPayload.issueDate,
        dueDate,
        dueDateUnix: dueUnix,
        easOriginationUid: keccak256(
          toHex(`eas:orig:${simulationResult.canonicalHash}:${Date.now()}`)
        ),
        easAcceptanceUid: keccak256(
          toHex(`eas:accept:${simulationResult.canonicalHash}:${Date.now()}`)
        ),
        zkProofHash: keccak256(toHex(`zk:proof:${simulationResult.canonicalHash}`)),
        cbamEmissionsKgCo2e: 680,
        cbamStandard: 'EU CBAM Definitive • ISO-14064-1 Verified',
        virtualIbanAccount: 'DE89 3704 0044 0532 0130 00 (FBO Escrow)',
      });
      setLastTxHash(res.hash);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left 6 Columns: Live Canonical Hash Anti-Double-Financing Simulator */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs lg:col-span-6">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
              Layer 1 — InvoiceRegistry.sol + MonetaGo Bridge
            </span>
            <h2 className="mt-0.5 text-[17px] font-bold text-[#0F172A]">
              Anti-Double-Financing Canonical Hash Simulator
            </h2>
          </div>
          <SemanticPill variant="blue">KECCAK256 NORMALIZER</SemanticPill>
        </div>

        <p className="mt-3 text-[13px] text-[#334155]">
          Try adding spaces, hyphens, slashes, or lowercase letters to an already-registered invoice
          (such as <code className="font-mono font-semibold">INV-2026-8841</code>). Diptos strips
          formatting noise before computing the canonical hash and blocks duplicate minting across
          Base and MonetaGo. Change the invoice number to register a new unique hash on-chain.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-[12px]">
          <div>
            <label className="font-semibold text-[#475569]">Seller Global Tax ID / vLEI</label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 font-mono text-[12px] text-[#0F172A]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#475569]">Buyer Global Tax ID / vLEI</label>
            <input
              type="text"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 font-mono text-[12px] text-[#0F172A]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#475569]">
              Official Invoice Number (Try adding spaces/hyphens)
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 font-mono text-[12px] text-[#0F172A]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#475569]">Issue Date (YYYY-MM-DD)</label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 font-mono text-[12px] text-[#0F172A]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#475569]">ISO 4217 Currency</label>
            <input
              type="text"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 font-mono text-[12px] text-[#0F172A]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#475569]">Face Value (USD)</label>
            <input
              type="text"
              value={faceValueUsd}
              onChange={(e) => setFaceValueUsd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 font-mono text-[12px] text-[#0F172A]"
            />
          </div>
        </div>

        {simulationResult && (
          <div
            className={`mt-5 rounded-xl border p-4 ${
              simulationResult.isDuplicate
                ? 'border-[#FECACA] bg-[#FEF2F2]'
                : 'border-[#A7F3D0] bg-[#ECFDF5]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-bold uppercase tracking-[0.04em] text-[#0F172A]">
                Deduplication Verdict:
              </span>
              <SemanticPill variant={simulationResult.isDuplicate ? 'red' : 'emerald'}>
                {simulationResult.isDuplicate
                  ? 'BLOCKED: DUPLICATE INVOICE COLLISION'
                  : 'CLEAR: UNIQUE CANONICAL FINGERPRINT ✓'}
              </SemanticPill>
            </div>

            <div className="mt-2 font-mono text-[11px] text-[#334155]">
              Normalized Tuple: {simulationResult.normalizedPayload.sellerId} |{' '}
              {simulationResult.normalizedPayload.buyerId} |{' '}
              {simulationResult.normalizedPayload.invoiceNumber} |{' '}
              {simulationResult.normalizedPayload.currency} |{' '}
              {simulationResult.normalizedPayload.issueDate} |{' '}
              {simulationResult.normalizedPayload.faceValueMinorUnits}
            </div>

            <code className="mt-2 block break-all rounded border border-[#CBD5E1] bg-[#FFFFFF] p-2 font-mono text-[11px] text-[#0F172A]">
              {simulationResult.canonicalHash}
            </code>

            {!simulationResult.isDuplicate && (
              <button
                type="button"
                disabled={isRegistering}
                onClick={handleRegisterUniqueHashOnChain}
                className="mt-3 w-full rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
              >
                {isRegistering
                  ? 'Registering Hash in InvoiceRegistry.sol...'
                  : 'Commit Unique Canonical Hash On-Chain (InvoiceRegistry.sol)'}
              </button>
            )}

            {lastTxHash && (
              <div className="mt-2 font-mono text-[11px] text-[#047857] break-all">
                On-Chain Registry Tx: {lastTxHash}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right 6 Columns: Live On-Chain InvoiceRegistry.sol Ledger */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs lg:col-span-6">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
              Base (8453) • {protocolState?.contracts.INVOICE_REGISTRY?.slice(0, 12)}...
            </span>
            <h2 className="mt-0.5 text-[17px] font-bold text-[#0F172A]">
              Live Registered Canonical Fingerprints
            </h2>
          </div>
          <SemanticPill variant="emerald">{invoices.length} ON-CHAIN RECORDS</SemanticPill>
        </div>

        <div className="mt-4 space-y-3">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] font-bold text-[#0F172A]">
                  {inv.invoiceNumber} • ${inv.faceValueUsd.toLocaleString()}
                </span>
                <SemanticPill variant={inv.status === 'FACTORED' ? 'blue' : 'emerald'}>
                  {inv.status}
                </SemanticPill>
              </div>
              <div className="mt-1 text-[12px] text-[#334155]">
                {inv.sellerName} → {inv.buyerName}
              </div>
              <div className="mt-1.5 font-mono text-[11px] text-[#0F172A] break-all">
                Hash: {inv.canonicalHash}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
