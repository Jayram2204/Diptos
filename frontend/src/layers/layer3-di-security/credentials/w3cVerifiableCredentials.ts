import type { Address } from 'viem';

export interface W3CVerifiableCredentialSummary {
  id: string;
  type: string[];
  issuerDid: string;
  issuerName: string;
  subjectAddress?: Address;
  subjectDid: string;
  claimSummary: string;
  status: 'ACTIVE_NON_REVOKED' | 'REVOKED';
  issuedAt: string;
}
