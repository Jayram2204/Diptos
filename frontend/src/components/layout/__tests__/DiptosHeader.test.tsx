import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiptosWeb3Provider } from '@/providers/DiptosWeb3Provider';
import { DiptosHeader } from '../DiptosHeader';

describe('Institutional Header & Dynamic MetaMask Auth Gateway (DiptosHeader)', () => {
  it('displays the verified vLEI & ONCHAINID pill (did:pkh:base:0x...), switches workspaces, and opens the dynamic MetaMask Auth Modal without hardcoded .env wallets', () => {
    render(
      <DiptosWeb3Provider>
        <DiptosHeader />
      </DiptosWeb3Provider>
    );

    // Verified corporate identity pill should render in the header
    expect(screen.getByText(/did:pkh:base:0x/i)).toBeInTheDocument();
    expect(screen.getByText(/GLEIF vLEI/i)).toBeInTheDocument();
    expect(screen.getByText(/Gas: Sponsored \(ERC-4337\)/i)).toBeInTheDocument();

    // Role switcher buttons
    const supplierBtn = screen.getByRole('button', { name: /Supplier Portal/i });
    const financierBtn = screen.getByRole('button', { name: /Financier Credit Desk/i });

    expect(supplierBtn).toHaveAttribute('aria-pressed', 'true');
    expect(financierBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(financierBtn);

    expect(financierBtn).toHaveAttribute('aria-pressed', 'true');
    expect(supplierBtn).toHaveAttribute('aria-pressed', 'false');

    // Open Auth Modal and verify .env Wallets tab is removed and MetaMask / Injected EOA is default
    const connectBtn = screen.getByRole('button', { name: /Connect \/ Switch MetaMask/i });
    fireEvent.click(connectBtn);

    expect(screen.queryByText(/\.env Wallets/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Apex Global Industrial Exporters/i)).not.toBeInTheDocument();
    expect(screen.getByText(/MetaMask \/ Injected EOA/i)).toBeInTheDocument();
    expect(screen.getByText(/Register Corporate Identity On-Chain/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Register DID on Base/i })).toBeInTheDocument();
  });
});
