import type { EInvoiceStandard } from '../models/rwaInvoiceTypes';

export interface EInvoiceAdapterMetadata {
  standard: EInvoiceStandard;
  label: string;
  regions: string;
  authorityPortal: string;
  cryptographicProofFormat: string;
  legalFramework: string;
}

export const EINVOICE_ADAPTER_SPECIFICATIONS: Record<EInvoiceStandard, EInvoiceAdapterMetadata> = {
  PEPPOL_BIS_3_0: {
    standard: 'PEPPOL_BIS_3_0',
    label: 'Peppol BIS Billing 3.0 XML',
    regions: 'EU, UK, Singapore (IMDA), Australia (ATO)',
    authorityPortal: 'Accredited Peppol Access Point (AS4 Signed UBL 2.1)',
    cryptographicProofFormat: 'XMLDSig X.509 Access Point Certificate',
    legalFramework: 'UK ETDA 2023 / Singapore ETA (UNCITRAL MLETR)',
  },
  INDIA_GSTN_IRN: {
    standard: 'INDIA_GSTN_IRN',
    label: 'India GSTN e-Invoice IRN',
    regions: 'India Export & Domestic Corridors',
    authorityPortal: 'NIC Invoice Registration Portal (IRP)',
    cryptographicProofFormat: '64-Char SHA-256 IRN + Digitally Signed QR JWT',
    legalFramework: 'UNCITRAL MLETR Cross-Border SPV / Factoring Regulation Act',
  },
  MEXICO_SAT_CFDI: {
    standard: 'MEXICO_SAT_CFDI',
    label: 'LatAm SAT CFDI 4.0 / SEFAZ NF-e',
    regions: 'Mexico, Brazil, Chile Cross-Border Trade',
    authorityPortal: 'SAT PAC Timbre Fiscal Digital (TFD)',
    cryptographicProofFormat: '36-Char Fiscal UUID + SAT RSA-2048 Digital Stamp',
    legalFramework: 'Delaware UCC Article 12 Controllable Electronic Record',
  },
  US_ERP_3WAY_MATCH: {
    standard: 'US_ERP_3WAY_MATCH',
    label: 'SAP / NetSuite 3-Way Match + eBL',
    regions: 'United States & Global Multinationals',
    authorityPortal: 'SAP S/4HANA / Oracle NetSuite + Electronic Bill of Lading',
    cryptographicProofFormat: 'PO + ASN/eBL + EDI 810 Tri-Partite Hash',
    legalFramework: 'US UCC Article 12 True Sale Receivable Assignment',
  },
};
