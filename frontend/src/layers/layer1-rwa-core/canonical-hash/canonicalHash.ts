import { encodePacked, keccak256, type Hex } from 'viem';
import type {
  CanonicalInvoiceInput,
  DeduplicationResult,
  RWAInvoiceRecord,
  TrancheVaultPool,
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
 * and simulated MonetaGo bilateral deduplication registry.
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
    checkedAtIso: '2026-10-17T08:00:00.000Z',
  };
}

export const INITIAL_DIPTOS_INVOICES: RWAInvoiceRecord[] = [
  {
    id: 'RWA-3643-01',
    invoiceNumber: 'INV-2026-8841',
    corridor: 'India (Pune) → EU (Germany)',
    eInvoiceStandard: 'INDIA_GSTN_IRN',
    governmentClearanceRef: 'IRN: 8f4e2c9a71b3d04f...9941a2b8 (NIC GSTN Signed)',
    sellerName: 'Bharat Precision Forgings Pvt. Ltd.',
    sellerLei: '33580048329184928172',
    sellerDid: 'did:pkh:eip155:8453:0x71C95911E9a5D330f4D621842EC243EE134329A2',
    sellerAddress: '0x71C95911E9a5D330f4D621842EC243EE134329A2',
    buyerName: 'RheinMetall Industrial Drivetrain AG',
    buyerLei: '529900T8BM49AURSDO55',
    buyerDid: 'did:pkh:eip155:8453:0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    buyerRating: 'AA- (Investment Grade)',
    buyerAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    currency: 'USD',
    faceValueUsd: 185000,
    faceValueMinorUnits: 18500000n,
    discountRateAprBps: 980, // 9.80% APR
    platformFeeBps: 10, // 10 bps
    tenorDays: 60,
    issueDate: '2026-10-15',
    dueDate: '2026-12-14',
    dueDateUnix: 1797206400n,
    canonicalHash: computeCanonicalInvoiceHash({
      sellerTaxIdOrLei: '33580048329184928172',
      buyerTaxIdOrLei: '529900T8BM49AURSDO55',
      officialInvoiceNumber: 'INV-2026-8841',
      currencyCode: 'USD',
      issueDateYYYYMMDD: '2026-10-15',
      faceValueMinorUnits: 18500000n,
    }),
    easOriginationUid: '0x4a81b2f0e911d29c8374a6b55f0e2c91a4b382910084a1c2d3e4f5a6b7c8d901',
    easBuyerAcceptanceUid: '0x9c22f1a8b344e01d7723c8a11e9f4b62c8d192034455a6b7c8d9e0f1a2b3c4d5',
    zkProofHash: '0x7e11d9c3a500f82b4412e7c99a0b3d51e6f283940011b2c3d4e5f6a7b8c9d0e2',
    cbamEmissionsKgCo2e: 1420,
    cbamStandard: 'EU CBAM Definitive • ISO-14064-1 Verified (<1.65t CO2e/t)',
    status: 'REGISTERED',
    virtualIbanAccount: 'DE89 3704 0044 0532 0130 00 (Banking Circle FBO Escrow)',
    privateLineItems: [
      {
        skuCode: 'BPF-CNC-7740-TI',
        description: 'Cold-Forged Low-Carbon Alloy Transmission Shafts (Batch #409)',
        unitPriceMasked: 'ZK-MASKED (PRIVATE)',
        supplierMarginMasked: 'ZK-MASKED (PRIVATE)',
        rebateTierMasked: 'ZK-MASKED (PRIVATE)',
      },
      {
        skuCode: 'BPF-HAR-2210-CR',
        description: 'Induction-Hardened Bevel Gear Assemblies (EU CBAM Lot #19)',
        unitPriceMasked: 'ZK-MASKED (PRIVATE)',
        supplierMarginMasked: 'ZK-MASKED (PRIVATE)',
        rebateTierMasked: 'ZK-MASKED (PRIVATE)',
      },
    ],
  },
  {
    id: 'RWA-3643-02',
    invoiceNumber: 'PEPPOL-SG-2026-4419',
    corridor: 'Singapore → UK (London)',
    eInvoiceStandard: 'PEPPOL_BIS_3_0',
    governmentClearanceRef: 'Peppol IMDA Access Point SGN-AP-99201 Signed XML',
    sellerName: 'Merlion Semiconductor Packaging Pte. Ltd.',
    sellerLei: '5493006MHB84DD0ZWV18',
    sellerDid: 'did:pkh:eip155:8453:0x71C95911E9a5D330f4D621842EC243EE134329A2',
    sellerAddress: '0x71C95911E9a5D330f4D621842EC243EE134329A2',
    buyerName: 'Thames Valley Avionics & Defense PLC',
    buyerLei: '213800D1EI4B9WTWWD28',
    buyerDid: 'did:pkh:eip155:8453:0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    buyerRating: 'A+ (Investment Grade)',
    buyerAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    currency: 'USD',
    faceValueUsd: 320000,
    faceValueMinorUnits: 32000000n,
    discountRateAprBps: 910, // 9.10% APR
    platformFeeBps: 10,
    tenorDays: 45,
    issueDate: '2026-10-16',
    dueDate: '2026-11-30',
    dueDateUnix: 1795996800n,
    canonicalHash: computeCanonicalInvoiceHash({
      sellerTaxIdOrLei: '5493006MHB84DD0ZWV18',
      buyerTaxIdOrLei: '213800D1EI4B9WTWWD28',
      officialInvoiceNumber: 'PEPPOL-SG-2026-4419',
      currencyCode: 'USD',
      issueDateYYYYMMDD: '2026-10-16',
      faceValueMinorUnits: 32000000n,
    }),
    easOriginationUid: '0x2b91c4d8e712a39f6541b8c22d1e3f90b5c471829901a2b3c4d5e6f7a8b9c012',
    easBuyerAcceptanceUid: '0x8d44e2b9c123f08a6612d9b33f0a5c71d9e283145566b7c8d9e0f1a2b3c4d5e6',
    zkProofHash: '0x5c33a1b7d901e44f8823c1d44b2f6e80c1a394051122c3d4e5f6a7b8c9d0e1f3',
    cbamEmissionsKgCo2e: 610,
    cbamStandard: 'UK ETDA 2023 MLETR • ISO-14064 Cleanroom Certified',
    status: 'REGISTERED',
    virtualIbanAccount: 'GB29 NWBK 6016 1331 9268 19 (Faster Payments FBO Escrow)',
    privateLineItems: [
      {
        skuCode: 'MSP-QFN-64L-AU',
        description: 'Radiation-Hardened QFN-64 Sensor Leadframes (Lot #881A)',
        unitPriceMasked: 'ZK-MASKED (PRIVATE)',
        supplierMarginMasked: 'ZK-MASKED (PRIVATE)',
        rebateTierMasked: 'ZK-MASKED (PRIVATE)',
      },
    ],
  },
  {
    id: 'RWA-3643-03',
    invoiceNumber: 'CFDI-MX-2026-9012',
    corridor: 'Mexico (Monterrey) → US (Detroit)',
    eInvoiceStandard: 'MEXICO_SAT_CFDI',
    governmentClearanceRef: 'SAT CFDI 4.0 UUID: 3f92a1d0-88b4-4c21-9e77-0192837465ab',
    sellerName: 'Grupo Industrial Regiomontano S.A. de C.V.',
    sellerLei: '5493008K9P2MN4QR8T77',
    sellerDid: 'did:pkh:eip155:8453:0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    sellerAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    buyerName: 'Great Lakes Mobility Powertrain Corp.',
    buyerLei: '5493001KJTIIGC8Y1R12',
    buyerDid: 'did:pkh:eip155:8453:0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    buyerRating: 'A (Investment Grade)',
    buyerAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
    currency: 'USD',
    faceValueUsd: 140000,
    faceValueMinorUnits: 14000000n,
    discountRateAprBps: 1120, // 11.20% APR
    platformFeeBps: 10,
    tenorDays: 90,
    issueDate: '2026-10-12',
    dueDate: '2027-01-10',
    dueDateUnix: 1799539200n,
    canonicalHash: computeCanonicalInvoiceHash({
      sellerTaxIdOrLei: '5493008K9P2MN4QR8T77',
      buyerTaxIdOrLei: '5493001KJTIIGC8Y1R12',
      officialInvoiceNumber: 'CFDI-MX-2026-9012',
      currencyCode: 'USD',
      issueDateYYYYMMDD: '2026-10-12',
      faceValueMinorUnits: 14000000n,
    }),
    easOriginationUid: '0x6f12d8a3c401b92e7734c1a55d2f8b90e1c263748899a0b1c2d3e4f5a6b7c823',
    easBuyerAcceptanceUid: '0x1a77c3e9b512d04f8834e2c66a1b9d82f0e374256677c8d9e0f1a2b3c4d5e6f7',
    zkProofHash: '0x3d88b2c4e109f73a9945d2e77c3a1f91d2b405162233d4e5f6a7b8c9d0e1f2a4',
    cbamEmissionsKgCo2e: 980,
    cbamStandard: 'USMCA Green Corridor • UCC Article 12 CER Verified',
    status: 'FACTORED',
    virtualIbanAccount: 'US64 SVBK 0012 9948 1102 84 (FedNow / USDC Bridge Escrow)',
    privateLineItems: [
      {
        skuCode: 'GIR-ALU-9012-EV',
        description: 'Die-Cast Aluminum EV Stator Housings (PO #US-88410)',
        unitPriceMasked: 'ZK-MASKED (PRIVATE)',
        supplierMarginMasked: 'ZK-MASKED (PRIVATE)',
        rebateTierMasked: 'ZK-MASKED (PRIVATE)',
      },
    ],
  },
];

