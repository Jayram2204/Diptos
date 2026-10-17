'use client';

import React, { useEffect, useState } from 'react';
import type { RWAInvoiceRecord } from '@/layers/layer1-rwa-core';
import {
  useDiptosIdentity,
  type DiptosWorkspaceRole,
} from '@/hooks/useDiptosIdentity';
import { DiptosHeader } from './DiptosHeader';
import { Rwa3dArchitectureHero } from '@/components/ui/Rwa3dArchitectureHero';
import { SupplierWorkspaceView } from '@/components/supplier/SupplierWorkspaceView';
import { FinancierWorkspaceView } from '@/components/financier/FinancierWorkspaceView';
import { RegistryWorkspaceView } from '@/components/registry/RegistryWorkspaceView';
import { SecurityWorkspaceView } from '@/components/security/SecurityWorkspaceView';
import { ZkEasAuditDrawer } from '@/components/drawers/ZkEasAuditDrawer';

export interface AppWorkspaceShellProps {
  forcedInitialRole?: DiptosWorkspaceRole;
}

export function AppWorkspaceShell({ forcedInitialRole }: AppWorkspaceShellProps) {
  const {
    activeRole,
    setActiveRole,
    protocolState,
    refreshProtocolState,
  } = useDiptosIdentity();
  const [auditInvoice, setAuditInvoice] = useState<RWAInvoiceRecord | null>(null);

  useEffect(() => {
    if (forcedInitialRole) {
      setActiveRole(forcedInitialRole);
    }
  }, [forcedInitialRole, setActiveRole]);

  const liveInvoices = protocolState?.invoices ?? [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <DiptosHeader />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <Rwa3dArchitectureHero />

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

      <ZkEasAuditDrawer
        invoice={auditInvoice}
        onClose={() => setAuditInvoice(null)}
      />
    </div>
  );
}
