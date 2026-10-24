'use client';

import React, { useMemo, useState } from 'react';
import { keccak256, toHex } from 'viem';
import {
  checkInvoiceDeduplication,
  type RWAInvoiceRecord,
} from '@/layers/layer1-rwa-core';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { Globe2, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { SemanticPill } from '@/components/ui/SemanticPill';

export interface RegistryWorkspaceViewProps {
  invoices: RWAInvoiceRecord[];
}

export function RegistryWorkspaceView({ invoices }: RegistryWorkspaceViewProps) {
  const { executeOnchainAction, activeAddress, vleiProfile } = useDiptosIdentity();

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

  const loadSamplePreset = (type: 'UNIQUE' | 'DUPLICATE') => {
    if (type === 'DUPLICATE' && invoices.length > 0) {
      const first = invoices[0];
      setSellerId(first.sellerLei);
      setBuyerId(first.buyerLei);
      setInvoiceNumber(first.invoiceNumber);
      setCurrencyCode(first.currency);
      setIssueDate(first.issueDate.replace(/[^0-9]/g, ''));
      setFaceValueUsd(first.faceValueUsd.toString());
    } else {
      setSellerId('33580048329184928172');
      setBuyerId('529900T8BM49AURSDO55');
      setInvoiceNumber(`INV-${Date.now().toString().slice(-5)}`);
      setCurrencyCode('USD');
      setIssueDate('20261023');
      setFaceValueUsd('350000');
    }
  };

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
        invoiceNumber: invoiceNumber.trim(),
        corridor: 'Singapore -> EU Trade',
        eInvoiceStandard: 'PEPPOL_BIS_3_0',
        governmentClearanceRef: `PEPPOL-CLR-${invoiceNumber.trim()}`,
        sellerName: vleiProfile?.legalName || `Seller (${activeAddress?.slice(0, 6) || 'EOA'})`,
        sellerLei: simulationResult.normalizedPayload.sellerId,
        buyerName: `Buyer (${simulationResult.normalizedPayload.buyerId.slice(0, 8)})`,
        buyerLei: simulationResult.normalizedPayload.buyerId,
        buyerRating: 'Verified Obligor',
        currency: simulationResult.normalizedPayload.currency,
        faceValueMinorUnits: minorUnits,
        discountRateAprBps: 885,
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
        cbamEmissionsKgCo2e: 450,
        cbamStandard: 'EU CBAM • ISO-14064-1',
        virtualIbanAccount: `vIBAN-${simulationResult.canonicalHash.slice(2, 10).toUpperCase()}`,
      });
      setLastTxHash(res.hash);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
      {/* Left 5 Columns: Canonical Hash Simulator */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm lg:col-span-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              Canonical Hash Simulator
            </h2>
            <p className="text-[11px] text-slate-400">
              Deterministic Keccak256 Anti-Double-Financing Engine
            </p>
          </div>
          <span className="font-mono text-[10px] text-emerald-400">
            InvoiceRegistry.sol
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[11px] font-medium text-slate-400">Quick Test Preset:</span>
          <div className="flex gap-1.5 font-mono text-[10px]">
            <button
              type="button"
              onClick={() => loadSamplePreset('UNIQUE')}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-300 hover:text-white hover:border-emerald-500 cursor-pointer"
            >
              Unique Note
            </button>
            <button
              type="button"
              onClick={() => loadSamplePreset('DUPLICATE')}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-300 hover:text-white hover:border-rose-500 cursor-pointer"
            >
              Test Collision
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Seller LEI / Tax ID
            </label>
            <input
              type="text"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              placeholder="33580048329184928172"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Buyer LEI / Tax ID
            </label>
            <input
              type="text"
              value={buyerId}
              onChange={(e) => setBuyerId(e.target.value)}
              placeholder="529900T8BM49AURSDO55"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Official Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-2026-8841"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Currency
            </label>
            <select
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="SGD">SGD</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Issue Date (YYYYMMDD)
            </label>
            <input
              type="text"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              placeholder="20261023"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Face Value (USD)
            </label>
            <input
              type="number"
              value={faceValueUsd}
              onChange={(e) => setFaceValueUsd(e.target.value)}
              placeholder="250000"
              className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Simulation Output Card */}
        {simulationResult && (
          <div
            className={`rounded-xl border p-4 space-y-2.5 text-xs font-mono ${
              simulationResult.isDuplicate
                ? 'border-rose-500/40 bg-rose-950/20'
                : 'border-emerald-500/40 bg-emerald-950/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white flex items-center gap-1.5">
                {simulationResult.isDuplicate ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-400" />
                    <span className="text-rose-400">DOUBLE-FINANCING COLLISION DETECTED</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">DETERMINISTICALLY UNIQUE</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-400">{simulationResult.checkedAtIso.slice(11, 19)} UTC</span>
            </div>

            <div>
              <div className="text-[10px] text-slate-400 uppercase">Derived Canonical Keccak256 Hash:</div>
              <div className="mt-0.5 truncate text-[11px] text-cyan-400 font-bold bg-slate-950/60 p-1.5 rounded border border-slate-800">
                {simulationResult.canonicalHash}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
              <div>
                <span className="text-slate-400">Base L2 Registry:</span>
                <span className={`ml-1 font-semibold ${simulationResult.isDuplicate ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {simulationResult.baseRegistryStatus}
                </span>
              </div>
              <div>
                <span className="text-slate-400">MonetaGo Cross-Check:</span>
                <span className={`ml-1 font-semibold ${simulationResult.isDuplicate ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {simulationResult.monetaGoRegistryStatus}
                </span>
              </div>
            </div>

            {!simulationResult.isDuplicate && (
              <button
                type="button"
                disabled={isRegistering}
                onClick={handleRegisterUniqueHashOnChain}
                className="w-full mt-2 rounded-lg bg-emerald-600 py-2 font-sans text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer shadow-sm shadow-emerald-950"
              >
                {isRegistering ? 'Registering on Base L2...' : 'Commit Unique Hash to Base L2'}
              </button>
            )}
          </div>
        )}

        {lastTxHash && (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            <span className="font-semibold text-white">Registered on Base: </span>
            <span className="font-mono text-[11px] text-cyan-400 truncate block mt-0.5">
              Tx: {lastTxHash}
            </span>
          </div>
        )}
      </div>

      {/* Right 7 Columns: Live Registered E-Invoices Ledger */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm lg:col-span-7 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">
              Live Verified Canonical Hashes
            </h2>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-300">
              {invoices.length} Committed
            </span>
          </div>
          <span className="font-mono text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            MonetaGo Synchronized
          </span>
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <Globe2 className="h-8 w-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-white">No registered invoice hashes on Base L2 yet.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Use the simulator on the left or originate an invoice from the Supplier portal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  <th className="py-3 pl-5 pr-2">Invoice / Hash</th>
                  <th className="px-3 py-3">Counterparties</th>
                  <th className="px-3 py-3 text-right">Face Value</th>
                  <th className="py-3 pl-2 pr-5 text-right">Deduplication</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {invoices.map((inv) => (
                  <tr key={inv.canonicalHash} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 pl-5 pr-2 align-top">
                      <div className="font-mono font-semibold text-white">
                        {inv.invoiceNumber}
                      </div>
                      <div className="font-mono text-[11px] text-cyan-400 truncate max-w-[200px]" title={inv.canonicalHash}>
                        {inv.canonicalHash}
                      </div>
                    </td>
                    <td className="px-3 py-3 align-top">
                      <div className="font-medium text-slate-200">{inv.buyerName}</div>
                      <div className="text-[11px] text-slate-400">{inv.corridor}</div>
                    </td>
                    <td className="px-3 py-3 text-right align-top font-mono tabular-nums">
                      <div className="font-semibold text-white">
                        ${inv.faceValueUsd.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500">{inv.currency}</div>
                    </td>
                    <td className="py-3 pl-2 pr-5 text-right align-top">
                      <SemanticPill variant="emerald">UNIQUE CLEAR</SemanticPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
