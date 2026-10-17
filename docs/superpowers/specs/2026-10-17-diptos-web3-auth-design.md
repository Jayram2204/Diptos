# Diptos Industrial Repository Skeleton & Web3 Execution Layer Design Specification

- **Date:** 2026-10-17
- **Domain:** `diptos.xyz`
- **Target Chains:** Base Mainnet (`8453`), Base Sepolia Testnet (`84532`)
- **Status:** Validated Specification

---

## 1. Purpose & Scope

This specification defines the industrial monorepo skeleton for **Diptos (`diptos.xyz`)** and the implementation of its **Layer 2 Web3 Authentication & Smart Account Execution Layer**, **Layer 1 Canonical Invoice Fingerprinting**, **Layer 3 vLEI / ONCHAINID / Privado ID ZK Privacy Shield**, and **Daylight-First Institutional UI Workspaces** in Next.js App Router (`frontend/`).

### Core Objectives
1. **Strict 3-Layer Isolation:** Organize both `contracts/` (Foundry Solidity `^0.8.24`) and `frontend/src/layers/` into three explicitly separated architectural domains matching the PRD:
   - `layer1-rwa-core`: Canonical invoice hashing, e-invoice adapters (Peppol BIS 3.0, India GSTN IRN, Mexico SAT CFDI, US 3-Way Match), MonetaGo deduplication bridge, and ERC-3643 / ERC-4626 models.
   - `layer2-base-protocol`: Privy + ERC-4337 Smart Wallets + Wagmi/Viem on Base (`8453`) & Base Sepolia (`84532`), `DiptosWeb3Provider.tsx`, `useDiptosIdentity()`, EAS attestation builders, and atomic DvP settlement orchestration.
   - `layer3-di-security`: GLEIF vLEI + ONCHAINID (`ERC-734`/`735`) resolution, W3C Verifiable Credentials 2.0, Privado ID ZK selective disclosure (`[ZK-MASKED (PRIVATE)]`), and `Slasher.sol` underwriter bond tracking.
2. **Privy + ERC-4337 + Wagmi Execution (`DiptosWeb3Provider.tsx` & `useDiptosIdentity.ts`):**
   - Light theme (`#0A2540` accent), enabling `email`, `sms`, `passkey`, and `wallet` login.
   - Automatic provisioning of embedded wallets and ERC-4337 smart accounts for users without wallets (`createOnLogin: 'users-without-wallets'`).
   - `useDiptosIdentity()` returning `isAuthenticated`, `smartAccountAddress`, `eoaAddress`, `didPkh` (`did:pkh:eip155:8453:${address}`), `didBaseDisplay` (`did:pkh:base:0x...`), `login()`, `logout()`, and `executeSponsoredTx({ to, abi, functionName, args, value })`.
   - `executeSponsoredTx` uses Privy's `useSmartWallets()` client for gas-sponsored Base transactions and automatically falls back to Wagmi's `writeContractAsync` for external institutional wallets.
   - Seamless Sandbox Fallback when `NEXT_PUBLIC_PRIVY_APP_ID` is not set in `.env.local` so developers and reviewers can test both the ERC-4337 sponsored path and the Wagmi external wallet fallback out of the box.
3. **Institutional Daylight-First UI & Role-Separated Routing:**
   - Persistent `DiptosHeader.tsx` displaying the verified **vLEI & ONCHAINID** pill (`did:pkh:base:0x...`), `Gas: Sponsored (ERC-4337)` badge, and Role/Workspace Switcher across `/supplier`, `/financier`, `/registry`, and `/security`.
   - Zero AI/Web3 slop: `#F8FAFC` alabaster background, `#FFFFFF` cards, `1px solid #E2E8F0` borders, `#0F172A` slate-navy ink, `#0A2540` primary CTAs, `Inter` headings/body, and `IBM Plex Mono` (`tabular-nums`) for all financial metrics and hashes.

---

## 2. Repository & File Architecture

