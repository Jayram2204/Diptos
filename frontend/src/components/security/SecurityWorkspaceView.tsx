'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';

export function SecurityWorkspaceView() {
  const {
    didPkh,
    vleiProfile,
    smartAccountAddress,
    eoaAddress,
    protocolState,
    executeOnchainAction,
    setIsAuthModalOpen,
  } = useDiptosIdentity();

  const [activeSubTab, setActiveSubTab] = useState<'vlei-credentials' | 'slasher-bonds'>(
    'vlei-credentials'
  );

  const [showVcModal, setShowVcModal] = useState(false);
  const [vcType, setVcType] = useState('SupplyChainTier1VendorCredential');
  const [vcClaimSummary, setVcClaimSummary] = useState('');

  const [showBondModal, setShowBondModal] = useState(false);
  const [operatorName, setOperatorName] = useState('');
  const [operatorRole, setOperatorRole] = useState('');
  const [bondAmountUsd, setBondAmountUsd] = useState('');

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
        claimSummary: vcClaimSummary.trim(),
      });
      setShowVcModal(false);
      setVcClaimSummary('');
      setTxNotice(`Credential Anchored: ${res.hash}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostVerifierBond = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await executeOnchainAction('POST_VERIFIER_BOND', {
        operatorName: operatorName.trim(),
        role: operatorRole.trim(),
        amountUsd: Number(bondAmountUsd),
      });
      setShowBondModal(false);
      setOperatorName('');
      setOperatorRole('');
      setBondAmountUsd('');
      setTxNotice(`Bond Staked: ${res.hash}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Notice Banner */}
      {txNotice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 font-mono">
          <span className="truncate max-w-xl">{txNotice}</span>
          <button
            type="button"
            onClick={() => setTxNotice(null)}
            className="rounded px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 cursor-pointer font-sans"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Sub-Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('vlei-credentials')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeSubTab === 'vlei-credentials'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Corporate vLEI &amp; W3C Credentials
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('slasher-bonds')}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
              activeSubTab === 'slasher-bonds'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slasher.sol Verifier Bonds (${totalBondedUsd.toLocaleString()})
          </button>
        </div>

        {activeSubTab === 'vlei-credentials' ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Switch / Edit DID
            </button>
            <button
              type="button"
              onClick={() => setShowVcModal(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Issue W3C VC</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowBondModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Post Verifier Bond</span>
          </button>
        )}
      </div>

      {/* Tab 1: Corporate vLEI & W3C Credentials */}
      {activeSubTab === 'vlei-credentials' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* Identity Hierarchy Summary */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-none lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  GLEIF vLEI &amp; ONCHAINID
                </h3>
                <p className="text-[11px] text-slate-500">
                  Layer 3 W3C Corporate Identifier Binding
                </p>
              </div>
              <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-700 border border-emerald-200">
                Anchored
              </span>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">Legal Entity:</dt>
                <dd className="font-semibold text-slate-900">{vleiProfile?.legalName}</dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">GLEIF LEI:</dt>
                <dd className="font-mono font-medium text-slate-900">{vleiProfile?.lei}</dd>
              </div>
              <div className="border-b border-slate-100 pb-2">
                <dt className="text-slate-500 mb-1">W3C DID:PKH Identifier:</dt>
                <dd className="font-mono text-[11px] text-slate-800 bg-slate-50 p-2 rounded border border-slate-200 break-all">
                  {didPkh}
                </dd>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <dt className="text-slate-500">IdentityRegistry.sol:</dt>
                <dd className="font-mono text-[11px] text-slate-700 truncate max-w-[200px]">
                  {protocolState?.contracts.IDENTITY_REGISTRY ?? vleiProfile?.onchainIdAddress}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Signer / EOA:</dt>
                <dd className="font-mono text-[11px] text-slate-700">
                  {eoaAddress ? `${eoaAddress.slice(0, 6)}...${eoaAddress.slice(-4)}` : 'None'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Active W3C Verifiable Credentials */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-none lg:col-span-7">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  On-Chain Verifiable Credentials
                </h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                  {liveCredentials.length} VCs
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                W3C VC 2.0
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {liveCredentials.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No credentials anchored on-chain yet. Click <strong>Issue W3C VC</strong> above.
                </div>
              ) : (
                liveCredentials.map((vc) => (
                  <div
                    key={vc.id}
                    className="rounded-md border border-slate-200 bg-slate-50/60 p-2.5 text-xs transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-medium text-slate-900">
                        {vc.type[1] || vc.type[0]}
                      </span>
                      <span className="rounded bg-emerald-50 px-1.5 py-0.2 font-mono text-[10px] text-emerald-700 border border-emerald-200">
                        {vc.status}
                      </span>
                    </div>
                    <div className="mt-1 text-slate-700 font-medium">
                      {vc.claimSummary}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-slate-400">
                      Issuer: {vc.issuerName}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Slasher.sol Verifier Bonds */}
      {activeSubTab === 'slasher-bonds' && (
        <div className="rounded-lg border border-slate-200 bg-white shadow-none overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Verifier &amp; Underwriter Collateral Bonds
              </h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600">
                ${totalBondedUsd.toLocaleString()} Staked
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Slasher.sol
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  <th className="py-2.5 pl-4 pr-2">Node / Operator</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5 text-right">Bonded Stake</th>
                  <th className="px-3 py-2.5 text-right">Invoices Attested</th>
                  <th className="py-2.5 pl-2 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liveVerifierNodes.map((node) => (
                  <tr key={node.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 pl-4 pr-2 font-medium text-slate-900">
                      <div>{node.operatorName}</div>
                      <div className="font-mono text-[11px] text-slate-400 truncate max-w-[180px]">
                        {node.nodeAddress}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-600">{node.role}</td>
                    <td className="px-3 py-3 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      ${node.stakedBondUsd.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600 tabular-nums">
                      {node.invoicesVerifiedCount.toLocaleString()}
                    </td>
                    <td className="py-3 pl-2 pr-4 text-right">
                      <span className="rounded bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-700 border border-emerald-200">
                        {node.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Issue W3C VC */}
      {showVcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Issue W3C Verifiable Credential
              </h3>
              <button
                type="button"
                onClick={() => setShowVcModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIssueCredentialOnChain} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Credential Type
                </label>
                <select
                  value={vcType}
                  onChange={(e) => setVcType(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
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
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  ZK Claim Summary
                </label>
                <input
                  type="text"
                  value={vcClaimSummary}
                  onChange={(e) => setVcClaimSummary(e.target.value)}
                  placeholder="e.g. Tier-1 Verified Vendor with ISO-14064 ESG Audit"
                  required
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVcModal(false)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Anchoring...' : 'Commit Credential'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Post Verifier Bond */}
      {showBondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Post Verifier Bond (Slasher.sol)
              </h3>
              <button
                type="button"
                onClick={() => setShowBondModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePostVerifierBond} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Operator Legal Name
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Munich Trade Analytics GmbH"
                  required
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Node Role
                </label>
                <input
                  type="text"
                  value={operatorRole}
                  onChange={(e) => setOperatorRole(e.target.value)}
                  placeholder="e.g. EU CBAM Auditor"
                  required
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Bond Amount (USD)
                </label>
                <input
                  type="number"
                  value={bondAmountUsd}
                  onChange={(e) => setBondAmountUsd(e.target.value)}
                  placeholder="100000"
                  required
                  className="h-9 w-full rounded-md border border-slate-300 px-3 text-xs text-slate-900 font-mono focus:border-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBondModal(false)}
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-slate-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Staking...' : 'Stake Bond'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
