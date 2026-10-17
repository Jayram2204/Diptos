# Diptos Industrial Repository Skeleton & Web3 Execution Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the industrial 3-layer monorepo skeleton (`contracts/`, `docs/`, `frontend/`) and implement the Next.js App Router Web3 authentication, ERC-4337 smart account execution layer (`DiptosWeb3Provider.tsx`, `useDiptosIdentity.ts`), and role-separated institutional workspaces (`Supplier Portal`, `Financier Credit Desk`, `Hash Registry`, `DI & ZK Security`).

**Architecture:** The repository separates Smart Contracts (`contracts/src/layer1-rwa-core`, `layer2-base-protocol`, `layer3-di-security`) and Frontend Domain Modules (`frontend/src/layers/layer1-rwa-core`, `layer2-base-protocol`, `layer3-di-security`). Layer 2 wraps `@privy-io/react-auth`, `@privy-io/react-auth/smart-wallets`, and `@privy-io/wagmi` on `base` (`8453`) and `baseSepolia` (`84532`) with a deterministic institutional sandbox fallback when `NEXT_PUBLIC_PRIVY_APP_ID` is not set.

**Tech Stack:** Next.js 15 (App Router, TypeScript), React 19, Tailwind CSS, `@privy-io/react-auth`, `@privy-io/react-auth/smart-wallets`, `@privy-io/wagmi`, `wagmi`, `viem`, `@tanstack/react-query`, Vitest, React Testing Library, Foundry (Solidity `^0.8.24`).

**Spec:** `docs/superpowers/specs/2026-10-17-diptos-web3-auth-design.md`

## Global Constraints

- Target Chains: `base` (`8453`) and `baseSepolia` (`84532`).
- Privy Light Theme Accent: `#0A2540` with login methods `['email', 'sms', 'passkey', 'wallet']` and `createOnLogin: 'users-without-wallets'`.
- Daylight-First Color Tokens: `#F8FAFC` alabaster background, `#FFFFFF` cards, `1px solid #E2E8F0` borders, `#0F172A` primary ink, `#0A2540` CTA navy, `#047857` emerald yield.
- Typography: `Inter` for headings/body, `IBM Plex Mono` with `font-variant-numeric: tabular-nums` for currency, APR, tenor, and hashes.
- DID Format: `did:pkh:eip155:8453:${address}` full DID and `did:pkh:base:0x...` compact header badge.

## Review Focus

1. Non-alphanumeric characters (spaces, hyphens, slashes, lowercase) in invoice numbers or tax IDs must produce the exact same `canonicalHash` as clean uppercase inputs.
2. Calling `executeSponsoredTx` when Privy `useSmartWallets().client` is available must encode call data with `encodeFunctionData` and dispatch via `smartWalletClient.sendTransaction` (`executionMode: 'erc4337-sponsored'`).
3. Calling `executeSponsoredTx` when `smartWalletClient` is null (external institutional wallet) must automatically fall back to Wagmi's `writeContractAsync` (`executionMode: 'wagmi-eoa'`).
4. Missing `NEXT_PUBLIC_PRIVY_APP_ID` in local development must not crash the Next.js app; `DiptosWeb3Provider` must render in institutional sandbox mode with full interactive testing of both `smart-wallet` and `external-eoa` modes.
5. Switching roles in `DiptosHeader` must cleanly update the active workspace and preserve the verified `vLEI & ONCHAINID` pill (`did:pkh:base:0x...`).

---

### Task 1: Root Monorepo Documentation & Foundry 3-Layer Smart Contract Skeleton

**Files:**
- Create: `README.md`
- Create: `docs/architecture/layer1-rwa-engine.md`
- Create: `docs/architecture/layer2-base-protocol.md`
- Create: `docs/architecture/layer3-di-zk-security.md`
- Create: `docs/legal/mletr-ucc12-true-sale.md`
- Create: `contracts/foundry.toml`
- Create: `contracts/src/layer1-rwa-core/InvoiceRegistry.sol`
- Create: `contracts/src/layer1-rwa-core/RWAInvoice3643.sol`
- Create: `contracts/src/layer1-rwa-core/RWAVault4626.sol`
- Create: `contracts/src/layer2-base-protocol/SettlementEscrow.sol`
- Create: `contracts/src/layer2-base-protocol/EASInvoiceSchemas.sol`
- Create: `contracts/src/layer3-di-security/IdentityRegistry.sol`
- Create: `contracts/src/layer3-di-security/Slasher.sol`