```text
/Users/noname/Documents/Diptos/
├── PRD.md
├── README.md
├── docs/
│   ├── architecture/
│   │   ├── layer1-rwa-engine.md
│   │   ├── layer2-base-protocol.md
│   │   └── layer3-di-zk-security.md
│   ├── legal/
│   │   └── mletr-ucc12-true-sale.md
│   └── superpowers/
│       ├── specs/2026-10-17-diptos-web3-auth-design.md
│       └── plans/2026-10-17-diptos-web3-auth.md
├── contracts/
│   ├── foundry.toml
│   └── src/
│       ├── layer1-rwa-core/
│       │   ├── InvoiceRegistry.sol
│       │   ├── RWAInvoice3643.sol
│       │   └── RWAVault4626.sol
│       ├── layer2-base-protocol/
│       │   ├── SettlementEscrow.sol
│       │   └── EASInvoiceSchemas.sol
│       └── layer3-di-security/
│           ├── IdentityRegistry.sol
│           └── Slasher.sol
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── .env.example
    └── src/
        ├── app/
        │   ├── layout.tsx
        │   ├── globals.css
        │   ├── page.tsx
        │   ├── supplier/page.tsx
        │   ├── financier/page.tsx
        │   ├── registry/page.tsx
        │   └── security/page.tsx
        ├── layers/
        │   ├── layer1-rwa-core/
        │   │   ├── canonical-hash/canonicalHash.ts
        │   │   ├── adapters/einvoiceAdapters.ts
        │   │   ├── monetago-bridge/monetagoClient.ts
        │   │   └── models/rwaInvoiceTypes.ts
        │   ├── layer2-base-protocol/
        │   │   ├── config/wagmiConfig.ts
        │   │   ├── config/contractAbis.ts
        │   │   ├── providers/DiptosWeb3Provider.tsx
        │   │   ├── hooks/useDiptosIdentity.ts
        │   │   ├── eas/easAttestations.ts
        │   │   └── settlement/settlementEngine.ts
        │   └── layer3-di-security/
        │       ├── identity/vleiOnchainId.ts
        │       ├── credentials/w3cVerifiableCredentials.ts
        │       ├── zk-privacy/privadoZkShield.ts
        │       └── slashing/underwriterSlasher.ts
        ├── providers/
        │   └── DiptosWeb3Provider.tsx        # Barrel re-export for Layer 2 provider
        ├── hooks/
        │   └── useDiptosIdentity.ts          # Barrel re-export for Layer 2 identity hook
        └── components/
            ├── layout/
            │   ├── DiptosHeader.tsx
            │   └── AppWorkspaceShell.tsx
            ├── supplier/
            │   ├── SupplierWorkspaceView.tsx
            │   └── InstantPayoutCard.tsx
            ├── financier/
            │   ├── FinancierWorkspaceView.tsx
            │   └── TrancheVaultCards.tsx
            ├── registry/
            │   └── RegistryWorkspaceView.tsx
            ├── security/
            │   └── SecurityWorkspaceView.tsx
            ├── drawers/
            │   └── ZkEasAuditDrawer.tsx
            └── ui/
                └── SemanticPill.tsx
```

---

## 3. Component & Hook Interfaces

### 3.1 `DiptosWeb3Provider.tsx`
- Configures `wagmiConfig` with `base` (`8453`) and `baseSepolia` (`84532`) from `viem/chains` using `@privy-io/wagmi`'s `createConfig`.
- Configures `<PrivyProvider>` with:
  - `appearance: { theme: 'light', accentColor: '#0A2540', showWalletLoginFirst: false }`
  - `loginMethods: ['email', 'sms', 'passkey', 'wallet']`
  - `embeddedWallets: { ethereum: { createOnLogin: 'users-without-wallets' } }`
  - `defaultChain: base`
  - `supportedChains: [base, baseSepolia]`
- Wraps children in `<SmartWalletsProvider>`, `<QueryClientProvider>`, and `<WagmiProvider>`.
- Provides workspace role state (`activeRole: 'supplier' | 'financier' | 'registry' | 'security'`) and deterministic institutional fallback mode when `NEXT_PUBLIC_PRIVY_APP_ID` is not set to a live Privy App ID.

