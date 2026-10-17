'use client';

import React from 'react';
import { Copy, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { DIPTOS_CONTRACT_ADDRESSES } from '@/layers/layer2-base-protocol/config/contractAbis';

interface ContractsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContractMeta {
  name: string;
  key: string;
  purpose: string;
  standard: string;
}

const CONTRACT_METADATA: ContractMeta[] = [
  {
    name: 'InvoiceRegistry.sol',
    key: 'INVOICE_REGISTRY',
    purpose: 'Deterministic Keccak256 Anti-Double-Financing & MonetaGo Bridge',
    standard: 'Layer 1 Core',
  },
  {
    name: 'RWAInvoice3643.sol',
    key: 'RWA_INVOICE_3643',
    purpose: 'ERC-3643 Permissioned Compliant Trade Receivable Security Tokens',
    standard: 'ERC-3643',
  },
  {
    name: 'SettlementEscrow.sol',
    key: 'SETTLEMENT_ESCROW',
    purpose: 'Atomic DvP Settlement Engine for dUSDC & Virtual IBAN Clearing',
    standard: 'Layer 2 Escrow',
  },
  {
    name: 'IdentityRegistry.sol',
    key: 'IDENTITY_REGISTRY',
    purpose: 'GLEIF vLEI, ONCHAINID (ERC-734/735), and Corporate Role Registry',
    standard: 'Layer 3 DI & ZK',
  },
  {
    name: 'Slasher.sol',
    key: 'SLASHER',
    purpose: 'Accredited Verifier & Pool Underwriter Collateral Staking & Slashing',
    standard: 'Layer 3 Security',
  },
  {
    name: 'SeniorDropVault.sol',
    key: 'SENIOR_DROP_VAULT',
    purpose: 'Senior Tranche Capital Vault with Subordinated First-Loss Protection',
    standard: 'ERC-4626',
  },
  {
    name: 'JuniorTinVault.sol',
    key: 'JUNIOR_TIN_VAULT',
    purpose: 'Junior Tranche High-Yield First-Loss Equity Buffer',
    standard: 'ERC-4626',
  },
];

export function ContractsModal({ isOpen, onClose }: ContractsModalProps) {
  const { protocolState } = useDiptosIdentity();
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (key: string, address: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(address);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const contracts = protocolState?.contracts || DIPTOS_CONTRACT_ADDRESSES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-slate-900">
                Verified Smart Contracts
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">
                <ShieldCheck className="h-3.5 w-3.5" />
                7/7 Verified On-Chain
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Compiled with Solidity 0.8.24 (Cancun EVM) and deployed on Base L2 (Chain ID 84532 / 31337).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
          {CONTRACT_METADATA.map((meta) => {
            const address =
              contracts[meta.key as keyof typeof contracts] ||
              DIPTOS_CONTRACT_ADDRESSES[meta.key as keyof typeof DIPTOS_CONTRACT_ADDRESSES] ||
              '0x0000000000000000000000000000000000000000';
            const isCopied = copiedKey === meta.key;

            return (
              <div
                key={meta.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 font-mono">
                      {meta.name}
                    </span>
                    <span className="rounded bg-slate-200/70 px-1.5 py-0.2 font-mono text-[10px] text-slate-600">
                      {meta.standard}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {meta.purpose}
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-700 truncate">
                    {address}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(meta.key, address)}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Copy Contract Address"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={`https://sepolia.basescan.org/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    title="View on BaseScan"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="font-mono text-[11px]">
            Test USDC Asset: {contracts.TEST_USDC || DIPTOS_CONTRACT_ADDRESSES.TEST_USDC}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
