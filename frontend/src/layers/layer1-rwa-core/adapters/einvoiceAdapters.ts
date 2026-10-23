import { keccak256, encodePacked, type Hex } from 'viem';
import type { CanonicalInvoiceInput, EInvoiceStandard } from '../models/rwaInvoiceTypes';
import {
  computeCanonicalInvoiceHash,
  normalizeAlphaNumUpper,
  normalizeDateYYYYMMDD,
} from '../canonical-hash/canonicalHash';

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

export interface ParsedEInvoiceResult {
  standard: EInvoiceStandard;
  canonicalInput: CanonicalInvoiceInput;
  canonicalHash: Hex;
  governmentReference: string;
  extractedMetadata: {
    sellerIdentifier: string;
    buyerIdentifier: string;
    invoiceNumber: string;
    issueDate: string;
    currency: string;
    totalAmountFormatted: string;
    faceValueMinorUnits: string;
    rawAuthProofOrDigest?: string;
  };
}

/**
 * Extracts tag content from XML strings safely without DOM dependency (works in SSR and browser).
 */
function extractXmlTag(xml: string, tagName: string): string {
  // Support both namespaced and non-namespaced tags (e.g. <cbc:ID> or <ID>)
  const escapedTag = tagName.replace(':', '\\:');
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${escapedTag}[^>]*>([^<]+)<\\/(?:[a-zA-Z0-9_-]+:)?${escapedTag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Extracts attribute value from an XML tag.
 */
function extractXmlAttribute(xml: string, tagName: string, attrName: string): string {
  const regex = new RegExp(`<(?:[a-zA-Z0-9_-]+:)?${tagName}[^>]*\\b${attrName}=["']([^"']+)["'][^>]*>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Parses Peppol BIS Billing 3.0 UBL 2.1 XML documents.
 */
export function parsePeppolUblXml(xmlContent: string): ParsedEInvoiceResult {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Invalid Peppol XML content: input must be a non-empty string');
  }

  const invoiceNumber = extractXmlTag(xmlContent, 'ID');
  const issueDateRaw = extractXmlTag(xmlContent, 'IssueDate');
  const currency = extractXmlTag(xmlContent, 'DocumentCurrencyCode') || 'EUR';
  const payableAmountStr = extractXmlTag(xmlContent, 'PayableAmount') || extractXmlTag(xmlContent, 'TaxInclusiveAmount') || '0';

  // Extract seller & buyer party tax / company ID or endpoint
  const supplierPartyBlockMatch = xmlContent.match(/<cac:AccountingSupplierParty[\s\S]*?<\/cac:AccountingSupplierParty>/i) ||
    xmlContent.match(/<AccountingSupplierParty[\s\S]*?<\/AccountingSupplierParty>/i);
  const supplierBlock = supplierPartyBlockMatch ? supplierPartyBlockMatch[0] : xmlContent;

  const customerPartyBlockMatch = xmlContent.match(/<cac:AccountingCustomerParty[\s\S]*?<\/cac:AccountingCustomerParty>/i) ||
    xmlContent.match(/<AccountingCustomerParty[\s\S]*?<\/AccountingCustomerParty>/i);
  const customerBlock = customerPartyBlockMatch ? customerPartyBlockMatch[0] : xmlContent;

  const sellerTaxId = extractXmlTag(supplierBlock, 'CompanyID') || extractXmlTag(supplierBlock, 'EndpointID');
  const buyerTaxId = extractXmlTag(customerBlock, 'CompanyID') || extractXmlTag(customerBlock, 'EndpointID');

  if (!invoiceNumber || !issueDateRaw || !sellerTaxId || !buyerTaxId) {
    throw new Error('Peppol UBL XML is missing required legal fields (ID, IssueDate, Supplier CompanyID, or Customer CompanyID)');
  }

  const issueDateYYYYMMDD = normalizeDateYYYYMMDD(issueDateRaw);
  const amountFloat = parseFloat(payableAmountStr);
  if (isNaN(amountFloat) || amountFloat <= 0) {
    throw new Error(`Invalid Peppol payable amount: "${payableAmountStr}"`);
  }
  const faceValueMinorUnits = BigInt(Math.round(amountFloat * 100));

  const canonicalInput: CanonicalInvoiceInput = {
    sellerTaxIdOrLei: sellerTaxId,
    buyerTaxIdOrLei: buyerTaxId,
    officialInvoiceNumber: invoiceNumber,
    currencyCode: currency,
    issueDateYYYYMMDD,
    faceValueMinorUnits,
  };

  const canonicalHash = computeCanonicalInvoiceHash(canonicalInput);

  return {
    standard: 'PEPPOL_BIS_3_0',
    canonicalInput,
    canonicalHash,
    governmentReference: `PEPPOL-UBL-${invoiceNumber}`,
    extractedMetadata: {
      sellerIdentifier: sellerTaxId,
      buyerIdentifier: buyerTaxId,
      invoiceNumber,
      issueDate: issueDateYYYYMMDD,
      currency,
      totalAmountFormatted: amountFloat.toFixed(2),
      faceValueMinorUnits: faceValueMinorUnits.toString(),
      rawAuthProofOrDigest: extractXmlTag(xmlContent, 'DigestValue') || undefined,
    },
  };
}

/**
 * Parses India GSTN e-Invoice IRP payloads (signed JSON / IRN payload).
 */
export function parseGstnIrnPayload(input: string | Record<string, any>): ParsedEInvoiceResult {
  const payload = typeof input === 'string' ? JSON.parse(input) : input;

  const irn = (payload.Irn || payload.irn || '').trim();
  const docDtls = payload.DocDtls || payload.docDtls || {};
  const sellerDtls = payload.SellerDtls || payload.sellerDtls || {};
  const buyerDtls = payload.BuyerDtls || payload.buyerDtls || {};
  const valDtls = payload.ValDtls || payload.valDtls || {};

  const invoiceNumber = docDtls.No || docDtls.no || payload.invoiceNumber;
  const rawDate = docDtls.Dt || docDtls.dt || payload.issueDate;
  const sellerGstin = sellerDtls.Gstin || sellerDtls.gstin || payload.sellerTaxId;
  const buyerGstin = buyerDtls.Gstin || buyerDtls.gstin || payload.buyerTaxId;
  const totalVal = valDtls.TotInvVal ?? valDtls.totInvVal ?? payload.totalAmount;
  const currency = payload.currency || 'INR';

  if (!invoiceNumber || !rawDate || !sellerGstin || !buyerGstin || totalVal === undefined) {
    throw new Error('GSTN e-Invoice payload missing required fields (DocDtls.No, DocDtls.Dt, SellerDtls.Gstin, BuyerDtls.Gstin, or ValDtls.TotInvVal)');
  }

  // Format date: if DD/MM/YYYY or YYYY-MM-DD
  let formattedDate = rawDate.replace(/[^0-9]/g, '');
  if (rawDate.includes('/') && formattedDate.length === 8) {
    // DDMMYYYY -> YYYYMMDD
    const day = formattedDate.slice(0, 2);
    const month = formattedDate.slice(2, 4);
    const year = formattedDate.slice(4, 8);
    formattedDate = `${year}${month}${day}`;
  } else if (formattedDate.length === 8) {
    formattedDate = normalizeDateYYYYMMDD(formattedDate);
  } else {
    throw new Error(`Invalid GSTN issue date format: "${rawDate}"`);
  }

  const amountFloat = typeof totalVal === 'number' ? totalVal : parseFloat(totalVal);
  if (isNaN(amountFloat) || amountFloat <= 0) {
    throw new Error(`Invalid GSTN TotInvVal: "${totalVal}"`);
  }
  const faceValueMinorUnits = BigInt(Math.round(amountFloat * 100));

  const canonicalInput: CanonicalInvoiceInput = {
    sellerTaxIdOrLei: sellerGstin,
    buyerTaxIdOrLei: buyerGstin,
    officialInvoiceNumber: invoiceNumber,
    currencyCode: currency,
    issueDateYYYYMMDD: formattedDate,
    faceValueMinorUnits,
  };

  const canonicalHash = computeCanonicalInvoiceHash(canonicalInput);

  return {
    standard: 'INDIA_GSTN_IRN',
    canonicalInput,
    canonicalHash,
    governmentReference: irn || `GSTN-IRN-${invoiceNumber}`,
    extractedMetadata: {
      sellerIdentifier: sellerGstin,
      buyerIdentifier: buyerGstin,
      invoiceNumber,
      issueDate: formattedDate,
      currency,
      totalAmountFormatted: amountFloat.toFixed(2),
      faceValueMinorUnits: faceValueMinorUnits.toString(),
      rawAuthProofOrDigest: irn || undefined,
    },
  };
}

/**
 * Parses Mexico SAT CFDI 4.0 / Brazil SEFAZ XML documents.
 */
export function parseSatCfdiXml(xmlContent: string): ParsedEInvoiceResult {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Invalid CFDI XML content');
  }

  const folio = extractXmlAttribute(xmlContent, 'Comprobante', 'Folio') ||
    extractXmlAttribute(xmlContent, 'cfdi:Comprobante', 'Folio') ||
    extractXmlTag(xmlContent, 'Folio');
  const fecha = extractXmlAttribute(xmlContent, 'Comprobante', 'Fecha') ||
    extractXmlAttribute(xmlContent, 'cfdi:Comprobante', 'Fecha');
  const moneda = extractXmlAttribute(xmlContent, 'Comprobante', 'Moneda') ||
    extractXmlAttribute(xmlContent, 'cfdi:Comprobante', 'Moneda') || 'USD';
  const total = extractXmlAttribute(xmlContent, 'Comprobante', 'Total') ||
    extractXmlAttribute(xmlContent, 'cfdi:Comprobante', 'Total');

  const sellerRfc = extractXmlAttribute(xmlContent, 'Emisor', 'Rfc') ||
    extractXmlAttribute(xmlContent, 'cfdi:Emisor', 'Rfc');
  const buyerRfc = extractXmlAttribute(xmlContent, 'Receptor', 'Rfc') ||
    extractXmlAttribute(xmlContent, 'cfdi:Receptor', 'Rfc');

  const uuid = extractXmlAttribute(xmlContent, 'TimbreFiscalDigital', 'UUID') ||
    extractXmlAttribute(xmlContent, 'tfd:TimbreFiscalDigital', 'UUID');

  if (!folio || !fecha || !sellerRfc || !buyerRfc || !total) {
    throw new Error('CFDI XML is missing required fields (Folio, Fecha, Emisor Rfc, Receptor Rfc, or Total)');
  }

  const issueDateYYYYMMDD = normalizeDateYYYYMMDD(fecha.slice(0, 10));
  const amountFloat = parseFloat(total);
  if (isNaN(amountFloat) || amountFloat <= 0) {
    throw new Error(`Invalid CFDI Total: "${total}"`);
  }
  const faceValueMinorUnits = BigInt(Math.round(amountFloat * 100));

  const canonicalInput: CanonicalInvoiceInput = {
    sellerTaxIdOrLei: sellerRfc,
    buyerTaxIdOrLei: buyerRfc,
    officialInvoiceNumber: folio,
    currencyCode: moneda,
    issueDateYYYYMMDD,
    faceValueMinorUnits,
  };

  const canonicalHash = computeCanonicalInvoiceHash(canonicalInput);

  return {
    standard: 'MEXICO_SAT_CFDI',
    canonicalInput,
    canonicalHash,
    governmentReference: uuid || `SAT-CFDI-${folio}`,
    extractedMetadata: {
      sellerIdentifier: sellerRfc,
      buyerIdentifier: buyerRfc,
      invoiceNumber: folio,
      issueDate: issueDateYYYYMMDD,
      currency: moneda,
      totalAmountFormatted: amountFloat.toFixed(2),
      faceValueMinorUnits: faceValueMinorUnits.toString(),
      rawAuthProofOrDigest: uuid || undefined,
    },
  };
}

/**
 * Parses US Enterprise 3-Way Match (PO + ASN/eBL + Invoice) JSON payloads.
 */
export function parseErp3WayMatch(payload: Record<string, any>): ParsedEInvoiceResult {
  const purchaseOrderNumber = payload.purchaseOrderNumber || payload.poNumber;
  const asnNumber = payload.advancedShippingNoticeId || payload.asnId || payload.billOfLadingId;
  const invoiceNumber = payload.officialInvoiceNumber || payload.invoiceNumber;
  const sellerTaxIdOrLei = payload.sellerTaxIdOrLei || payload.sellerId;
  const buyerTaxIdOrLei = payload.buyerTaxIdOrLei || payload.buyerId;
  const currencyCode = payload.currencyCode || payload.currency || 'USD';
  const rawIssueDate = payload.issueDateYYYYMMDD || payload.issueDate;
  const amount = payload.faceValueUsd ?? payload.faceValueAmount ?? payload.totalAmount;

  if (!purchaseOrderNumber || !asnNumber || !invoiceNumber || !sellerTaxIdOrLei || !buyerTaxIdOrLei || !rawIssueDate) {
    throw new Error('ERP 3-Way Match requires purchaseOrderNumber, advancedShippingNoticeId, invoiceNumber, sellerId, buyerId, and issueDate');
  }

  const issueDateYYYYMMDD = normalizeDateYYYYMMDD(rawIssueDate);
  const amountFloat = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(amountFloat) || amountFloat <= 0) {
    throw new Error(`Invalid ERP 3-Way Match face value: "${amount}"`);
  }
  const faceValueMinorUnits = payload.faceValueMinorUnits
    ? BigInt(payload.faceValueMinorUnits)
    : BigInt(Math.round(amountFloat * 100));

  const canonicalInput: CanonicalInvoiceInput = {
    sellerTaxIdOrLei,
    buyerTaxIdOrLei,
    officialInvoiceNumber: invoiceNumber,
    currencyCode,
    issueDateYYYYMMDD,
    faceValueMinorUnits,
  };

  const canonicalHash = computeCanonicalInvoiceHash(canonicalInput);

  // Tri-partite hash binding PO + ASN + Invoice
  const triPartiteHash = keccak256(
    encodePacked(
      ['string', 'string', 'bytes32'],
      [
        normalizeAlphaNumUpper(purchaseOrderNumber),
        normalizeAlphaNumUpper(asnNumber),
        canonicalHash,
      ]
    )
  );

  return {
    standard: 'US_ERP_3WAY_MATCH',
    canonicalInput,
    canonicalHash,
    governmentReference: `ERP-3WAY-${purchaseOrderNumber}`,
    extractedMetadata: {
      sellerIdentifier: sellerTaxIdOrLei,
      buyerIdentifier: buyerTaxIdOrLei,
      invoiceNumber,
      issueDate: issueDateYYYYMMDD,
      currency: currencyCode,
      totalAmountFormatted: amountFloat.toFixed(2),
      faceValueMinorUnits: faceValueMinorUnits.toString(),
      rawAuthProofOrDigest: triPartiteHash,
    },
  };
}

/**
 * Universal auto-detection and parsing dispatcher for any supported e-invoicing standard.
 */
export function detectAndParseEInvoice(
  input: string | Record<string, any>,
  standardHint?: EInvoiceStandard
): ParsedEInvoiceResult {
  if (standardHint === 'PEPPOL_BIS_3_0' || (typeof input === 'string' && input.includes('urn:oasis:names:specification:ubl'))) {
    return parsePeppolUblXml(typeof input === 'string' ? input : JSON.stringify(input));
  }

  if (standardHint === 'MEXICO_SAT_CFDI' || (typeof input === 'string' && (input.includes('cfdi:Comprobante') || input.includes('TimbreFiscalDigital')))) {
    return parseSatCfdiXml(typeof input === 'string' ? input : JSON.stringify(input));
  }

  if (standardHint === 'INDIA_GSTN_IRN' || (typeof input === 'object' && ('Irn' in input || 'DocDtls' in input))) {
    return parseGstnIrnPayload(input);
  }

  if (standardHint === 'US_ERP_3WAY_MATCH' || (typeof input === 'object' && ('purchaseOrderNumber' in input || 'poNumber' in input))) {
    return parseErp3WayMatch(typeof input === 'object' ? input : JSON.parse(input));
  }

  // Fallback: If input is JSON string, parse and inspect
  if (typeof input === 'string') {
    try {
      const parsedJson = JSON.parse(input);
      return detectAndParseEInvoice(parsedJson, standardHint);
    } catch {
      // If it looks like XML, attempt Peppol or CFDI
      if (input.includes('<') && input.includes('>')) {
        try {
          return parsePeppolUblXml(input);
        } catch {
          return parseSatCfdiXml(input);
        }
      }
    }
  }

  throw new Error('Unable to determine e-invoice standard from provided input. Specify standardHint or provide valid XML/JSON.');
}
