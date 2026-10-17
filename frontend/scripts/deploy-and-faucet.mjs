import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  parseUnits,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.join(__dirname, '..', '..', 'contracts');
const outDir = path.join(contractsDir, 'out');

function loadArtifact(contractFile, contractName) {
  const raw = fs.readFileSync(
    path.join(outDir, contractFile, `${contractName}.json`),
    'utf8'
  );
  const parsed = JSON.parse(raw);
  return {
    abi: parsed.abi,
    bytecode: parsed.bytecode.object,
  };
}

// Anvil Faucet Master Account #0
const ANVIL_FAUCET_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Generated Base & ETH Wallets for .env
const ENV_WALLETS = {
  supplier: {
    role: 'Supplier (.env Wallet)',
    address: '0x89A9314d76ef6EF3E1DC1efE40b704373B2f709b',
    privateKey:
      '0x1cff2dec14c4600cf7be15fa9e72c42f9935931cc96935656f648b6ad9f7cf6b',
    vlei: '54930089A9314D76EF6E',
    legalName: 'Supplier Account (0x89A9...709b)',
    jurisdiction: 'Base L2 (8453)',
  },
  buyer: {
    role: 'Buyer (.env Wallet)',
    address: '0x8c12f05ad5030A1F7B27464A99D4800C17D23A0C',
    privateKey:
      '0x6faacfc384b8181cf6741f2993ac65349e77fbee3887fd2674e7f679529788fd',
    vlei: '5493008C12F05AD5030A',
    legalName: 'Buyer Account (0x8c12...3A0C)',
    jurisdiction: 'Base L2 (8453)',
  },
  financier: {
    role: 'Financier (.env Wallet)',
    address: '0x4c70c6f7889a1520B4453ee0899D9C758c7E1eD0',
    privateKey:
      '0x3e4f878f8ce70a7c7135eb1db18e8cf75da87b69e60add45c5b0ce7433b46707',
    vlei: '5493004C70C6F7889A15',
    legalName: 'Financier Account (0x4c70...1eD0)',
    jurisdiction: 'Base L2 (8453)',
  },
};

