# Layer 2 Architecture: Ethereum & Base Protocol Engine

## Responsibilities
1. **Base L2 Execution (`wagmiConfig.ts`):**
   - Operates on Base Mainnet (`8453`) and Base Sepolia (`84532`) for deterministic sub-cent (<$0.01) execution.
2. **ERC-4337 Account Abstraction & Paymaster (`DiptosWeb3Provider.tsx` & `useDiptosIdentity.ts`):**
   - Uses `@privy-io/react-auth`, `@privy-io/react-auth/smart-wallets`, and `@privy-io/wagmi`.
   - Provisions embedded wallets + ERC-4337 smart accounts automatically (`createOnLogin: 'users-without-wallets'`).
   - `executeSponsoredTx({ to, abi, functionName, args })` dispatches gas-sponsored UserOperations via Privy's `useSmartWallets()` client and falls back to Wagmi's `writeContractAsync` for external institutional custody wallets.
3. **Ethereum Attestation Service (`easAttestations.ts` & `EASInvoiceSchemas.sol`):**
   - Schema #1: Supplier Origination Attestation.
   - Schema #2: Buyer Acceptance / Reverse Factoring Confirmation Attestation.
   - Schema #3: Maturity Settlement & Discharge Attestation.
4. **Hybrid Atomic DvP Settlement (`SettlementEscrow.sol`):**
   - On-chain USDC/EURC escrow + regulated Virtual IBAN fiat webhook oracle.
