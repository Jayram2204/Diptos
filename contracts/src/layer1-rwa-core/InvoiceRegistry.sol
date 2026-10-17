// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title InvoiceRegistry (Layer 1 — RWA Core Engine)
/// @notice Singleton anti-double-financing state machine enforcing canonical invoice fingerprints on Base L2.
contract InvoiceRegistry {
    enum Status {
        NONE,
        REGISTERED,
        FACTORED,
        SETTLED,
        DEFAULTED,
        DISPUTED
    }

    struct InvoiceRecord {
        bytes32 canonicalHash;
        bytes32 easAcceptanceUID;
        bytes32 zkProofHash;
        address supplier;
        address buyer;
        uint256 faceValueMinorUnits;
        uint64 dueDate;
        Status status;
    }

    mapping(bytes32 => InvoiceRecord) public registry;

    error DuplicateInvoiceHash(bytes32 canonicalHash);
    error InvalidInvoiceState(bytes32 canonicalHash, Status currentStatus);

    event InvoiceRegistered(
        bytes32 indexed canonicalHash,
        bytes32 indexed easAcceptanceUID,
        address indexed supplier,
        uint256 faceValueMinorUnits
    );
    event InvoiceStateUpdated(bytes32 indexed canonicalHash, Status newStatus);

    function registerInvoice(
        bytes32 canonicalHash,
        bytes32 easAcceptanceUID,
        bytes32 zkProofHash,
        address buyer,
        uint256 faceValueMinorUnits,
        uint64 dueDate
    ) external {
        if (registry[canonicalHash].status != Status.NONE) {
            revert DuplicateInvoiceHash(canonicalHash);
        }

        registry[canonicalHash] = InvoiceRecord({
            canonicalHash: canonicalHash,
            easAcceptanceUID: easAcceptanceUID,
            zkProofHash: zkProofHash,
            supplier: msg.sender,
            buyer: buyer,
            faceValueMinorUnits: faceValueMinorUnits,
            dueDate: dueDate,
            status: Status.REGISTERED
        });

        emit InvoiceRegistered(canonicalHash, easAcceptanceUID, msg.sender, faceValueMinorUnits);
    }

    function updateStatus(bytes32 canonicalHash, Status newStatus) external {
        InvoiceRecord storage record = registry[canonicalHash];
        if (record.status == Status.NONE) {
            revert InvalidInvoiceState(canonicalHash, Status.NONE);
        }
        record.status = newStatus;
        emit InvoiceStateUpdated(canonicalHash, newStatus);
    }
}
