# Diptos Product Requirements Document (PRD): Global RWA Trade Receivables Protocol

- **Domain:** `diptos.xyz`
- **Version:** 2.0 (Global Institutional Edition)
- **Date:** 17 October 2026
- **Status:** Architecture & GTM Ready
- **Core Thesis:** Short-duration, self-liquidating Real-World Asset (RWA) trade invoices powered by an Ethereum/Base settlement layer and secured by a Zero-Knowledge Decentralized Identity (DI) compliance layer.

---

## 1. Executive Summary: Three-Layer Architecture Unlocks Global Trade Finance

Diptos is a permissioned, global Real-World Asset (RWA) protocol that transforms verified B2B trade invoices into short-term (30–90 day), self-liquidating on-chain financial instruments. Unlike illiquid real estate or commodity tokenization, trade receivables settle automatically upon buyer payment, delivering predictable real-economy yield (8%–14% APR) uncorrelated with cryptocurrency asset prices.

To scale across global trade corridors (EU, UK, US, Singapore, Latin America, Middle East, and India), Diptos is architected across three tightly integrated layers:

1. **Core Layer — Real-World Asset (RWA) Engine:** Ingests standardized government e-invoices and ERP payables, enforces global anti-double-financing deduplication via canonical field hashing, and mints legally enforceable [ERC-3643](https://www.erc3643.org/) (T-REX) invoice tokens aligned with the [UNCITRAL Model Law on Electronic Transferable Records (MLETR)](https://uncitral.un.org/en/texts/ecommerce/modellaw/electronic_transferable_records).
2. **Protocol Layer — Ethereum & Base Execution Engine:** Operates on [Base](https://docs.base.org/get-started/base) (Ethereum Layer 2, Chain ID `8453` / Sepolia `84532`) for sub-cent deterministic execution, records immutable buyer acceptance and delivery proofs via the [Ethereum Attestation Service (EAS)](https://docs.attest.org/), abstracts wallet complexity via [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337) smart accounts, and settles in regulated institutional stablecoins (USDC/EURC) or automated Virtual IBAN fiat escrows.
3. **Security Layer — Decentralized Identity (DI) & ZK Privacy Shield:** Binds every corporate participant to a globally recognized [GLEIF Verifiable LEI (vLEI)](https://www.gleif.org/en/organizational-identity/lei-vlei/the-verifiable-lei-vlei) and [ONCHAINID](https://docs.onchainid.com/docs/concepts/howItWorks/) smart contract, issues [W3C Verifiable Credentials 2.0](https://www.w3.org/TR/vc-data-model-2.0/), and uses [Privado ID](https://docs.privado.id/docs/introduction/) zero-knowledge (ZK) selective disclosure so financiers and regulators can verify compliance and [EU CBAM](https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism/cbam-definitive-regime_en) carbon metrics without exposing confidential supplier pricing.

| Architectural Layer | Primary Role in Diptos | Core Standards & Technologies | Key Problem Solved |
| :--- | :--- | :--- | :--- |
| **1. RWA Core Layer** | Asset origination, deduplication, legal transferability, and liquidity packaging | ERC-3643, ERC-4626 Vaults, Peppol, UNCITRAL MLETR, MonetaGo API Bridge | Eliminates cross-platform double-financing and makes tokenized invoices legally enforceable debt claims |
| **2. Ethereum Protocol Layer** | High-throughput state machine, cryptographic attestations, gasless UX, and atomic settlement | Base L2 (`8453`), EAS, ERC-4337, USDC/EURC & Virtual IBAN Oracles | Removes Web3 friction for SMEs/banks and guarantees atomic delivery-versus-payment (DvP) |
| **3. DI Security Layer** | Institutional KYB/KYC enforcement, role authorization, and commercial data privacy | ONCHAINID, W3C VC 2.0, GLEIF vLEI, Privado ID ZK Proofs | Prevents fake invoice minting while keeping unit prices and supplier margins strictly private |

---

## 2. Problem Statement: Fragmented Registries and Unverified Identities Block $5.2T in Global Trade Finance

Global B2B trade runs on 30-to-120-day payment terms, trapping trillions of dollars in unpaid working capital on supplier balance sheets while leaving a multi-trillion-dollar SME trade finance gap. Existing factoring infrastructure fails across four structural dimensions:

- **Cross-Platform Double-Financing Fraud:** Suppliers can export the same invoice from an ERP system and discount it simultaneously across multiple domestic factoring exchanges, cross-border trade finance funds, and local banks because regional platforms lack a shared cryptographic deduplication state.
- **Seller-Side Dilution and Fake Invoice Risk:** Simply uploading a PDF or ERP invoice only proves a seller generated a bill, not that the corporate buyer received the goods or agreed to pay—exposing financiers to fabricated invoices and commercial disputes.
- **Commercial Privacy vs. Public Blockchain Transparency:** Corporate buyers and suppliers refuse to put raw invoices on public blockchains if competitors can inspect SKU-level pricing, bill-of-materials relationships, or discount margins.
- **High Onboarding and Legal Friction in Traditional RWA:** Tokenizing real estate or physical commodities requires complex SPV structuring, physical custodians, and court enforcement, whereas institutional financiers want short-duration, self-settling commercial paper with instant KYB verification.

---

## 3. Product Scope: Goals and Non-Goals

### 3.1 Product Goals
- **Sub-24-Hour Global Liquidity:** Enable verified suppliers and exporters to receive discounted working capital in under 24 hours from invoice acceptance.
- **Zero Double-Financing Guarantee:** Enforce deterministic, canonical invoice hashing on-chain paired with bilateral API bridges to national deduplication registries such as MonetaGo.
- **Cryptographic Buyer Confirmation:** Require cryptographic buyer acceptance (Reverse Factoring / Confirming) or government tax-portal clearance before an invoice can be minted as an RWA token.
- **Multi-Jurisdictional Legal Validity:** Structure every minted token to satisfy UNCITRAL MLETR and US UCC Article 12 (Controllable Electronic Records) so token ownership legally transfers the underlying receivable claim.
- **Bubble-Resistant Real Yield:** Anchor all protocol revenue and investor yield strictly in real manufacturing and trade cash flows rather than speculative utility tokens.

### 3.2 Explicit Non-Goals
- **Long-Duration Illiquid RWAs:** No tokenization of real estate, fine art, carbon offset credits, or physical gold bullion.
- **Permissionless Retail Trading:** No anonymous DeFi AMM pools or unverified retail secondary trading of invoice tokens.
- **ERP or Accounting Replacement:** Diptos integrates with existing enterprise ERP systems (SAP, Oracle NetSuite, Microsoft Dynamics, Tally, Zoho) and e-invoicing networks (Peppol) via API rather than building accounting software.
- **Uncollateralized SME Speculation:** No requirement for cash-strapped SMEs to lock up speculative cryptocurrency stakes to use the platform.

---

## 4. Deep-Dive Specification: The Three-Layer Stack

### 4.1 Layer 1 — The Core RWA Engine (Asset Origination, Deduplication & Liquidity)

#### Canonical Invoice Normalization & Deduplication
```solidity
canonicalHash = keccak256(
    abi.encodePacked(
        UPPERCASE_ALPHANUM(Seller_Global_Tax_ID_or_LEI),
        UPPERCASE_ALPHANUM(Buyer_Global_Tax_ID_or_LEI),
        UPPERCASE_ALPHANUM(Official_Invoice_Number),
        ISO4217_Currency_Code,
        Invoice_Issue_Date_YYYYMMDD,
        Normalized_Face_Value_In_Minor_Units
    )
)
```
Before minting, the off-chain ingestion engine also runs a fuzzy-matching check (detecting transposed digits, date shifts, or split invoices) and queries external national registries via the MonetaGo API before committing the `canonicalHash` to `InvoiceRegistry.sol`.

#### Multi-Standard Global E-Invoicing Ingestion
- **European Union, UK, Singapore & Australia:** Direct ingestion of signed XML UBL documents via the Peppol BIS Billing 3.0 network.
- **Latin America:** Cryptographic verification of government-cleared tax XMLs (Mexico SAT CFDI UUID, Brazil SEFAZ NF-e, Chile DTE).
- **India:** Verification of the 64-character Invoice Reference Number (IRN) signed by the GSTN e-Invoice IRP portal, alongside Tally Prime and SAP ERP connectors.
- **United States & Global Cross-Border:** Direct 3-way match verification (Purchase Order + Advanced Shipping Notice / Electronic Bill of Lading + Invoice) pulled from SAP S/4HANA, Oracle NetSuite, or EDI 810 feeds.

#### Dual Institutional Liquidity Packaging
- **Whole-Invoice Token (`RWAInvoice3643.sol`):** Dedicated ERC-3643 permissioned token representing a single high-value corporate invoice ($100,000+).
- **Diversified Factoring Vaults (`RWAVault4626.sol`):** ERC-4626 compliant, permissioned liquidity pool wrapped in ERC-3643 transfer restrictions, divided into **Senior Tranches (DROP @ 8.85% APY)** and **Junior First-Loss Tranches (TIN @ 14.20% APY)**.

### 4.2 Layer 2 — The Ethereum / Base Protocol Layer (Execution, Attestations & Settlement)

- **Base L2 Execution Environment:** Mainnet Chain ID `8453` and Sepolia Testnet `84532` (<$0.01 per invoice lifecycle).
- **Cryptographic Workflow Attestations via EAS:**
  - *Schema #1 — Supplier Origination Attestation*
  - *Schema #2 — Buyer Acceptance / Confirming Attestation*
  - *Schema #3 — Settlement & Discharge Attestation*
- **Invisible Web3 UX via ERC-4337 Account Abstraction:**
  - Smart Accounts via Privy + OpenZeppelin ERC-4337 contracts.
  - Paymaster Gas Sponsorship (`Gas: Sponsored (ERC-4337)`).
  - Enterprise 2-of-3 Recovery & Role Thresholds.
- **Hybrid Fiat & Stablecoin Settlement Engine:**
  - On-Chain Stablecoin Rail (USDC/EURC via `SettlementEscrow.sol`).
  - Regulated Fiat Escrow Rail (Virtual IBAN / SEPA Instant / FedNow / Faster Payments / UPI).

### 4.3 Layer 3 — The Decentralized Identity (DI) Security & Privacy Layer

- **Global Corporate Identity Hierarchy (`vLEI` + `ONCHAINID`):**
  - Root Trust Anchors (GLEIF Qualified vLEI Issuers).
  - Corporate Participants (`ONCHAINID` ERC-734/735 + W3C VC 2.0).
  - Supply Chain Relationship Credentials (Anchor Buyer $\rightarrow$ Tier-1/Tier-2 Supplier VCs).
- **Zero-Knowledge Selective Disclosure via Privado ID:**
  - Line-item SKU descriptions, unit prices, volume rebates, and margins are strictly encrypted off-chain and rendered in the UI with `ZK-MASKED (PRIVATE)`.
  - On-chain ZK proofs verify Tier-1 vendor status and EU CBAM embedded emissions compliance (`ISO-14064`).
- **Credit Underwriter & Verifier Staking (`Slasher.sol`):**
  - Verifiers and underwriters post collateral bonds that are slashed on forged attestations or missed duplicate checks.

---

## 5. Typography, Readability & Daylight-First Color System

| UI Element | Font & Weight Specification | Sizing, Tracking & Alignment Rules | Color & Contrast Token |
| :--- | :--- | :--- | :--- |
| **Workspace Headlines (H1/H2)** | `Inter` Bold (700) / Semi-Bold (600) | 20px–24px (H1), 16px (H2), `-0.02em` tracking, 1.25 line height | `#0F172A` on `#FFFFFF` (15.8:1 AAA) |
| **Body Copy & Legal Entities** | `Inter` Regular (400) & Medium (500) | 13px–14px body copy, 1.5 line height | `#334155` primary / `#64748B` secondary |
| **Table Column Headers & Badges** | `Inter` Semi-Bold (600) Uppercase | 11px (`0.6875rem`), `0.05em` letter-spacing, single line | `#475569` on `#F8FAFC` strip |
| **Currency, APR, Tenor & Hashes** | `IBM Plex Mono` Medium (500) / Bold (600) | Mandatory `font-variant-numeric: tabular-nums`, right-aligned | `#0F172A` principal, `#047857` Emerald yield |
| **Semantic Verification Pills** | `IBM Plex Mono` Semi-Bold (600) | 10px–11px inside 4px rounded pills with 1px semantic borders | Emerald (`#ECFDF5`/`#047857`), Blue (`#EFF6FF`/`#1D4ED8`), Red (`#FEF2F2`/`#991B1B`) |