async function main() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
  const account = privateKeyToAccount(ANVIL_FAUCET_KEY);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  });

  async function deploy(file, name, args = []) {
    const { abi, bytecode } = loadArtifact(file, name);
    const hash = await walletClient.deployContract({
      abi,
      bytecode,
      args,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`Deployed ${name} at ${receipt.contractAddress}`);
    return { address: receipt.contractAddress, abi };
  }

  const testUsdc = await deploy('DiptosTestUSDC.sol', 'DiptosTestUSDC');
  const identityRegistry = await deploy('IdentityRegistry.sol', 'IdentityRegistry');
  const slasher = await deploy('Slasher.sol', 'Slasher');
  const invoiceRegistry = await deploy('InvoiceRegistry.sol', 'InvoiceRegistry');
  const rwaInvoice3643 = await deploy('RWAInvoice3643.sol', 'RWAInvoice3643', [
    identityRegistry.address,
    invoiceRegistry.address,
  ]);
  const rwaVault4626 = await deploy('RWAVault4626.sol', 'RWAVault4626');
  const settlementEscrow = await deploy('SettlementEscrow.sol', 'SettlementEscrow', [
    invoiceRegistry.address,
  ]);

  // Fund the 3 .env Base/ETH accounts from the Faucet (50 ETH + 2,500,000 dUSDC each)
  for (const key of Object.keys(ENV_WALLETS)) {
    const w = ENV_WALLETS[key];
    const ethTx = await walletClient.sendTransaction({
      to: w.address,
      value: parseEther('50'),
    });
    await publicClient.waitForTransactionReceipt({ hash: ethTx });

    const usdcTx = await walletClient.writeContract({
      address: testUsdc.address,
      abi: testUsdc.abi,
      functionName: 'faucetMint',
      args: [w.address, parseUnits('2500000', 6)],
    });
    await publicClient.waitForTransactionReceipt({ hash: usdcTx });

    // Register corporate vLEI in IdentityRegistry.sol
    const idTx = await walletClient.writeContract({
      address: identityRegistry.address,
      abi: identityRegistry.abi,
      functionName: 'registerIdentity',
      args: [
        w.address,
        identityRegistry.address,
        w.vlei,
        w.legalName,
        w.jurisdiction,
        'GLEIF Qualified vLEI Issuer (QVI)',
      ],
    });
    await publicClient.waitForTransactionReceipt({ hash: idTx });

    console.log(`Faucet funded & vLEI registered for ${w.role}: ${w.address}`);
  }

  // Also register the Anvil Operator account #0 so any Paymaster/Relayer tx is verified
  const opIdTx = await walletClient.writeContract({
    address: identityRegistry.address,
    abi: identityRegistry.abi,
    functionName: 'registerIdentity',
    args: [
      account.address,
      identityRegistry.address,
      '5493006MHB84DD0ZWV18',
      'Diptos ERC-4337 Paymaster & Protocol Relayer',
      'Base L2 Global Settlement Layer',
      'GLEIF Qualified vLEI Issuer (QVI)',
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: opIdTx });

  const deployedConfig = {
    chainId: 8453,
    rpcUrl,
    deployedAt: new Date().toISOString(),
    contracts: {
      TEST_USDC: testUsdc.address,
      IDENTITY_REGISTRY: identityRegistry.address,
      SLASHER: slasher.address,
      INVOICE_REGISTRY: invoiceRegistry.address,
      RWA_INVOICE_3643: rwaInvoice3643.address,
      RWA_VAULT_4626: rwaVault4626.address,
      SETTLEMENT_ESCROW: settlementEscrow.address,
    },
    wallets: ENV_WALLETS,
  };

  fs.writeFileSync(
    path.join(contractsDir, 'deployed-addresses.json'),
    JSON.stringify(deployedConfig, null, 2)
  );

  const envLocalContent = `# ============================================================================
# DIPTOS (diptos.xyz) — LIVE ON-CHAIN & MULTI-WALLET ENVIRONMENT (.env.local)
# ============================================================================

# 1. RPC Endpoints (Local Base 8453 Node + Base Sepolia + Ethereum Sepolia)
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_DEFAULT_CHAIN_ID=8453

# 2. Deployed Smart Contract Addresses on Base Node (Chain ID 8453)
NEXT_PUBLIC_TEST_USDC_ADDRESS=${testUsdc.address}
NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS=${identityRegistry.address}
NEXT_PUBLIC_SLASHER_ADDRESS=${slasher.address}
NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS=${invoiceRegistry.address}
NEXT_PUBLIC_RWA_INVOICE_3643_ADDRESS=${rwaInvoice3643.address}
NEXT_PUBLIC_RWA_VAULT_4626_ADDRESS=${rwaVault4626.address}
NEXT_PUBLIC_SETTLEMENT_ESCROW_ADDRESS=${settlementEscrow.address}

# 3. Pre-Funded Base & ETH Wallets (50 ETH + 2,500,000 dUSDC each via Faucet)
NEXT_PUBLIC_SUPPLIER_WALLET_ADDRESS=${ENV_WALLETS.supplier.address}
NEXT_PUBLIC_SUPPLIER_PRIVATE_KEY=${ENV_WALLETS.supplier.privateKey}
DIPTOS_SUPPLIER_PRIVATE_KEY=${ENV_WALLETS.supplier.privateKey}

NEXT_PUBLIC_BUYER_WALLET_ADDRESS=${ENV_WALLETS.buyer.address}
NEXT_PUBLIC_BUYER_PRIVATE_KEY=${ENV_WALLETS.buyer.privateKey}
DIPTOS_BUYER_PRIVATE_KEY=${ENV_WALLETS.buyer.privateKey}

NEXT_PUBLIC_FINANCIER_WALLET_ADDRESS=${ENV_WALLETS.financier.address}
NEXT_PUBLIC_FINANCIER_PRIVATE_KEY=${ENV_WALLETS.financier.privateKey}
DIPTOS_FINANCIER_PRIVATE_KEY=${ENV_WALLETS.financier.privateKey}

# 4. ERC-4337 Paymaster / Faucet Relayer Key
DIPTOS_FAUCET_MASTER_PRIVATE_KEY=${ANVIL_FAUCET_KEY}

# 5. Optional Privy Dashboard App ID (if using hosted Privy cloud modal)
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_PRIVY_CLIENT_ID=
`;

  fs.writeFileSync(path.join(__dirname, '..', '.env.local'), envLocalContent);
  fs.writeFileSync(path.join(__dirname, '..', '.env.example'), envLocalContent);
  fs.writeFileSync(path.join(contractsDir, '.env'), envLocalContent);

  console.log('Successfully wrote frontend/.env.local, contracts/.env, and contracts/deployed-addresses.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
