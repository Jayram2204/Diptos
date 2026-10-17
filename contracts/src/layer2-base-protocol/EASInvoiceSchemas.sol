// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EASInvoiceSchemas (Layer 2 — Base Protocol Layer)
/// @notice Standardized Ethereum Attestation Service (EAS) schemas on Base L2 (0x4200000000000000000000000000000000000021).
library EASInvoiceSchemas {
    // Schema #1: Supplier Origination Attestation
    bytes32 public constant SCHEMA_SUPPLIER_ORIGINATION =
        keccak256("bytes32 canonicalHash,uint64 maturityDate,uint256 faceValueMinorUnits,bytes32 zkProofRef");

    // Schema #2: Buyer Acceptance / Confirming Attestation
    bytes32 public constant SCHEMA_BUYER_ACCEPTANCE =
        keccak256("bytes32 canonicalHash,string buyerVleiDid,uint256 confirmedPayableMinorUnits,uint64 dueDate,address settlementEscrow");

    // Schema #3: Maturity Settlement & Discharge Attestation
    bytes32 public constant SCHEMA_SETTLEMENT_DISCHARGE =
        keccak256("bytes32 canonicalHash,uint256 settledAmountMinorUnits,bytes32 paymentRailRef,uint64 settledTimestamp");
}
