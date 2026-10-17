import { describe, expect, it, vi } from 'vitest';
import { encodeFunctionResult, keccak256, parseAbi, toHex } from 'viem';
import {
  executeMetaMaskConnectOrSwitch,
  executeTxWithSmartWalletOrWagmi,
} from '../hooks/useDiptosIdentity';
import { IDENTITY_REGISTRY_ABI } from '../config/contractAbis';

const SAMPLE_ABI = parseAbi([
  'function mintVerifiedInvoice(bytes32 canonicalHash, uint256 faceValue, bytes3 currency, uint64 dueDate, string buyerDID, bytes32 zkProofHash) external',
]);

describe('Layer 2 — useDiptosIdentity, connectOrSwitchMetaMask & executeSponsoredTx', () => {
  const contractAddress = '0x1111111111111111111111111111111111111111' as const;
  const sampleHash = '0x8f4e2c9a0000000000000000000000000000000000000000000000009941a2b8' as const;

  it('dispatches gas-sponsored Base transactions via Privy SmartWallet client when available', async () => {
    const sendTransactionMock = vi
      .fn()
      .mockResolvedValue('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
    const writeContractAsyncMock = vi.fn();

    const result = await executeTxWithSmartWalletOrWagmi({
      txParams: {
        to: contractAddress,
        abi: SAMPLE_ABI,
        functionName: 'mintVerifiedInvoice',
        args: [
          sampleHash,
          12500000n,
          '0x555344',
          1797465600n,
          'did:pkh:eip155:8453:0x2222222222222222222222222222222222222222',
          sampleHash,
        ],
      },
      smartWalletClient: {
        sendTransaction: sendTransactionMock,
      },
      writeContractAsync: writeContractAsyncMock,
      preferSmartWallet: true,
      chainId: 8453,
    });

    expect(sendTransactionMock).toHaveBeenCalledTimes(1);
    expect(writeContractAsyncMock).not.toHaveBeenCalled();
    expect(result.executionMode).toBe('erc4337-sponsored');
    expect(result.gasSponsored).toBe(true);
    expect(result.hash).toBe('0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
  });

  it('falls back to Wagmi writeContractAsync when external institutional wallet is used without a smart wallet client', async () => {
    const writeContractAsyncMock = vi
      .fn()
      .mockResolvedValue('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');

    const result = await executeTxWithSmartWalletOrWagmi({
      txParams: {
        to: contractAddress,
        abi: SAMPLE_ABI,
        functionName: 'mintVerifiedInvoice',
        args: [
          sampleHash,
          12500000n,
          '0x555344',
          1797465600n,
          'did:pkh:eip155:8453:0x2222222222222222222222222222222222222222',
          sampleHash,
        ],
      },
      smartWalletClient: null,
      writeContractAsync: writeContractAsyncMock,
      preferSmartWallet: false,
      chainId: 8453,
    });

    expect(writeContractAsyncMock).toHaveBeenCalledTimes(1);
    expect(result.executionMode).toBe('wagmi-eoa');
    expect(result.gasSponsored).toBe(false);
    expect(result.hash).toBe('0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
  });

  it('forces the MetaMask popup via wallet_requestPermissions + eth_requestAccounts, switches chain on mismatch (with 4902 fallback), signs EIP-191 challenge, and resolves IdentityRegistry.sol role', async () => {
    const mockWallet = '0x3ec000000000000000000000000000000000ecc2' as const;
    const mockClaimHash = keccak256(toHex('claim:financier'));
    const encodedIdentity = encodeFunctionResult({
      abi: IDENTITY_REGISTRY_ABI,
      functionName: 'getIdentity',
      result: {
        wallet: mockWallet,
        onchainIdContract: contractAddress,
        vlei: '5493001234567890ABCD',
        legalName: 'Dynamic Trade Credit Partners',
        jurisdiction: 'Base Sepolia (84532)',
        qviIssuer: 'GLEIF Qualified vLEI Issuer (QVI)',
        role: 'FINANCIER',
        vleiClaimHash: mockClaimHash,
        verified: true,
        registeredAt: 1797465600n,
      },
    });

    const requestCalls: { method: string; params?: unknown[] }[] = [];
    const mockEthereum = {
      request: vi.fn(async (args: { method: string; params?: unknown[] }) => {
        requestCalls.push(args);
        switch (args.method) {
          case 'wallet_requestPermissions':
            return [{ parentCapability: 'eth_accounts' }];
          case 'eth_requestAccounts':
            return [mockWallet];
          case 'eth_chainId':
            return '0x1'; // Ethereum mainnet -> triggers chain switch to Base Sepolia 0x14a34
          case 'wallet_switchEthereumChain': {
            const err = new Error('Unrecognized chain ID') as Error & { code: number };
            err.code = 4902;
            throw err;
          }
          case 'wallet_addEthereumChain':
            return null;
          case 'personal_sign':
            return '0xdeadbeefsignature';
          case 'eth_call':
            return encodedIdentity;
          default:
            return null;
        }
      }),
    };

    const res = await executeMetaMaskConnectOrSwitch({
      ethereum: mockEthereum,
      targetChainId: 84532,
      identityRegistryAddress: contractAddress,
    });

    expect(requestCalls.map((c) => c.method)).toEqual([
      'wallet_requestPermissions',
      'eth_requestAccounts',
      'eth_chainId',
      'wallet_switchEthereumChain',
      'wallet_addEthereumChain',
      'personal_sign',
      'eth_call',
    ]);
    expect(requestCalls[0].params).toEqual([{ eth_accounts: {} }]);
    expect(res.address).toBe(mockWallet);
    expect(res.chainId).toBe(84532);
    expect(res.didPkh).toBe(`did:pkh:eip155:84532:${mockWallet}`);
    expect(res.signature).toBe('0xdeadbeefsignature');
    expect(res.onChainIdentity?.role).toBe('FINANCIER');
    expect(res.onChainIdentity?.legalName).toBe('Dynamic Trade Credit Partners');
    expect(res.onChainIdentity?.verified).toBe(true);
  });
});
