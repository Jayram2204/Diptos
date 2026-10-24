'use client';

import React, { useState } from 'react';
import { Plus, X, Lock, ShieldCheck, KeyRound, Award, CheckCircle2 } from 'lucide-react';
import { useDiptosIdentity } from '@/hooks/useDiptosIdentity';
import { SemanticPill } from '@/components/ui/SemanticPill';

export interface SecurityWorkspaceViewProps {
  identities?: any[];
  credentials?: any[];
  verifierNodes?: any[];
  onRefresh?: () => void;
}

export function SecurityWorkspaceView({
  identities: propIdentities,
  credentials: propCredentials,
  verifierNodes: propVerifierNodes,
  onRefresh,
}: SecurityWorkspaceViewProps) {
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

  const liveCredentials = propCredentials ?? protocolState?.credentials ?? [];
  const liveVerifierNodes = propVerifierNodes ?? protocolState?.verifierNodes ?? [];
  const liveIdentities = propIdentities ?? protocolState?.identities ?? [];
  const totalBondedUsd = liveVerifierNodes.reduce((sum, n) => sum + (n.stakedBondUsd || 0), 0);

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
      setTxNotice(`Credential Anchored on Base: ${res.hash}`);
      onRefresh?.();
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
        operatorRole: operatorRole.trim(),
        bondAmountUsd: Math.max(1, Number(bondAmountUsd)),
      });
      setShowBondModal(false);
      setOperatorName('');
      setOperatorRole('');
      setBondAmountUsd('');
      setTxNotice(`Collateral Bond Staked in Slasher.sol: ${res.hash}`);
      onRefresh?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Transaction Notice */}
      {txNotice && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-xs text-emerald-300 font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{txNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setTxNotice(null)}
            className="text-xs text-emerald-400 hover:text-white cursor-pointer"
          >
            [Dismiss]
          </button>
        </div>
      )}

      {/* Top 3-Card Identity Overview Strip */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Card 1: GLEIF vLEI Profile */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              GLEIF vLEI Trust Anchor
            </span>
            <SemanticPill variant="emerald">GLEIF QUALIFIED</SemanticPill>
          </div>
          <div>
            <div className="text-base font-semibold text-white">
              {vleiProfile?.legalName ?? 'Corporate Legal Entity'}
            </div>
            <div className="mt-1 font-mono text-xs text-slate-400">
              LEI: {vleiProfile?.lei ?? 'Not Bound • Connect Wallet'}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              QVI Issuer: {vleiProfile?.qviIssuer ?? 'Global Legal Entity Identifier Foundation'}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 py-1.5 font-mono text-xs text-slate-300 hover:text-white hover:border-slate-600 transition cursor-pointer"
          >
            Switch / Register Corporate DID
          </button>
        </div>

        {/* Card 2: ONCHAINID Smart Account */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              ONCHAINID Identity Contract
            </span>
            <SemanticPill variant="blue">ERC-734 / ERC-735</SemanticPill>
          </div>
          <div className="space-y-1 font-mono text-xs">
            <div className="text-slate-400">
              Smart Account:{' '}
              <span className="text-cyan-400 truncate block">
                {smartAccountAddress ?? '0xPendingProvision'}
              </span>
            </div>
            <div className="text-slate-400">
              did:pkh:{' '}
              <span className="text-slate-300 truncate block text-[11px]">
                {didPkh ?? 'did:pkh:eip155:8453:...'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-500">
            Enforces transfer restrictions on RWAInvoice3643 notes.
          </div>
        </div>

        {/* Card 3: Privado ID ZK Shield */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Privado ID ZK Privacy Shield
            </span>
            <SemanticPill variant="zk-masked">GROTH16 SNARK</SemanticPill>
          </div>
          <div>
            <div className="text-base font-semibold text-emerald-400">
              0 Bytes Commercial Margin Leaked
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Line-item SKU pricing, margins, and rebate schedules are encrypted off-chain.
              Financiers verify solvency cryptographically.
            </p>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Circuit: Tier-1 Supplier &amp; EU CBAM ISO-14064
          </div>
        </div>
      </div>

      {/* Main Tabbed Console: W3C Credentials vs Slasher Bonds */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('vlei-credentials')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'vlei-credentials'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award className="h-4 w-4 text-emerald-400" />
              <span>W3C Verifiable Credentials ({liveCredentials.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('slasher-bonds')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'slasher-bonds'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Slasher Underwriter Bonds (${totalBondedUsd.toLocaleString()})</span>
            </button>
          </div>

          <div>
            {activeSubTab === 'vlei-credentials' ? (
              <button
                type="button"
                onClick={() => setShowVcModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Issue W3C Credential</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowBondModal(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500 transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Post Underwriter Bond</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: W3C Credentials Table */}
        {activeSubTab === 'vlei-credentials' && (
          <div className="overflow-x-auto">
            {liveCredentials.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <Award className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-white">No W3C Verifiable Credentials issued yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click &quot;Issue W3C Credential&quot; to anchor a verified relationship or carbon metric credential on Base L2.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-5 pr-2">Credential Type / ID</th>
                    <th className="px-3 py-3">Subject / Counterparty</th>
                    <th className="px-3 py-3">Claim Summary</th>
                    <th className="py-3 pl-2 pr-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {liveCredentials.map((vc) => (
                    <tr key={vc.vcId} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 pl-5 pr-2">
                        <div className="font-semibold text-white">{vc.vcType}</div>
                        <div className="text-[11px] text-cyan-400 truncate max-w-[200px]">{vc.vcId}</div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-300">
                        <div>{vc.subjectLegalName ?? 'Verified Supplier'}</div>
                        <div className="text-[11px] text-slate-500">vLEI: {vc.subjectVlei ?? '33580048...'}</div>
                      </td>
                      <td className="px-3 py-3.5 text-slate-300 font-sans text-xs">
                        {vc.claimSummary}
                      </td>
                      <td className="py-3.5 pl-2 pr-5 text-right">
                        <SemanticPill variant="emerald">ACTIVE VALID</SemanticPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Slasher Bonds Table */}
        {activeSubTab === 'slasher-bonds' && (
          <div className="overflow-x-auto">
            {liveVerifierNodes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <ShieldCheck className="h-8 w-8 mx-auto text-slate-600 mb-2" />
                <p className="font-semibold text-white">No underwriter bonds staked yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Accredited verifiers stake bonds in Slasher.sol to absorb risk for fraudulent attestations.
                </p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-5 pr-2">Operator / Role</th>
                    <th className="px-3 py-3">Bond Staked (dUSDC)</th>
                    <th className="px-3 py-3">Slashing Exposure</th>
                    <th className="py-3 pl-2 pr-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                  {liveVerifierNodes.map((node) => (
                    <tr key={node.nodeAddress} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 pl-5 pr-2">
                        <div className="font-semibold text-white font-sans">{node.operatorName}</div>
                        <div className="text-[11px] text-slate-400">{node.role}</div>
                        <div className="text-[10px] text-slate-500">{node.nodeAddress}</div>
                      </td>
                      <td className="px-3 py-3.5 text-white font-bold tabular-nums">
                        ${node.stakedBondUsd.toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 text-slate-300 font-sans text-xs">
                        100% bonded against forged attestations &amp; double-financing breaches.
                      </td>
                      <td className="py-3.5 pl-2 pr-5 text-right">
                        <SemanticPill variant="emerald">ACTIVE BONDED</SemanticPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modal: Issue W3C Credential */}
      {showVcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Issue W3C Verifiable Credential 2.0</h3>
              <button
                type="button"
                onClick={() => setShowVcModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleIssueCredentialOnChain} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Credential Schema
                </label>
                <select
                  value={vcType}
                  onChange={(e) => setVcType(e.target.value)}
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="SupplyChainTier1VendorCredential">
                    SupplyChainTier1VendorCredential (Buyer Relationship)
                  </option>
                  <option value="EUCbamCarbonBorderAdjustmentCredential">
                    EUCbamCarbonBorderAdjustmentCredential (ISO-14064-1)
                  </option>
                  <option value="AccreditedInvestorCredential">
                    AccreditedInvestorCredential (Reg D / Institutional)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Claim Summary / Business Terms
                </label>
                <textarea
                  rows={3}
                  value={vcClaimSummary}
                  onChange={(e) => setVcClaimSummary(e.target.value)}
                  placeholder="e.g. Certified Tier-1 manufacturing supplier for Continental AG with annual SLA volume > $5M"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-emerald-600 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Anchoring on Base L2...' : 'Sign & Anchor Credential On-Chain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Post Underwriter Bond */}
      {showBondModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Post Slasher Underwriter Bond</h3>
              <button
                type="button"
                onClick={() => setShowBondModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePostVerifierBond} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Operator Entity Legal Name
                </label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Meridian Underwriting Syndicate LP"
                  required
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Operator Role / Accreditation
                </label>
                <input
                  type="text"
                  value={operatorRole}
                  onChange={(e) => setOperatorRole(e.target.value)}
                  placeholder="Accredited KYB Verifier & ERP Relayer"
                  required
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Bond Amount (dUSDC)
                </label>
                <input
                  type="number"
                  value={bondAmountUsd}
                  onChange={(e) => setBondAmountUsd(e.target.value)}
                  placeholder="100000"
                  required
                  className="h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-xs text-white font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-cyan-600 py-2.5 text-xs font-semibold text-white hover:bg-cyan-500 transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Staking Bond on Base L2...' : 'Stake Collateral Bond in Slasher.sol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
