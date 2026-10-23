import { describe, expect, it } from 'vitest';
import {
  parsePeppolUblXml,
  parseGstnIrnPayload,
  parseSatCfdiXml,
  parseErp3WayMatch,
  detectAndParseEInvoice,
  generateLegalInstrumentBundle,
} from '../index';
import { computeCanonicalInvoiceHash } from '../canonical-hash/canonicalHash';

describe('Layer 1 — Global E-Invoicing Adapters & Legal Document Generator', () => {
  it('parses Peppol BIS Billing 3.0 UBL 2.1 XML and computes deterministic canonical hash', () => {
    const samplePeppolXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ID>INV-2026-SG-9901</cbc:ID>
  <cbc:IssueDate>2026-10-18</cbc:IssueDate>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>33580048329184928172</cbc:CompanyID>
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
    <cbc:PayableAmount currencyID="EUR">250000.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

    const parsed = parsePeppolUblXml(samplePeppolXml);
    expect(parsed.standard).toBe('PEPPOL_BIS_3_0');
    expect(parsed.canonicalInput.officialInvoiceNumber).toBe('INV-2026-SG-9901');
    expect(parsed.canonicalInput.issueDateYYYYMMDD).toBe('20261018');
    expect(parsed.canonicalInput.currencyCode).toBe('EUR');
    expect(parsed.canonicalInput.faceValueMinorUnits).toBe(25000000n);
    expect(parsed.canonicalHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('parses India GSTN e-Invoice IRP JSON payload and normalizes date/amount', () => {
    const sampleGstnJson = {
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
        LglNm: 'Continental Global Sourcing',
      },
      ValDtls: {
        TotInvVal: 1850000.5,
      },
      currency: 'INR',
    };

    const parsed = parseGstnIrnPayload(sampleGstnJson);
    expect(parsed.standard).toBe('INDIA_GSTN_IRN');
    expect(parsed.canonicalInput.officialInvoiceNumber).toBe('EXP/2026/0442');
    expect(parsed.canonicalInput.issueDateYYYYMMDD).toBe('20261018');
    expect(parsed.canonicalInput.sellerTaxIdOrLei).toBe('27AABCU9603R1ZM');
    expect(parsed.canonicalHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('parses Mexico SAT CFDI 4.0 XML and extracts Timbre Fiscal Digital UUID', () => {
    const sampleCfdiXml = `<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital"
      Folio="CFDI-88912" Fecha="2026-10-18T10:00:00" Moneda="USD" Total="75000.00">
      <cfdi:Emisor Rfc="MME920422AA1" Nombre="Manufacturas Mexicanas SA de CV" />
      <cfdi:Receptor Rfc="CGO880315KL9" Nombre="Continental Logistics LLC" />
      <cfdi:Complemento>
        <tfd:TimbreFiscalDigital UUID="4A942E3C-658F-4A42-9AE1-C8A4B6925F9C" />
      </cfdi:Complemento>
    </cfdi:Comprobante>`;

    const parsed = parseSatCfdiXml(sampleCfdiXml);
    expect(parsed.standard).toBe('MEXICO_SAT_CFDI');
    expect(parsed.canonicalInput.officialInvoiceNumber).toBe('CFDI-88912');
    expect(parsed.canonicalInput.sellerTaxIdOrLei).toBe('MME920422AA1');
    expect(parsed.canonicalInput.buyerTaxIdOrLei).toBe('CGO880315KL9');
    expect(parsed.governmentReference).toBe('4A942E3C-658F-4A42-9AE1-C8A4B6925F9C');
    expect(parsed.canonicalHash).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('parses US ERP 3-Way Match (PO + ASN/eBL + Invoice) payload', () => {
    const sampleErp = {
      purchaseOrderNumber: 'PO-2026-9921',
      advancedShippingNoticeId: 'ASN-EBL-77102',
      officialInvoiceNumber: 'INV-US-4401',
      sellerTaxIdOrLei: '33580048329184928172',
      buyerTaxIdOrLei: '529900T8BM49AURSDO55',
      currencyCode: 'USD',
      issueDateYYYYMMDD: '20261018',
      faceValueUsd: 140000,
    };

    const parsed = parseErp3WayMatch(sampleErp);
    expect(parsed.standard).toBe('US_ERP_3WAY_MATCH');
    expect(parsed.canonicalInput.officialInvoiceNumber).toBe('INV-US-4401');
    expect(parsed.extractedMetadata.rawAuthProofOrDigest).toMatch(/^0x[a-f0-9]{64}$/);
  });

  it('auto-detects formats via detectAndParseEInvoice()', () => {
    const peppol = `<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"><cbc:ID>INV-AUTO-1</cbc:ID><cbc:IssueDate>2026-10-18</cbc:IssueDate><cbc:DocumentCurrencyCode>USD</cbc:DocumentCurrencyCode><cac:AccountingSupplierParty><cac:Party><cac:PartyTaxScheme><cbc:CompanyID>LEI1</cbc:CompanyID></cac:PartyTaxScheme></cac:Party></cac:AccountingSupplierParty><cac:AccountingCustomerParty><cac:Party><cac:PartyTaxScheme><cbc:CompanyID>LEI2</cbc:CompanyID></cac:PartyTaxScheme></cac:Party></cac:AccountingCustomerParty><cac:LegalMonetaryTotal><cbc:PayableAmount>1000.00</cbc:PayableAmount></cac:LegalMonetaryTotal></Invoice>`;
    const parsed = detectAndParseEInvoice(peppol);
    expect(parsed.standard).toBe('PEPPOL_BIS_3_0');
  });

  it('generates legally binding UNCITRAL MLETR & UK ETDA 2023 Master Purchase Agreements (MPA) with cryptographic digests', () => {
    const canonicalHash = computeCanonicalInvoiceHash({
      sellerTaxIdOrLei: '33580048329184928172',
      buyerTaxIdOrLei: '529900T8BM49AURSDO55',
      officialInvoiceNumber: 'INV-UK-MLETR-101',
      currencyCode: 'GBP',
      issueDateYYYYMMDD: '20261018',
      faceValueMinorUnits: 50000000n,
    });

    const bundle = generateLegalInstrumentBundle({
      invoice: {
        invoiceNumber: 'INV-UK-MLETR-101',
        sellerName: 'Apex Industrial Exporters Ltd.',
        sellerLei: '33580048329184928172',
        buyerName: 'Continental UK Automotive Ltd.',
        buyerLei: '529900T8BM49AURSDO55',
        currency: 'GBP',
        faceValueFormatted: '500,000.00',
        canonicalHash,
        dueDate: '2026-12-15',
      },
      spvJurisdiction: 'United Kingdom',
    });

    expect(bundle.legalFramework).toBe('UNCITRAL_MLETR_UK_ETDA_2023');
    expect(bundle.governingLaw).toContain('Electronic Trade Documents Act 2023');
    expect(bundle.masterPurchaseAgreementText).toContain('NON-RECOURSE TRUE SALE');
    expect(bundle.noticeOfAssignmentText).toContain('FORMAL NOTICE OF ASSIGNMENT');
    expect(bundle.keccak256Digest).toMatch(/^0x[a-f0-9]{64}$/);
    expect(bundle.virtualIbanRemittanceAccount).toContain('INVUKMLETR101');
  });
});
