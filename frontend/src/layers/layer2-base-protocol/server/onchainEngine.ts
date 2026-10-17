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

export interface EnvWalletAccountInfo {
  keyId: 'supplier' | 'buyer' | 'financier';
  label: string;
  address: Address;
  privateKey: Hex;
  vlei: string;
  legalName: string;
  jurisdiction: string;
  ethBalanceFormatted?: string;
  usdcBalanceFormatted?: string;
}

export function getEnvConfiguredWallets(): EnvWalletAccountInfo[] {
  const sAddr = (process.env.NEXT_PUBLIC_SUPPLIER_WALLET_ADDRESS ||
    '0x89A9314d76ef6EF3E1DC1efE40b704373B2f709b') as Address;
  const bAddr = (process.env.NEXT_PUBLIC_BUYER_WALLET_ADDRESS ||
    '0x8c12f05ad5030A1F7B27464A99D4800C17D23A0C') as Address;
  const fAddr = (process.env.NEXT_PUBLIC_FINANCIER_WALLET_ADDRESS ||
    '0x4c70c6f7889a1520B4453ee0899D9C758c7E1eD0') as Address;

  return [
    {
      keyId: 'supplier',
      label: 'Supplier (.env Wallet)',
      address: sAddr,
      privateKey: (process.env.DIPTOS_SUPPLIER_PRIVATE_KEY ||
        '0x1cff2dec14c4600cf7be15fa9e72c42f9935931cc96935656f648b6ad9f7cf6b') as Hex,
      vlei: process.env.NEXT_PUBLIC_SUPPLIER_VLEI || `549300${sAddr.slice(2, 16).toUpperCase()}`,
      legalName:
        process.env.NEXT_PUBLIC_SUPPLIER_NAME ||
        `Supplier Account (${sAddr.slice(0, 6)}...${sAddr.slice(-4)})`,
      jurisdiction: process.env.NEXT_PUBLIC_SUPPLIER_JURISDICTION || 'Base L2 (8453)',
    },
    {
      keyId: 'buyer',
      label: 'Buyer (.env Wallet)',
      address: bAddr,
      privateKey: (process.env.DIPTOS_BUYER_PRIVATE_KEY ||
        '0x6faacfc384b8181cf6741f2993ac65349e77fbee3887fd2674e7f679529788fd') as Hex,
      vlei: process.env.NEXT_PUBLIC_BUYER_VLEI || `549300${bAddr.slice(2, 16).toUpperCase()}`,
      legalName:
        process.env.NEXT_PUBLIC_BUYER_NAME ||
        `Buyer Account (${bAddr.slice(0, 6)}...${bAddr.slice(-4)})`,
      jurisdiction: process.env.NEXT_PUBLIC_BUYER_JURISDICTION || 'Base L2 (8453)',
    },
    {
      keyId: 'financier',
      label: 'Financier (.env Wallet)',
      address: fAddr,
      privateKey: (process.env.DIPTOS_FINANCIER_PRIVATE_KEY ||
        '0x3e4f878f8ce70a7c7135eb1db18e8cf75da87b69e60add45c5b0ce7433b46707') as Hex,
      vlei: process.env.NEXT_PUBLIC_FINANCIER_VLEI || `549300${fAddr.slice(2, 16).toUpperCase()}`,
      legalName:
        process.env.NEXT_PUBLIC_FINANCIER_NAME ||
        `Financier Account (${fAddr.slice(0, 6)}...${fAddr.slice(-4)})`,
      jurisdiction: process.env.NEXT_PUBLIC_FINANCIER_JURISDICTION || 'Base L2 (8453)',
    },
  ];
}

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
 * If the local Anvil node was restarted, automatically deploys all 7 contracts and
 * funds the .env wallets via the Faucet.
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
  const operatorAccount = privateKeyToAccount(FAUCET_MASTER_KEY);

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

  // Fund .env wallets and register their vLEI identities on-chain
  for (const w of getEnvConfiguredWallets()) {
    const ethHash = await walletClient.sendTransaction({
      to: w.address,
      value: parseEther('50'),
    });
    await publicClient.waitForTransactionReceipt({ hash: ethHash });

    const usdcHash = await walletClient.writeContract({
      address: activeContracts.TEST_USDC,
      abi: TEST_USDC_ABI,
      functionName: 'faucetMint',
      args: [w.address, parseUnits('2500000', 6)],
    });
    await publicClient.waitForTransactionReceipt({ hash: usdcHash });

    const idHash = await walletClient.writeContract({
      address: activeContracts.IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'registerIdentity',
      args: [
        w.address,
        activeContracts.IDENTITY_REGISTRY,
        w.vlei,
        w.legalName,
        w.jurisdiction,
        'GLEIF Qualified vLEI Issuer (QVI)',
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: idHash });
  }

  const opHash = await walletClient.writeContract({
    address: activeContracts.IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'registerIdentity',
    args: [
      operatorAccount.address,
      activeContracts.IDENTITY_REGISTRY,
      '5493006MHB84DD0ZWV18',
      'Diptos ERC-4337 Paymaster Relayer',
      'Base L2 Global Settlement Layer',
      'GLEIF Qualified vLEI Issuer (QVI)',
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: opHash });

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

  // Read live ETH and dUSDC balances for all .env wallets
  const envWallets = await Promise.all(
    getEnvConfiguredWallets().map(async (w) => {
      const [ethBal, usdcBal] = await Promise.all([
        publicClient.getBalance({ address: w.address }),
        publicClient.readContract({
          address: contracts.TEST_USDC,
          abi: TEST_USDC_ABI,
          functionName: 'balanceOf',
          args: [w.address],
        }),
      ]);
      return {
        keyId: w.keyId,
        label: w.label,
        address: w.address,
        vlei: w.vlei,
        legalName: w.legalName,
        jurisdiction: w.jurisdiction,
        ethBalanceFormatted: Number(formatEther(ethBal)).toFixed(4),
        usdcBalanceFormatted: Number(formatUnits(usdcBal, 6)).toLocaleString('en-US', {
          maximumFractionDigits: 2,
        }),
      };
    })
  );

  let connectedWalletBalances = {
    ethBalance: '0.0000',
    usdcBalance: '0.00',
    isVerifiedOnChain: false,
  };

  if (activeUserAddress && /^0x[a-fA-F0-9]{40}$/.test(activeUserAddress)) {
    const addr = activeUserAddress as Address;
    const [ethBal, usdcBal, verified] = await Promise.all([
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
    ]);

    connectedWalletBalances = {
      ethBalance: Number(formatEther(ethBal)).toFixed(4),
      usdcBalance: Number(formatUnits(usdcBal, 6)).toLocaleString('en-US', {
        maximumFractionDigits: 2,
      }),
      isVerifiedOnChain: verified,
    };
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

  const identities = rawIdentities.map((id) => ({
    wallet: id.wallet,
    onchainIdContract: id.onchainIdContract,
    vlei: id.vlei,
    legalName: id.legalName,
    jurisdiction: id.jurisdiction,
    qviIssuer: id.qviIssuer,
    verified: id.verified,
    registeredAt: Number(id.registeredAt),
  }));

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
    envWallets,
    connectedWalletBalances,
    invoices,
    vaults,
    identities,
    credentials,
    verifierNodes,
  };
}

export async function executeDynamicOnchainAction(payload: {
  action: string;
  signerKeyId?: 'supplier' | 'buyer' | 'financier' | 'paymaster';
  callerAddress?: Address;
  data?: Record<string, unknown>;
  rawCallData?: { to: Address; data: Hex; value?: string };
}): Promise<{ hash: Hash; blockNumber: string; executionMode: string }> {
  const contracts = await ensureContractsDeployed();
  const publicClient = getPublicClient();
  const envWallets = getEnvConfiguredWallets();

  const matchedEnvWallet = envWallets.find((w) => w.keyId === payload.signerKeyId);
  const signingKey = matchedEnvWallet?.privateKey || FAUCET_MASTER_KEY;
  const walletClient = getWalletClientForKey(signingKey);
  const signerAccount = privateKeyToAccount(signingKey);

  // Ensure signer and optional callerAddress are registered in IdentityRegistry.sol
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
      functionName: 'registerIdentity',
      args: [
        signerAccount.address,
        contracts.IDENTITY_REGISTRY,
        '54930099887766554433',
        `Verified Institutional Signer (${signerAccount.address.slice(0, 6)})`,
        'Base L2 Global Corridor',
        'GLEIF Qualified vLEI Issuer (QVI)',
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: regHash });
  }

  if (
    payload.callerAddress &&
    /^0x[a-fA-F0-9]{40}$/.test(payload.callerAddress) &&
    payload.callerAddress.toLowerCase() !== signerAccount.address.toLowerCase()
  ) {
    const isCallerVerified = await publicClient.readContract({
      address: contracts.IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'isVerified',
      args: [payload.callerAddress],
    });
    if (!isCallerVerified) {
      const callerRegHash = await walletClient.writeContract({
        address: contracts.IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'registerIdentity',
        args: [
          payload.callerAddress,
          contracts.IDENTITY_REGISTRY,
          `549300${payload.callerAddress.slice(2, 16).toUpperCase()}`,
          `Verified Institutional Account (${payload.callerAddress.slice(0, 6)})`,
          'Base L2 Global Corridor',
          'GLEIF Qualified vLEI Issuer (QVI)',
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash: callerRegHash });
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
            buyer: (d.buyerAddress || envWallets[1].address) as Address,
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
      const targetUser = (d.walletAddress || signerAccount.address) as Address;
      txHash = await walletClient.writeContract({
        address: contracts.IDENTITY_REGISTRY,
        abi: IDENTITY_REGISTRY_ABI,
        functionName: 'registerIdentity',
        args: [
          targetUser,
          contracts.IDENTITY_REGISTRY,
          String(d.vlei),
          String(d.legalName),
          String(d.jurisdiction),
          String(d.qviIssuer || 'GLEIF Qualified vLEI Issuer (QVI)'),
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
          String(d.issuerDid || `did:pkh:eip155:8453:${envWallets[1].address}`),
          String(d.issuerName || envWallets[1].legalName),
          (d.subjectAddress || envWallets[0].address) as Address,
          String(d.subjectDid || `did:pkh:eip155:8453:${envWallets[0].address}`),
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

  // Also ensure the recipient is registered in IdentityRegistry.sol so they can immediately transact
  const isVerified = await publicClient.readContract({
    address: contracts.IDENTITY_REGISTRY,
    abi: IDENTITY_REGISTRY_ABI,
    functionName: 'isVerified',
    args: [params.recipientAddress],
  });

  if (!isVerified) {
    const idHash = await walletClient.writeContract({
      address: contracts.IDENTITY_REGISTRY,
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'registerIdentity',
      args: [
        params.recipientAddress,
        contracts.IDENTITY_REGISTRY,
        `549300${params.recipientAddress.slice(2, 16).toUpperCase()}`,
        `Verified Institutional Participant (${params.recipientAddress.slice(0, 6)}...${params.recipientAddress.slice(-4)})`,
        'Base L2 / UNCITRAL MLETR Corridor',
        'GLEIF Qualified vLEI Issuer (QVI)',
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: idHash });
  }

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
