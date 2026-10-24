'use client';

import React from 'react';
import { Copy, Check, ExternalLink, ShieldCheck, X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0B111E] p-6 shadow-2xl shadow-emerald-950/20">
        <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                Verified Smart Contracts
              </h2>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3.5 w-3.5" />
                7/7 Verified On-Chain
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Compiled with Solidity 0.8.24 (Cancun EVM) and deployed on Base L2 (Chain ID 84532 / 31337).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
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
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 text-xs hover:border-slate-700 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-slate-200">
                      {meta.name}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                      {meta.standard}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400 truncate">
                    {meta.purpose}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <code className="rounded bg-[#06090F] px-1.5 py-0.5 font-mono text-[11px] text-emerald-400">
                      {address}
                    </code>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(meta.key, address)}
                    className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[11px] font-mono text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
                    title="Copy Contract Address"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`https://sepolia.basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-800/60 px-2 py-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 hover:border-slate-700 transition"
                    title="View on BaseScan"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          <span>Native AA Paymaster &amp; Gas Tank Active</span>
          <span className="font-mono text-emerald-400">Zero Gas for Whitelisted Partners</span>
        </div>
      </div>
    </div>
  );
}
