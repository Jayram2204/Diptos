import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';

export interface InvoiceDiscountBreakdown {
  faceValueUsd: number;
  discountYieldUsd: number;
  platformFeeUsd: number;
  netSupplierPayoutUsd: number;
  effectiveAprPercent: number;
  estimatedBaseGasUsd: number;
}

/**
 * Computes exact transparent institutional discount math:
 * Net Cash = Face Value - Prorated Discount (APR * Tenor / 365) - Platform Fee (10 bps capped at $150)
 */
export function calculateInvoiceDiscountMath(
  invoice: RWAInvoiceRecord
): InvoiceDiscountBreakdown {
  const aprDecimal = invoice.discountRateAprBps / 10000;
  const discountYieldUsd = Math.round(
    invoice.faceValueUsd * aprDecimal * (invoice.tenorDays / 365)
  );
  const uncappedFee = Math.round(invoice.faceValueUsd * (invoice.platformFeeBps / 10000));
  const platformFeeUsd = Math.min(150, Math.max(10, uncappedFee));
  const netSupplierPayoutUsd = invoice.faceValueUsd - discountYieldUsd - platformFeeUsd;

  return {
    faceValueUsd: invoice.faceValueUsd,
    discountYieldUsd,
    platformFeeUsd,
    netSupplierPayoutUsd,
    effectiveAprPercent: Number((invoice.discountRateAprBps / 100).toFixed(2)),
    estimatedBaseGasUsd: 0.0, // Sponsored via Diptos ERC-4337 Paymaster
  };
}
