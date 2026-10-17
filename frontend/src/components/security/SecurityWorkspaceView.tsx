'use client';

import React, { useState } from 'react';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { SemanticPill } from '@/components/ui/SemanticPill';

export function SecurityWorkspaceView() {
  const {
    didPkh,
    vleiProfile,
    smartAccountAddress,
    eoaAddress,
    protocolState,
    executeOnchainAction,
  } = useDiptosIdentity();

  const [showVcForm, setShowVcForm] = useState(false);
  const [vcType, setVcType] = useState('SupplyChainTier1VendorCredential');
  const [vcClaimSummary, setVcClaimSummary] = useState(
    'Verified Tier-1 Exporter • Zero Commercial Disputes • ISO-14064-1 Audited'
  );

  const [showBondForm, setShowBondForm] = useState(false);
  const [operatorName, setOperatorName] = useState('Aegis Institutional RWA Underwriter Node');
  const [operatorRole, setOperatorRole] = useState('Pool Underwriter & Tax Portal Verifier');
  const [bondAmountUsd, setBondAmountUsd] = useState('450000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txNotice, setTxNotice] = useState<string | null>(null);

  const liveCredentials = protocolState?.credentials ?? [];
  const liveVerifierNodes = protocolState?.verifierNodes ?? [];
  const totalBondedUsd = liveVerifierNodes.reduce((sum, n) => sum + n.stakedBondUsd, 0);

  const handleIssueCredentialOnChain = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await executeOnchainAction('ISSUE_CREDENTIAL', {
        vcId: `urn:uuid:vc-${Date.now()}`,
        vcType,
        claimSummary: vcClaimSummary,
      });
      setShowVcForm(false);
      setTxNotice(`W3C Credential Anchored On-Chain (Tx: ${res.hash})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostVerifierBond = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await executeOnchainAction('POST_VERIFIER_BOND', {
        operatorName,
        role: operatorRole,
        amountUsd: Number(bondAmountUsd) || 450000,
      });
      setShowBondForm(false);
      setTxNotice(`Slasher Bond Staked On-Chain (Tx: ${res.hash})`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {txNotice && (
        <div className="flex items-center justify-between rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-5 py-3 text-xs font-mono text-[#047857]">
          <span className="break-all">{txNotice}</span>
          <button
            type="button"
            onClick={() => setTxNotice(null)}
            className="ml-3 rounded border border-[#A7F3D0] bg-white px-2 py-1 font-sans font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

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
              <dt className="text-[#64748B]">IdentityRegistry.sol Address:</dt>
              <dd className="font-mono text-[11px] text-[#1D4ED8]">
                {protocolState?.contracts.IDENTITY_REGISTRY ?? vleiProfile?.onchainIdAddress}
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
                Live Supply Chain &amp; EU CBAM Credentials ({liveCredentials.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowVcForm((prev) => !prev)}
              className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
            >
              + Issue W3C VC On-Chain
            </button>
          </div>

          {showVcForm && (
            <form
              onSubmit={handleIssueCredentialOnChain}
              className="mt-3 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-3.5 space-y-2.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-[#475569] mb-1">Credential Type</label>
                <select
                  value={vcType}
                  onChange={(e) => setVcType(e.target.value)}
                  className="w-full rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs text-[#0F172A]"
                >
                  <option value="SupplyChainTier1VendorCredential">
                    SupplyChainTier1VendorCredential
                  </option>
                  <option value="EuCbamCarbonFootprintCredential">
                    EuCbamCarbonFootprintCredential
                  </option>
                  <option value="GleifVleiCorporateRoleCredential">
                    GleifVleiCorporateRoleCredential
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#475569] mb-1">
                  ZK Selective Disclosure Claim Summary
                </label>
                <input
                  type="text"
                  value={vcClaimSummary}
                  onChange={(e) => setVcClaimSummary(e.target.value)}
                  required
                  className="w-full rounded border border-[#CBD5E1] bg-white px-2.5 py-1.5 text-xs text-[#0F172A]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded bg-[#0A2540] py-2 font-semibold text-white"
              >
                {isSubmitting ? 'Anchoring VC in IdentityRegistry.sol...' : 'Commit Credential On-Chain'}
              </button>
            </form>
          )}

          <div className="mt-4 space-y-3">
            {liveCredentials.map((vc) => (
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

      {/* Slasher.sol Verifier & Underwriter Staking Table */}
      <div className="rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div>
            <h3 className="text-[16px] font-bold text-[#0F172A]">
              Slasher.sol — Accredited Verifier &amp; Pool Underwriter Collateral Bonds
            </h3>
            <p className="text-[13px] text-[#64748B]">
              Cash-strapped SMEs never post speculative crypto collateral. Economic skin-in-the-game
              is posted by ingestion relayers and pool underwriters on Base L2.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SemanticPill variant="emerald">
              ${totalBondedUsd.toLocaleString('en-US')} ACTIVE SLASHABLE BOND
            </SemanticPill>
            <button
              type="button"
              onClick={() => setShowBondForm((prev) => !prev)}
              className="rounded-lg bg-[#0A2540] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1E293B] cursor-pointer"
            >
              + Post Verifier Bond
            </button>
          </div>
        </div>

        {showBondForm && (
          <form
            onSubmit={handlePostVerifierBond}
            className="mt-4 grid grid-cols-1 gap-3 rounded-lg border border-[#CBD5E1] bg-[#F8FAFC] p-4 sm:grid-cols-4 text-xs"
          >
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Operator Legal Name"
              required
              className="rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[#0F172A]"
            />
            <input
              type="text"
              value={operatorRole}
              onChange={(e) => setOperatorRole(e.target.value)}
              placeholder="Node Role"
              required
              className="rounded border border-[#CBD5E1] bg-white px-3 py-2 text-[#0F172A]"
            />
            <input
              type="number"
              value={bondAmountUsd}
              onChange={(e) => setBondAmountUsd(e.target.value)}
              placeholder="Bond Amount (USD)"
              required
              className="rounded border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-[#0F172A]"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-[#0A2540] px-4 py-2 font-semibold text-white"
            >
              {isSubmitting ? 'Staking in Slasher.sol...' : 'Stake Bond On-Chain'}
            </button>
          </form>
        )}

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
              {liveVerifierNodes.map((node) => (
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
