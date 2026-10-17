import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createPublicClient,
  createWalletClient,
  http,
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

// Anvil Faucet / Paymaster Relayer Account #0
const ANVIL_FAUCET_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

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
  };

  fs.writeFileSync(
    path.join(contractsDir, 'deployed-addresses.json'),
    JSON.stringify(deployedConfig, null, 2)
  );

  const envLocalContent = `# ============================================================================
# DIPTOS (diptos.xyz) — DYNAMIC ON-CHAIN ENVIRONMENT (.env.local)
# ============================================================================

# 1. RPC Endpoints (Local Anvil Node + Base Sepolia + Base Mainnet)
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_BASE_MAINNET_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_ETH_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_DEFAULT_CHAIN_ID=84532

# 2. Deployed Smart Contract Addresses
NEXT_PUBLIC_TEST_USDC_ADDRESS=${testUsdc.address}
NEXT_PUBLIC_IDENTITY_REGISTRY_ADDRESS=${identityRegistry.address}
NEXT_PUBLIC_SLASHER_ADDRESS=${slasher.address}
NEXT_PUBLIC_INVOICE_REGISTRY_ADDRESS=${invoiceRegistry.address}
NEXT_PUBLIC_RWA_INVOICE_3643_ADDRESS=${rwaInvoice3643.address}
NEXT_PUBLIC_RWA_VAULT_4626_ADDRESS=${rwaVault4626.address}
NEXT_PUBLIC_SETTLEMENT_ESCROW_ADDRESS=${settlementEscrow.address}

# 3. ERC-4337 Paymaster / Faucet Relayer Key
DIPTOS_FAUCET_MASTER_PRIVATE_KEY=${ANVIL_FAUCET_KEY}

# 4. Optional Privy Dashboard App ID (if using hosted Privy cloud modal)
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
