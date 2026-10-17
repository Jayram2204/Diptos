# Layer 1 Architecture: RWA Core Engine

## Responsibilities
1. **Canonical Invoice Normalization & Deduplication (`canonicalHash.ts` & `InvoiceRegistry.sol`):**
   - Replaces brittle file hashing (`keccak256(pdf_bytes)`) with a deterministic fingerprint across 6 immutable business fields:
     `Seller_Global_Tax_ID_or_LEI`, `Buyer_Global_Tax_ID_or_LEI`, `Official_Invoice_Number`, `ISO4217_Currency_Code`, `Invoice_Issue_Date_YYYYMMDD`, and `Normalized_Face_Value_In_Minor_Units`.
   - Bridges with national deduplication registries via the MonetaGo API before on-chain registration.
2. **Multi-Standard E-Invoicing Ingestion (`einvoiceAdapters.ts`):**
   - EU/UK/SG/AU: Peppol BIS Billing 3.0 signed UBL XML.
   - India: GSTN e-Invoice IRP 64-char IRN signature verification.
   - LatAm: Mexico SAT CFDI UUID, Brazil SEFAZ NF-e, Chile DTE.
   - US & Cross-Border: ERP 3-Way Match (PO + ASN/eBL + EDI 810 Invoice).
3. **Dual Institutional Liquidity Packaging:**
   - `RWAInvoice3643.sol`: ERC-3643 (T-REX) permissioned single-invoice note ($100k+).
   - `RWAVault4626.sol`: ERC-4626 permissioned Senior (`DROP` @ 8.85% APY) and Junior First-Loss (`TIN` @ 14.20% APY) factoring vaults.
