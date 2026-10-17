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

  const liveInvoices = protocolState?.invoices ?? [];
  const liveVaults = protocolState?.vaults ?? [];
  const liveIdentities = protocolState?.identities ?? [];

  const totalTvlUsd = liveVaults.reduce((sum, v) => sum + v.tvlUsd, 0) || 14850000;
  const totalReceivablesUsd = liveInvoices.reduce((sum, i) => sum + i.faceValueUsd, 0);
  const verifiedEntitiesCount = liveIdentities.length || 3;

  const walletBalanceDisplay =
    isAuthenticated && activeAddress
      ? protocolState?.connectedWalletBalances
        ? `$${protocolState.connectedWalletBalances.usdcBalance} dUSDC • ${protocolState.connectedWalletBalances.ethBalance} ETH`
        : '$250,000 dUSDC • 10.00 ETH'
      : 'Disconnected';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <DiptosHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-5 space-y-5">
        {/* Slim 4-Metric Ledger Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200 shadow-none">
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Vault TVL
            </div>
            <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              ${totalTvlUsd.toLocaleString('en-US')}
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Active RWA Notes
            </div>
            <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {liveInvoices.length} (${totalReceivablesUsd.toLocaleString('en-US')})
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Verified vLEI Entities
            </div>
            <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5">
              {verifiedEntitiesCount} On-Chain
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Connected Wallet Balance
            </div>
            <div className="text-lg font-semibold font-mono tabular-nums text-slate-900 mt-0.5 truncate">
              {walletBalanceDisplay}
            </div>
          </div>
        </div>

        {/* Active Workspace View */}
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

        {activeRole === 'security' && <SecurityWorkspaceView />}
      </main>

      {/* Clean Single-Line Footer */}
      <footer className="border-t border-slate-200 bg-white py-3 px-4 lg:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <span>Diptos Protocol</span>
            <span className="mx-2 text-slate-300">•</span>
            <span>Self-Liquidating Global Trade Receivables on Base L2</span>
          </div>
          <button
            type="button"
            onClick={() => setIsContractsModalOpen(true)}
            className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-4 cursor-pointer"
          >
            View 7/7 Verified Contracts
          </button>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <ZkEasAuditDrawer
        invoice={auditInvoice}
        onClose={() => setAuditInvoice(null)}
      />

      <ContractsModal
        isOpen={isContractsModalOpen}
        onClose={() => setIsContractsModalOpen(false)}
      />
    </div>
  );
}
