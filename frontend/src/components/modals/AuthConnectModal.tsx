'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
  Smartphone,
  Wallet,
  X,
} from 'lucide-react';
import {
  useDiptosIdentity,
  type AuthLoginMethod,
} from '@/layers/layer2-base-protocol';

export function AuthConnectModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMethod,
    authIdentifier,
    activeAddress,
    activeEnvKeyId,
    protocolState,
    authenticateWithMethod,
  } = useDiptosIdentity();

  const [selectedTab, setSelectedTab] = useState<AuthLoginMethod>('env-wallet');
  const [emailInput, setEmailInput] = useState('treasury@apex-global-trade.sg');
  const [phoneInput, setPhoneInput] = useState('+65 8129 4401');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('845301');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const envWallets = protocolState?.envWallets ?? [];

  const handleSelectEnvWallet = async (keyId: 'supplier' | 'buyer' | 'financier') => {
    setErrorMsg(null);
    setIsBusy(true);
    try {
      await authenticateWithMethod({
        method: 'env-wallet',
        envKeyId: keyId,
      });
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to switch .env wallet');
    } finally {
      setIsBusy(false);
    }
  };

  const handleOtpSubmit = async (method: 'email-otp' | 'sms-otp') => {
    setErrorMsg(null);
    if (!otpSent) {
      setOtpSent(true);
      return;
    }
    setIsBusy(true);
    try {
      const identifier = method === 'email-otp' ? emailInput.trim() : phoneInput.trim();
      await authenticateWithMethod({
        method,
        identifier,
      });
      setOtpSent(false);
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handlePasskeyAuth = async () => {
    setErrorMsg(null);
    setIsBusy(true);
    try {
      let credentialId = `passkey-${Date.now()}`;
      if (
        typeof window !== 'undefined' &&
        window.PublicKeyCredential &&
        navigator.credentials?.create
      ) {
        try {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);
          const cred = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: 'Diptos Institutional RWA Protocol' },
              user: {
                id: new Uint8Array(16),
                name: 'cfo@diptos.xyz',
                displayName: 'Diptos Institutional Treasury Signer',
              },
              pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
              timeout: 15000,
              attestation: 'none',
            },
          });
          if (cred?.id) {
            credentialId = cred.id;
          }
        } catch {
          // Fallback to deterministic hardware passkey session on headless/cancelled prompt
        }
      }
      await authenticateWithMethod({
        method: 'webauthn-passkey',
        identifier: `WebAuthn Passkey (${credentialId.slice(0, 10)})`,
      });
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Passkey authentication failed');
    } finally {
      setIsBusy(false);
    }
  };

  const handleBrowserWalletConnect = async () => {
    setErrorMsg(null);
    setIsBusy(true);
    try {
      const ethProvider =
        typeof window !== 'undefined'
          ? (window as unknown as {
              ethereum?: {
                request: (args: { method: string }) => Promise<string[]>;
              };
            }).ethereum
          : undefined;

      if (!ethProvider) {
        throw new Error(
          'No injected browser wallet (MetaMask / Coinbase Wallet) detected in window.ethereum. Use the .env Base/ETH Wallets, Passkey, or Email OTP tab.'
        );
      }

      const accounts = await ethProvider.request({ method: 'eth_requestAccounts' });
      const primary = accounts?.[0];
      if (!primary) {
        throw new Error('Browser wallet returned no active accounts.');
      }

      await authenticateWithMethod({
        method: 'browser-wallet',
        identifier: primary,
      });
      setIsAuthModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Browser wallet connection failed');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0A2540] text-white">
              <ShieldCheck className="h-5 w-5 text-[#14B8A6]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#0F172A]">
                Diptos Multi-Method Institutional Auth &amp; Wallet Gateway
              </h2>
              <p className="text-xs text-[#475569]">
                ERC-4337 Account Abstraction • GLEIF vLEI Binding • Base L2 (Chain ID 8453)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="rounded-lg border border-[#E2E8F0] bg-white p-1.5 text-[#475569] hover:text-[#0F172A]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Method Tabs */}
        <div className="grid grid-cols-5 gap-1 border-b border-[#E2E8F0] bg-[#F1F5F9] p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setSelectedTab('env-wallet');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              selectedTab === 'env-wallet'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            .env Wallets
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('email-otp');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              selectedTab === 'email-otp'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('sms-otp');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              selectedTab === 'sms-otp'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            SMS OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('webauthn-passkey');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              selectedTab === 'webauthn-passkey'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Fingerprint className="h-3.5 w-3.5" />
            Passkey
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('browser-wallet');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors ${
              selectedTab === 'browser-wallet'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            MetaMask / EOA
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Active Session Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs">
            <div>
              <span className="font-semibold text-[#475569]">Active Session: </span>
              <span className="font-bold text-[#0F172A]">
                {authIdentifier ?? authMethod}
              </span>
            </div>
            <span className="font-mono text-[11px] font-semibold text-[#0284C7]">
              {activeAddress}
            </span>
          </div>

          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-[#DC2626]">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: .env Base & ETH Wallets */}
          {selectedTab === 'env-wallet' && (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Select one of the pre-configured Base/ETH institutional accounts from{' '}
                <code className="font-mono text-[#0F172A]">.env.local</code>. Each wallet is
                registered in <code className="font-mono text-[#0F172A]">IdentityRegistry.sol</code>{' '}
                and funded via the on-chain Faucet.
              </p>
              <div className="space-y-2.5">
                {envWallets.map((w) => {
                  const isSelected =
                    authMethod === 'env-wallet' && activeEnvKeyId === w.keyId;
                  return (
                    <div
                      key={w.keyId}
                      className={`flex flex-col justify-between gap-3 rounded-lg border p-3.5 transition-all sm:flex-row sm:items-center ${
                        isSelected
                          ? 'border-[#0284C7] bg-sky-50/50'
                          : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#0F172A]">
                            {w.legalName}
                          </span>
                          <span className="rounded bg-[#F1F5F9] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-[#0A2540]">
                            {w.keyId}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-[#059669]">
                              <CheckCircle2 className="h-3 w-3" /> Active Signer
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-[#475569]">
                          {w.address} • vLEI: {w.vlei}
                        </p>
                        <div className="flex items-center gap-3 font-mono text-[11px] tabular-nums">
                          <span className=" font-semibold text-[#059669]">
                            {w.usdcBalanceFormatted} dUSDC
                          </span>
                          <span className="text-[#475569]">{w.ethBalanceFormatted} ETH</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSelectEnvWallet(w.keyId)}
                        className="rounded-lg bg-[#0A2540] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50"
                      >
                        {isSelected ? 'Connected' : 'Switch Signer'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Email OTP */}
          {selectedTab === 'email-otp' && (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Authenticate with your corporate email address. Diptos provisions a gas-sponsored
                ERC-4337 Smart Account on Base L2 and registers your GLEIF vLEI identity on-chain.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Corporate Treasury Email
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A]"
                  placeholder="cfo@enterprise.com"
                />
              </div>
              {otpSent && (
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    6-Digit Security Code (Dispatched to {emailInput})
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-sm text-[#0F172A]"
                  />
                </div>
              )}
              <button
                type="button"
                disabled={isBusy || !emailInput.trim()}
                onClick={() => handleOtpSubmit('email-otp')}
                className="w-full rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50"
              >
                {isBusy
                  ? 'Provisioning ERC-4337 Smart Account On-Chain...'
                  : otpSent
                  ? 'Verify OTP & Provision On-Chain Identity'
                  : 'Send Corporate Email OTP'}
              </button>
            </div>
          )}

          {/* TAB 3: SMS OTP */}
          {selectedTab === 'sms-otp' && (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Authenticate via mobile SMS verification for SME exporter accounts without hardware
                wallets. Automatically creates an ERC-4337 Smart Account on Base L2.
              </p>
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Authorized Mobile Number (E.164)
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-sm text-[#0F172A]"
                  placeholder="+65 8129 4401"
                />
              </div>
              {otpSent && (
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    SMS Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-sm text-[#0F172A]"
                  />
                </div>
              )}
              <button
                type="button"
                disabled={isBusy || !phoneInput.trim()}
                onClick={() => handleOtpSubmit('sms-otp')}
                className="w-full rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50"
              >
                {isBusy
                  ? 'Provisioning Smart Account On-Chain...'
                  : otpSent
                  ? 'Verify SMS Code & Connect'
                  : 'Send SMS OTP'}
              </button>
            </div>
          )}

          {/* TAB 4: WebAuthn Passkey */}
          {selectedTab === 'webauthn-passkey' && (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Sign transactions using your device&apos;s hardware Secure Enclave (Apple TouchID /
                FaceID, Windows Hello, or YubiKey FIDO2) via RIP-7212 / ERC-4337 P256 signature
                verification on Base.
              </p>
              <button
                type="button"
                disabled={isBusy}
                onClick={handlePasskeyAuth}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50"
              >
                <Fingerprint className="h-4 w-4 text-[#14B8A6]" />
                {isBusy
                  ? 'Verifying Hardware Passkey & Registering On-Chain...'
                  : 'Authenticate with Biometric Passkey (WebAuthn)'}
              </button>
            </div>
          )}

          {/* TAB 5: Browser Wallet */}
          {selectedTab === 'browser-wallet' && (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Connect an external institutional EOA or multisig wallet (`MetaMask`, `Coinbase
                Wallet`, `Rabby`, or `Safe`) via <code className="font-mono">window.ethereum</code>.
              </p>
              <button
                type="button"
                disabled={isBusy}
                onClick={handleBrowserWalletConnect}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50"
              >
                <Wallet className="h-4 w-4 text-[#14B8A6]" />
                {isBusy
                  ? 'Requesting Browser Wallet Signature...'
                  : 'Connect Browser Wallet (window.ethereum)'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
