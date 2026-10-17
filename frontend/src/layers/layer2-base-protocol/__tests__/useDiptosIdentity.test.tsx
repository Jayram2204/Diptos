import { describe, expect, it, vi } from 'vitest';
import { parseAbi } from 'viem';
import { executeTxWithSmartWalletOrWagmi } from '../hooks/useDiptosIdentity';

const SAMPLE_ABI = parseAbi([
  'function mintVerifiedInvoice(bytes32 canonicalHash, uint256 faceValue, bytes3 currency, uint64 dueDate, string buyerDID, bytes32 zkProofHash) external',
]);

describe('Layer 2 — useDiptosIdentity & executeSponsoredTx Dispatcher', () => {
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
});
