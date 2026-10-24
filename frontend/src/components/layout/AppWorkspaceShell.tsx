'use client';

import React, { useEffect, useState } from 'react';
import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';
import {
  useDiptosIdentity,
  type DiptosWorkspaceRole,
} from '@/hooks/useDiptosIdentity';
import { DiptosHeader } from './DiptosHeader';
import { SupplierWorkspaceView } from '@/components/supplier/SupplierWorkspaceView';
import { FinancierWorkspaceView } from '@/components/financier/FinancierWorkspaceView';
import { RegistryWorkspaceView } from '@/components/registry/RegistryWorkspaceView';
import { SecurityWorkspaceView } from '@/components/security/SecurityWorkspaceView';
import { ZkEasAuditDrawer } from '@/components/drawers/ZkEasAuditDrawer';
import { ContractsModal } from '@/components/modals/ContractsModal';

export interface AppWorkspaceShellProps {
  forcedInitialRole?: DiptosWorkspaceRole;
}

export function AppWorkspaceShell({ forcedInitialRole }: AppWorkspaceShellProps) {
  const {
    activeRole,
    setActiveRole,
    protocolState,
    refreshProtocolState,
    isAuthenticated,
    activeAddress,
  } = useDiptosIdentity();

  const [auditInvoice, setAuditInvoice] = useState<RWAInvoiceRecord | null>(null);
  const [isContractsModalOpen, setIsContractsModalOpen] = useState(false);

  useEffect(() => {
    if (forcedInitialRole) {
      setActiveRole(forcedInitialRole);
    }
  }, [forcedInitialRole, setActiveRole]);

  // Periodic real-time protocol refresh
  useEffect(() => {
    const timer = setInterval(() => {
      refreshProtocolState();
    }, 8000);
    return () => clearInterval(timer);
  }, [refreshProtocolState]);

  const liveInvoices = protocolState?.invoices ?? [];
  const liveVaults = protocolState?.vaults ?? [];
  const liveIdentities = protocolState?.identities ?? [];

  // Zero static/hardcoded data
  const totalTvlUsd = liveVaults.reduce((sum, v) => sum + v.tvlUsd, 0);
  const totalReceivablesUsd = liveInvoices.reduce((sum, i) => sum + i.faceValueUsd, 0);
  const verifiedEntitiesCount = liveIdentities.length;

  const walletBalanceDisplay =
    isAuthenticated && activeAddress
      ? protocolState?.connectedWalletBalances
        ? `$${protocolState.connectedWalletBalances.usdcBalance} dUSDC • ${protocolState.connectedWalletBalances.ethBalance} ETH`
        : '$0.00 dUSDC • 0.0000 ETH'
      : 'Wallet Not Connected';

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      <DiptosHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
        {/* Dynamic 4-Metric Real-Time Ledger Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-slate-900/60 border border-slate-800 rounded-xl divide-y lg:divide-y-0 lg:divide-x divide-slate-800 shadow-sm">
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Live Vault TVL
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              ${totalTvlUsd.toLocaleString('en-US')}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Active RWA Notes
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {liveInvoices.length}{' '}
              <span className="text-xs font-normal text-slate-400 font-sans">
                (${totalReceivablesUsd.toLocaleString('en-US')})
              </span>
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Verified vLEI Entities
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-white mt-1">
              {verifiedEntitiesCount}{' '}
              <span className="text-xs font-normal text-emerald-400 font-sans">
                On-Chain
              </span>
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Connected Balance
            </div>
            <div className="text-base font-semibold font-mono tabular-nums text-emerald-400 mt-1 truncate">
              {walletBalanceDisplay}
            </div>
          </div>
        </div>

        {/* Dynamic Active Workspace View */}
        {activeRole === 'supplier' && (
          <SupplierWorkspaceView
            invoices={liveInvoices}
            onAccelerateInvoice={() => refreshProtocolState()}
            onInspectAudit={(inv) => setAuditInvoice(inv)}
          />
        )}

        {activeRole === 'financier' && (
          <FinancierWorkspaceView
            invoices={liveInvoices}
            onFundInvoice={() => refreshProtocolState()}
            onInspectAudit={(inv) => setAuditInvoice(inv)}
          />
        )}

        {activeRole === 'registry' && (
          <RegistryWorkspaceView invoices={liveInvoices} />
        )}

        {activeRole === 'security' && (
          <SecurityWorkspaceView
            identities={liveIdentities}
            credentials={protocolState?.credentials ?? []}
            verifierNodes={protocolState?.verifierNodes ?? []}
            onRefresh={() => refreshProtocolState()}
          />
        )}
      </main>

      {/* Global Audit Drawer & Modals */}
      <ZkEasAuditDrawer
        invoice={auditInvoice}
        isOpen={Boolean(auditInvoice)}
        onClose={() => setAuditInvoice(null)}
      />

      <ContractsModal
        isOpen={isContractsModalOpen}
        onClose={() => setIsContractsModalOpen(false)}
      />

      <footer className="border-t border-slate-800/80 bg-[#080C14] px-4 py-6 text-xs text-slate-500">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Diptos Protocol</span>
            <span>&copy; {new Date().getFullYear()}</span>
            <span>•</span>
            <span className="font-mono text-[11px]">Base L2 (Chain ID 8453)</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <a href="https://diptos.xyz/docs/GTM_STRATEGY.md" className="hover:text-slate-300 transition">GTM Strategy</a>
            <a href="https://github.com/Jayram2204/Diptos" target="_blank" rel="noreferrer" className="hover:text-slate-300 transition">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