### 3.2 `useDiptosIdentity()` Hook
```ts
export interface ExecuteSponsoredTxParams {
  to: Address;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  value?: bigint;
}

export interface ExecuteSponsoredTxResult {
  hash: Hash;
  executionMode: 'erc4337-sponsored' | 'wagmi-eoa';
  chainId: number;
  gasSponsored: boolean;
}

export interface DiptosIdentityState {
  isAuthenticated: boolean;
  isReady: boolean;
  smartAccountAddress: Address | null;
  eoaAddress: Address | null;
  activeAddress: Address | null;
  didPkh: string | null;          // "did:pkh:eip155:8453:0x..."
  didBaseDisplay: string | null;  // "did:pkh:base:0x71C...9A2"
  vleiRecord: {
    lei: string;
    legalName: string;
    jurisdiction: string;
    onchainIdAddress: Address;
    verified: boolean;
  };
  activeRole: DiptosWorkspaceRole;
  setActiveRole: (role: DiptosWorkspaceRole) => void;
  walletMode: 'smart-wallet' | 'external-eoa';
  setWalletMode: (mode: 'smart-wallet' | 'external-eoa') => void;
  login: () => void;
  logout: () => Promise<void>;
  executeSponsoredTx: (params: ExecuteSponsoredTxParams) => Promise<ExecuteSponsoredTxResult>;
}
```

### 3.3 `executeSponsoredTx` Execution Algorithm
1. Validate `params.to` and encode call data via `encodeFunctionData({ abi: params.abi as Abi, functionName: params.functionName, args: params.args ?? [] })`.
2. If Privy's `smartWalletClient` (from `useSmartWallets()`) is present and `walletMode === 'smart-wallet'`:
   - Invoke `const hash = await smartWalletClient.sendTransaction({ to: params.to, data, value: params.value ?? 0n })`.
   - Return `{ hash, executionMode: 'erc4337-sponsored', chainId: 8453, gasSponsored: true }`.
3. Otherwise, fall back to Wagmi's `writeContractAsync`:
   - Invoke `const hash = await writeContractAsync({ address: params.to, abi: params.abi as Abi, functionName: params.functionName, args: params.args ?? [], value: params.value })`.
   - Return `{ hash, executionMode: 'wagmi-eoa', chainId: 8453, gasSponsored: false }`.

### 3.4 Layer 1 Canonical Invoice Fingerprint (`canonicalHash.ts`)
- Normalizes `sellerTaxIdOrLei`, `buyerTaxIdOrLei`, and `invoiceNumber` by stripping all non-alphanumeric characters and converting to uppercase (`replace(/[^A-Za-z0-9]/g, '').toUpperCase()`).
- Enforces 3-letter uppercase ISO 4217 currency code (`USD`, `EUR`, `SGD`, `INR`), `YYYYMMDD` issue date, and integer minor units (`BigInt`).
- Computes `keccak256(encodePacked(['string', 'string', 'string', 'string', 'string', 'uint256'], [...]))` via `viem`.
- Guarantees identical canonical hashes even when an attacker adds spaces, hyphens, or lowercase characters to an invoice number or tax ID.

---

## 4. Verification & Testing Strategy
- **Unit & Integration Tests (Vitest + React Testing Library):**
  1. `canonicalHash.test.ts`: Verifies deterministic hashing and tamper invariance across whitespace/hyphen injection and fuzzy duplicate detection.
  2. `useDiptosIdentity.test.tsx`: Verifies `did:pkh:eip155:8453:${address}` formatting, `did:pkh:base:0x...` truncation, ERC-4337 `smartWalletClient.sendTransaction` primary execution path, and automatic fallback to Wagmi's `writeContractAsync` when smart wallet client is absent.
  3. `DiptosHeader.test.tsx`: Verifies rendering of the `vLEI & ONCHAINID` pill, `Gas: Sponsored (ERC-4337)` badge, and role switching between `Supplier Portal` and `Financier Credit Desk`.
- **Production Build Check:** `npm run build` in `frontend/` must succeed with zero TypeScript or Next.js App Router compilation errors.
