// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IdentityRegistry} from "../src/layer3-di-security/IdentityRegistry.sol";
import {Slasher} from "../src/layer3-di-security/Slasher.sol";
import {InvoiceRegistry} from "../src/layer1-rwa-core/InvoiceRegistry.sol";
import {RWAInvoice3643} from "../src/layer1-rwa-core/RWAInvoice3643.sol";
import {RWAVault4626} from "../src/layer1-rwa-core/RWAVault4626.sol";
import {SettlementEscrow} from "../src/layer2-base-protocol/SettlementEscrow.sol";
import {DiptosTestUSDC} from "../src/layer2-base-protocol/DiptosTestUSDC.sol";

contract DiptosProtocolTest {
    IdentityRegistry public identityRegistry;
    Slasher public slasher;
    InvoiceRegistry public invoiceRegistry;
    RWAInvoice3643 public rwaInvoice3643;
    RWAVault4626 public rwaVault4626;
    SettlementEscrow public settlementEscrow;
    DiptosTestUSDC public testUsdc;

    function setUp() public {
        identityRegistry = new IdentityRegistry();
        slasher = new Slasher();
        invoiceRegistry = new InvoiceRegistry();
        rwaInvoice3643 = new RWAInvoice3643(address(identityRegistry), address(invoiceRegistry));
        rwaVault4626 = new RWAVault4626();
        settlementEscrow = new SettlementEscrow(address(invoiceRegistry));
        testUsdc = new DiptosTestUSDC();
    }

    function testEndToEndDynamicInvoiceLifecycleAndFaucet() public {
        // 1. Faucet mints dUSDC to this account
        testUsdc.faucetMint(address(this), 500_000 * 1e6);
        require(testUsdc.balanceOf(address(this)) == 500_000 * 1e6, "Faucet mint failed");

        // 2. Register corporate vLEI & ONCHAINID in Layer 3 IdentityRegistry
        identityRegistry.registerIdentity(
            address(this),
            address(0x7347350000000000000000000000000000009941),
            "33580048329184928172",
            "Diptos Verified Exporter Ltd.",
            "Global Cross-Border (IN / EU / SG / US)",
            "GLEIF Accredited QVI"
        );
        require(identityRegistry.isVerified(address(this)), "Identity should be verified");

        // 3. Issue W3C VC 2.0 Credential on-chain
        identityRegistry.issueCredential(
            "urn:uuid:vc-vlei-01",
            "GLEIFvLEICredential",
            "did:web:gleif.org:qvi",
            "GLEIF QVI Root",
            address(this),
            "did:pkh:eip155:8453:0x1111",
            "Active 20-Character LEI & Tier-1 Vendor"
        );
        require(identityRegistry.getAllCredentials().length == 1, "VC count mismatch");

        // 4. Post Verifier Bond in Slasher.sol
        slasher.postVerifierBond("MonetaGo x Peppol Relayer", "ERP Ingestion Relayer", 250_000);
        require(slasher.getAllVerifierNodes().length == 1, "Verifier node count mismatch");

        // 5. Register canonical invoice in Layer 1 InvoiceRegistry
        bytes32 canonicalHash = keccak256("SELLER_LEI|BUYER_LEI|INV-001|USD|20261017|10000000");
        InvoiceRegistry.RegisterInvoiceParams memory params = InvoiceRegistry.RegisterInvoiceParams({
            canonicalHash: canonicalHash,
            invoiceNumber: "INV-001",
            corridor: "SG -> UK",
            eInvoiceStandard: "PEPPOL_BIS_3_0",
            governmentClearanceRef: "IMDA Peppol Signed XML",
            sellerName: "Diptos Verified Exporter Ltd.",
            sellerLei: "33580048329184928172",
            buyerName: "Thames Industrial PLC",
            buyerLei: "213800D1EI4B9WTWWD28",
            buyerRating: "AA-",
            buyer: address(0x2222),
            currency: "USD",
            faceValueMinorUnits: 10000000,
            discountRateAprBps: 950,
            tenorDays: 60,
            issueDate: "2026-10-17",
            dueDate: "2026-12-16",
            dueDateUnix: 1797379200,
            easOriginationUid: keccak256("EAS_ORIG_1"),
            easAcceptanceUid: keccak256("EAS_ACCEPT_2"),
            zkProofHash: keccak256("ZK_PROOF_3"),
            cbamEmissionsKgCo2e: 850,
            cbamStandard: "ISO-14064-1",
            virtualIbanAccount: "GB29 NWBK 6016 1331 9268 19"
        });
        invoiceRegistry.registerInvoiceFull(params);
        require(invoiceRegistry.getInvoiceCount() == 1, "Invoice count should be 1");

        // 6. Mint ERC-3643 Invoice Token (transitions status to FACTORED)
        rwaInvoice3643.mintVerifiedInvoice(
            canonicalHash,
            10000000,
            "USD",
            1797379200,
            "did:pkh:eip155:8453:0x2222",
            keccak256("ZK_PROOF_3")
        );
        require(rwaInvoice3643.holderOf(canonicalHash) == address(this), "Holder mismatch");

        // 7. Deposit into ERC-4626 Senior & Junior Vaults
        rwaVault4626.depositSenior(1_000_000);
        rwaVault4626.depositJunior(250_000);
        (uint256 seniorAssets, uint256 juniorAssets, , , ) = rwaVault4626.getVaultMetrics();
        require(seniorAssets == 1_000_000 && juniorAssets == 250_000, "Vault assets mismatch");

        // 8. Settle via SettlementEscrow (transitions status to SETTLED)
        settlementEscrow.settleOnChainStablecoin(canonicalHash, 10000000);
        InvoiceRegistry.InvoiceRecord[] memory allInvoices = invoiceRegistry.getAllInvoices();
        require(
            allInvoices[0].status == InvoiceRegistry.Status.SETTLED,
            "Invoice should be SETTLED"
        );
    }
}
