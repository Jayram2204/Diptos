// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Slasher (Layer 3 — DI Security & Privacy Layer)
/// @notice Underwriter & Verifier node bonding and cryptographic duplicate-fraud adjudication.
contract Slasher {
    mapping(address => uint256) public verifierBonds;

    event VerifierBondPosted(address indexed verifier, uint256 amount);
    event DuplicateProofSubmitted(bytes32 indexed canonicalHash, address indexed challenger);
    event VerifierSlashedAndVCRevoked(
        address indexed verifier,
        address indexed offendingSupplier,
        bytes32 indexed canonicalHash,
        uint256 slashedAmount
    );

    function postVerifierBond(uint256 amount) external {
        verifierBonds[msg.sender] += amount;
        emit VerifierBondPosted(msg.sender, amount);
    }

    function submitDuplicateProof(bytes32 canonicalHash, bytes calldata duplicateEvidence) external {
        require(duplicateEvidence.length > 0, "Empty evidence");
        emit DuplicateProofSubmitted(canonicalHash, msg.sender);
    }

    function slashAndRevokeVC(
        address verifier,
        address offendingSupplier,
        bytes32 canonicalHash,
        uint256 slashAmount
    ) external {
        uint256 currentBond = verifierBonds[verifier];
        uint256 actualSlash = slashAmount > currentBond ? currentBond : slashAmount;
        verifierBonds[verifier] = currentBond - actualSlash;
        emit VerifierSlashedAndVCRevoked(verifier, offendingSupplier, canonicalHash, actualSlash);
    }
}
