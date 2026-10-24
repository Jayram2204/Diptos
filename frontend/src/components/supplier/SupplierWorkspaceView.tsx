'use client';

import React, { useState } from 'react';
import { keccak256, toHex } from 'viem';
import { Plus, X, ArrowRight, ShieldCheck, CheckCircle2, FileCheck2, Zap, Upload } from 'lucide-react';
import {
  EINVOICE_ADAPTER_SPECIFICATIONS,
  computeCanonicalInvoiceHash,
  detectAndParseEInvoice,
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
  const {
    executeSponsoredTx,
    executeOnchainAction,
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
  const [newAprBps, setNewAprBps] = useState('885');
  const [newTenorDays, setNewTenorDays] = useState('60');
  const [newCbamKg, setNewCbamKg] = useState('450');
  const [parsedBanner, setParsedBanner] = useState<string | null>(null);
  const [showRawPaste, setShowRawPaste] = useState(false);
  const [rawPasteText, setRawPasteText] = useState('');

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

  const loadSampleEInvoice = (type: 'PEPPOL' | 'GSTN' | 'CFDI' | 'ERP') => {
    try {
      let raw = '';
      if (type === 'PEPPOL') {
        raw = `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><cbc:ID>INV-2026-SG-9102</cbc:ID><cbc:IssueDate>2026-10-23</cbc:IssueDate><cbc:DocumentCurrencyCode>USD</cbc:DocumentCurrencyCode><cac:AccountingSupplierParty><cac:Party><cac:PartyTaxScheme><cbc:CompanyID>33580048329184928172</cbc:CompanyID></cac:PartyTaxScheme></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cac:PartyTaxScheme><cbc:CompanyID>529900T8BM49AURSDO55</cbc:CompanyID></cac:PartyTaxScheme></cac:Party></cac:AccountingCustomerParty><cac:LegalMonetaryTotal><cbc:PayableAmount>320000.00</cbc:PayableAmount></cac:LegalMonetaryTotal></Invoice>`;
      } else if (type === 'GSTN') {
        raw = JSON.stringify({
          Irn: "4a1f8b2c9e4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
          DocDtls: { Typ: "INV", No: "IN-2026-EXP-7701", Dt: "23/10/2026" },
          SellerDtls: { Gstin: "27AABCU9603R1ZM", LglNm: "Apex Precision Engineering" },
          BuyerDtls: { Gstin: "07AAACD4962Q1ZS", LglNm: "Continental AG Sourcing" },
          ValDtls: { TotInvVal: 215000.00 },
          currency: "USD"
        });
      } else if (type === 'CFDI') {
        raw = `<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Folio="CFDI-MX-40291" Fecha="2026-10-23T11:00:00" Moneda="USD" Total="185000.00"><cfdi:Emisor Rfc="MME920422AA1" /><cfdi:Receptor Rfc="CGO880315KL9" /><cfdi:Complemento><tfd:TimbreFiscalDigital UUID="9A842E3C-658F-4A42-9AE1-C8A4B6925F9C" /></cfdi:Complemento></cfdi:Comprobante>`;
      } else {
        raw = JSON.stringify({
          purchaseOrderNumber: "PO-SAP-2026-8804",
          advancedShippingNoticeId: "ASN-EBL-99120",
          officialInvoiceNumber: "INV-SAP-5501",
          sellerTaxIdOrLei: "33580048329184928172",
          buyerTaxIdOrLei: "529900T8BM49AURSDO55",
          currencyCode: "USD",
          issueDateYYYYMMDD: "20261023",
          faceValueUsd: 450000
        });
      }

      handleParseAndApplyEInvoice(raw);
    } catch (err) {
      setParsedBanner(`Error loading template: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleParseAndApplyEInvoice = (text: string) => {
    try {
      const parsed = detectAndParseEInvoice(text);
      setNewInvNumber(parsed.canonicalInput.officialInvoiceNumber);
      setNewStandard(parsed.standard);
      setNewBuyerLei(parsed.canonicalInput.buyerTaxIdOrLei);
      setNewBuyerName(parsed.extractedMetadata.buyerIdentifier || 'Anchor Corporate Obligor');
      const valUsd = Number(parsed.canonicalInput.faceValueMinorUnits) / 100;
      setNewFaceValueUsd(valUsd.toString());
      setNewAprBps('885');
      setNewTenorDays('60');
      setNewCbamKg('420');

      if (parsed.standard === 'PEPPOL_BIS_3_0') setNewCorridor('Singapore -> EU Corridor');
      else if (parsed.standard === 'INDIA_GSTN_IRN') setNewCorridor('India -> UK Trade');
      else if (parsed.standard === 'MEXICO_SAT_CFDI') setNewCorridor('Mexico -> US Nearshore');
      else setNewCorridor('US -> Global Cross-Border');

      setParsedBanner(`Verified & Ingested: ${parsed.standard} • Canonical Hash: ${parsed.canonicalHash.slice(0, 14)}...`);
    } catch (err) {
      setParsedBanner(`Parsing failed: ${err instanceof Error ? err.message : String(err)}`);
    }
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
        `Supplier (${activeAddress?.slice(0, 6) || 'EOA'})`;

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
        discountRateAprBps: Number(newAprBps) || 885,
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
      setParsedBanner(null);
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
    <div className="space-y-6">
      {/* Confirmation Banner */}
      {txBanner && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="font-semibold text-white">{txBanner.invoiceNumber}</span>
            <span>Minted &amp; Accelerated (${txBanner.netCashUsd.toLocaleString()} Net Cash via {txBanner.executionMode})</span>
            <span className="font-mono text-[11px] text-emerald-400 truncate max-w-xs">
              Tx: {txBanner.hash}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTxBanner(null)}
            className="rounded px-2 py-0.5 text-xs font-mono text-emerald-400 hover:text-white cursor-pointer"
          >
            [Dismiss]
          </button>
        </div>
      )}

      {/* Primary Table & Summary View */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* On-Chain Receivables Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm lg:col-span-8 flex flex-col justify-between overflow-hidden">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="h-4 w-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  On-Chain Receivables Ledger
                </h2>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 font-mono text-[11px] font-medium text-slate-300">
                  {invoices.length} Invoices
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOriginateDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition cursor-pointer shadow-sm shadow-emerald-950"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Originate E-Invoice</span>
              </button>
            </div>

            {invoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 px-4">
                <FileCheck2 className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-white">No trade receivables registered on-chain yet.</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                  Click the button below to originate an invoice manually or test with 1-click Peppol / GSTN e-invoicing presets.
                </p>
                <button
                  type="button"
                  onClick={() => setIsOriginateDrawerOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 cursor-pointer shadow-sm shadow-emerald-950"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Originate First E-Invoice</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                      <th className="py-3 pl-5 pr-2">Invoice / Corridor</th>
                      <th className="px-3 py-3">Buyer / Obligor</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Tenor / APR</th>
                      <th className="px-3 py-3 text-right">Face Value</th>
                      <th className="py-3 pl-2 pr-5 text-right">Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs">
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
                            isSelected ? 'bg-slate-800/70 border-l-2 border-emerald-500' : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3.5 pl-5 pr-2 align-top">
                            <div className="flex items-start gap-2.5">
                              <input
                                type="radio"
                                name="selectedInvoice"
                                checked={isSelected}
                                onChange={() => setSelectedInvoiceId(invoice.id)}
                                aria-label={`Select invoice ${invoice.invoiceNumber}`}
                                className="mt-0.5 h-3.5 w-3.5 accent-emerald-500"
                              />
                              <div>
                                <div className="font-mono font-semibold text-white">
                                  {invoice.invoiceNumber}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  {invoice.corridor}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-3.5 align-top">
                            <div className="font-medium text-slate-200">{invoice.buyerName}</div>
                            <div className="font-mono text-[11px] text-slate-400 truncate max-w-[160px]">
                              vLEI: {invoice.buyerLei}
                            </div>
                          </td>

                          <td className="px-3 py-3.5 align-top">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-medium ${
                                invoice.status === 'FACTORED'
                                  ? 'bg-blue-950/80 text-sky-400 border border-sky-800/80'
                                  : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                              }`}
                            >
                              {invoice.status}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {adapterInfo.label}
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-right align-top font-mono tabular-nums">
                            <div className="font-medium text-white">
                              {invoice.tenorDays}d
                            </div>
                            <div className="text-[11px] text-emerald-400 font-semibold">
                              {(invoice.discountRateAprBps / 100).toFixed(2)}%
                            </div>
                          </td>

                          <td className="px-3 py-3.5 text-right align-top font-mono tabular-nums">
                            <div className="font-bold text-white">
                              ${invoice.faceValueUsd.toLocaleString()}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Due {invoice.dueDate}
                            </div>
                          </td>

                          <td className="py-3.5 pl-2 pr-5 text-right align-top">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onInspectAudit(invoice);
                              }}
                              className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-[11px] font-medium text-slate-300 hover:text-white hover:border-slate-600 transition cursor-pointer"
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
            <div className="sticky top-20 rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    Early-Pay Settlement Desk
                  </div>
                  <h3 className="text-base font-semibold text-white mt-0.5">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                </div>
                <SemanticPill variant="emerald">UNCITRAL MLETR</SemanticPill>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-400 mb-2">
                  Payout Rail Selection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettlementRail('BASE_USDC_ERC4337')}
                    className={`rounded-lg border p-2.5 text-left transition cursor-pointer ${
                      settlementRail === 'BASE_USDC_ERC4337'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold text-white">
                      Base USDC
                    </div>
                    <div className="text-[10px] text-slate-400">Atomic DvP Escrow</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlementRail('VIRTUAL_IBAN_FIAT')}
                    className={`rounded-lg border p-2.5 text-left transition cursor-pointer ${
                      settlementRail === 'VIRTUAL_IBAN_FIAT'
                        ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-mono text-xs font-semibold text-white">
                      Virtual IBAN
                    </div>
                    <div className="text-[10px] text-slate-400">SEPA Instant / Wire</div>
                  </button>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4 font-mono text-xs tabular-nums">
                <div className="flex justify-between text-slate-400">
                  <span>Gross Face Value:</span>
                  <span className="text-white">${discountMath.faceValueUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Discount Yield ({discountMath.effectiveAprPercent.toFixed(2)}% APY):</span>
                  <span className="text-amber-400">-${discountMath.discountYieldUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Protocol Servicing Fee:</span>
                  <span className="text-slate-400">-${discountMath.platformFeeUsd.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between font-semibold text-sm">
                  <span className="text-slate-200">Net Early Cash:</span>
                  <span className="text-emerald-400">
                    ${discountMath.netSupplierPayoutUsd.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmitting || selectedInvoice.status === 'FACTORED'}
                onClick={handleMintAndAccelerate}
                className="w-full rounded-lg bg-emerald-600 py-3 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {selectedInvoice.status === 'FACTORED'
                  ? 'Already Factored on Base L2'
                  : isSubmitting
                  ? 'Minting ERC-3643 Note...'
                  : 'Accelerate Receivable (Mint ERC-3643)'}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-xs text-slate-500 text-center">
              Select an invoice from the ledger to view early-pay terms and mint on-chain.
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Modal for Origination */}
      {isOriginateDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-400" />
                  Originate E-Invoice On-Chain
                </h3>
                <p className="text-xs text-slate-400">
                  Anchors canonical hash &amp; EAS acceptance to Base L2.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOriginateDrawerOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                aria-label="Close origination modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 1-Click E-Invoicing Ingestion Quick-Load Bar */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  1-Click E-Invoice Presets:
                </span>
                <button
                  type="button"
                  onClick={() => setShowRawPaste(!showRawPaste)}
                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                >
                  {showRawPaste ? 'Hide Raw Input' : 'Paste Raw XML/JSON'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => loadSampleEInvoice('PEPPOL')}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:border-emerald-500 hover:text-white transition cursor-pointer"
                >
                  Peppol BIS 3.0
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleEInvoice('GSTN')}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:border-emerald-500 hover:text-white transition cursor-pointer"
                >
                  India GSTN IRN
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleEInvoice('CFDI')}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:border-emerald-500 hover:text-white transition cursor-pointer"
                >
                  Mexico CFDI 4.0
                </button>
                <button
                  type="button"
                  onClick={() => loadSampleEInvoice('ERP')}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1.5 text-[11px] font-medium text-slate-300 hover:border-emerald-500 hover:text-white transition cursor-pointer"
                >
                  SAP 3-Way Match
                </button>
              </div>

              {showRawPaste && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <textarea
                    rows={3}
                    value={rawPasteText}
                    onChange={(e) => setRawPasteText(e.target.value)}
                    placeholder="Paste raw Peppol XML, GSTN JSON, CFDI XML, or ERP payload..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleParseAndApplyEInvoice(rawPasteText)}
                    className="w-full rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
                  >
                    Parse Document &amp; Compute Canonical Hash
                  </button>
                </div>
              )}

              {parsedBanner && (
                <div className="rounded-lg bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 font-mono">
                  {parsedBanner}
                </div>
              )}
            </div>

            <form onSubmit={handleOriginateNewInvoiceOnChain} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={newInvNumber}
                    onChange={(e) => setNewInvNumber(e.target.value)}
                    placeholder="INV-2026-001"
                    required
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Trade Corridor
                  </label>
                  <input
                    type="text"
                    value={newCorridor}
                    onChange={(e) => setNewCorridor(e.target.value)}
                    placeholder="SG -> EU Corridor"
                    required
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    E-Invoice Standard
                  </label>
                  <select
                    value={newStandard}
                    onChange={(e) => setNewStandard(e.target.value as EInvoiceStandard)}
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="PEPPOL_BIS_3_0">Peppol BIS Billing 3.0 (EU / SG)</option>
                    <option value="INDIA_GSTN_IRN">India GSTN e-Invoice IRN</option>
                    <option value="MEXICO_SAT_CFDI">Mexico SAT CFDI 4.0</option>
                    <option value="US_ERP_3WAY_MATCH">US ERP 3-Way Match + eBL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Anchor Buyer Legal Name
                  </label>
                  <input
                    type="text"
                    value={newBuyerName}
                    onChange={(e) => setNewBuyerName(e.target.value)}
                    placeholder="Buyer Legal Name"
                    required
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Buyer 20-Char GLEIF vLEI
                  </label>
                  <input
                    type="text"
                    value={newBuyerLei}
                    onChange={(e) => setNewBuyerLei(e.target.value)}
                    placeholder="20-char LEI"
                    required
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Face Value (USD)
                  </label>
                  <input
                    type="number"
                    value={newFaceValueUsd}
                    onChange={(e) => setNewFaceValueUsd(e.target.value)}
                    placeholder="250000"
                    required
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Discount Rate (bps, 885 = 8.85%)
                  </label>
                  <input
                    type="number"
                    value={newAprBps}
                    onChange={(e) => setNewAprBps(e.target.value)}
                    placeholder="885"
                    required
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Tenor (Days)
                  </label>
                  <input
                    type="number"
                    value={newTenorDays}
                    onChange={(e) => setNewTenorDays(e.target.value)}
                    placeholder="60"
                    required
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    EU CBAM Carbon (kg CO2e)
                  </label>
                  <input
                    type="number"
                    value={newCbamKg}
                    onChange={(e) => setNewCbamKg(e.target.value)}
                    placeholder="450"
                    className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-950"
                >
                  {isSubmitting ? 'Registering on Base L2...' : 'Commit to On-Chain Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
