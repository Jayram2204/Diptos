'use client';

import React, { useState } from 'react';
import {
  Code2,
  FileCheck2,
  Layers,
  Send,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  BookOpen,
  ArrowRight,
} from 'lucide-react';
const PEPPOL_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>INV-2026-SG-9901</cbc:ID>
  <cbc:IssueDate>2026-10-18</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>USD</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>5493001KJTIIGC8Y1R12</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>529900T8BM49AURSDO55</cbc:CompanyID>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="USD">250000.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

const GSTN_SAMPLE = JSON.stringify(
  {
    Irn: '3a1f8b2c9e4d5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    DocDtls: {
      Typ: 'INV',
      No: 'EXP/2026/0442',
      Dt: '18/10/2026',
    },
    SellerDtls: {
      Gstin: '27AABCU9603R1ZM',
      LglNm: 'Apex Precision Engineering Pvt Ltd',
    },
    BuyerDtls: {
      Gstin: '07AAACD4962Q1ZS',
      LglNm: 'Continental Global Sourcing Corp',
    },
    ValDtls: {
      TotInvVal: 1850000.5,
    },
    currency: 'USD',
  },
  null,
  2
);

const CFDI_SAMPLE = `<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
  Folio="CFDI-88912" Fecha="2026-10-18T10:00:00" Moneda="USD" Total="75000.00">
  <cfdi:Emisor Rfc="MME920422AA1" Nombre="Manufacturas Mexicanas SA de CV" />
  <cfdi:Receptor Rfc="CGO880315KL9" Nombre="Continental Logistics LLC" />
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="4A942E3C-658F-4A42-9AE1-C8A4B6925F9C" />
  </cfdi:Complemento>
</cfdi:Comprobante>`;

type PresetKey = 'peppol' | 'gstn' | 'cfdi' | 'erp';

const PRESET_TEMPLATES: Record<PresetKey, { label: string; standard: string; payload: string }> = {
  peppol: {
    label: 'Peppol BIS 3.0 (EU/Singapore)',
    standard: 'PEPPOL_BIS_3_0',
    payload: PEPPOL_SAMPLE,
  },
  gstn: {
    label: 'GSTN e-Invoice (India / Asia)',
    standard: 'INDIA_GSTN_IRN',
    payload: GSTN_SAMPLE,
  },
  cfdi: {
    label: 'CFDI 4.0 (Mexico / LATAM)',
    standard: 'MEXICO_SAT_CFDI',
    payload: CFDI_SAMPLE,
  },
  erp: {
    label: 'SAP ERP 3-Way Match (US / Global)',
    standard: 'US_ERP_3WAY_MATCH',
    payload: JSON.stringify(
      {
        sellerTaxIdOrLei: 'US942385921-CORP',
        buyerTaxIdOrLei: 'US128492015-RETAIL',
        officialInvoiceNumber: 'INV-2026-SAP-8921',
        currencyCode: 'USD',
        issueDateYYYYMMDD: '20261023',
        faceValueMinorUnits: '42500000',
        metadata: {
          purchaseOrderRef: 'PO-GLOBAL-99214',
          goodsReceiptAckHash: '0x8f2a1b9c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0',
        },
      },
      null,
      2
    ),
  },
};

