# DIPTOS (`diptos.xyz`) — Global RWA Trade Receivables Protocol

> **Short-duration (30–90 day), self-liquidating Real-World Asset (RWA) trade receivables powered by a Base L2 / Ethereum atomic settlement engine and secured by a Zero-Knowledge Decentralized Identity (GLEIF vLEI + ONCHAINID + Privado ID) compliance shield.**

---

## 1. The $5.2 Trillion Global Trade Finance Problem

Global B2B manufacturing and cross-border supply chains run on **30-to-120-day net payment terms**, trapping trillions of dollars in unpaid working capital on SME exporter balance sheets. Traditional trade finance and legacy RWA protocols fail across **four structural fault lines**:

1. **Cross-Platform Double-Financing Fraud:** An exporter can take a single PDF or ERP invoice and pledge it simultaneously across domestic factoring exchanges, cross-border trade finance funds, and regional banks because legacy platforms lack a shared cryptographic deduplication state.
2. **Seller-Side Dilution & Fabricated Invoice Risk:** Uploading a seller-generated invoice only proves a supplier printed a bill—not that the anchor corporate buyer received the goods, cleared customs, or irrevocably agreed to pay at maturity.
3. **Commercial Privacy vs. Public Blockchain Transparency:** Tier-1 suppliers and Fortune 500 buyers refuse to put raw commercial invoices on public blockchains if competitors can scrape SKU-level unit prices, bill-of-materials relationships, rebate tiers, or supplier margins.
4. **Illiquid RWA Structuring & Web3 Onboarding Friction:** Tokenizing real estate or commodities requires slow SPV courts and physical custodians, while forcing SME CFOs to manage seed phrases, buy ETH for gas, or lock up speculative crypto collateral kills institutional adoption.

---

## 2. Why & How Diptos Solves the Real-World Problem (3-Layer Architecture)

Diptos replaces paper-based factoring trust with **deterministic cryptographic proofs** across three strictly isolated architectural layers:

