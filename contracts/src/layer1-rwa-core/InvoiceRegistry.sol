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
        string invoiceNumber;
        string corridor;
        string eInvoiceStandard;
        string governmentClearanceRef;
        string sellerName;
        string sellerLei;
        address supplier;
        string buyerName;
        string buyerLei;
        string buyerRating;
        address buyer;
        string currency;
        uint256 faceValueMinorUnits;
        uint256 discountRateAprBps;
        uint256 tenorDays;
        string issueDate;
        string dueDate;
        uint64 dueDateUnix;
        bytes32 easOriginationUid;
        bytes32 easAcceptanceUid;
        bytes32 zkProofHash;
        uint256 cbamEmissionsKgCo2e;
        string cbamStandard;
        string virtualIbanAccount;
        Status status;
    }

    struct RegisterInvoiceParams {
        bytes32 canonicalHash;
        string invoiceNumber;
        string corridor;
        string eInvoiceStandard;
        string governmentClearanceRef;
        string sellerName;
        string sellerLei;
        string buyerName;
        string buyerLei;
        string buyerRating;
        address buyer;
        string currency;
        uint256 faceValueMinorUnits;
        uint256 discountRateAprBps;
        uint256 tenorDays;
        string issueDate;
        string dueDate;
        uint64 dueDateUnix;
        bytes32 easOriginationUid;
        bytes32 easAcceptanceUid;
        bytes32 zkProofHash;
        uint256 cbamEmissionsKgCo2e;
        string cbamStandard;
        string virtualIbanAccount;
    }

    mapping(bytes32 => InvoiceRecord) public registry;
    bytes32[] public registeredHashes;

    error DuplicateInvoiceHash(bytes32 canonicalHash);
    error InvalidInvoiceState(bytes32 canonicalHash, Status currentStatus);

    event InvoiceRegistered(
        bytes32 indexed canonicalHash,
        bytes32 indexed easAcceptanceUid,
        address indexed supplier,
        uint256 faceValueMinorUnits
    );
    event InvoiceStateUpdated(bytes32 indexed canonicalHash, Status newStatus);

    function registerInvoiceFull(RegisterInvoiceParams calldata params) external {
        if (registry[params.canonicalHash].status != Status.NONE) {
            revert DuplicateInvoiceHash(params.canonicalHash);
        }

        registeredHashes.push(params.canonicalHash);
        registry[params.canonicalHash] = InvoiceRecord({
            canonicalHash: params.canonicalHash,
            invoiceNumber: params.invoiceNumber,
            corridor: params.corridor,
            eInvoiceStandard: params.eInvoiceStandard,
            governmentClearanceRef: params.governmentClearanceRef,
            sellerName: params.sellerName,
            sellerLei: params.sellerLei,
            supplier: msg.sender,
            buyerName: params.buyerName,
            buyerLei: params.buyerLei,
            buyerRating: params.buyerRating,
            buyer: params.buyer,
            currency: params.currency,
            faceValueMinorUnits: params.faceValueMinorUnits,
            discountRateAprBps: params.discountRateAprBps,
            tenorDays: params.tenorDays,
            issueDate: params.issueDate,
            dueDate: params.dueDate,
            dueDateUnix: params.dueDateUnix,
            easOriginationUid: params.easOriginationUid,
            easAcceptanceUid: params.easAcceptanceUid,
            zkProofHash: params.zkProofHash,
            cbamEmissionsKgCo2e: params.cbamEmissionsKgCo2e,
            cbamStandard: params.cbamStandard,
            virtualIbanAccount: params.virtualIbanAccount,
            status: Status.REGISTERED
        });

        emit InvoiceRegistered(
            params.canonicalHash,
            params.easAcceptanceUid,
            msg.sender,
            params.faceValueMinorUnits
        );
    }

    function updateStatus(bytes32 canonicalHash, Status newStatus) external {
        InvoiceRecord storage record = registry[canonicalHash];
        if (record.status == Status.NONE) {
            revert InvalidInvoiceState(canonicalHash, Status.NONE);
        }
        record.status = newStatus;
        emit InvoiceStateUpdated(canonicalHash, newStatus);
    }

    function getAllInvoices() external view returns (InvoiceRecord[] memory) {
        uint256 len = registeredHashes.length;
        InvoiceRecord[] memory list = new InvoiceRecord[](len);
        for (uint256 i = 0; i < len; i++) {
            list[i] = registry[registeredHashes[i]];
        }
        return list;
    }

    function getInvoiceCount() external view returns (uint256) {
        return registeredHashes.length;
    }
}
