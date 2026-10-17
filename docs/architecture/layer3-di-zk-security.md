# Layer 3 Architecture: Decentralized Identity (DI) & ZK Privacy Shield

## Responsibilities
1. **Corporate Identity Hierarchy (`vleiOnchainId.ts` & `IdentityRegistry.sol`):**
   - Binds every corporate participant to a 20-character GLEIF Verifiable LEI (`vLEI`), an `ONCHAINID` (`ERC-734`/`735`) contract, and a `did:pkh:eip155:8453:${address}` identifier.
2. **Supply Chain Relationship Credentials (`w3cVerifiableCredentials.ts`):**
   - Anchor Buyers issue revocable W3C Verifiable Credentials 2.0 to vetted Tier-1 and Tier-2 suppliers.
3. **Privado ID Zero-Knowledge Selective Disclosure (`privadoZkShield.ts`):**
   - Keeps SKU unit prices, volume rebates, and margins strictly off-chain (`ZK-MASKED (PRIVATE)`).
   - Proves on-chain that the supplier holds a non-revoked Tier-1 VC from an investment-grade buyer (`>= BBB`) and meets EU CBAM embedded carbon thresholds (`ISO-14064`).
4. **Underwriter & Verifier Staking (`Slasher.sol`):**
   - Shifts economic collateral bonding away from cash-strapped SMEs to accredited KYB verifiers, ERP relayers, and Junior pool underwriters.
