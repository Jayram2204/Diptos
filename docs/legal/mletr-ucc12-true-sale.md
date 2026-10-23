# Legal Enforceability Architecture: UNCITRAL MLETR & US UCC Article 12

## Singularity of Claim & Controllable Electronic Records (CER)
Every `RWAInvoice3643` token minted on Diptos embeds a cryptographic hash of a legally binding assignment instrument governed by:
- **UNCITRAL Model Law on Electronic Transferable Records (MLETR)** (adopted under the UK Electronic Trade Documents Act 2023 and Singapore Electronic Transactions Act).
- **US Uniform Commercial Code (UCC) Article 12** (Controllable Electronic Records in Delaware and adopting states).

## Non-Recourse True Sale
Discounting an invoice via `SettlementEscrow.sol` executes a non-recourse **True Sale** of the underlying trade receivable rather than a collateralized loan, ensuring bankruptcy remoteness if the supplier subsequently enters insolvency.

## Master Purchase Agreement (MPA) & Assignment Perfecting
- Each tokenized invoice is bound to a bilateral Master Purchase Agreement (MPA) signed via corporate electronic signatures / EAS attestations.
- Automated Notice of Assignment (NOA) is dispatched to the anchor buyer upon minting, creating direct legal privity between the obligor and the SPV holding the receivable.

## Dispute & Default Resolution Waterfall
1. **T+1 to T+5 Days:** Automated reconciliation check; notice of payment due.
2. **T+6 to T+15 Days:** Bilateral grace period; junior tranche buffer absorbs cash flow delay.
3. **T+16 to T+30 Days:** Formal execution of assignment rights under local commercial law.
4. **T+31+ Days:** Judicial summary debt enforcement under English law, Singapore SICC, or Delaware Chancery courts.

For full operational and legal details, refer to the [Go-to-Market Strategy](file:///Users/noname/documents/diptos/docs/GTM_STRATEGY.md).

