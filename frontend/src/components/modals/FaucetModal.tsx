'use client';

import React, { useState } from 'react';
import { CheckCircle2, Coins, Droplets, X } from 'lucide-react';
import type { Address } from 'viem';
import { useDiptosIdentity } from '@/layers/layer2-base-protocol';

export function FaucetModal() {
  const {
    isFaucetModalOpen,
    setIsFaucetModalOpen,
    activeAddress,
    protocolState,
    requestFaucetFunds,
  } = useDiptosIdentity();

  const [customRecipient, setCustomRecipient] = useState<string>('');
  const [ethAmount, setEthAmount] = useState<string>('10');
  const [usdcAmount, setUsdcAmount] = useState<string>('250000');
  const [isMinting, setIsMinting] = useState<boolean>(false);
  const [lastFaucetResult, setLastFaucetResult] = useState<{
    ethTxHash: string;
    usdcTxHash: string;
    newEthBalanceFormatted: string;
    newUsdcBalanceFormatted: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isFaucetModalOpen) return null;

  const targetAddress = (customRecipient.trim() || activeAddress || '') as Address;
  const registeredIdentities = protocolState?.identities ?? [];

  const handleDisburse = async (overrideRecipient?: Address) => {
    setErrorMsg(null);
    setIsMinting(true);
    try {
      const recipient = overrideRecipient || targetAddress;
      const res = await requestFaucetFunds({
        recipientAddress: recipient,
        ethAmount,
        usdcAmount,
      });
      setLastFaucetResult(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Faucet transaction failed');
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0B111E] shadow-2xl shadow-emerald-950/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Droplets className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Base L2 Institutional Test Faucet
              </h2>
              <p className="text-xs text-slate-400">
                Mints native ETH + <code className="font-mono text-emerald-400">DiptosTestUSDC.sol</code> (dUSDC) to
                connected accounts
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFaucetModalOpen(false)}
            className="rounded-lg border border-slate-800 bg-slate-900/60 p-1.5 text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Dynamically Registered On-Chain Corporate Identities Quick Top-Up */}
          {registeredIdentities.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Registered On-Chain Corporate Identities (IdentityRegistry.sol)
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {registeredIdentities.map((id) => (
                  <div
                    key={id.wallet}
                    className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-emerald-400">
                          {id.role}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">
                          {id.wallet.slice(0, 6)}...{id.wallet.slice(-4)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-semibold text-slate-200 line-clamp-1">
                        {id.legalName}
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-emerald-400 tabular-nums">
                        {id.usdcBalanceFormatted ?? '0'} dUSDC
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {id.ethBalanceFormatted ?? '0.0000'} ETH
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isMinting}
                      onClick={() => handleDisburse(id.wallet)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-800/60 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition disabled:opacity-50 cursor-pointer"
                    >
                      + Top Up {id.role}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom / Active Wallet Faucet Form */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">
                Wallet Faucet Disbursement
              </span>
              <span className="font-mono text-[11px] text-cyan-400">
                {protocolState?.contracts?.TEST_USDC ? `${protocolState.contracts.TEST_USDC.slice(0, 10)}...` : 'Base Sepolia'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Recipient Base / ETH Address
              </label>
              <input
                type="text"
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                placeholder={activeAddress ?? '0x...'}
                className="w-full rounded-lg border border-slate-800 bg-[#06090F] px-3 py-2 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Native Base ETH
                </label>
                <input
                  type="number"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#06090F] px-3 py-2 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  dUSDC (6 Decimals)
                </label>
                <input
                  type="number"
                  value={usdcAmount}
                  onChange={(e) => setUsdcAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-[#06090F] px-3 py-2 font-mono text-xs text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-400">
                {errorMsg}
              </div>
            )}

            {lastFaucetResult && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Faucet Minted Successfully on Base
                </div>
                <p className="font-mono text-[11px] text-slate-300">
                  Updated Balances: {lastFaucetResult.newEthBalanceFormatted} ETH •{' '}
                  {lastFaucetResult.newUsdcBalanceFormatted} dUSDC
                </p>
                <p className="font-mono text-[10px] text-slate-500 break-all">
                  Tx: {lastFaucetResult.usdcTxHash}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={isMinting || !targetAddress}
              onClick={() => handleDisburse()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Coins className="h-4 w-4" />
              {isMinting
                ? 'Executing On-Chain Faucet Mint...'
                : `Mint ${ethAmount} ETH + ${Number(usdcAmount).toLocaleString()} dUSDC`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