**Interfaces:**
- Produces: Complete 3-layer smart contract interfaces (`InvoiceRegistry`, `RWAInvoice3643`, `RWAVault4626`, `SettlementEscrow`, `EASInvoiceSchemas`, `IdentityRegistry`, `Slasher`) matching Section 7 of `PRD.md`.

- [ ] **Step 1: Create root `README.md`, architecture/legal docs, and Foundry 3-layer contracts**
- [ ] **Step 2: Verify directory tree matches the 3-layer specification**
- [ ] **Step 3: Commit smart contract and architecture skeleton**

---

### Task 2: Frontend Next.js Scaffold & Layer 1 RWA Core Module (`layer1-rwa-core`)

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/layers/layer1-rwa-core/models/rwaInvoiceTypes.ts`
- Create: `frontend/src/layers/layer1-rwa-core/canonical-hash/canonicalHash.ts`
- Create: `frontend/src/layers/layer1-rwa-core/adapters/einvoiceAdapters.ts`
- Create: `frontend/src/layers/layer1-rwa-core/monetago-bridge/monetagoClient.ts`
- Test: `frontend/src/layers/layer1-rwa-core/__tests__/canonicalHash.test.ts`

**Interfaces:**
- Produces:
  - `computeCanonicalInvoiceHash(input: CanonicalInvoiceInput): Hex`
  - `normalizeAlphaNumUpper(value: string): string`
  - `checkInvoiceDeduplication(input: CanonicalInvoiceInput, existingHashes: readonly Hex[]): DeduplicationResult`
  - `INITIAL_DIPTOS_INVOICES: RWAInvoiceRecord[]`
  - `DIPTOS_TRANCHE_VAULTS: TrancheVaultPool[]`

- [ ] **Step 1: Initialize `frontend/` configuration files and install dependencies**
- [ ] **Step 2: Write failing unit tests in `frontend/src/layers/layer1-rwa-core/__tests__/canonicalHash.test.ts` testing canonical hash normalization and whitespace/hyphen tamper invariance**
- [ ] **Step 3: Implement `rwaInvoiceTypes.ts`, `canonicalHash.ts`, `einvoiceAdapters.ts`, and `monetagoClient.ts`**
- [ ] **Step 4: Run `npm test` in `frontend/` and verify Layer 1 tests pass**
- [ ] **Step 5: Commit Layer 1 RWA Core module**

---

### Task 3: Layer 3 Decentralized Identity & ZK Privacy Module (`layer3-di-security`)

**Files:**
- Create: `frontend/src/layers/layer3-di-security/identity/vleiOnchainId.ts`
- Create: `frontend/src/layers/layer3-di-security/credentials/w3cVerifiableCredentials.ts`
- Create: `frontend/src/layers/layer3-di-security/zk-privacy/privadoZkShield.ts`
- Create: `frontend/src/layers/layer3-di-security/slashing/underwriterSlasher.ts`
- Test: `frontend/src/layers/layer3-di-security/__tests__/layer3Security.test.ts`

**Interfaces:**
- Produces:
  - `formatDidPkh(address: Address, chainId?: number): string` (`did:pkh:eip155:8453:${address}`)
  - `formatDidBaseBadge(address: Address): string` (`did:pkh:base:0x71C...9A2`)
  - `resolveCorporateVleiProfile(address: Address): CorporateVleiProfile`
  - `generateZkSelectiveDisclosureView(invoice: RWAInvoiceRecord): ZkAuditDisclosure`

- [ ] **Step 1: Write failing unit tests in `frontend/src/layers/layer3-di-security/__tests__/layer3Security.test.ts` for DID formatting and `[ZK-MASKED (PRIVATE)]` SKU field redaction**
- [ ] **Step 2: Implement `vleiOnchainId.ts`, `w3cVerifiableCredentials.ts`, `privadoZkShield.ts`, and `underwriterSlasher.ts`**
- [ ] **Step 3: Run `npm test` in `frontend/` and verify Layer 3 tests pass**
- [ ] **Step 4: Commit Layer 3 DI & ZK Security module**

---

### Task 4: Layer 2 Base Protocol & Privy ERC-4337 Execution Module (`layer2-base-protocol`)

**Files:**
- Create: `frontend/src/layers/layer2-base-protocol/config/wagmiConfig.ts`
- Create: `frontend/src/layers/layer2-base-protocol/config/contractAbis.ts`
- Create: `frontend/src/layers/layer2-base-protocol/eas/easAttestations.ts`
- Create: `frontend/src/layers/layer2-base-protocol/settlement/settlementEngine.ts`
- Create: `frontend/src/layers/layer2-base-protocol/providers/DiptosWeb3Provider.tsx`
- Create: `frontend/src/layers/layer2-base-protocol/hooks/useDiptosIdentity.ts`
- Create: `frontend/src/providers/DiptosWeb3Provider.tsx`
- Create: `frontend/src/hooks/useDiptosIdentity.ts`
- Test: `frontend/src/layers/layer2-base-protocol/__tests__/useDiptosIdentity.test.tsx`

**Interfaces:**
- Consumes: `formatDidPkh`, `formatDidBaseBadge`, `resolveCorporateVleiProfile` from Layer 3.
- Produces:
  - `DiptosWeb3Provider` (React Provider configuring Privy `#0A2540` light theme, `email`/`sms`/`passkey`/`wallet`, `users-without-wallets`, `SmartWalletsProvider`, `WagmiProvider` on `base` `8453` & `baseSepolia` `84532`, plus institutional sandbox fallback)
  - `useDiptosIdentity()` returning `isAuthenticated`, `smartAccountAddress`, `eoaAddress`, `didPkh`, `didBaseDisplay`, `login()`, `logout()`, and `executeSponsoredTx({ to, abi, functionName, args, value })`
  - `executeTxWithSmartWalletOrWagmi()` core execution dispatcher

