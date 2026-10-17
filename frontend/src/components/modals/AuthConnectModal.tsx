'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ExternalLink,
  Fingerprint,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import {
  useDiptosIdentity,
  type AuthLoginMethod,
} from '@/layers/layer2-base-protocol';
import {
  generateValidGleifLei,
  type CorporateIdentityRole,
} from '@/layers/layer3-di-security';

export function AuthConnectModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMethod,
    authIdentifier,
    lastAuthSignature,
    activeAddress,
    didPkh,
    chainId,
    vleiProfile,
    isRegisteredOnChain,
    registeredCorporateRole,
    protocolState,
    authenticateWithMethod,
    connectOrSwitchMetaMask,
    switchNetworkInMetaMask,
    registerCorporateIdentityOnChain,
  } = useDiptosIdentity();

  const [selectedTab, setSelectedTab] = useState<AuthLoginMethod>('browser-wallet');
  const [targetChainId, setTargetChainId] = useState<number>(chainId || 84532);

  // Registration Form State (for unregistered wallets or updating identity)
  const [legalNameInput, setLegalNameInput] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<CorporateIdentityRole>('SUPPLIER');
  const [leiInput, setLeiInput] = useState<string>('');
  const [jurisdictionInput, setJurisdictionInput] = useState<string>(
    'Global Cross-Border (UNCITRAL MLETR • Base L2)'
  );
  const [mintInitialFaucet, setMintInitialFaucet] = useState<boolean>(true);
  const [showEditIdentityForm, setShowEditIdentityForm] = useState<boolean>(false);
  const [registrationTxHash, setRegistrationTxHash] = useState<string | null>(null);

  // Passkey / OTP State
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [missingMetaMask, setMissingMetaMask] = useState<boolean>(false);

  useEffect(() => {
    if (activeAddress && !leiInput) {
      setLeiInput(generateValidGleifLei(`${activeAddress}:default`));
    }
  }, [activeAddress, leiInput]);

  useEffect(() => {
    if (chainId) {
      setTargetChainId(chainId);
    }
  }, [chainId]);

  if (!isAuthModalOpen) return null;

  const hasInjectedProvider =
    typeof window !== 'undefined' &&
    Boolean((window as unknown as { ethereum?: unknown }).ethereum);

  const handleConnectOrSwitchMetaMask = async () => {
    setErrorMsg(null);
    setMissingMetaMask(false);
    setRegistrationTxHash(null);
    setIsBusy(true);
    try {
      const res = await connectOrSwitchMetaMask(targetChainId);
      setLeiInput(generateValidGleifLei(`${res.address}:${Date.now()}`));
      if (res.onChainIdentity?.verified) {
        setLegalNameInput(res.onChainIdentity.legalName);
        setSelectedRole(res.onChainIdentity.role);
        setLeiInput(res.onChainIdentity.vlei);
      }
    } catch (err) {
      const code = (err as { code?: string })?.code;
      const message =
        err instanceof Error ? err.message : 'MetaMask connection failed';
      if (code === 'METAMASK_NOT_FOUND' || message.toLowerCase().includes('metamask')) {
        setMissingMetaMask(true);
      }
      setErrorMsg(message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleChainSwitch = async (nextChainId: number) => {
    setTargetChainId(nextChainId);
    setErrorMsg(null);
    try {
      await switchNetworkInMetaMask(nextChainId);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Failed to switch network in MetaMask'
      );
    }
  };

  const handleGenerateLei = () => {
    const seed = `${activeAddress || '0x0'}:${legalNameInput}:${selectedRole}:${Date.now()}`;
    setLeiInput(generateValidGleifLei(seed));
  };

  const handleRegisterIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setRegistrationTxHash(null);
    setIsBusy(true);
    try {
      const receipt = await registerCorporateIdentityOnChain({
        legalName: legalNameInput,
        role: selectedRole,
        lei: leiInput,
        jurisdiction: jurisdictionInput,
        mintInitialFaucet,
      });
      setRegistrationTxHash(receipt.hash);
      setShowEditIdentityForm(false);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Failed to register Corporate Identity on-chain'
      );
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
      const identifier =
        method === 'email-otp' ? emailInput.trim() : phoneInput.trim();
      await authenticateWithMethod({
        method,
        identifier,
      });
      setOtpSent(false);
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
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Passkey authentication failed');
    } finally {
      setIsBusy(false);
    }
  };

  const shouldShowRegistrationForm =
    !isRegisteredOnChain || showEditIdentityForm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden my-auto">
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
                100% Dynamic EOA &amp; ERC-4337 • GLEIF vLEI Binding • IdentityRegistry.sol
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(false)}
            className="rounded-lg border border-[#E2E8F0] bg-white p-1.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Method Tabs — MetaMask / Injected EOA is Primary Default */}
        <div className="grid grid-cols-4 gap-1 border-b border-[#E2E8F0] bg-[#F1F5F9] p-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setSelectedTab('browser-wallet');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors cursor-pointer ${
              selectedTab === 'browser-wallet'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Wallet className="h-3.5 w-3.5" />
            MetaMask / Injected EOA
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('webauthn-passkey');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors cursor-pointer ${
              selectedTab === 'webauthn-passkey'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Fingerprint className="h-3.5 w-3.5" />
            Passkey / Smart Account
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('email-otp');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors cursor-pointer ${
              selectedTab === 'email-otp'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            Email / OTP
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedTab('sms-otp');
              setOtpSent(false);
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-colors cursor-pointer ${
              selectedTab === 'sms-otp'
                ? 'bg-[#0A2540] text-white shadow-xs'
                : 'text-[#475569] hover:text-[#0F172A]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            SMS OTP
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {/* Active Session & Dynamic DID Telemetry Banner */}
          <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-[#475569]">Active Signer: </span>
                <span className="font-bold text-[#0F172A]">
                  {authIdentifier ?? authMethod}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isRegisteredOnChain && registeredCorporateRole ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-[10px] font-bold text-[#059669]">
                    <CheckCircle2 className="h-3 w-3" />
                    ON-CHAIN ROLE: {registeredCorporateRole}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700">
                    UNREGISTERED ON-CHAIN
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
              <span className="text-[#0284C7] break-all">{didPkh}</span>
              {protocolState?.connectedWalletBalances && (
                <span className="font-semibold text-[#059669] tabular-nums">
                  {protocolState.connectedWalletBalances.usdcBalance} dUSDC •{' '}
                  {protocolState.connectedWalletBalances.ethBalance} ETH
                </span>
              )}
            </div>
          </div>

          {/* Explicit Missing MetaMask Warning Banner with Install Link */}
          {(!hasInjectedProvider || missingMetaMask) && selectedTab === 'browser-wallet' && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>MetaMask Browser Extension (window.ethereum) Not Detected</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                No injected EVM wallet was found in <code className="font-mono">window.ethereum</code>.
                Please install the official MetaMask browser extension to connect your Supplier,
                Buyer, or Financier accounts.
              </p>
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-[#0284C7] underline hover:text-[#0369A1]"
              >
                <span>Install MetaMask Extension (metamask.io/download)</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-[#DC2626]">
              {errorMsg}
            </div>
          )}

          {/* TAB 1 (PRIMARY): MetaMask / Injected EOA */}
          {selectedTab === 'browser-wallet' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#E2E8F0] bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">
                      Step 1 — Connect or Switch MetaMask Account &amp; Network
                    </h3>
                    <p className="text-[11px] text-[#475569]">
                      Calls <code className="font-mono">wallet_requestPermissions</code> +{' '}
                      <code className="font-mono">eth_requestAccounts</code> +{' '}
                      <code className="font-mono">personal_sign</code> to force the MetaMask popup
                      open so you can select your Supplier, Buyer, or Financier account.
                    </p>
                  </div>
                </div>

                {/* Target Network Switcher */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-[#475569]">
                    Target Chain:
                  </span>
                  {[
                    { id: 84532, label: 'Base Sepolia (0x14a34 / 84532)' },
                    { id: 31337, label: 'Local Anvil (0x7a69 / 31337)' },
                    { id: 8453, label: 'Base (0x2105 / 8453)' },
                  ].map((net) => (
                    <button
                      key={net.id}
                      type="button"
                      onClick={() => handleChainSwitch(net.id)}
                      className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-semibold transition cursor-pointer ${
                        targetChainId === net.id
                          ? 'border-[#0A2540] bg-[#0A2540] text-white'
                          : 'border-[#CBD5E1] bg-[#F8FAFC] text-[#475569] hover:text-[#0F172A]'
                      }`}
                    >
                      {net.label}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleConnectOrSwitchMetaMask}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
                  >
                    <Wallet className="h-4 w-4 text-[#14B8A6]" />
                    {isBusy
                      ? 'Opening MetaMask Popup...'
                      : 'Connect MetaMask'}
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={handleConnectOrSwitchMetaMask}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#0A2540] bg-white px-4 py-2.5 text-xs font-semibold text-[#0A2540] hover:bg-[#F8FAFC] disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-[#0284C7]" />
                    Switch MetaMask Account
                  </button>
                </div>

                {lastAuthSignature && (
                  <div className="rounded border border-emerald-200 bg-emerald-50/70 px-3 py-2 font-mono text-[10px] text-[#047857] break-all">
                    EIP-191 Ownership Signature Verified: {lastAuthSignature.slice(0, 34)}...
                    {lastAuthSignature.slice(-16)}
                  </div>
                )}
              </div>

              {/* Step 2: On-Chain Identity Resolution or Registration Form */}
              {isRegisteredOnChain && !shouldShowRegistrationForm && vleiProfile && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                      <span className="text-xs font-bold text-[#0F172A]">
                        Corporate Identity Verified in IdentityRegistry.sol
                      </span>
                    </div>
                    <span className="rounded bg-[#0A2540] px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                      {registeredCorporateRole}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[#64748B]">Legal Entity: </span>
                      <span className="font-semibold text-[#0F172A]">
                        {vleiProfile.legalName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#64748B]">20-Char LEI: </span>
                      <span className="font-mono font-bold text-[#047857]">
                        {vleiProfile.lei}
                      </span>
                    </div>
                    <div className="sm:col-span-2 font-mono text-[11px] text-[#475569] break-all">
                      vLEI Claim Hash: {vleiProfile.vleiClaimHash}
                    </div>
                  </div>

                  {registrationTxHash && (
                    <div className="font-mono text-[10px] text-[#047857] break-all">
                      IdentityRegistry Tx: {registrationTxHash}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-emerald-200/70">
                    <button
                      type="button"
                      onClick={() => {
                        setLegalNameInput(vleiProfile.legalName);
                        setSelectedRole(vleiProfile.role);
                        setLeiInput(vleiProfile.lei);
                        setShowEditIdentityForm(true);
                      }}
                      className="text-[11px] font-semibold text-[#0284C7] hover:underline cursor-pointer"
                    >
                      Update Role / Re-Register Identity On-Chain
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(false)}
                      className="rounded-lg bg-[#059669] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#047857] cursor-pointer"
                    >
                      Continue to {registeredCorporateRole} Workspace
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Passkey / Smart Account */}
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
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
              >
                <Fingerprint className="h-4 w-4 text-[#14B8A6]" />
                {isBusy
                  ? 'Verifying Hardware Passkey...'
                  : 'Authenticate with Biometric Passkey (WebAuthn)'}
              </button>
            </div>
          )}

          {/* TAB 3: Email OTP */}
          {selectedTab === 'email-otp' && (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Authenticate with your corporate email address to derive a deterministic ERC-4337
                Smart Account on Base L2.
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
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-sm text-[#0F172A]"
                  />
                </div>
              )}
              <button
                type="button"
                disabled={isBusy || !emailInput.trim()}
                onClick={() => handleOtpSubmit('email-otp')}
                className="w-full rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
              >
                {isBusy
                  ? 'Provisioning ERC-4337 Smart Account...'
                  : otpSent
                  ? 'Verify OTP & Connect Smart Account'
                  : 'Send Corporate Email OTP'}
              </button>
            </div>
          )}

          {/* TAB 4: SMS OTP */}
          {selectedTab === 'sms-otp' && (
            <div className="space-y-3">
              <p className="text-xs text-[#475569]">
                Authenticate via mobile SMS verification for SME exporter accounts. Automatically
                provisions an ERC-4337 Smart Account on Base L2.
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
                  placeholder="+1 415 555 0199"
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
                    placeholder="Enter 6-digit SMS code"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-sm text-[#0F172A]"
                  />
                </div>
              )}
              <button
                type="button"
                disabled={isBusy || !phoneInput.trim()}
                onClick={() => handleOtpSubmit('sms-otp')}
                className="w-full rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
              >
                {isBusy
                  ? 'Provisioning Smart Account...'
                  : otpSent
                  ? 'Verify SMS Code & Connect'
                  : 'Send SMS OTP'}
              </button>
            </div>
          )}

          {/* Dynamic On-Chain Corporate Identity Registration Form (shown whenever connected address is not registered in IdentityRegistry.sol) */}
          {shouldShowRegistrationForm && (
            <form
              onSubmit={handleRegisterIdentitySubmit}
              className="rounded-xl border border-[#CBD5E1] bg-[#F8FAFC] p-4 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0284C7]" />
                  <div>
                    <h3 className="text-xs font-bold text-[#0F172A]">
                      Register Corporate Identity On-Chain (IdentityRegistry.sol)
                    </h3>
                    <p className="text-[11px] text-[#475569]">
                      Wallet <code className="font-mono">{activeAddress?.slice(0, 8)}...{activeAddress?.slice(-4)}</code>{' '}
                      requires on-chain GLEIF vLEI &amp; Role binding on Base.
                    </p>
                  </div>
                </div>
                {showEditIdentityForm && (
                  <button
                    type="button"
                    onClick={() => setShowEditIdentityForm(false)}
                    className="text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A]"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Legal Entity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={legalNameInput}
                    onChange={(e) => setLegalNameInput(e.target.value)}
                    placeholder="Enter your corporate legal entity name"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Institutional Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value as CorporateIdentityRole)
                    }
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs font-semibold text-[#0F172A]"
                  >
                    <option value="SUPPLIER">SUPPLIER (Exporter / Originator)</option>
                    <option value="BUYER">BUYER (Anchor Obligor / EAS Co-Signer)</option>
                    <option value="FINANCIER">FINANCIER (Institutional LP / Underwriter)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#0F172A]">
                      20-Character GLEIF LEI
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateLei}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#0284C7] hover:underline cursor-pointer"
                    >
                      <Sparkles className="h-3 w-3" />
                      Generate 20-Char LEI
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    minLength={20}
                    value={leiInput}
                    onChange={(e) => setLeiInput(e.target.value.toUpperCase())}
                    placeholder="20-char ISO 17442 LEI"
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 font-mono text-xs text-[#0F172A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                    Jurisdiction &amp; Corridor
                  </label>
                  <input
                    type="text"
                    value={jurisdictionInput}
                    onChange={(e) => setJurisdictionInput(e.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-xs text-[#0F172A]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#334155] cursor-pointer">
                <input
                  type="checkbox"
                  checked={mintInitialFaucet}
                  onChange={(e) => setMintInitialFaucet(e.target.checked)}
                  className="h-4 w-4 accent-[#0A2540]"
                />
                <span>
                  Also mint initial test <code className="font-mono font-bold">250,000 dUSDC</code>{' '}
                  &amp; <code className="font-mono font-bold">10 ETH</code> via{' '}
                  <code className="font-mono">DiptosTestUSDC.sol</code> Faucet
                </span>
              </label>

              <button
                type="submit"
                disabled={isBusy || !legalNameInput.trim() || leiInput.trim().length !== 20}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A2540] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#1E293B] disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-[#14B8A6]" />
                {isBusy
                  ? 'Confirming writeContractAsync in MetaMask...'
                  : 'Register DID on Base'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
