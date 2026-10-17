import type { Address, Hex } from 'viem';

export type EInvoiceStandard =
  | 'PEPPOL_BIS_3_0'
  | 'INDIA_GSTN_IRN'
  | 'MEXICO_SAT_CFDI'
  | 'US_ERP_3WAY_MATCH';

export type InvoiceLifecycleStatus =
  | 'NONE'
  | 'REGISTERED'
  | 'FACTORED'
  | 'SETTLED'
  | 'DEFAULTED'
  | 'DISPUTED';

export type ISO4217Currency = 'USD' | 'EUR' | 'SGD' | 'GBP' | 'INR';

export type SettlementRail = 'BASE_USDC_ERC4337' | 'VIRTUAL_IBAN_FIAT';

export interface CanonicalInvoiceInput {
  sellerTaxIdOrLei: string;
  buyerTaxIdOrLei: string;
  officialInvoiceNumber: string;
  currencyCode: string;
  issueDateYYYYMMDD: string;
  faceValueMinorUnits: bigint;
}

export interface DeduplicationResult {
  canonicalHash: Hex;
  normalizedPayload: {
    sellerId: string;
    buyerId: string;
    invoiceNumber: string;
    currency: string;
    issueDate: string;
    faceValueMinorUnits: string;
  };
  isDuplicate: boolean;
  monetaGoRegistryStatus: 'CLEAR_UNIQUE' | 'DUPLICATE_DETECTED';
  baseRegistryStatus: 'NONE' | 'ALREADY_REGISTERED';
  status: 'VERIFIED_UNIQUE' | 'BLOCKED_DUPLICATE';
  checkedAtIso: string;
}

export interface RWAInvoiceRecord {
  id: string;
  invoiceNumber: string;
  corridor: string;
  eInvoiceStandard: EInvoiceStandard;
  governmentClearanceRef: string;
  sellerName: string;
  sellerLei: string;
  sellerDid: string;
  sellerAddress: Address;
  buyerName: string;
  buyerLei: string;
  buyerDid: string;
  buyerRating: string;
  buyerAddress: Address;
  currency: ISO4217Currency;
  faceValueUsd: number;
  faceValueMinorUnits: bigint;
  discountRateAprBps: number; // e.g., 960 = 9.60% APR
  platformFeeBps: number; // e.g., 10 = 0.10%
  tenorDays: number;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueDateUnix: bigint;
  canonicalHash: Hex;
  easOriginationUid: Hex;
  easBuyerAcceptanceUid: Hex;
  zkProofHash: Hex;
  cbamEmissionsKgCo2e: number;
  cbamStandard: string;
  status: InvoiceLifecycleStatus;
  virtualIbanAccount: string;
  privateLineItems: {
    skuCode: string;
    description: string;
    unitPriceMasked: string;
    supplierMarginMasked: string;
    rebateTierMasked: string;
  }[];
}

export interface TrancheVaultPool {
  id: 'SENIOR_DROP' | 'JUNIOR_TIN';
  symbol: 'dRWA-DROP' | 'dRWA-TIN';
  name: string;
  trancheRole: 'Senior Protected Tranche' | 'Junior First-Loss Tranche';
  targetApyPercent: number;
  tvlUsd: number;
  collateralizationRatioPercent: number;
  defaultRatePercent: number;
  weightedAvgTenorDays: number;
  activeInvoicesCount: number;
  erc4626VaultAddress: Address;
  erc3643ComplianceModule: Address;
  monthlyPerformance2026: { month: string; returnPercent: string }[];
}
