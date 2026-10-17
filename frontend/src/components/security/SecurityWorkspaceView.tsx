'use client';

import React from 'react';
import {
  ACTIVE_SUPPLY_CHAIN_CREDENTIALS,
  ACTIVE_UNDERWRITER_NODES,
} from '@/layers/layer3-di-security';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { SemanticPill } from '@/components/ui/SemanticPill';

export function SecurityWorkspaceView() {
  const { didPkh, vleiProfile, smartAccountAddress, eoaAddress } = useDiptosIdentity();

  return (
    <div className="space-y-6">
      {/* Top Identity Hierarchy Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs lg:col-span-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
                Layer 3 — Global Corporate Identity Hierarchy
              </span>
              <h2 className="mt-0.5 text-[17px] font-bold text-[#0F172A]">
                GLEIF vLEI + ONCHAINID (ERC-734/735) Binding
              </h2>
            </div>
            <SemanticPill variant="emerald">QVI ROOT ANCHORED ✓</SemanticPill>
          </div>

          <dl className="mt-4 space-y-3 text-[13px]">
            <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
              <dt className="text-[#64748B]">Corporate Legal Name:</dt>
              <dd className="font-semibold text-[#0F172A]">{vleiProfile?.legalName}</dd>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
              <dt className="text-[#64748B]">20-Character GLEIF LEI:</dt>
              <dd className="font-mono font-bold text-[#047857]">{vleiProfile?.lei}</dd>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
              <dt className="text-[#64748B]">W3C DID:PKH (Base 8453):</dt>
              <dd className="font-mono text-[11px] text-[#0F172A] break-all">{didPkh}</dd>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0] pb-2">
              <dt className="text-[#64748B]">ONCHAINID Smart Contract:</dt>
              <dd className="font-mono text-[11px] text-[#1D4ED8]">
                {vleiProfile?.onchainIdAddress}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748B]">ERC-4337 Smart Account / EOA:</dt>
              <dd className="font-mono text-[11px] text-[#475569]">
                {smartAccountAddress?.slice(0, 8)}... / {eoaAddress?.slice(0, 8)}...
              </dd>
            </div>
          </dl>
        </div>

        {/* Active W3C Verifiable Credentials 2.0 */}
        <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs lg:col-span-6">
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-[#475569]">
                W3C Verifiable Credentials Data Model 2.0
              </span>
              <h2 className="mt-0.5 text-[17px] font-bold text-[#0F172A]">
                Supply Chain &amp; EU CBAM Credentials
              </h2>
            </div>
            <SemanticPill variant="blue">PRIVADO ID ZK READY</SemanticPill>
          </div>

          <div className="mt-4 space-y-3">
            {ACTIVE_SUPPLY_CHAIN_CREDENTIALS.map((vc) => (
              <div
                key={vc.id}
                className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#0F172A]">
                    {vc.type[1]}
                  </span>
                  <SemanticPill variant="emerald">{vc.status}</SemanticPill>
                </div>
                <div className="mt-1 text-[12px] font-medium text-[#0F172A]">
                  {vc.claimSummary}
                </div>
                <div className="mt-1 font-mono text-[11px] text-[#64748B]">
                  Issuer: {vc.issuerName}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slasher.sol Verifier & Underwriter Staking Table (Replacing SME Staking) */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#0F172A]">
              Slasher.sol — Accredited Verifier &amp; Pool Underwriter Collateral Bonds
            </h3>
            <p className="text-[13px] text-[#64748B]">
              Cash-strapped SMEs never post speculative crypto collateral. Economic skin-in-the-game is posted by ingestion relayers and pool underwriters.
            </p>
          </div>
          <SemanticPill variant="emerald">$3.10M ACTIVE SLASHABLE BOND</SemanticPill>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] font-semibold uppercase tracking-[0.05em] text-[#475569]">
                <th className="py-3 pl-4 pr-3">Verifier / Underwriter Node</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3 text-right">Bonded Collateral (USDC)</th>
                <th className="px-3 py-3 text-right">Invoices Attested</th>
                <th className="py-3 pl-3 pr-4 text-right">Slasher.sol Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {ACTIVE_UNDERWRITER_NODES.map((node) => (
                <tr key={node.id}>
                  <td className="py-3.5 pl-4 pr-3 font-medium text-[#0F172A]">
                    <div>{node.operatorName}</div>
                    <div className="font-mono text-[11px] text-[#64748B]">
                      {node.nodeAddress}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#334155]">{node.role}</td>
                  <td className="px-3 py-3.5 text-right font-mono font-bold text-[#0F172A] tabular-nums">
                    ${node.stakedBondUsd.toLocaleString()}
                  </td>
                  <td className="px-3 py-3.5 text-right font-mono text-[#334155] tabular-nums">
                    {node.invoicesVerifiedCount.toLocaleString()}
                  </td>
                  <td className="py-3.5 pl-3 pr-4 text-right">
                    <SemanticPill variant="emerald">{node.status}</SemanticPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
