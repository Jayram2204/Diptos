// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdentityRegistry {
    function isVerified(address _user) external view returns (bool);
}

/// @title RWAInvoice3643 (Layer 1 — RWA Core Engine)
/// @notice Permissioned ERC-3643 (T-REX) whole-invoice token aligned with UNCITRAL MLETR & US UCC Article 12.
contract RWAInvoice3643 {
    struct InvoiceMetadata {
        bytes32 canonicalHash;
        uint256 faceValue;
        bytes3 currency;
        uint64 dueDate;
        string buyerDID;
        bytes32 zkProofHash;
        bool frozen;
        bool settled;
    }

    IIdentityRegistry public immutable identityRegistry;
    mapping(bytes32 => InvoiceMetadata) public invoices;
    mapping(bytes32 => address) public holderOf;

    error UnverifiedParticipant(address participant);
    error InvoiceFrozenOrSettled(bytes32 canonicalHash);

    event VerifiedInvoiceMinted(
        bytes32 indexed canonicalHash,
        address indexed supplier,
        uint256 faceValue,
        uint64 dueDate
    );
    event InvoiceTransferred(bytes32 indexed canonicalHash, address indexed from, address indexed to);
    event InvoiceBurnedOnSettlement(bytes32 indexed canonicalHash, address indexed financier);
    event InvoiceFrozen(bytes32 indexed canonicalHash);

    constructor(address _identityRegistry) {
        identityRegistry = IIdentityRegistry(_identityRegistry);
    }

    function mintVerifiedInvoice(
        bytes32 canonicalHash,
        uint256 faceValue,
        bytes3 currency,
        uint64 dueDate,
        string calldata buyerDID,
        bytes32 zkProofHash
    ) external {
        if (!identityRegistry.isVerified(msg.sender)) {
            revert UnverifiedParticipant(msg.sender);
        }
        invoices[canonicalHash] = InvoiceMetadata({
            canonicalHash: canonicalHash,
            faceValue: faceValue,
            currency: currency,
            dueDate: dueDate,
            buyerDID: buyerDID,
            zkProofHash: zkProofHash,
            frozen: false,
            settled: false
        });
        holderOf[canonicalHash] = msg.sender;
        emit VerifiedInvoiceMinted(canonicalHash, msg.sender, faceValue, dueDate);
    }

    function transfer(bytes32 canonicalHash, address to) external {
        if (!identityRegistry.isVerified(to)) {
            revert UnverifiedParticipant(to);
        }
        InvoiceMetadata storage meta = invoices[canonicalHash];
        if (meta.frozen || meta.settled) {
            revert InvoiceFrozenOrSettled(canonicalHash);
        }
        address previous = holderOf[canonicalHash];
        holderOf[canonicalHash] = to;
        emit InvoiceTransferred(canonicalHash, previous, to);
    }

    function burnOnSettlement(bytes32 canonicalHash) external {
        InvoiceMetadata storage meta = invoices[canonicalHash];
        meta.settled = true;
        address financier = holderOf[canonicalHash];
        delete holderOf[canonicalHash];
        emit InvoiceBurnedOnSettlement(canonicalHash, financier);
    }

    function freezeInvoice(bytes32 canonicalHash) external {
        invoices[canonicalHash].frozen = true;
        emit InvoiceFrozen(canonicalHash);
    }
}
