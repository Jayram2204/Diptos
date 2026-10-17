// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IIdentityRegistry {
    function isVerified(address _user) external view returns (bool);
}

interface IInvoiceRegistryStatus {
    enum Status {
        NONE,
        REGISTERED,
        FACTORED,
        SETTLED,
        DEFAULTED,
        DISPUTED
    }
    function updateStatus(bytes32 canonicalHash, Status newStatus) external;
}

/// @title RWAInvoice3643 (Layer 1 — RWA Core Engine)
/// @notice Permissioned ERC-3643 (T-REX) whole-invoice token aligned with UNCITRAL MLETR & US UCC Article 12.
contract RWAInvoice3643 {
    struct InvoiceMetadata {
        bytes32 canonicalHash;
        uint256 faceValue;
        bytes3 currency;
        uint64 dueDate;
        string buyerDid;
        bytes32 zkProofHash;
        bool frozen;
        bool settled;
    }

    IIdentityRegistry public immutable IDENTITY_REGISTRY;
    IInvoiceRegistryStatus public immutable INVOICE_REGISTRY;
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

    constructor(address _identityRegistry, address _invoiceRegistry) {
        IDENTITY_REGISTRY = IIdentityRegistry(_identityRegistry);
        INVOICE_REGISTRY = IInvoiceRegistryStatus(_invoiceRegistry);
    }

    function mintVerifiedInvoice(
        bytes32 canonicalHash,
        uint256 faceValue,
        bytes3 currency,
        uint64 dueDate,
        string calldata buyerDid,
        bytes32 zkProofHash
    ) external {
        if (!IDENTITY_REGISTRY.isVerified(msg.sender)) {
            revert UnverifiedParticipant(msg.sender);
        }
        invoices[canonicalHash] = InvoiceMetadata({
            canonicalHash: canonicalHash,
            faceValue: faceValue,
            currency: currency,
            dueDate: dueDate,
            buyerDid: buyerDid,
            zkProofHash: zkProofHash,
            frozen: false,
            settled: false
        });
        holderOf[canonicalHash] = msg.sender;
        INVOICE_REGISTRY.updateStatus(canonicalHash, IInvoiceRegistryStatus.Status.FACTORED);
        emit VerifiedInvoiceMinted(canonicalHash, msg.sender, faceValue, dueDate);
    }

    function transfer(bytes32 canonicalHash, address to) external {
        if (!IDENTITY_REGISTRY.isVerified(to)) {
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
        INVOICE_REGISTRY.updateStatus(canonicalHash, IInvoiceRegistryStatus.Status.SETTLED);
        emit InvoiceBurnedOnSettlement(canonicalHash, financier);
    }

    function freezeInvoice(bytes32 canonicalHash) external {
        invoices[canonicalHash].frozen = true;
        INVOICE_REGISTRY.updateStatus(canonicalHash, IInvoiceRegistryStatus.Status.DISPUTED);
        emit InvoiceFrozen(canonicalHash);
    }
}
