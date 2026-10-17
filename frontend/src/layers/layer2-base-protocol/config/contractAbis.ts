import { parseAbi, type Address } from 'viem';

export const DIPTOS_CONTRACT_ADDRESSES: Record<
  | 'TEST_USDC'
  | 'IDENTITY_REGISTRY'
  | 'SLASHER'
  | 'INVOICE_REGISTRY'
  | 'RWA_INVOICE_3643'
  | 'RWA_VAULT_4626'
  | 'SETTLEMENT_ESCROW',
  Address
> = {
  TEST_USDC: (process.env.NEXT_PUBLIC_TEST_USDC_ADDRESS ??
    '0x9a9f2ccfde556a7e9ff0848998aa4a0cfd8863ae') as Address,
  IDENTITY_REGISTRY: (process.env.NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS ??
    '0x68b1d87f95878fe05b998f19b66f4baba5de1aed') as Address,
  SLASHER: (process.env.NEXT_PUBLIC_SLASHER_ADDRESS ??
    '0x3aa5ebb10dc797cac828524e59a333d0a371443c') as Address,
  INVOICE_REGISTRY: (process.env.NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS ??
    '0xc6e7df5e7b4f2a278906862b61205850344d4e7d') as Address,
  RWA_INVOICE_3643: (process.env.NEXT_PUBLIC_RWA_INVOICE_3643_ADDRESS ??
    '0x59b670e9fa9d0a427751af201d676719a970857b') as Address,
  RWA_VAULT_4626: (process.env.NEXT_PUBLIC_RWA_VAULT_4626_ADDRESS ??
    '0x4ed7c70f96b99c776995fb64377f0d4ab3b0e1c1') as Address,
  SETTLEMENT_ESCROW: (process.env.NEXT_PUBLIC_SETTLEMENT_ESCROW_ADDRESS ??
    '0x322813fd9a801c5507c9de605d63cea4f2ce6c44') as Address,
};

export const TEST_USDC_ABI = parseAbi([
  'function balanceOf(address owner) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function faucetMint(address to, uint256 amount) external',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function transfer(address to, uint256 amount) external returns (bool)',
]);

export const RWA_INVOICE_3643_ABI = parseAbi([
  'function mintVerifiedInvoice(bytes32 canonicalHash, uint256 faceValue, bytes3 currency, uint64 dueDate, string buyerDid, bytes32 zkProofHash) external',
  'function transfer(bytes32 canonicalHash, address to) external',
  'function burnOnSettlement(bytes32 canonicalHash) external',
  'function freezeInvoice(bytes32 canonicalHash) external',
  'function holderOf(bytes32 canonicalHash) external view returns (address)',
]);

export const INVOICE_REGISTRY_ABI = parseAbi([
  'struct RegisterInvoiceParams { bytes32 canonicalHash; string invoiceNumber; string corridor; string eInvoiceStandard; string governmentClearanceRef; string sellerName; string sellerLei; string buyerName; string buyerLei; string buyerRating; address buyer; string currency; uint256 faceValueMinorUnits; uint256 discountRateAprBps; uint256 tenorDays; string issueDate; string dueDate; uint64 dueDateUnix; bytes32 easOriginationUid; bytes32 easAcceptanceUid; bytes32 zkProofHash; uint256 cbamEmissionsKgCo2e; string cbamStandard; string virtualIbanAccount; }',
  'struct InvoiceRecord { bytes32 canonicalHash; string invoiceNumber; string corridor; string eInvoiceStandard; string governmentClearanceRef; string sellerName; string sellerLei; address supplier; string buyerName; string buyerLei; string buyerRating; address buyer; string currency; uint256 faceValueMinorUnits; uint256 discountRateAprBps; uint256 tenorDays; string issueDate; string dueDate; uint64 dueDateUnix; bytes32 easOriginationUid; bytes32 easAcceptanceUid; bytes32 zkProofHash; uint256 cbamEmissionsKgCo2e; string cbamStandard; string virtualIbanAccount; uint8 status; }',
  'function registerInvoiceFull(RegisterInvoiceParams params) external',
  'function updateStatus(bytes32 canonicalHash, uint8 newStatus) external',
  'function getAllInvoices() external view returns (InvoiceRecord[])',
  'function getInvoiceCount() external view returns (uint256)',
]);

export const SETTLEMENT_ESCROW_ABI = parseAbi([
  'function fundInvoiceDvP(bytes32 canonicalHash, address supplier, uint256 discountedPurchaseAmount, uint256 maturityFaceValue) external',
  'function settleOnChainStablecoin(bytes32 canonicalHash, uint256 repaymentAmount) external',
  'function confirmFiatVirtualIbanSettlement(bytes32 canonicalHash, bytes oracleSig) external',
]);

export const RWA_VAULT_4626_ABI = parseAbi([
  'function depositSenior(uint256 assets) external',
  'function depositJunior(uint256 assets) external',
  'function allocateToInvoice(bytes32 canonicalHash, uint256 fundedAmount) external',
  'function getVaultMetrics() external view returns (uint256 seniorPoolAssets, uint256 juniorFirstLossAssets, uint256 seniorTargetApyBps, uint256 juniorTargetApyBps, uint256 activeAllocatedInvoices)',
]);

export const IDENTITY_REGISTRY_ABI = parseAbi([
  'struct CorporateIdentityRecord { address wallet; address onchainIdContract; string vlei; string legalName; string jurisdiction; string qviIssuer; string role; bytes32 vleiClaimHash; bool verified; uint64 registeredAt; }',
  'struct VerifiableCredentialRecord { string vcId; string vcType; string issuerDid; string issuerName; address subjectAddress; string subjectDid; string claimSummary; bool revoked; uint64 issuedAt; }',
  'function registerIdentity(address _user, address _onchainId, string _vlei, string _legalName, string _jurisdiction, string _qviIssuer) external',
  'function registerCorporateIdentity(address _user, address _onchainId, string _vlei, string _legalName, string _jurisdiction, string _qviIssuer, string _role) external',
  'function issueCredential(string _vcId, string _vcType, string _issuerDid, string _issuerName, address _subjectAddress, string _subjectDid, string _claimSummary) external',
  'function isVerified(address _user) external view returns (bool)',
  'function getIdentity(address _user) external view returns (CorporateIdentityRecord)',
  'function getAllIdentities() external view returns (CorporateIdentityRecord[])',
  'function getAllCredentials() external view returns (VerifiableCredentialRecord[])',
]);

export const SLASHER_ABI = parseAbi([
  'struct VerifierNodeRecord { address nodeAddress; string operatorName; string role; uint256 stakedBondUsd; uint256 invoicesVerifiedCount; uint256 slashEventsCount; bool slashed; }',
  'function postVerifierBond(string operatorName, string role, uint256 amount) external',
  'function submitDuplicateProof(bytes32 canonicalHash, bytes duplicateEvidence) external',
  'function getAllVerifierNodes() external view returns (VerifierNodeRecord[])',
]);
