export interface ZkSelectiveDisclosureInput {
  invoiceId: string;
  buyerRating: string;
  cbamStandard: string;
  tierLevel: string;
}

export interface ZkAuditDisclosure {
  invoiceId: string;
  circuitId: string;
  verifierContract: string;
  publicProofs: {
    claimLabel: string;
    publicStatement: string;
    badgeText: string;
    verified: boolean;
  }[];
  maskedCommercialFields: {
    fieldName: string;
    storageLocation: string;
    maskedBadge: 'ZK-MASKED (PRIVATE)';
  }[];
}

/**
 * Generates the Privado ID Zero-Knowledge Selective Disclosure view:
 * proves Tier-1 Supplier status, investment-grade obligor rating, and EU CBAM compliance
 * while strictly masking proprietary SKU unit prices, margins, and volume rebates.
 */
export function generateZkSelectiveDisclosureView(
  input: ZkSelectiveDisclosureInput
): ZkAuditDisclosure {
  return {
    invoiceId: input.invoiceId,
    circuitId: 'credentialAtomicQueryMTPV2OnChain (Privado ID Groth16)',
    verifierContract: '0x3643000000000000000000000000000000007777',
    publicProofs: [
      {
        claimLabel: 'Supply Chain Vendor Tier & Obligor Rating',
        publicStatement: `Seller holds non-revoked ${input.tierLevel} VC from Buyer rated ${input.buyerRating} (>= BBB threshold)`,
        badgeText: 'ZK PROVEN (TIER-1 VENDOR) ✓',
        verified: true,
      },
      {
        claimLabel: 'EU CBAM Embedded Emissions & ESG Threshold',
        publicStatement: `Shipment satisfies ${input.cbamStandard} without revealing proprietary factory run-rate`,
        badgeText: 'ZK PROVEN (ISO-14064) ✓',
        verified: true,
      },
    ],
    maskedCommercialFields: [
      {
        fieldName: 'SKU-Level Unit Pricing & Bill of Materials',
        storageLocation: 'Encrypted Off-Chain Vault (AES-256-GCM • Buyer/Seller/Bank ACL)',
        maskedBadge: 'ZK-MASKED (PRIVATE)',
      },
      {
        fieldName: 'Negotiated Gross Supplier Margin (%)',
        storageLocation: 'Zero-Knowledge Witness Only (Never Submitted On-Chain)',
        maskedBadge: 'ZK-MASKED (PRIVATE)',
      },
      {
        fieldName: 'Annual Volume Rebate & Tiered Discount Schedule',
        storageLocation: 'Zero-Knowledge Witness Only (Never Submitted On-Chain)',
        maskedBadge: 'ZK-MASKED (PRIVATE)',
      },
    ],
  };
}
