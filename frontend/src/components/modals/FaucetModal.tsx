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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A2540] text-white">
              <Droplets className="h-5 w-5 text-[#14B8A6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">
                Diptos Base L2 &amp; ETH Institutional Test Faucet
              </h2>
              <p className="text-xs text-[#475569]">
                Mints native ETH + <code className="font-mono">DiptosTestUSDC.sol</code> (dUSDC) to
                your connected MetaMask or Smart Account wallet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFaucetModalOpen(false)}
            className="rounded-lg border border-[#E2E8F0] bg-white p-1.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Dynamically Registered On-Chain Corporate Identities Quick Top-Up */}
          {registeredIdentities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] mb-2">
                Registered On-Chain Corporate Identities (IdentityRegistry.sol)
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {registeredIdentities.map((id) => (
                  <div
                    key={id.wallet}
                    className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-[#0A2540] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-white">
                          {id.role}
                        </span>
                        <span className="font-mono text-[10px] text-[#475569]">
                          {id.wallet.slice(0, 6)}...{id.wallet.slice(-4)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs font-semibold text-[#0F172A] line-clamp-1">
                        {id.legalName}
                      </p>
                      <p className="mt-1 font-mono text-xs font-bold text-[#059669] tabular-nums">
                        {id.usdcBalanceFormatted ?? '0'} dUSDC
                      </p>
                      <p className="font-mono text-[11px] text-[#475569] tabular-nums">
                        {id.ethBalanceFormatted ?? '0.0000'} ETH
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isMinting}
                      onClick={() => handleDisburse(id.wallet)}
                      className="w-full rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#0A2540] hover:bg-[#F1F5F9] disabled:opacity-50 cursor-pointer"
                    >
                      + Top Up {id.role} Wallet
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom / Active Wallet Faucet Form */}
          <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0F172A]">
                Connected / Custom Wallet Faucet Disbursement
              </span>
              <span className="font-mono text-[11px] text-[#0284C7]">
                Contract: {protocolState?.contracts.TEST_USDC}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#475569] mb-1">
                Recipient Base / ETH Address (Defaults to Active Connected Account)
              </label>
              <input
                type="text"
                value={customRecipient}
                onChange={(e) => setCustomRecipient(e.target.value)}
                placeholder={activeAddress ?? '0x...'}
                className="w-full rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] px-3 py-2 font-mono text-xs text-[#0F172A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Native Base ETH Amount
                </label>
                <input
                  type="number"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-xs text-[#0F172A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1">
                  Institutional dUSDC Amount (6 Decimals)
                </label>
                <input
                  type="number"
                  value={usdcAmount}
                  onChange={(e) => setUsdcAmount(e.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-xs text-[#0F172A]"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-[#DC2626]">
                {errorMsg}
              </div>
            )}

            {lastFaucetResult && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#059669]">
                  <CheckCircle2 className="h-4 w-4" />
                  On-Chain Faucet Minted ETH + dUSDC Successfully
                </div>
                <p className="font-mono text-[11px] text-[#0F172A]">
                  Updated Balances: {lastFaucetResult.newEthBalanceFormatted} ETH •{' '}
                  {lastFaucetResult.newUsdcBalanceFormatted} dUSDC
                </p>
                <p className="font-mono text-[10px] text-[#475569]">
                  dUSDC Mint Tx: {lastFaucetResult.usdcTxHash}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={isMinting || !targetAddress}
              onClick={() => handleDisburse()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
            >
              <Coins className="h-4 w-4 text-[#14B8A6]" />
              {isMinting
                ? 'Executing On-Chain Faucet Mint...'
                : `Mint ${ethAmount} ETH + ${Number(usdcAmount).toLocaleString()} dUSDC to ${
                    targetAddress.slice(0, 6)
                  }...${targetAddress.slice(-4)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
