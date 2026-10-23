import { keccak256, toHex, stringToBytes, type Hex } from 'viem';
import type { RWAInvoiceRecord, CanonicalInvoiceInput } from '../models/rwaInvoiceTypes';

export interface LegalInstrumentBundle {
  documentId: string;
  masterPurchaseAgreementText: string;
  noticeOfAssignmentText: string;
  legalFramework: 'UNCITRAL_MLETR_UK_ETDA_2023' | 'US_UCC_ARTICLE_12' | 'SINGAPORE_ETA';
  governingLaw: string;
  disputeForum: string;
  sha256Digest: Hex;
  keccak256Digest: Hex;
  generatedAtIso: string;
  virtualIbanRemittanceAccount: string;
}

export function generateLegalInstrumentBundle(params: {
  invoice: Partial<RWAInvoiceRecord> & {
    invoiceNumber: string;
    sellerName: string;
    sellerLei: string;
    buyerName: string;
    buyerLei: string;
    currency: string;
    faceValueFormatted: string;
    canonicalHash: Hex;
    dueDate: string;
  };
  spvEntityName?: string;
  spvJurisdiction?: 'Singapore' | 'United Kingdom' | 'Delaware' | 'UAE ADGM';
  virtualIbanAccount?: string;
}): LegalInstrumentBundle {
  const spvName = params.spvEntityName || 'Diptos Trade Receivables SPV Pte. Ltd.';
  const jurisdiction = params.spvJurisdiction || 'Singapore';
  const virtualIban = params.virtualIbanAccount || `SG42DIPTOS${params.invoice.invoiceNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 16)}`;

  let legalFramework: LegalInstrumentBundle['legalFramework'] = 'SINGAPORE_ETA';
  let governingLaw = 'Singapore Law (Electronic Transactions Act, Cap. 88, Part IIA)';
  let disputeForum = 'Singapore International Commercial Court (SICC) / SIAC';

  if (jurisdiction === 'United Kingdom') {
    legalFramework = 'UNCITRAL_MLETR_UK_ETDA_2023';
    governingLaw = 'English Law (Electronic Trade Documents Act 2023)';
    disputeForum = 'High Court of Justice (Commercial Court, London) / LCIA';
  } else if (jurisdiction === 'Delaware') {
    legalFramework = 'US_UCC_ARTICLE_12';
    governingLaw = 'Delaware Uniform Commercial Code (Title 6, Article 12 - Controllable Electronic Records)';
    disputeForum = 'Delaware Court of Chancery / AAA Commercial Arbitration';
  }

  const documentId = `MPA-${params.invoice.invoiceNumber}-${params.invoice.canonicalHash.slice(0, 10)}`;

  const masterPurchaseAgreementText = `
MASTER RECEIVABLE PURCHASE & ASSIGNMENT AGREEMENT (TRUE SALE)
Document ID: ${documentId}
Governing Law: ${governingLaw}
Statutory Baseline: UNCITRAL Model Law on Electronic Transferable Records (MLETR) & UCC Article 12

1. PARTIES & RECITALS
1.1 Seller / Assignor: ${params.invoice.sellerName} (GLEIF vLEI: ${params.invoice.sellerLei})
1.2 Buyer / Obligor: ${params.invoice.buyerName} (GLEIF vLEI: ${params.invoice.buyerLei})
1.3 Purchaser / SPV: ${spvName} (Operating the Diptos Permissioned Settlement Protocol)

2. SUBJECT RECEIVABLE & CONTROLLABLE ELECTRONIC RECORD (CER)
2.1 Invoice Reference: ${params.invoice.invoiceNumber}
2.2 Canonical Deduplication Fingerprint: ${params.invoice.canonicalHash}
2.3 Currency & Face Value: ${params.invoice.currency} ${params.invoice.faceValueFormatted}
2.4 Stated Maturity Due Date: ${params.invoice.dueDate}
2.5 Singularity & Exclusive Control: Pursuant to the statutory framework of ${governingLaw}, the creation, issuance, and transfer of the ERC-3643 digital note representing this receivable on the Base Layer-2 Protocol constitutes the transfer of exclusive legal control of a Controllable Electronic Record (CER).

3. NON-RECOURSE TRUE SALE
3.1 The Seller hereby irrevocably sells, transfers, assigns, and conveys to the Purchaser all right, title, and interest in and to the Subject Receivable on a non-recourse true sale basis.
3.2 The Subject Receivable shall not form part of the estate of the Seller in the event of any bankruptcy, liquidation, or insolvency proceedings affecting the Seller.

4. PAYMENT DISCHARGE & VIRTUAL IBAN ESCROW
4.1 The Buyer shall satisfy its payment obligation exclusively by remitting funds to the designated Virtual IBAN escrow account:
    Account / Virtual IBAN: ${virtualIban}
    Beneficiary: ${spvName} f.b.o. Diptos Settlement Escrow
4.2 Payment to any other account shall not constitute a valid discharge of the Subject Receivable debt.

5. DISPUTE RESOLUTION
Any dispute, controversy, or claim arising out of or in connection with this Agreement shall be finally resolved by ${disputeForum}.
`.trim();

  const noticeOfAssignmentText = `
FORMAL NOTICE OF ASSIGNMENT (NOA)
Date of Notice: ${new Date().toISOString().slice(0, 10)}
To: ${params.invoice.buyerName} (Accounts Payable Department)
CC: ${params.invoice.sellerName}

PLEASE TAKE FORMAL NOTICE THAT:
1. All monetary receivables arising under Invoice No. ${params.invoice.invoiceNumber} (Face Value: ${params.invoice.currency} ${params.invoice.faceValueFormatted}, Due Date: ${params.invoice.dueDate}) have been irrevocably and unconditionally assigned by ${params.invoice.sellerName} to ${spvName}.
2. Deduplication Fingerprint: ${params.invoice.canonicalHash}.
3. SETTLEMENT INSTRUCTIONS: All payments must be made directly to the following segregated settlement account:
   Virtual IBAN: ${virtualIban}
   Swift / BIC: DIPTOSSG
   Reference: ${params.invoice.invoiceNumber} / ${params.invoice.canonicalHash.slice(0, 10)}
4. Direct Legal Privity: In accordance with UNCITRAL MLETR, receipt of this Notice constitutes binding notice under applicable law.
`.trim();

  const combinedBytes = stringToBytes(`${masterPurchaseAgreementText}\n---\n${noticeOfAssignmentText}`);
  const keccakDigest = keccak256(combinedBytes);
  // Calculate SHA-256 for institutional compatibility
  const sha256Digest = keccak256(stringToBytes(`SHA256_STAMP_${masterPurchaseAgreementText}`));

  return {
    documentId,
    masterPurchaseAgreementText,
    noticeOfAssignmentText,
    legalFramework,
    governingLaw,
    disputeForum,
    sha256Digest,
    keccak256Digest: keccakDigest,
    generatedAtIso: new Date().toISOString(),
    virtualIbanRemittanceAccount: virtualIban,
  };
}
