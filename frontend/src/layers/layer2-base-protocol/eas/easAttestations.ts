import type { Hex } from 'viem';
import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';

export interface EasAttestationStep {
  schemaNumber: 1 | 2 | 3;
  schemaTitle: string;
  schemaUid: Hex;
  attestationUid: Hex;
  signerRole: string;
  signerDid: string;
  timestampIso: string;
  status: 'ATTESTED_ON_BASE' | 'AWAITING_MATURITY';
  easscanUrl: string;
}

export function buildInvoiceEasTimeline(invoice: RWAInvoiceRecord): EasAttestationStep[] {
  return [
    {
      schemaNumber: 1,
      schemaTitle: 'Schema #1 — Supplier Origination & E-Invoice Clearance',
      schemaUid: '0x1111000000000000000000000000000000000000000000000000000000008453',
      attestationUid: invoice.easOriginationUid,
      signerRole: `${invoice.sellerName} (ERC-4337 Smart Account)`,
      signerDid: invoice.sellerDid,
      timestampIso: `${invoice.issueDate}T09:14:22Z`,
      status: 'ATTESTED_ON_BASE',
      easscanUrl: `https://base.easscan.org/attestation/view/${invoice.easOriginationUid}`,
    },
    {
      schemaNumber: 2,
      schemaTitle: 'Schema #2 — Buyer Acceptance & Dilution Waiver (Confirming)',
      schemaUid: '0x2222000000000000000000000000000000000000000000000000000000008453',
      attestationUid: invoice.easBuyerAcceptanceUid,
      signerRole: `${invoice.buyerName} (vLEI Treasury Signer)`,
      signerDid: invoice.buyerDid,
      timestampIso: `${invoice.issueDate}T11:42:08Z`,
      status: 'ATTESTED_ON_BASE',
      easscanUrl: `https://base.easscan.org/attestation/view/${invoice.easBuyerAcceptanceUid}`,
    },
    {
      schemaNumber: 3,
      schemaTitle: 'Schema #3 — Maturity Settlement & ERC-3643 Auto-Burn',
      schemaUid: '0x3333000000000000000000000000000000000000000000000000000000008453',
      attestationUid: '0x0000000000000000000000000000000000000000000000000000000000000000',
      signerRole: 'SettlementEscrow.sol / Virtual IBAN Banking Oracle',
      signerDid: 'did:pkh:eip155:8453:0x4000000000000000000000000000000000008453',
      timestampIso: `${invoice.dueDate}T16:00:00Z`,
      status: invoice.status === 'SETTLED' ? 'ATTESTED_ON_BASE' : 'AWAITING_MATURITY',
      easscanUrl: 'https://base.easscan.org',
    },
  ];
}