export const DIPTOS_TRANCHE_VAULTS: TrancheVaultPool[] = [
  {
    id: 'SENIOR_DROP',
    symbol: 'dRWA-DROP',
    name: 'Diptos Global Trade Receivables — Senior Protected Tranche',
    trancheRole: 'Senior Protected Tranche',
    targetApyPercent: 8.85,
    tvlUsd: 42850000,
    collateralizationRatioPercent: 124.5,
    defaultRatePercent: 0.0,
    weightedAvgTenorDays: 54,
    activeInvoicesCount: 684,
    erc4626VaultAddress: '0x8888888888888888888888888888888888884626',
    erc3643ComplianceModule: '0x3643364336433643364336433643364336430001',
    monthlyPerformance2026: [
      { month: 'Jan', returnPercent: '0.72%' },
      { month: 'Feb', returnPercent: '0.69%' },
      { month: 'Mar', returnPercent: '0.74%' },
      { month: 'Apr', returnPercent: '0.73%' },
      { month: 'May', returnPercent: '0.75%' },
      { month: 'Jun', returnPercent: '0.74%' },
      { month: 'Jul', returnPercent: '0.75%' },
      { month: 'Aug', returnPercent: '0.76%' },
      { month: 'Sep', returnPercent: '0.74%' },
      { month: 'Oct', returnPercent: '0.75%' },
    ],
  },
  {
    id: 'JUNIOR_TIN',
    symbol: 'dRWA-TIN',
    name: 'Diptos Global Trade Receivables — Junior First-Loss Tranche',
    trancheRole: 'Junior First-Loss Tranche',
    targetApyPercent: 14.2,
    tvlUsd: 10450000,
    collateralizationRatioPercent: 100.0,
    defaultRatePercent: 0.0,
    weightedAvgTenorDays: 54,
    activeInvoicesCount: 684,
    erc4626VaultAddress: '0x9999999999999999999999999999999999994626',
    erc3643ComplianceModule: '0x3643364336433643364336433643364336430002',
    monthlyPerformance2026: [
      { month: 'Jan', returnPercent: '1.14%' },
      { month: 'Feb', returnPercent: '1.10%' },
      { month: 'Mar', returnPercent: '1.18%' },
      { month: 'Apr', returnPercent: '1.17%' },
      { month: 'May', returnPercent: '1.21%' },
      { month: 'Jun', returnPercent: '1.19%' },
      { month: 'Jul', returnPercent: '1.20%' },
      { month: 'Aug', returnPercent: '1.22%' },
      { month: 'Sep', returnPercent: '1.18%' },
      { month: 'Oct', returnPercent: '1.21%' },
    ],
  },
];