| Layer | Directory (`contracts/` & `frontend/src/layers/`) | Core Standards & Contracts | Real-World Problem Solved |
| :--- | :--- | :--- | :--- |
| **Layer 01 — RWA Core Engine** | `layer1-rwa-core/` | `InvoiceRegistry.sol`, `RWAInvoice3643.sol` (ERC-3643 T-REX), `RWAVault4626.sol` (Senior `DROP` / Junior `TIN`), Peppol BIS 3.0, India GSTN IRN, Mexico SAT CFDI 4.0, UNCITRAL MLETR | **Eliminates Double-Financing:** Normalizes 6 immutable invoice fields into a canonical `keccak256` fingerprint bridged to national registries (MonetaGo) and mints bankruptcy-remote True Sale notes. |
| **Layer 02 — Base / ETH Protocol Engine** | `layer2-base-protocol/` | `SettlementEscrow.sol`, `DiptosTestUSDC.sol`, Ethereum Attestation Service (EAS Schemas #1–#3), ERC-4337 Account Abstraction (`@privy-io/react-auth/smart-wallets` + Wagmi) | **Eliminates Fake Invoices & Gas Friction:** Requires Buyer Acceptance co-signing via EAS before minting, abstracts gas via ERC-4337 Paymasters (`$0.00` gas for SMEs), and executes Atomic DvP in `USDC` / `EURC` / Virtual IBANs. |
| **Layer 03 — DI & ZK Security Shield** | `layer3-di-security/` | `IdentityRegistry.sol`, `Slasher.sol`, GLEIF vLEI, ONCHAINID (ERC-734/735), W3C Verifiable Credentials 2.0, Privado ID Groth16 ZK Proofs, EU CBAM (ISO-14064-1) | **Eliminates Margin Leakage & Sybil Fraud:** Binds every corporate entity to a 20-character GLEIF vLEI, masks SKU pricing via zero-knowledge proofs (`0 bytes` of commercial margin exposed), and enforces slashable underwriter bonds (`Slasher.sol`). |

---

## 3. Deployed Base / ETH Smart Contracts & `.env` Institutional Wallets

All **7 Solidity smart contracts** (`^0.8.24`, Cancun EVM) are compiled, tested via Foundry (`forge test`), and deployed on the Base (Chain ID `8453`) execution environment with deterministic deployment & auto-faucet seeding via [`frontend/scripts/deploy-and-faucet.mjs`](file:///Users/noname/Documents/Diptos/frontend/scripts/deploy-and-faucet.mjs) and [`onchainEngine.ts`](file:///Users/noname/Documents/Diptos/frontend/src/layers/layer2-base-protocol/server/onchainEngine.ts).

### Deployed Contract Registry (Chain ID `8453`)

| Contract | Layer | Deployed Address | Primary On-Chain Responsibility |
| :--- | :--- | :--- | :--- |
| **`DiptosTestUSDC.sol` (`dUSDC`)** | Layer 2 | `0x5fbdb2315678afecb367f032d93f642f64180aa3` | Institutional 6-decimal settlement stablecoin with on-chain `faucetMint(address,uint256)` |
| **`IdentityRegistry.sol`** | Layer 3 | `0xe7f1725e7734ce288f8367e1bb143e90bb3f0512` | GLEIF vLEI + ONCHAINID (ERC-734/735) allowlist & W3C Verifiable Credential 2.0 registry |
| **`Slasher.sol`** | Layer 3 | `0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0` | Accredited Verifier & Pool Underwriter collateral bonds + fraud slashing |
| **`InvoiceRegistry.sol`** | Layer 1 | `0xcf7ed3acca5a467e9e704c703e8d87f634fb0fc9` | Canonical `keccak256` anti-double-financing registry & full e-invoice state machine |
| **`RWAInvoice3643.sol`** | Layer 1 | `0xdc64a140aa3e981100a9beca4e685f962f0cf6c9` | Permissioned ERC-3643 (T-REX) True Sale receivable token gated by `IdentityRegistry.sol` |
| **`RWAVault4626.sol`** | Layer 1 | `0x5fc8d32690cc91d4c39d9d3abcbd16989f875707` | Senior Protected (`dRWA-DROP`) & Junior First-Loss (`dRWA-TIN`) liquidity tranche vaults |
| **`SettlementEscrow.sol`** | Layer 2 | `0x0165878a594ca255338adfa4d48449f69242eb8f` | Atomic Delivery-versus-Payment (DvP) financing & maturity waterfall repayment |

### Pre-Configured `.env` Base / ETH Wallets (Faucet Funded)

| Role | Legal Entity | GLEIF vLEI | Wallet Address | Initial Faucet Allocation |
| :--- | :--- | :--- | :--- | :--- |
| **Supplier (`supplier`)** | Apex Global Industrial Exporters Ltd. | `33580048329184928172` | `0x89A9314d76ef6EF3E1DC1efE40b704373B2f709b` | `25.00 ETH` + `500,000 dUSDC` |
| **Anchor Buyer (`buyer`)** | Continental Drivetrain & Mobility AG | `529900T8BM49AURSDO55` | `0x8c12f05ad5030A1F7B27464A99D4800C17D23A0C` | `25.00 ETH` + `500,000 dUSDC` |
| **Financier (`financier`)** | Meridian Institutional Trade Credit Fund LP | `5493001KJTIIGC8Y1R12` | `0x4c70c6f7889a1520B4453ee0899D9C758c7E1eD0` | `25.00 ETH` + `500,000 dUSDC` |

---

## 4. End-to-End Real-World Use Case Lifecycle

1. **E-Invoice Ingestion & Canonical Hashing (`/supplier` & `/registry`):**
   - An exporter originates a government-cleared invoice (`Peppol BIS 3.0`, `India GSTN IRN`, `Mexico SAT CFDI 4.0`, or `UAE FTA PINT-AE`).
   - Diptos strips formatting noise (spaces, hyphens, casing) from `(SellerID, BuyerID, InvoiceNumber, Currency, FaceValueMinorUnits, IssueDate)` and commits the `keccak256` hash to `InvoiceRegistry.sol`. Any duplicate submission across any corridor reverts with `DuplicateInvoiceHashDetected`.
2. **Buyer Acceptance EAS Co-Signing & ZK CBAM Proof (`/security`):**
   - The anchor buyer co-signs EAS Schema #2 (`BuyerAcceptance`), confirming goods receipt and unconditional obligation to pay at maturity.
   - Privado ID generates a Groth16 zero-knowledge proof attesting to Tier-1 status and EU CBAM ISO-14064-1 carbon thresholds while keeping SKU unit prices strictly private.
3. **ERC-3643 Minting & Atomic DvP Financing (`/financier`):**
   - Institutional LPs deposit `dUSDC` into `RWAVault4626.sol` (`Senior DROP` at `8.85% APY` or `Junior TIN` at `14.20% APY`) or fund individual ERC-3643 notes via `SettlementEscrow.fundInvoiceDvP()`.
   - The supplier receives discounted cash in under 24 hours; at maturity (30–90 days), `SettlementEscrow.settleOnChainStablecoin()` repays principal + yield and burns the ERC-3643 token.

---

## 5. Quickstart: Run Smart Contracts, Faucet & Web Application

```bash
# 1. Start local Base L2 node (Chain ID 8453)
anvil --chain-id 8453 --port 8545 --host 127.0.0.1

# 2. Run Foundry Smart Contract Test Suite
cd contracts && forge test -vv

# 3. Deploy all 7 contracts & seed .env wallets via Faucet
cd ../frontend && node scripts/deploy-and-faucet.mjs

# 4. Run Frontend Unit Tests & Start Next.js App
npm test
npm run dev
```

### Application Routes
- **`/`** — Interactive 3D RWA Architecture Landing Page & Live On-Chain Telemetry
- **`/supplier`** — Supplier Early-Pay Portal (Dynamic On-Chain E-Invoice Origination & ERC-3643 Minting)
- **`/financier`** — Financier Credit Desk (Live ERC-4626 Senior/Junior Vault Deposits, Atomic DvP & Maturity Settlement)
- **`/registry`** — Canonical Hash Anti-Double-Financing Simulator & Live `InvoiceRegistry.sol` Ledger
- **`/security`** — GLEIF vLEI + ONCHAINID Hierarchy, Live W3C VC 2.0 Issuance & `Slasher.sol` Verifier Bonds
