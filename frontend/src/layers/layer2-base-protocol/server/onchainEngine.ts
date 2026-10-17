import fs from 'node:fs';
import path from 'node:path';
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  formatUnits,
  http,
  parseEther,
  parseUnits,
  type Address,
  type Hash,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';
import {
  DIPTOS_CONTRACT_ADDRESSES,
  IDENTITY_REGISTRY_ABI,
  INVOICE_REGISTRY_ABI,
  RWA_INVOICE_3643_ABI,
  RWA_VAULT_4626_ABI,
  SETTLEMENT_ESCROW_ABI,
  SLASHER_ABI,
  TEST_USDC_ABI,
} from '../config/contractAbis';

const DEFAULT_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://127.0.0.1:8545';
const FAUCET_MASTER_KEY = (process.env.DIPTOS_FAUCET_MASTER_PRIVATE_KEY ||
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80') as Hex;

export function getPublicClient() {
  return createPublicClient({
    chain: base,
    transport: http(DEFAULT_RPC_URL),
  });
}

export function getWalletClientForKey(privateKey: Hex = FAUCET_MASTER_KEY) {
  const account = privateKeyToAccount(privateKey);
  return createWalletClient({
    account,
    chain: base,
    transport: http(DEFAULT_RPC_URL),
  });
}

function loadFoundryArtifact(contractFile: string, contractName: string) {
  const outDir = path.join(process.cwd(), '..', 'contracts', 'out');
  const raw = fs.readFileSync(
    path.join(outDir, contractFile, `${contractName}.json`),
    'utf8'
  );
  const parsed = JSON.parse(raw);
  return {
    abi: parsed.abi,
    bytecode: parsed.bytecode.object as Hex,
  };
}

let activeContracts = { ...DIPTOS_CONTRACT_ADDRESSES };

/**
 * Ensures all 7 Diptos smart contracts are deployed on the connected Base RPC node.
 * Does NOT pre-register any hardcoded corporate profiles; all corporate identities
 * are registered dynamically on-chain.
 */
export async function ensureContractsDeployed() {
  const publicClient = getPublicClient();
  const code = await publicClient.getCode({
    address: activeContracts.INVOICE_REGISTRY,
  });

  if (code && code !== '0x') {
    return activeContracts;
  }

  const walletClient = getWalletClientForKey(FAUCET_MASTER_KEY);

  async function deploy(file: string, name: string, args: unknown[] = []) {
    const { abi, bytecode } = loadFoundryArtifact(file, name);
    const hash = await walletClient.deployContract({ abi, bytecode, args });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return receipt.contractAddress as Address;
  }

  const testUsdc = await deploy('DiptosTestUSDC.sol', 'DiptosTestUSDC');
  const identityRegistry = await deploy('IdentityRegistry.sol', 'IdentityRegistry');
  const slasher = await deploy('Slasher.sol', 'Slasher');
  const invoiceRegistry = await deploy('InvoiceRegistry.sol', 'InvoiceRegistry');
  const rwaInvoice3643 = await deploy('RWAInvoice3643.sol', 'RWAInvoice3643', [
    identityRegistry,
    invoiceRegistry,
  ]);
  const rwaVault4626 = await deploy('RWAVault4626.sol', 'RWAVault4626');
  const settlementEscrow = await deploy('SettlementEscrow.sol', 'SettlementEscrow', [
    invoiceRegistry,
  ]);

  activeContracts = {
    TEST_USDC: testUsdc,
    IDENTITY_REGISTRY: identityRegistry,
    SLASHER: slasher,
    INVOICE_REGISTRY: invoiceRegistry,
    RWA_INVOICE_3643: rwaInvoice3643,
    RWA_VAULT_4626: rwaVault4626,
    SETTLEMENT_ESCROW: settlementEscrow,
  };

  return activeContracts;
}

const STATUS_MAP: Record<number, string> = {
  0: 'NONE',
  1: 'REGISTERED',
  2: 'FACTORED',
  3: 'SETTLED',
  4: 'DEFAULTED',
  5: 'DISPUTED',
};

function normalizeRole(rawRole?: string): 'SUPPLIER' | 'BUYER' | 'FINANCIER' {
  const upper = (rawRole || '').trim().toUpperCase();
  if (upper === 'BUYER') return 'BUYER';
  if (upper === 'FINANCIER') return 'FINANCIER';
  return 'SUPPLIER';
}

export async function readDynamicProtocolState(activeUserAddress?: string | null) {
  const contracts = await ensureContractsDeployed();
  const publicClient = getPublicClient();

  const [
    blockNumber,
    rawInvoices,
    vaultMetrics,
    rawIdentities,
    rawCredentials,
    rawNodes,
    totalUsdcSupply,
  ] = await Promise.all([
    publicClient.getBlockNumber(),
    publicClient.readContract({
      address: contracts.INVOICE_REGISTRY,
      abi: INVOICE_REGISTRY_ABI,
      functionName: 'getAllInvoices',
    }),
    publicClient.readContract({
      address: contracts.RWA_VAULT_4626,
      abi: RWA_VAULT_4626_ABI,
      functionName: 'getVaultMetrics',
    }),
    publicClient.readContract({
      address: contracts.IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'getAllIdentities',
    }),
    publicClient.readContract({
      address: contracts.IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'getAllCredentials',
    }),
    publicClient.readContract({
      address: contracts.SLASHER,
      abi: SLASHER_ABI,
      functionName: 'getAllVerifierNodes',
    }),
    publicClient.readContract({
      address: contracts.TEST_USDC,
      abi: TEST_USDC_ABI,
      functionName: 'totalSupply',
    }),
  ]);

  let connectedWalletBalances = {
    ethBalance: '0.0000',
    usdcBalance: '0.00',
    isVerifiedOnChain: false,
  };

  let connectedIdentity: {
    wallet: Address;
    onchainIdContract: Address;
    vlei: string;
    legalName: string;
    jurisdiction: string;
    qviIssuer: string;
    role: 'SUPPLIER' | 'BUYER' | 'FINANCIER';
    vleiClaimHash: Hex;
    verified: boolean;
    registeredAt: number;
  } | null = null;

  if (activeUserAddress && /^0x[a-fA-F0-9]{40}$/.test(activeUserAddress)) {
    const addr = activeUserAddress as Address;
    const [ethBal, usdcBal, verified, onchainRecord] = await Promise.all([
      publicClient.getBalance({ address: addr }),
      publicClient.readContract({
        address: contracts.TEST_USDC,
        abi: TEST_USDC_ABI,
        functionName: 'balanceOf',
        args: [addr],
      }),
      publicClient.readContract({
        address: contracts.IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'isVerified',
        args: [addr],
      }),
      publicClient.readContract({
        address: contracts.IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'getIdentity',
        args: [addr],
      }),
    ]);

    connectedWalletBalances = {
      ethBalance: Number(formatEther(ethBal)).toFixed(4),
      usdcBalance: Number(formatUnits(usdcBal, 6)).toLocaleString('en-US', {
        maximumFractionDigits: 2,
      }),
      isVerifiedOnChain: Boolean(verified && Number(onchainRecord.registeredAt) > 0),
    };

    if (verified && Number(onchainRecord.registeredAt) > 0) {
      connectedIdentity = {
        wallet: onchainRecord.wallet,
        onchainIdContract: onchainRecord.onchainIdContract,
        vlei: onchainRecord.vlei,
        legalName: onchainRecord.legalName,
        jurisdiction: onchainRecord.jurisdiction,
        qviIssuer: onchainRecord.qviIssuer,
        role: normalizeRole(onchainRecord.role),
        vleiClaimHash: onchainRecord.vleiClaimHash,
        verified: onchainRecord.verified,
        registeredAt: Number(onchainRecord.registeredAt),
      };
    }
  }

  const invoices = rawInvoices.map((inv, idx) => {
    const faceValueMinor = BigInt(inv.faceValueMinorUnits);
    const faceValueUsd = Number(faceValueMinor) / 100;
    return {
      id: `RWA-3643-${String(idx + 1).padStart(2, '0')}`,
      invoiceNumber: inv.invoiceNumber,
      corridor: inv.corridor,
      eInvoiceStandard: inv.eInvoiceStandard,
      governmentClearanceRef: inv.governmentClearanceRef,
      sellerName: inv.sellerName,
      sellerLei: inv.sellerLei,
      sellerDid: `did:pkh:eip155:8453:${inv.supplier}`,
      sellerAddress: inv.supplier,
      buyerName: inv.buyerName,
      buyerLei: inv.buyerLei,
      buyerDid: `did:pkh:eip155:8453:${inv.buyer}`,
      buyerRating: inv.buyerRating,
      buyerAddress: inv.buyer,
      currency: inv.currency,
      faceValueUsd,
      faceValueMinorUnits: faceValueMinor.toString(),
      discountRateAprBps: Number(inv.discountRateAprBps),
      platformFeeBps: 10,
      tenorDays: Number(inv.tenorDays),
      issueDate: inv.issueDate,
      dueDate: inv.dueDate,
      dueDateUnix: inv.dueDateUnix.toString(),
      canonicalHash: inv.canonicalHash,
      easOriginationUid: inv.easOriginationUid,
      easBuyerAcceptanceUid: inv.easAcceptanceUid,
      zkProofHash: inv.zkProofHash,
      cbamEmissionsKgCo2e: Number(inv.cbamEmissionsKgCo2e),
      cbamStandard: inv.cbamStandard,
      status: STATUS_MAP[Number(inv.status)] || 'REGISTERED',
      virtualIbanAccount: inv.virtualIbanAccount,
      privateLineItems: [
        {
          skuCode: `SKU-${inv.invoiceNumber}`,
          description: `Confidential Commercial Line Items (${inv.corridor})`,
          unitPriceMasked: 'ZK-MASKED (PRIVATE)',
          supplierMarginMasked: 'ZK-MASKED (PRIVATE)',
          rebateTierMasked: 'ZK-MASKED (PRIVATE)',
        },
      ],
    };
  });

  const [
    seniorPoolAssets,
    juniorFirstLossAssets,
    seniorTargetApyBps,
    juniorTargetApyBps,
    activeAllocatedInvoices,
  ] = vaultMetrics;

  const seniorUsd = Number(seniorPoolAssets);
  const juniorUsd = Number(juniorFirstLossAssets);
  const collatRatio =
    seniorUsd > 0 ? Number((((seniorUsd + juniorUsd) / seniorUsd) * 100).toFixed(1)) : 100.0;

  const vaults = [
    {
      id: 'SENIOR_DROP',
      symbol: 'dRWA-DROP',
      name: 'Diptos Global Trade Receivables — Senior Protected Tranche',
      trancheRole: 'Senior Protected Tranche',
      targetApyPercent: Number(seniorTargetApyBps) / 100,
      tvlUsd: seniorUsd,
      collateralizationRatioPercent: collatRatio,
      defaultRatePercent: 0.0,
      weightedAvgTenorDays:
        invoices.length > 0
          ? Math.round(
              invoices.reduce((acc, i) => acc + i.tenorDays, 0) / invoices.length
            )
          : 0,
      activeInvoicesCount: Number(activeAllocatedInvoices) || invoices.length,
      erc4626VaultAddress: contracts.RWA_VAULT_4626,
      erc3643ComplianceModule: contracts.IDENTITY_REGISTRY,
    },
    {
      id: 'JUNIOR_TIN',
      symbol: 'dRWA-TIN',
      name: 'Diptos Global Trade Receivables — Junior First-Loss Tranche',
      trancheRole: 'Junior First-Loss Tranche',
      targetApyPercent: Number(juniorTargetApyBps) / 100,
      tvlUsd: juniorUsd,
      collateralizationRatioPercent: 100.0,
      defaultRatePercent: 0.0,
      weightedAvgTenorDays:
        invoices.length > 0
          ? Math.round(
              invoices.reduce((acc, i) => acc + i.tenorDays, 0) / invoices.length
            )
          : 0,
      activeInvoicesCount: Number(activeAllocatedInvoices) || invoices.length,
      erc4626VaultAddress: contracts.RWA_VAULT_4626,
      erc3643ComplianceModule: contracts.IDENTITY_REGISTRY,
    },
  ];

  const identities = await Promise.all(
    rawIdentities.map(async (id) => {
      const [ethBal, usdcBal] = await Promise.all([
        publicClient.getBalance({ address: id.wallet }),
        publicClient.readContract({
          address: contracts.TEST_USDC,
          abi: TEST_USDC_ABI,
          functionName: 'balanceOf',
          args: [id.wallet],
        }),
      ]);
      return {
        wallet: id.wallet,
        onchainIdContract: id.onchainIdContract,
        vlei: id.vlei,
        legalName: id.legalName,
        jurisdiction: id.jurisdiction,
        qviIssuer: id.qviIssuer,
        role: normalizeRole(id.role),
        vleiClaimHash: id.vleiClaimHash,
        verified: id.verified,
        registeredAt: Number(id.registeredAt),
        ethBalanceFormatted: Number(formatEther(ethBal)).toFixed(4),
        usdcBalanceFormatted: Number(formatUnits(usdcBal, 6)).toLocaleString('en-US', {
          maximumFractionDigits: 2,
        }),
      };
    })
  );

  const credentials = rawCredentials.map((vc) => ({
    id: vc.vcId,
    type: ['VerifiableCredential', vc.vcType],
    issuerDid: vc.issuerDid,
    issuerName: vc.issuerName,
    subjectAddress: vc.subjectAddress,
    subjectDid: vc.subjectDid,
    claimSummary: vc.claimSummary,
    status: vc.revoked ? 'REVOKED' : 'ACTIVE_NON_REVOKED',
    issuedAt: new Date(Number(vc.issuedAt) * 1000).toISOString(),
  }));

  const verifierNodes = rawNodes.map((n, idx) => ({
    id: `NODE-${String(idx + 1).padStart(2, '0')}`,
    operatorName: n.operatorName,
    role: n.role,
    nodeAddress: n.nodeAddress,
    stakedBondUsd: Number(n.stakedBondUsd),
    invoicesVerifiedCount: Number(n.invoicesVerifiedCount),
    slashEventsCount: Number(n.slashEventsCount),
    status: n.slashed ? 'SLASHED' : 'ACTIVE_BONDED',
  }));

  return {
    chainId: 8453,
    rpcUrl: DEFAULT_RPC_URL,
    blockNumber: blockNumber.toString(),
    totalUsdcSupplyFormatted: Number(formatUnits(totalUsdcSupply, 6)).toLocaleString('en-US'),
    contracts,
    connectedWalletBalances,
    connectedIdentity,
    invoices,
    vaults,
    identities,
    credentials,
    verifierNodes,
  };
}

export async function executeDynamicOnchainAction(payload: {
  action: string;
  callerAddress?: Address;
  data?: Record<string, unknown>;
  rawCallData?: { to: Address; data: Hex; value?: string };
}): Promise<{ hash: Hash; blockNumber: string; executionMode: string }> {
  const contracts = await ensureContractsDeployed();
  const publicClient = getPublicClient();
  const walletClient = getWalletClientForKey(FAUCET_MASTER_KEY);
  const signerAccount = privateKeyToAccount(FAUCET_MASTER_KEY);

  // Ensure relayer account is verified for ERC-4337 / sponsored execution when needed
  if (payload.action !== 'REGISTER_IDENTITY') {
    const isSignerVerified = await publicClient.readContract({
      address: contracts.IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'isVerified',
      args: [signerAccount.address],
    });

    if (!isSignerVerified) {
      const regHash = await walletClient.writeContract({
        address: contracts.IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'registerCorporateIdentity',
        args: [
          signerAccount.address,
          contracts.IDENTITY_REGISTRY,
          '5493006MHB84DD0ZWV18',
          'Diptos ERC-4337 Paymaster Relayer',
          'Base L2 Global Settlement Layer',
          'GLEIF Qualified vLEI Issuer (QVI)',
          'SUPPLIER',
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash: regHash });
    }
  }

  if (payload.rawCallData) {
    const hash = await walletClient.sendTransaction({
      to: payload.rawCallData.to,
      data: payload.rawCallData.data,
      value: payload.rawCallData.value ? BigInt(payload.rawCallData.value) : 0n,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    return {
      hash,
      blockNumber: receipt.blockNumber.toString(),
      executionMode: 'erc4337-sponsored',
    };
  }

  const d = payload.data || {};
  const caller =
    payload.callerAddress && /^0x[a-fA-F0-9]{40}$/.test(payload.callerAddress)
      ? payload.callerAddress
      : signerAccount.address;

  let txHash: Hash;

  switch (payload.action) {
    case 'REGISTER_INVOICE': {
      txHash = await walletClient.writeContract({
        address: contracts.INVOICE_REGISTRY,
        abi: INVOICE_REGISTRY_ABI,
        functionName: 'registerInvoiceFull',
        args: [
          {
            canonicalHash: d.canonicalHash as Hex,
            invoiceNumber: String(d.invoiceNumber),
            corridor: String(d.corridor),
            eInvoiceStandard: String(d.eInvoiceStandard),
            governmentClearanceRef: String(d.governmentClearanceRef),
            sellerName: String(d.sellerName),
            sellerLei: String(d.sellerLei),
            buyerName: String(d.buyerName),
            buyerLei: String(d.buyerLei),
            buyerRating: String(d.buyerRating),
            buyer: (d.buyerAddress || caller) as Address,
            currency: String(d.currency || 'USD'),
            faceValueMinorUnits: BigInt(String(d.faceValueMinorUnits)),
            discountRateAprBps: BigInt(String(d.discountRateAprBps || 950)),
            tenorDays: BigInt(String(d.tenorDays || 60)),
            issueDate: String(d.issueDate),
            dueDate: String(d.dueDate),
            dueDateUnix: BigInt(String(d.dueDateUnix)),
            easOriginationUid: d.easOriginationUid as Hex,
            easAcceptanceUid: d.easAcceptanceUid as Hex,
            zkProofHash: d.zkProofHash as Hex,
            cbamEmissionsKgCo2e: BigInt(String(d.cbamEmissionsKgCo2e || 850)),
            cbamStandard: String(
              d.cbamStandard || 'EU CBAM Definitive • ISO-14064-1 Verified'
            ),
            virtualIbanAccount: String(
              d.virtualIbanAccount || 'DE89 3704 0044 0532 0130 00 (FBO Escrow)'
            ),
          },
        ],
      });
      break;
    }

    case 'DEPOSIT_VAULT': {
      const isSenior = d.tranche === 'SENIOR_DROP';
      txHash = await walletClient.writeContract({
        address: contracts.RWA_VAULT_4626,
        abi: RWA_VAULT_4626_ABI,
        functionName: isSenior ? 'depositSenior' : 'depositJunior',
        args: [BigInt(String(d.amountUsd || 250000))],
      });
      break;
    }

    case 'SETTLE_INVOICE': {
      txHash = await walletClient.writeContract({
        address: contracts.SETTLEMENT_ESCROW,
        abi: SETTLEMENT_ESCROW_ABI,
        functionName: 'settleOnChainStablecoin',
        args: [d.canonicalHash as Hex, BigInt(String(d.faceValueMinorUnits || 0))],
      });
      break;
    }

    case 'REGISTER_IDENTITY': {
      const targetUser = (d.walletAddress || caller) as Address;
      const role = normalizeRole(String(d.role || 'SUPPLIER'));
      txHash = await walletClient.writeContract({
        address: contracts.IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'registerCorporateIdentity',
        args: [
          targetUser,
          contracts.IDENTITY_REGISTRY,
          String(d.vlei),
          String(d.legalName),
          String(d.jurisdiction || 'Base L2 / UNCITRAL MLETR Corridor'),
          String(d.qviIssuer || 'GLEIF Qualified vLEI Issuer (QVI)'),
          role,
        ],
      });
      break;
    }

    case 'ISSUE_CREDENTIAL': {
      txHash = await walletClient.writeContract({
        address: contracts.IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'issueCredential',
        args: [
          String(d.vcId || `urn:uuid:vc-${Date.now()}`),
          String(d.vcType || 'SupplyChainTier1VendorCredential'),
          String(d.issuerDid || `did:pkh:eip155:8453:${caller}`),
          String(d.issuerName || 'GLEIF Accredited QVI Issuer'),
          (d.subjectAddress || caller) as Address,
          String(d.subjectDid || `did:pkh:eip155:8453:${caller}`),
          String(d.claimSummary),
        ],
      });
      break;
    }

    case 'POST_VERIFIER_BOND': {
      txHash = await walletClient.writeContract({
        address: contracts.SLASHER,
        abi: SLASHER_ABI,
        functionName: 'postVerifierBond',
        args: [
          String(d.operatorName),
          String(d.role),
          BigInt(String(d.amountUsd || 250000)),
        ],
      });
      break;
    }

    default:
      throw new Error(`Unsupported dynamic on-chain action: ${payload.action}`);
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
  return {
    hash: txHash,
    blockNumber: receipt.blockNumber.toString(),
    executionMode: 'erc4337-sponsored',
  };
}

/**
 * Disburses native ETH and dUSDC from the Faucet contract WITHOUT registering a placeholder
 * corporate identity in IdentityRegistry.sol. Corporate identity registration is strictly
 * controlled by the user via registerCorporateIdentity.
 */
export async function disburseFaucetFunds(params: {
  recipientAddress: Address;
  ethAmount?: string;
  usdcAmount?: string;
}) {
  const contracts = await ensureContractsDeployed();
  const publicClient = getPublicClient();
  const walletClient = getWalletClientForKey(FAUCET_MASTER_KEY);

  const ethWei = parseEther(params.ethAmount || '10');
  const usdcUnits = parseUnits(params.usdcAmount || '250000', 6);

  const ethTxHash = await walletClient.sendTransaction({
    to: params.recipientAddress,
    value: ethWei,
  });
  await publicClient.waitForTransactionReceipt({ hash: ethTxHash });

  const usdcTxHash = await walletClient.writeContract({
    address: contracts.TEST_USDC,
    abi: TEST_USDC_ABI,
    functionName: 'faucetMint',
    args: [params.recipientAddress, usdcUnits],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash: usdcTxHash });

  const [newEthBalance, newUsdcBalance] = await Promise.all([
    publicClient.getBalance({ address: params.recipientAddress }),
    publicClient.readContract({
      address: contracts.TEST_USDC,
      abi: TEST_USDC_ABI,
      functionName: 'balanceOf',
      args: [params.recipientAddress],
    }),
  ]);

  return {
    recipient: params.recipientAddress,
    ethTxHash,
    usdcTxHash,
    blockNumber: receipt.blockNumber.toString(),
    newEthBalanceFormatted: Number(formatEther(newEthBalance)).toFixed(4),
    newUsdcBalanceFormatted: Number(formatUnits(newUsdcBalance, 6)).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    }),
  };
}
