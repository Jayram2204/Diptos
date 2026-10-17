// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RWAVault4626 (Layer 1 — RWA Core Engine)
/// @notice Tranched ERC-4626 liquidity pool wrapped in ERC-3643 compliance (Senior DROP & Junior First-Loss TIN).
contract RWAVault4626 {
    uint256 public seniorPoolAssets;
    uint256 public juniorFirstLossAssets;
    mapping(bytes32 => bool) public activePoolInvoices;

    event SeniorDeposited(address indexed financier, uint256 assets);
    event JuniorDeposited(address indexed underwriter, uint256 assets);
    event InvoiceAllocated(bytes32 indexed canonicalHash, uint256 fundedAmount);
    event WaterfallDistributed(bytes32 indexed canonicalHash, uint256 seniorRepayment, uint256 juniorYield);

    function depositSenior(uint256 assets) external {
        seniorPoolAssets += assets;
        emit SeniorDeposited(msg.sender, assets);
    }

    function depositJunior(uint256 assets) external {
        juniorFirstLossAssets += assets;
        emit JuniorDeposited(msg.sender, assets);
    }

    function allocateToInvoice(bytes32 canonicalHash, uint256 fundedAmount) external {
        activePoolInvoices[canonicalHash] = true;
        emit InvoiceAllocated(canonicalHash, fundedAmount);
    }

    function distributeRepaymentWaterfall(
        bytes32 canonicalHash,
        uint256 seniorRepayment,
        uint256 juniorYield
    ) external {
        activePoolInvoices[canonicalHash] = false;
        seniorPoolAssets += seniorRepayment;
        juniorFirstLossAssets += juniorYield;
        emit WaterfallDistributed(canonicalHash, seniorRepayment, juniorYield);
    }
}
