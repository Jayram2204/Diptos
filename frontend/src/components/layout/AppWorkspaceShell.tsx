'use client';

import React, { useEffect, useState } from 'react';
import {
  INITIAL_DIPTOS_INVOICES,
  type RWAInvoiceRecord,
} from '@/layers/layer1-rwa-core';
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
  const { activeRole, setActiveRole } = useDiptosIdentity();
  const [invoices, setInvoices] = useState<RWAInvoiceRecord[]>(INITIAL_DIPTOS_INVOICES);
  const [auditInvoice, setAuditInvoice] = useState<RWAInvoiceRecord | null>(null);

  useEffect(() => {
    if (forcedInitialRole) {
      setActiveRole(forcedInitialRole);
    }
  }, [forcedInitialRole, setActiveRole]);

  const handleMarkInvoiceFactored = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'FACTORED' } : inv
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <DiptosHeader />

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6">
        <Rwa3dArchitectureHero />

        {activeRole === 'supplier' && (
          <SupplierWorkspaceView
            invoices={invoices}
            onAccelerateInvoice={(id) => handleMarkInvoiceFactored(id)}
            onInspectAudit={(inv) => setAuditInvoice(inv)}
          />
        )}

        {activeRole === 'financier' && (
          <FinancierWorkspaceView
            invoices={invoices}
            onFundInvoice={(id) => handleMarkInvoiceFactored(id)}
            onInspectAudit={(inv) => setAuditInvoice(inv)}
          />
        )}

        {activeRole === 'registry' && (
          <RegistryWorkspaceView invoices={invoices} />
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