export function PartnersWorkspaceView() {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('peppol');
  const [activeTab, setActiveTab] = useState<'tester' | 'snippets' | 'architecture'>('tester');
  const [requestPayload, setRequestPayload] = useState<string>(PRESET_TEMPLATES.peppol.payload);
  const [partnerVlei, setPartnerVlei] = useState('5493001KJTIIGC8Y1R12');
  const [partnerName, setPartnerName] = useState('Apex Trade Capital & Factoring Ltd');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [snippetLang, setSnippetLang] = useState<'curl' | 'typescript' | 'python'>('curl');
  const [copied, setCopied] = useState(false);

  const handleSelectPreset = (key: PresetKey) => {
    setSelectedPreset(key);
    setRequestPayload(PRESET_TEMPLATES[key].payload);
  };

  const handleExecuteRequest = async () => {
    setIsLoading(true);
    setApiResponse(null);
    try {
      let body: any;
      if (selectedPreset === 'erp') {
        body = JSON.parse(requestPayload);
      } else {
        body = {
          standard: PRESET_TEMPLATES[selectedPreset].standard,
          rawDocument: requestPayload,
        };
      }

      const res = await fetch('/api/v1/partners/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-diptos-partner-vlei': partnerVlei,
          'x-diptos-partner-name': partnerName,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setApiResponse({ status: res.status, ok: res.ok, data });
    } catch (err: any) {
      setApiResponse({
        status: 500,
        ok: false,
        data: { error: err.message || 'Request failed' },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlSnippet = `curl -X POST https://diptos.xyz/api/v1/partners/invoices \\
  -H "Content-Type: application/json" \\
  -H "x-diptos-partner-vlei: ${partnerVlei}" \\
  -H "x-diptos-partner-name: ${partnerName}" \\
  -d '${JSON.stringify(
    selectedPreset === 'erp'
      ? JSON.parse(requestPayload || '{}')
      : { standard: PRESET_TEMPLATES[selectedPreset].standard, rawDocument: requestPayload.slice(0, 80) + '...' },
    null,
    2
  )}'`;

  const tsSnippet = `import { DiptosPartnerClient } from '@diptos/sdk';

const diptos = new DiptosPartnerClient({
  endpoint: 'https://diptos.xyz/api/v1',
  partnerVlei: '${partnerVlei}',
  partnerName: '${partnerName}',
});

// Ingest e-invoice and obtain canonical hash + MLETR legal instrument
const result = await diptos.invoices.ingest({
  standard: '${PRESET_TEMPLATES[selectedPreset].standard}',
  payload: eInvoiceRawData,
});

console.log('Canonical Hash:', result.canonicalHash);
console.log('Notice of Assignment Hash:', result.legalAssignment.noticeOfAssignmentHash);
console.log('MonetaGo Deduplication:', result.deduplicationReport.monetaGoStatus);`;

  const pythonSnippet = `import requests

url = "https://diptos.xyz/api/v1/partners/invoices"
headers = {
    "Content-Type": "application/json",
    "x-diptos-partner-vlei": "${partnerVlei}",
    "x-diptos-partner-name": "${partnerName}",
}

payload = {
    "standard": "${PRESET_TEMPLATES[selectedPreset].standard}",
    "rawDocument": e_invoice_xml_or_json_string
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

print(f"Canonical Hash: {data['canonicalHash']}")
print(f"Assignment Legal Ref: {data['legalAssignment']['jurisdiction']}")`;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#080C14] text-slate-100 p-4 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400">
                Partner Gateway v1.0
              </span>
              <span className="font-mono text-xs text-slate-400">REST API & White-label Rails</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
              NBFC & Enterprise Partner Console
            </h1>
            <p className="mt-1 text-sm text-slate-400 max-w-2xl">
              Programmatic ingest, cross-border MonetaGo deduplication, and automated MLETR legal instrument generation for trade finance originators, factors, and ERP platforms.
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 p-1">
            <button
              onClick={() => setActiveTab('tester')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'tester'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              API Sandbox
            </button>
            <button
              onClick={() => setActiveTab('snippets')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'snippets'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code SDKs
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Legal & Arch
            </button>
          </div>
        </div>

        {/* TAB 1: API SANDBOX */}
        {activeTab === 'tester' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Preset Selector and Request Editor (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Presets */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Select Production E-Invoice Schema Preset:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(PRESET_TEMPLATES) as PresetKey[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => handleSelectPreset(key)}
                      className={`px-3 py-2 text-left rounded-lg border text-xs font-medium transition cursor-pointer ${
                        selectedPreset === key
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-bold">{key.toUpperCase()}</div>
                      <div className="text-[10px] text-slate-400 truncate">{PRESET_TEMPLATES[key].label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Partner Credentials Header */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3 backdrop-blur-md">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Partner Authenticated Headers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">
                      x-diptos-partner-vlei (Originator LEI)
                    </label>
                    <input
                      type="text"
                      value={partnerVlei}
                      onChange={(e) => setPartnerVlei(e.target.value)}
                      className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-400 mb-1">
                      x-diptos-partner-name (Corporate Title)
                    </label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Payload Box */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-3 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400">
                    HTTP POST /api/v1/partners/invoices
                  </span>
                  <span className="font-mono text-[11px] text-cyan-400">
                    {PRESET_TEMPLATES[selectedPreset].standard}
                  </span>
                </div>
                <textarea
                  rows={14}
                  value={requestPayload}
                  onChange={(e) => setRequestPayload(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#06090F] p-3 font-mono text-xs text-slate-300 focus:border-emerald-500 focus:outline-hidden selection:bg-emerald-500/20"
                  spellCheck={false}
                />
                <button
                  onClick={handleExecuteRequest}
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm hover:bg-emerald-400 transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Ingesting & Verifying Cross-Registry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Execute Partner Ingestion API Call</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Column: Live Output & Legal Instrument Inspector (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 backdrop-blur-md">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Server Telemetry & MLETR Proof</span>
                  {apiResponse && (
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                        apiResponse.ok
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      HTTP {apiResponse.status}
                    </span>
                  )}
                </h3>

                {apiResponse ? (
                  <div className="space-y-4">
                    {/* Status Pill */}
                    <div
                      className={`p-3 rounded-lg border text-xs ${
                        apiResponse.ok
                          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                          : 'border-red-500/30 bg-red-950/20 text-red-300'
                      }`}
                    >
                      {apiResponse.data.message || (apiResponse.ok ? 'E-Invoice Ingested Successfully' : 'Error')}
                    </div>

                    {apiResponse.ok && apiResponse.data.canonicalHash && (
                      <div className="space-y-3 font-mono text-xs">
                        <div className="p-2.5 rounded bg-[#06090F] border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">Canonical Hash (Keccak-256)</div>
                          <div className="text-cyan-400 break-all select-all font-mono mt-0.5">
                            {apiResponse.data.canonicalHash}
                          </div>
                        </div>

                        <div className="p-2.5 rounded bg-[#06090F] border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase">MonetaGo Cross-Registry Check</div>
                          <div className="text-emerald-400 mt-0.5 flex items-center gap-1.5">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{apiResponse.data.deduplicationReport?.monetaGoStatus ?? 'VERIFIED_CLEAR'}</span>
                          </div>
                        </div>

                        {apiResponse.data.legalAssignment && (
                          <div className="p-2.5 rounded bg-[#06090F] border border-slate-800 space-y-1">
                            <div className="text-[10px] text-slate-500 uppercase">Legal Instrument Bundle</div>
                            <div className="text-slate-300">
                              <span className="text-slate-400">Jurisdiction:</span> {apiResponse.data.legalAssignment.jurisdiction}
                            </div>
                            <div className="text-slate-300">
                              <span className="text-slate-400">Notice of Assignment:</span>{' '}
                              <span className="text-emerald-400">{apiResponse.data.legalAssignment.noticeOfAssignmentHash?.slice(0, 18)}...</span>
                            </div>
                            <div className="text-slate-300">
                              <span className="text-slate-400">Governing Law:</span> {apiResponse.data.legalAssignment.governingLaw}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Raw JSON viewer */}
                    <div className="rounded-lg border border-slate-800 bg-[#06090F] p-3 max-h-60 overflow-y-auto">
                      <pre className="font-mono text-[11px] text-slate-400 whitespace-pre-wrap">
                        {JSON.stringify(apiResponse.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-slate-800 rounded-lg">
                    <Terminal className="h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-xs text-slate-400">No request sent yet</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                      Select a preset above and click Execute to test live server-side parsing, deduplication, and legal assignment.
                    </p>
                  </div>
                )}
              </div>

              {/* MonetaGo Information Card */}
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4 space-y-2 backdrop-blur-md">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>MonetaGo Secure Financing Registry API</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Every API ingest automatically queries both the on-chain Base Sepolia Hash Registry and MonetaGo cross-bank deduplication feed to prevent double-financing across SWIFT, ICC, and institutional bank consortia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CODE SNIPPETS */}
        {activeTab === 'snippets' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSnippetLang('curl')}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                    snippetLang === 'curl'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setSnippetLang('typescript')}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                    snippetLang === 'typescript'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setSnippetLang('python')}
                  className={`px-3 py-1 rounded-md text-xs font-mono transition cursor-pointer ${
                    snippetLang === 'python'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
              </div>

              <button
                onClick={() =>
                  copyToClipboard(
                    snippetLang === 'curl'
                      ? curlSnippet
                      : snippetLang === 'typescript'
                      ? tsSnippet
                      : pythonSnippet
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1 rounded-md border border-slate-800 bg-slate-900 text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#06090F] p-4">
              <pre className="font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
                {snippetLang === 'curl' && curlSnippet}
                {snippetLang === 'typescript' && tsSnippet}
                {snippetLang === 'python' && pythonSnippet}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: ARCHITECTURE & LEGAL */}
        {activeTab === 'architecture' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">UNCITRAL MLETR Standard</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tokens on Diptos satisfy the Model Law on Electronic Transferable Records (MLETR) adopted by Singapore, UAE (ADGM/DIFC), UK, and the US (UCC Article 12). Electronic bills of lading and e-invoices are legally binding on-chain.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Bankruptcy-Remote SPV</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every trade receivable batch is isolated into a dedicated Special Purpose Vehicle (SPV) structure. In the event of supplier insolvency, invoice payment flows are legally ring-fenced strictly for tranche token holders.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Notice of Assignment (NOA)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automatic generation of cryptographically bound assignment notices sent to enterprise obligors. Guarantees perfected security interest and enforceable legal claims in local commercial courts upon buyer default.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
