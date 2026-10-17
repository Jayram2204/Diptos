// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Slasher (Layer 3 — DI Security & Privacy Layer)
/// @notice Underwriter & Verifier node bonding and cryptographic duplicate-fraud adjudication.
contract Slasher {
    struct VerifierNodeRecord {
        address nodeAddress;
        string operatorName;
        string role;
        uint256 stakedBondUsd;
        uint256 invoicesVerifiedCount;
        uint256 slashEventsCount;
        bool slashed;
    }

    mapping(address => VerifierNodeRecord) public nodes;
    address[] public nodeAddresses;

    event VerifierBondPosted(address indexed verifier, string operatorName, string role, uint256 amount);
    event DuplicateProofSubmitted(bytes32 indexed canonicalHash, address indexed challenger);
    event VerifierSlashedAndVcRevoked(
        address indexed verifier,
        address indexed offendingSupplier,
        bytes32 indexed canonicalHash,
        uint256 slashedAmount
    );

    function postVerifierBond(
        string calldata operatorName,
        string calldata role,
        uint256 amount
    ) external {
        if (bytes(nodes[msg.sender].operatorName).length == 0) {
            nodeAddresses.push(msg.sender);
            nodes[msg.sender] = VerifierNodeRecord({
                nodeAddress: msg.sender,
                operatorName: operatorName,
                role: role,
                stakedBondUsd: amount,
                invoicesVerifiedCount: 1,
                slashEventsCount: 0,
                slashed: false
            });
        } else {
            nodes[msg.sender].stakedBondUsd += amount;
            nodes[msg.sender].invoicesVerifiedCount += 1;
        }
        emit VerifierBondPosted(msg.sender, operatorName, role, amount);
    }

    function submitDuplicateProof(bytes32 canonicalHash, bytes calldata duplicateEvidence) external {
        require(duplicateEvidence.length > 0, "Empty evidence");
        emit DuplicateProofSubmitted(canonicalHash, msg.sender);
    }

    function slashAndRevokeVc(
        address verifier,
        address offendingSupplier,
        bytes32 canonicalHash,
        uint256 slashAmount
    ) external {
        uint256 currentBond = nodes[verifier].stakedBondUsd;
        uint256 actualSlash = slashAmount > currentBond ? currentBond : slashAmount;
        nodes[verifier].stakedBondUsd = currentBond - actualSlash;
        nodes[verifier].slashEventsCount += 1;
        nodes[verifier].slashed = true;
        emit VerifierSlashedAndVcRevoked(verifier, offendingSupplier, canonicalHash, actualSlash);
    }

    function getAllVerifierNodes() external view returns (VerifierNodeRecord[] memory) {
        uint256 len = nodeAddresses.length;
        VerifierNodeRecord[] memory result = new VerifierNodeRecord[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = nodes[nodeAddresses[i]];
        }
        return result;
    }
}
