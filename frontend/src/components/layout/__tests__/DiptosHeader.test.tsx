import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiptosWeb3Provider } from '@/providers/DiptosWeb3Provider';
import { DiptosHeader } from '../DiptosHeader';

describe('Institutional Header & Dynamic MetaMask Auth Gateway (DiptosHeader)', () => {
  it('displays the compact 56px header with Base Sepolia • Sponsored, unified vLEI button, switches workspaces, and opens the dynamic MetaMask Auth Modal', () => {
    render(
      <DiptosWeb3Provider>
        <DiptosHeader />
      </DiptosWeb3Provider>
    );

    // Compact network and gas status pill
    expect(screen.getByText(/Base Sepolia • Sponsored/i)).toBeInTheDocument();

    // Unified Wallet & vLEI button
    const walletButton = screen.getByRole('button', { name: /vLEI ✓|Connect MetaMask/i });
    expect(walletButton).toBeInTheDocument();

    // Ghost Faucet button
    expect(screen.getByRole('button', { name: /Faucet/i })).toBeInTheDocument();

    // Workspace switcher buttons
    const supplierBtn = screen.getByRole('button', { name: /Supplier Portal/i });
    const financierBtn = screen.getByRole('button', { name: /Financier Desk/i });
    const registryBtn = screen.getByRole('button', { name: /Hash Registry/i });
    const securityBtn = screen.getByRole('button', { name: /DI & Security/i });

    expect(supplierBtn).toHaveAttribute('aria-pressed', 'true');
    expect(financierBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(financierBtn);

    expect(financierBtn).toHaveAttribute('aria-pressed', 'true');
    expect(supplierBtn).toHaveAttribute('aria-pressed', 'false');

    // Open Auth Modal via unified wallet button and verify dynamic MetaMask connection
    fireEvent.click(walletButton);

    expect(screen.queryByText(/\.env Wallets/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apex Global Industrial Exporters/i)).not.toBeInTheDocument();
    expect(screen.getByText(/MetaMask \/ Injected EOA/i)).toBeInTheDocument();
    expect(screen.getByText(/Register Corporate Identity On-Chain/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register DID on Base/i })).toBeInTheDocument();
  });
});
