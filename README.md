# Diptos (`diptos.xyz`) — Global RWA Trade Receivables Protocol

Permissioned, short-duration (30–90 day), self-liquidating Real-World Asset (RWA) trade receivables protocol built on **Base L2 (`8453` / `84532`)** and secured by a **Zero-Knowledge Decentralized Identity (DI)** compliance layer.

---

## Industrial 3-Layer Repository Skeleton

```text
diptos/
├── PRD.md                                      # Global RWA Trade Receivables PRD v2.0
├── docs/
│   ├── architecture/                           # Deep-dive specs for Layers 1, 2, and 3
│   ├── legal/                                  # UNCITRAL MLETR & US UCC Article 12 True Sale specs
│   └── superpowers/                            # Design specifications & TDD implementation plans
├── contracts/                                  # Foundry Solidity ^0.8.24 Smart Contracts (3 Layers)
│   └── src/
│       ├── layer1-rwa-core/                    # InvoiceRegistry.sol, RWAInvoice3643.sol, RWAVault4626.sol
│       ├── layer2-base-protocol/               # SettlementEscrow.sol, EASInvoiceSchemas.sol
│       └── layer3-di-security/                 # IdentityRegistry.sol, Slasher.sol
└── frontend/                                   # Next.js App Router Application (diptos.xyz)
    └── src/
        ├── app/                                # Role-separated routes: /supplier, /financier, /registry, /security
        ├── layers/
        │   ├── layer1-rwa-core/                # Canonical Invoice Fingerprint, Peppol/GSTN/CFDI, MonetaGo Bridge
        │   ├── layer2-base-protocol/           # DiptosWeb3Provider, useDiptosIdentity, ERC-4337 Paymaster, EAS, DvP
        │   └── layer3-di-security/             # GLEIF vLEI, ONCHAINID, W3C VC 2.0, Privado ID ZK Shield, Slasher
        └── components/                         # Daylight-First Institutional UI (#F8FAFC / #0F172A / #0A2540)
```

## Quickstart (`frontend/`)

```bash
cd frontend
npm install
npm run dev
```

To run the automated TDD test suite:

```bash
cd frontend
npm test
```
