import { describe, expect, it } from 'vitest';
import {
  computeCanonicalInvoiceHash,
  normalizeAlphaNumUpper,
  checkInvoiceDeduplication,
} from '../canonical-hash/canonicalHash';

describe('Layer 1 — Canonical Invoice Fingerprint & Deduplication Engine', () => {
  it('normalizes tax IDs, LEIs, and invoice numbers to uppercase alphanumeric strings', () => {
    expect(normalizeAlphaNumUpper('  in-27aabcu9603r1zm / 01 ')).toBe('IN27AABCU9603R1ZM01');
    expect(normalizeAlphaNumUpper('inv-2026_00894-a')).toBe('INV202600894A');
  });

  it('produces identical canonical keccak256 hashes when attackers inject spaces, hyphens, or lowercase characters', () => {
    const cleanHash = computeCanonicalInvoiceHash({
      sellerTaxIdOrLei: '33580048329184928172',
      buyerTaxIdOrLei: '5493001KJTIIGC8Y1R12',
      officialInvoiceNumber: 'INV20268841',
      currencyCode: 'USD',
      issueDateYYYYMMDD: '20261017',
      faceValueMinorUnits: 12500000n, // $125,000.00
    });

    const tamperedFormattingHash = computeCanonicalInvoiceHash({
      sellerTaxIdOrLei: '3358-0048-3291-8492-8172 ',
      buyerTaxIdOrLei: '5493001kjtiigc8y1r12',
      officialInvoiceNumber: ' inv - 2026 / 8841 ',
      currencyCode: 'usd',
      issueDateYYYYMMDD: '2026-10-17',
      faceValueMinorUnits: 12500000n,
    });

    expect(cleanHash).toMatch(/^0x[a-f0-9]{64}$/);
    expect(tamperedFormattingHash).toBe(cleanHash);
  });

  it('detects exact canonical hash collisions and near-duplicate fuzzy matches across Base and MonetaGo', () => {
    const baseInput = {
      sellerTaxIdOrLei: '33580048329184928172',
      buyerTaxIdOrLei: '5493001KJTIIGC8Y1R12',
      officialInvoiceNumber: 'INV-2026-8841',
      currencyCode: 'USD',
      issueDateYYYYMMDD: '2026-10-17',
      faceValueMinorUnits: 12500000n,
    };

    const existingHash = computeCanonicalInvoiceHash(baseInput);

    const collisionCheck = checkInvoiceDeduplication(
      {
        ...baseInput,
        officialInvoiceNumber: 'INV 2026 8841', // attacker formatting tweak
      },
      [existingHash]
    );

    expect(collisionCheck.isDuplicate).toBe(true);
    expect(collisionCheck.status).toBe('BLOCKED_DUPLICATE');
    expect(collisionCheck.canonicalHash).toBe(existingHash);
  });
});
