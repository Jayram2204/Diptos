# Legal Enforceability Architecture: UNCITRAL MLETR & US UCC Article 12

## Singularity of Claim & Controllable Electronic Records (CER)
Every `RWAInvoice3643` token minted on Diptos embeds a cryptographic hash of a legally binding assignment instrument governed by:
- **UNCITRAL Model Law on Electronic Transferable Records (MLETR)** (adopted under the UK Electronic Trade Documents Act 2023 and Singapore Electronic Transactions Act).
- **US Uniform Commercial Code (UCC) Article 12** (Controllable Electronic Records in Delaware and adopting states).

## Non-Recourse True Sale
Discounting an invoice via `SettlementEscrow.sol` executes a non-recourse **True Sale** of the underlying trade receivable rather than a collateralized loan, ensuring bankruptcy remoteness if the supplier subsequently enters insolvency.