- [ ] **Step 1: Write failing unit tests in `frontend/src/layers/layer2-base-protocol/__tests__/useDiptosIdentity.test.tsx` verifying: (a) `didPkh` is `did:pkh:eip155:8453:${address}`, (b) `executeSponsoredTx` uses Privy `smartWalletClient.sendTransaction` when smart wallet is available, and (c) `executeSponsoredTx` falls back to Wagmi `writeContractAsync` when smart wallet is unavailable**
- [ ] **Step 2: Implement `wagmiConfig.ts`, `contractAbis.ts`, `easAttestations.ts`, `settlementEngine.ts`, `DiptosWeb3Provider.tsx`, and `useDiptosIdentity.ts`**
- [ ] **Step 3: Run `npm test` in `frontend/` and verify Layer 2 tests pass**
- [ ] **Step 4: Commit Layer 2 Base Protocol & Web3 Auth module**

---

### Task 5: Institutional Header, Role Switcher, Workspaces & App Router Pages

**Files:**
- Create: `frontend/src/components/ui/SemanticPill.tsx`
- Create: `frontend/src/components/layout/DiptosHeader.tsx`
- Create: `frontend/src/components/drawers/ZkEasAuditDrawer.tsx`
- Create: `frontend/src/components/supplier/SupplierWorkspaceView.tsx`
- Create: `frontend/src/components/financier/FinancierWorkspaceView.tsx`
- Create: `frontend/src/components/registry/RegistryWorkspaceView.tsx`
- Create: `frontend/src/components/security/SecurityWorkspaceView.tsx`
- Create: `frontend/src/components/layout/AppWorkspaceShell.tsx`
- Create: `frontend/src/app/globals.css`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/app/supplier/page.tsx`
- Create: `frontend/src/app/financier/page.tsx`
- Create: `frontend/src/app/registry/page.tsx`
- Create: `frontend/src/app/security/page.tsx`
- Test: `frontend/src/components/layout/__tests__/DiptosHeader.test.tsx`

**Interfaces:**
- Consumes: `DiptosWeb3Provider`, `useDiptosIdentity`, Layer 1, Layer 2, and Layer 3 modules.
- Produces: Full Daylight-First UI (`#F8FAFC` / `#FFFFFF` / `#0F172A` / `#0A2540`) with Header `did:pkh:base:0x...` pill, role switcher, Supplier Early Payment portal, Financier Credit Desk, Hash Registry simulator, DI/ZK Security console, and slide-over ZK/EAS Audit Drawer.

- [ ] **Step 1: Write failing component tests in `frontend/src/components/layout/__tests__/DiptosHeader.test.tsx` verifying the vLEI & ONCHAINID pill (`did:pkh:base:0x...`), gas sponsorship indicator, and role switching between Supplier Portal and Financier Credit Desk**
- [ ] **Step 2: Implement UI components, workspaces, audit drawer, and Next.js App Router pages**
- [ ] **Step 3: Run `npm test` and `npm run build` in `frontend/` to verify all tests and Next.js production build succeed**
- [ ] **Step 4: Commit UI components and App Router pages**
