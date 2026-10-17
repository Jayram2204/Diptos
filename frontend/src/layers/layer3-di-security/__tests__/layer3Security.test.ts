import { describe, expect, it } from 'vitest';
import {
  formatDidPkh,
  formatDidBaseBadge,
  resolveCorporateVleiProfile,
} from '../identity/vleiOnchainId';
import { generateZkSelectiveDisclosureView } from '../zk-privacy/privadoZkShield';

describe('Layer 3 — Decentralized Identity (vLEI + ONCHAINID) & Privado ID ZK Shield', () => {
  const sampleAddress = '0x71C95911E9a5D330f4D621842EC243EE134329A2' as const;

  it('formats standard W3C DID:PKH on Base Mainnet (8453) and compact header badge', () => {
    expect(formatDidPkh(sampleAddress, 8453)).toBe(
      'did:pkh:eip155:8453:0x71C95911E9a5D330f4D621842EC243EE134329A2'
    );
    expect(formatDidBaseBadge(sampleAddress)).toBe('did:pkh:base:0x71C9...29A2');
  });

  it('resolves verified GLEIF vLEI and ONCHAINID contract metadata for an institutional address', () => {
    const profile = resolveCorporateVleiProfile(sampleAddress);
    expect(profile.verified).toBe(true);
    expect(profile.lei).toHaveLength(20);
    expect(profile.onchainIdAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
  });

  it('masks proprietary SKU unit prices and margins with ZK-MASKED (PRIVATE) while proving CBAM compliance', () => {
    const disclosure = generateZkSelectiveDisclosureView({
      invoiceId: 'INV-2026-8841',
      buyerRating: 'AA-',
      cbamStandard: 'ISO-14064-1:2018',
      tierLevel: 'Tier-1 Approved Vendor',
    });

    expect(disclosure.publicProofs.every((p) => p.verified)).toBe(true);
    expect(disclosure.maskedCommercialFields.every((f) => f.maskedBadge === 'ZK-MASKED (PRIVATE)')).toBe(
      true
    );
  });
});
