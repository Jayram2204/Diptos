export interface W3CVerifiableCredentialSummary {
  id: string;
  type: string[];
  issuerDid: string;
  issuerName: string;
  subjectDid: string;
  claimSummary: string;
  status: 'ACTIVE_NON_REVOKED' | 'REVOKED';
  issuedAt: string;
  expiresAt: string;
}

export const ACTIVE_SUPPLY_CHAIN_CREDENTIALS: W3CVerifiableCredentialSummary[] = [
  {
    id: 'urn:uuid:vc-gleif-vlei-33580048329184928172',
    type: ['VerifiableCredential', 'GLEIFvLEICredential'],
    issuerDid: 'did:web:gleif.org:qvi:rapidlei',
    issuerName: 'GLEIF Accredited QVI Anchor',
    subjectDid: 'did:pkh:eip155:8453:0x71C95911E9a5D330f4D621842EC243EE134329A2',
    claimSummary: 'Active 20-Character LEI • Good Standing • Authorized Signatory Role',
    status: 'ACTIVE_NON_REVOKED',
    issuedAt: '2026-04-01T00:00:00Z',
    expiresAt: '2027-04-01T00:00:00Z',
  },
  {
    id: 'urn:uuid:vc-tier1-supplier-rheinmetall-409',
    type: ['VerifiableCredential', 'SupplyChainTier1VendorCredential'],
    issuerDid: 'did:pkh:eip155:8453:0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    issuerName: 'RheinMetall Industrial Drivetrain AG (LEI: 529900T8BM49AURSDO55)',
    subjectDid: 'did:pkh:eip155:8453:0x71C95911E9a5D330f4D621842EC243EE134329A2',
    claimSummary: 'Authorized Tier-1 Supplier — Steel & Alloy Division • Credit Limit $2.5M',
    status: 'ACTIVE_NON_REVOKED',
    issuedAt: '2026-06-15T00:00:00Z',
    expiresAt: '2027-06-15T00:00:00Z',
  },
  {
    id: 'urn:uuid:vc-cbam-iso14064-green-corridor',
    type: ['VerifiableCredential', 'EUCBAMCarbonComplianceCredential'],
    issuerDid: 'did:web:tuv-sud.com:cbam-verifier',
    issuerName: 'TÜV SÜD Accredited EU CBAM Verifier',
    subjectDid: 'did:pkh:eip155:8453:0x71C95911E9a5D330f4D621842EC243EE134329A2',
    claimSummary: 'Embedded Emissions < 1.65t CO2e/tonne • ISO-14064-1 Certified Facility',
    status: 'ACTIVE_NON_REVOKED',
    issuedAt: '2026-08-10T00:00:00Z',
    expiresAt: '2027-08-10T00:00:00Z',
  },
];
