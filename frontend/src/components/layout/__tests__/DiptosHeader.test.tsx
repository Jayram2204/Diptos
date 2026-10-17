import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiptosWeb3Provider } from '@/providers/DiptosWeb3Provider';
import { DiptosHeader } from '../DiptosHeader';

describe('Institutional Header & Role Switcher (DiptosHeader)', () => {
  it('displays the verified vLEI & ONCHAINID pill (did:pkh:base:0x...) and switches between Supplier Portal and Financier Credit Desk', () => {
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
  });
});
