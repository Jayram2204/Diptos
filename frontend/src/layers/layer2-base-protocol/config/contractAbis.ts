import { parseAbi, type Address } from 'viem';

export const DIPTOS_CONTRACT_ADDRESSES: Record<
  'INVOICE_REGISTRY' | 'RWA_INVOICE_3643' | 'RWA_VAULT_4626' | 'SETTLEMENT_ESCROW' | 'IDENTITY_REGISTRY' | 'SLASHER',
  Address
> = {
  INVOICE_REGISTRY: '0x1000000000000000000000000000000000003643',
  RWA_INVOICE_3643: '0x2000000000000000000000000000000000003643',
  RWA_VAULT_4626: '0x3000000000000000000000000000000000004626',
  SETTLEMENT_ESCROW: '0x4000000000000000000000000000000000008453',
  IDENTITY_REGISTRY: '0x5000000000000000000000000000000000000735',
  SLASHER: '0x6000000000000000000000000000000000009999',
};

export const RWA_INVOICE_3643_ABI = parseAbi([
  'function mintVerifiedInvoice(bytes32 canonicalHash, uint256 faceValue, bytes3 currency, uint64 dueDate, string buyerDID, bytes32 zkProofHash) external',
  'function transfer(bytes32 canonicalHash, address to) external',
  'function burnOnSettlement(bytes32 canonicalHash) external',
  'function freezeInvoice(bytes32 canonicalHash) external',
]);

export const INVOICE_REGISTRY_ABI = parseAbi([
  'function registerInvoice(bytes32 canonicalHash, bytes32 easAcceptanceUID, bytes32 zkProofHash, address buyer, uint256 faceValueMinorUnits, uint64 dueDate) external',
]);

export const SETTLEMENT_ESCROW_ABI = parseAbi([
  'function fundInvoiceDvP(bytes32 canonicalHash, address supplier, uint256 discountedPurchaseAmount, uint256 maturityFaceValue) external',
  'function settleOnChainStablecoin(bytes32 canonicalHash, uint256 repaymentAmount) external',
  'function confirmFiatVirtualIBANSettlement(bytes32 canonicalHash, bytes oracleSig) external',
]);

export const RWA_VAULT_4626_ABI = parseAbi([
  'function depositSenior(uint256 assets) external',
  'function depositJunior(uint256 assets) external',
  'function allocateToInvoice(bytes32 canonicalHash, uint256 fundedAmount) external',
]);

export const SLASHER_ABI = parseAbi([
  'function postVerifierBond(uint256 amount) external',
  'function submitDuplicateProof(bytes32 canonicalHash, bytes duplicateEvidence) external',
]);
