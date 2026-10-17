import { encodePacked, keccak256, type Hex } from 'viem';
import type {
  CanonicalInvoiceInput,
  DeduplicationResult,
} from '../models/rwaInvoiceTypes';

/**
 * Strips all non-alphanumeric characters (spaces, hyphens, slashes, punctuation)
 * and uppercases the string so formatting tweaks cannot bypass deduplication.
 */
export function normalizeAlphaNumUpper(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/**
 * Normalizes a date string (e.g. "2026-10-17" or "2026/10/17" or "20261017")
 * into canonical 8-digit YYYYMMDD format.
 */
export function normalizeDateYYYYMMDD(dateStr: string): string {
  const digitsOnly = dateStr.replace(/[^0-9]/g, '');
  if (digitsOnly.length !== 8) {
    throw new Error(`Invalid invoice issue date "${dateStr}": expected 8 digits (YYYYMMDD)`);
  }
  return digitsOnly;
}

/**
 * Computes the deterministic Canonical Invoice Fingerprint specified in PRD Section 4.1:
 * canonicalHash = keccak256(abi.encodePacked(
 *   UPPERCASE_ALPHANUM(Seller_Global_Tax_ID_or_LEI),
 *   UPPERCASE_ALPHANUM(Buyer_Global_Tax_ID_or_LEI),
 *   UPPERCASE_ALPHANUM(Official_Invoice_Number),
 *   ISO4217_Currency_Code,
 *   Invoice_Issue_Date_YYYYMMDD,
 *   Normalized_Face_Value_In_Minor_Units
 * ))
 */
export function computeCanonicalInvoiceHash(input: CanonicalInvoiceInput): Hex {
  const sellerId = normalizeAlphaNumUpper(input.sellerTaxIdOrLei);
  const buyerId = normalizeAlphaNumUpper(input.buyerTaxIdOrLei);
  const invoiceNumber = normalizeAlphaNumUpper(input.officialInvoiceNumber);
  const currency = normalizeAlphaNumUpper(input.currencyCode).slice(0, 3);
  const issueDate = normalizeDateYYYYMMDD(input.issueDateYYYYMMDD);

  if (!sellerId || !buyerId || !invoiceNumber || currency.length !== 3) {
    throw new Error('Canonical invoice input is missing required normalized fields');
  }

  return keccak256(
    encodePacked(
      ['string', 'string', 'string', 'string', 'string', 'uint256'],
      [sellerId, buyerId, invoiceNumber, currency, issueDate, input.faceValueMinorUnits]
    )
  );
}

/**
 * Runs deterministic canonical hash comparison against on-chain InvoiceRegistry.sol
 * and MonetaGo bilateral deduplication registry.
 */
export function checkInvoiceDeduplication(
  input: CanonicalInvoiceInput,
  existingHashes: readonly Hex[]
): DeduplicationResult {
  const sellerId = normalizeAlphaNumUpper(input.sellerTaxIdOrLei);
  const buyerId = normalizeAlphaNumUpper(input.buyerTaxIdOrLei);
  const invoiceNumber = normalizeAlphaNumUpper(input.officialInvoiceNumber);
  const currency = normalizeAlphaNumUpper(input.currencyCode).slice(0, 3);
  const issueDate = normalizeDateYYYYMMDD(input.issueDateYYYYMMDD);
  const canonicalHash = computeCanonicalInvoiceHash(input);

  const normalizedSet = new Set(existingHashes.map((h) => h.toLowerCase()));
  const isDuplicate = normalizedSet.has(canonicalHash.toLowerCase());

  return {
    canonicalHash,
    normalizedPayload: {
      sellerId,
      buyerId,
      invoiceNumber,
      currency,
      issueDate,
      faceValueMinorUnits: input.faceValueMinorUnits.toString(),
    },
    isDuplicate,
    monetaGoRegistryStatus: isDuplicate ? 'DUPLICATE_DETECTED' : 'CLEAR_UNIQUE',
    baseRegistryStatus: isDuplicate ? 'ALREADY_REGISTERED' : 'NONE',
    status: isDuplicate ? 'BLOCKED_DUPLICATE' : 'VERIFIED_UNIQUE',
    checkedAtIso: new Date().toISOString(),
  };
}
