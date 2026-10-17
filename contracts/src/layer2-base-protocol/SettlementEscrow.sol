// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IInvoiceRegistryEscrow {
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

/// @title SettlementEscrow (Layer 2 — Base Protocol Layer)
/// @notice Atomic Delivery-vs-Payment (DvP) & Virtual IBAN Oracle Settlement Controller.
contract SettlementEscrow {
    struct EscrowAccount {
        bytes32 canonicalHash;
        address supplier;
        address financier;
        uint256 discountedPurchaseAmount;
        uint256 maturityFaceValue;
        bool funded;
        bool settled;
    }

    IInvoiceRegistryEscrow public immutable INVOICE_REGISTRY;
    mapping(bytes32 => EscrowAccount) public escrows;

    event InvoiceFundedDvP(
        bytes32 indexed canonicalHash,
        address indexed financier,
        address indexed supplier,
        uint256 discountedPurchaseAmount
    );
    event StablecoinSettled(bytes32 indexed canonicalHash, uint256 maturityFaceValue);
    event FiatVirtualIbanSettled(bytes32 indexed canonicalHash, bytes oracleSig);

    constructor(address _invoiceRegistry) {
        INVOICE_REGISTRY = IInvoiceRegistryEscrow(_invoiceRegistry);
    }

    function fundInvoiceDvP(
        bytes32 canonicalHash,
        address supplier,
        uint256 discountedPurchaseAmount,
        uint256 maturityFaceValue
    ) external {
        escrows[canonicalHash] = EscrowAccount({
            canonicalHash: canonicalHash,
            supplier: supplier,
            financier: msg.sender,
            discountedPurchaseAmount: discountedPurchaseAmount,
            maturityFaceValue: maturityFaceValue,
            funded: true,
            settled: false
        });
        INVOICE_REGISTRY.updateStatus(canonicalHash, IInvoiceRegistryEscrow.Status.FACTORED);
        emit InvoiceFundedDvP(canonicalHash, msg.sender, supplier, discountedPurchaseAmount);
    }

    function settleOnChainStablecoin(bytes32 canonicalHash, uint256 repaymentAmount) external {
        EscrowAccount storage escrow = escrows[canonicalHash];
        escrow.settled = true;
        INVOICE_REGISTRY.updateStatus(canonicalHash, IInvoiceRegistryEscrow.Status.SETTLED);
        emit StablecoinSettled(canonicalHash, repaymentAmount);
    }

    function confirmFiatVirtualIbanSettlement(bytes32 canonicalHash, bytes calldata oracleSig) external {
        EscrowAccount storage escrow = escrows[canonicalHash];
        escrow.settled = true;
        INVOICE_REGISTRY.updateStatus(canonicalHash, IInvoiceRegistryEscrow.Status.SETTLED);
        emit FiatVirtualIbanSettled(canonicalHash, oracleSig);
    }
}
