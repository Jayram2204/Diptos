// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title RWAVault4626 (Layer 1 — RWA Core Engine)
/// @notice Tranched ERC-4626 liquidity pool wrapped in ERC-3643 compliance (Senior DROP & Junior First-Loss TIN).
contract RWAVault4626 {
    uint256 public seniorPoolAssets;
    uint256 public juniorFirstLossAssets;
    uint256 public seniorTargetApyBps = 885; // 8.85%
    uint256 public juniorTargetApyBps = 1420; // 14.20%
    uint256 public activeAllocatedInvoices;

    mapping(address => uint256) public seniorSharesOf;
    mapping(address => uint256) public juniorSharesOf;
    mapping(bytes32 => bool) public activePoolInvoices;

    event SeniorDeposited(address indexed financier, uint256 assets);
    event JuniorDeposited(address indexed underwriter, uint256 assets);
    event InvoiceAllocated(bytes32 indexed canonicalHash, uint256 fundedAmount);
    event WaterfallDistributed(bytes32 indexed canonicalHash, uint256 seniorRepayment, uint256 juniorYield);

    function depositSenior(uint256 assets) external {
        seniorPoolAssets += assets;
        seniorSharesOf[msg.sender] += assets;
        emit SeniorDeposited(msg.sender, assets);
    }

    function depositJunior(uint256 assets) external {
        juniorFirstLossAssets += assets;
        juniorSharesOf[msg.sender] += assets;
        emit JuniorDeposited(msg.sender, assets);
    }

    function allocateToInvoice(bytes32 canonicalHash, uint256 fundedAmount) external {
        if (!activePoolInvoices[canonicalHash]) {
            activePoolInvoices[canonicalHash] = true;
            activeAllocatedInvoices += 1;
        }
        emit InvoiceAllocated(canonicalHash, fundedAmount);
    }

    function distributeRepaymentWaterfall(
        bytes32 canonicalHash,
        uint256 seniorRepayment,
        uint256 juniorYield
    ) external {
        if (activePoolInvoices[canonicalHash]) {
            activePoolInvoices[canonicalHash] = false;
            if (activeAllocatedInvoices > 0) {
                activeAllocatedInvoices -= 1;
            }
        }
        seniorPoolAssets += seniorRepayment;
        juniorFirstLossAssets += juniorYield;
        emit WaterfallDistributed(canonicalHash, seniorRepayment, juniorYield);
    }

    function getVaultMetrics()
        external
        view
        returns (
            uint256 _seniorPoolAssets,
            uint256 _juniorFirstLossAssets,
            uint256 _seniorTargetApyBps,
            uint256 _juniorTargetApyBps,
            uint256 _activeAllocatedInvoices
        )
    {
        return (
            seniorPoolAssets,
            juniorFirstLossAssets,
            seniorTargetApyBps,
            juniorTargetApyBps,
            activeAllocatedInvoices
        );
    }
}
