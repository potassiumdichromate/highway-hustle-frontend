import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import {
  useLoginWithEmail,
  useLoginWithOAuth,
  useLogin,
  usePrivy,
  useCreateWallet,
  useWallets,
} from '@privy-io/react-auth'
import logo from '@/assets/logo-flame.png'
import { getPrimaryPrivyWallet } from '@/hooks/usePrivyWalletTools'
import './LoginModal.css'

/* ─── helpers ─── */
function getFriendlyError(code: string | undefined, fallback?: string) {
  switch (code) {
    case 'exited_auth_flow': return ''
    case 'client_request_timeout': return 'Wallet login timed out. Keep the wallet app open and try again.'
    case 'allowlist_rejected': return 'This origin is not allowed in the Privy configuration.'
    case 'unable_to_sign':
    case 'invalid_message': return 'Signature not completed. Unlock your wallet and try again.'
    case 'generic_connect_wallet_error':
    case 'unknown_connect_wallet_error': return "Wallet connection failed. Try opening the site inside your wallet's browser."
    default: return fallback || ''
  }
}

function isMobileSupported() {
  if (typeof window === 'undefined') return true
  const { protocol, hostname } = window.location
  return protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1'
}

/* ─── icons ─── */
const GoogleIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5c-.3 1.6-1.3 3-2.7 3.9v3.2h4.4c2.6-2.3 4.1-5.6 4.1-9.2z"/>
    <path fill="#34A853" d="M12 24c3.6 0 6.6-1.2 8.8-3.2l-4.4-3.2c-1.2.8-2.7 1.3-4.4 1.3-3.4 0-6.2-2.3-7.2-5.3H.2v3.3C2.3 21.3 6.8 24 12 24z"/>
    <path fill="#FBBC05" d="M4.8 13.6c-.3-1-.3-2 0-3V7.3H.2C-1 9.6-1 12.4.2 14.7l4.6-1.1z"/>
    <path fill="#EA4335" d="M12 4.7c1.9 0 3.6.7 4.9 1.9l3.7-3.7C18.6 1 15.6 0 12 0 6.8 0 2.3 2.7.2 7.3l4.6 3.3C5.8 7.1 8.6 4.7 12 4.7z"/>
  </svg>
)

const WalletIcon = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M3.75 7.5h13.5a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V9.75a2.25 2.25 0 0 1 2.25-2.25Z" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M18.75 12.75h-2.25a1.5 1.5 0 1 0 0 3h2.25a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75Z" fill="currentColor"/>
    <path d="M17.25 5.25H6a2.25 2.25 0 0 0-2.25 2.25v1.5" stroke="currentColor" strokeWidth="1.6"/>
  </svg>
)

const SpinnerIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" style={{ animation: 'hh-spin 0.75s linear infinite', flexShrink: 0 }}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    <style>{`@keyframes hh-spin { to { transform: rotate(360deg); } }`}</style>
  </svg>
)

/* ─── sub-components ─── */
function ErrorBanner({ msg }: { msg: string }) {
  if (!msg) return null
  return <div className="hh-login-alert hh-login-alert--error">{msg}</div>
}

function Divider() {
  return (
    <div className="hh-login-divider">
      <span className="hh-login-divider-line" />
      <span className="hh-login-divider-label">or</span>
      <span className="hh-login-divider-line" />
    </div>
  )
}

function EmailForm({
  email, setEmail, emailState, onSubmit, disabled,
}: {
  email: string
  setEmail: (s: string) => void
  emailState: ReturnType<typeof useLoginWithEmail>['state']
  onSubmit: React.FormEventHandler<HTMLFormElement>
  disabled: boolean
}) {
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-2">
        <span className="hh-login-field-label">Email address</span>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="hh-login-input"
          disabled={disabled}
          autoComplete="email"
        />
      </label>
      <button
        type="submit"
        className="hh-login-primary"
        disabled={disabled || emailState.status === 'sending-code' || emailState.status === 'submitting-code'}
      >
        {emailState.status === 'sending-code' ? <><SpinnerIcon /> Sending…</> : 'Send Code'}
      </button>
    </form>
  )
}

function CodeForm({
  code, setCode, onBack, onSubmit, emailState,
}: {
  code: string
  setCode: (s: string) => void
  onBack: () => void
  onSubmit: React.FormEventHandler<HTMLFormElement>
  emailState: ReturnType<typeof useLoginWithEmail>['state']
}) {
  const busy = emailState.status === 'submitting-code' || emailState.status === 'sending-code'
  const awaitingAuth = emailState.status === 'done'
  return (
    <form className="grid gap-3" onSubmit={onSubmit}>
      <label className="grid gap-2">
        <span className="hh-login-field-label">Enter 6-digit code</span>
        <input
          type="text"
          pattern="[0-9]{6}"
          inputMode="numeric"
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="hh-login-input"
          style={{ textAlign: 'center', letterSpacing: '0.4em' }}
          autoComplete="one-time-code"
          autoFocus
        />
      </label>
      <div className="mt-1 flex justify-between gap-2">
        <button type="button" onClick={onBack} className="hh-login-link">
          ← Edit email
        </button>
        <button
          type="submit"
          className="hh-login-primary"
          style={{ width: 'auto', flexShrink: 0 }}
          disabled={busy || awaitingAuth}
        >
          {busy ? <><SpinnerIcon /> Verifying…</> : awaitingAuth ? <><SpinnerIcon /> Connecting…</> : 'Verify & Login'}
        </button>
      </div>
    </form>
  )
}

/* ─── main component ─── */
export interface LoginModalProps {
  open: boolean
  onClose: () => void
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const dialogSuppressedRef = useRef(false)
  const loginFlowActiveRef = useRef(false)
  const authenticatedRef = useRef(false)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [emailStep, setEmailStep] = useState<'enter-email' | 'enter-code'>('enter-email')
  const [error, setError] = useState('')
  const [walletFlowBusy, setWalletFlowBusy] = useState(false)

  const { ready, authenticated, user } = usePrivy()
  const { wallets } = useWallets()
  const { createWallet } = useCreateWallet()
  const [creating, setCreating] = useState(false)

  const primaryWallet = useMemo(() => getPrimaryPrivyWallet(user, wallets), [user, wallets])
  const existingAddress = primaryWallet?.address as string | undefined
  const authDisabled = !ready

  useEffect(() => { authenticatedRef.current = authenticated }, [authenticated])

  const requestDismiss = useCallback(() => {
    dialogSuppressedRef.current = false
    loginFlowActiveRef.current = false
    setWalletFlowBusy(false)
    try {
      dialogRef.current?.close()
    } catch {
      /* ignore */
    }
    onClose()
  }, [onClose])

  /* ── open / close dialog ── */
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (!open) {
      dialogSuppressedRef.current = false
    }
    if (open && !dialogSuppressedRef.current) {
      if (!el.open) {
        try {
          el.showModal()
        } catch {
          /* ignore */
        }
      }
    } else if (!open && el.open) {
      try {
        el.close()
      } catch {
        /* ignore */
      }
    }
    return () => {
      try {
        el.close()
      } catch {
        /* ignore */
      }
    }
  }, [open])

  const closeDialogForPrivyFlow = () => {
    dialogSuppressedRef.current = true
    try {
      if (dialogRef.current?.open) dialogRef.current.close()
    } catch {
      /* ignore */
    }
  }

  const reopenDialog = useCallback(() => {
    dialogSuppressedRef.current = false
    try {
      if (open && dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
    } catch {
      /* ignore */
    }
  }, [open])

  /* ── close when authenticated ── */
  useEffect(() => {
    if (!authenticated) return
    const isEmailOrSocial = Boolean(user?.email?.address || user?.google?.email)
    if (isEmailOrSocial && !existingAddress && !creating) {
      setCreating(true)
      createWallet().catch(() => {}).finally(() => setCreating(false))
      return
    }
    if (existingAddress || !isEmailOrSocial) {
      requestDismiss()
    }
  }, [authenticated, existingAddress, user, wallets, requestDismiss, creating, createWallet])

  const handleCancel = (e: React.SyntheticEvent) => {
    e.preventDefault()
    requestDismiss()
  }

  /* ── Google OAuth ── */
  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: () => {},
    onError: (err: any) => {
      const msg = String(err?.message ?? err?.code ?? err)
      if (msg.includes('exited_auth_flow')) { setError(''); reopenDialog(); return }
      setError(msg || 'Google login failed')
      reopenDialog()
    },
  })

  /* ── Email OTP ── */
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onComplete: () => {},
    onError: (err: any) => setError((err?.message ?? err?.code ?? String(err)) || 'Email login failed'),
  })

  const handleEmailSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await sendCode({ email })
      setEmailStep('enter-code')
    } catch (err: any) {
      setError(err?.message || 'Failed to send code')
    }
  }

  const handleCodeSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await loginWithCode({ code })
    } catch (err: any) {
      setError(err?.message || 'Verification failed')
    }
  }

  /* ── Wallet — opens Privy's own wallet picker UI ── */
  const { login } = useLogin({
    onComplete: () => {
      loginFlowActiveRef.current = false
      setWalletFlowBusy(false)
    },
    onError: (errorCode: any) => {
      loginFlowActiveRef.current = false
      setWalletFlowBusy(false)
      if (errorCode === 'exited_auth_flow' || String(errorCode).includes('exited_auth_flow')) {
        setError(''); reopenDialog(); return
      }
      const code = typeof (errorCode as any)?.privyErrorCode === 'string'
        ? (errorCode as any).privyErrorCode
        : typeof errorCode === 'string' ? errorCode : String(errorCode)
      setError(getFriendlyError(code, 'Failed to connect wallet') || 'Failed to connect wallet')
      reopenDialog()
    },
  })

  const connectWallet = () => {
    if (authDisabled || walletFlowBusy) return
    if (!isMobileSupported()) {
      setError(`Mobile wallet login requires HTTPS. Current origin: ${window.location.origin}`)
      return
    }
    setError('')
    setWalletFlowBusy(true)
    setTimeout(() => {
      closeDialogForPrivyFlow()
      loginFlowActiveRef.current = true
      // Opens Privy's native wallet picker (MetaMask, WalletConnect, Rainbow, etc.)
      login({ loginMethods: ['wallet'], walletChainType: 'ethereum-only' })
    }, 150)
  }

  return (
    <dialog
      ref={dialogRef}
      className="hh-login-modal"
      onCancel={handleCancel}
      aria-labelledby="hh-login-title"
      aria-modal="true"
    >
      <div className="hh-login-shell">
        <div className="hh-login-orb hh-login-orb--one" aria-hidden="true" />
        <div className="hh-login-orb hh-login-orb--two" aria-hidden="true" />

        <div className="hh-login-card">
          <span className="hh-login-rivet hh-login-rivet--tl" aria-hidden="true" />
          <span className="hh-login-rivet hh-login-rivet--tr" aria-hidden="true" />
          <span className="hh-login-rivet hh-login-rivet--bl" aria-hidden="true" />
          <span className="hh-login-rivet hh-login-rivet--br" aria-hidden="true" />

          <div className="hh-login-crest-shell" aria-hidden="true">
            <img src={logo} alt="" className="hh-login-crest" />
          </div>

          <button
            type="button"
            className="hh-login-close"
            onClick={requestDismiss}
            aria-label="Close sign-in dialog"
          >
            ×
          </button>

          <div className="hh-login-scroll">
            <div className="hh-login-title-card">
              <h2 className="hh-login-title" id="hh-login-title">Sign In</h2>
              <p className="hh-login-subtitle">Email, Google, or connect a wallet.</p>
            </div>

            {existingAddress && (
              <div className="hh-login-badge">
                Wallet: <span className="hh-login-badge-address">{existingAddress}</span>
              </div>
            )}

            <ErrorBanner msg={error} />

            <div className="grid gap-1">
              {emailStep === 'enter-email' ? (
                <EmailForm
                  email={email}
                  setEmail={setEmail}
                  emailState={emailState}
                  onSubmit={handleEmailSubmit}
                  disabled={authDisabled}
                />
              ) : (
                <CodeForm
                  code={code}
                  setCode={setCode}
                  onBack={() => { setEmailStep('enter-email'); setCode(''); setError('') }}
                  onSubmit={handleCodeSubmit}
                  emailState={emailState}
                />
              )}

              <Divider />

              {/* Google — Privy handles OAuth redirect */}
              <button
                type="button"
                className="hh-login-secondary"
                disabled={authDisabled || oauthLoading}
                onClick={() => { setError(''); initOAuth({ provider: 'google' }) }}
                aria-label="Continue with Google"
              >
                <span className="hh-login-method-icon hh-login-method-icon--google" aria-hidden="true">
                  <GoogleIcon />
                </span>
                <span className="hh-login-method-text">
                  <span className="hh-login-method-title">
                    {oauthLoading ? 'Connecting…' : 'Google'}
                  </span>
                </span>
                {oauthLoading && <SpinnerIcon />}
              </button>

              {/* Wallet — opens Privy's native wallet picker directly */}
              <button
                type="button"
                className="hh-login-secondary"
                disabled={authDisabled || walletFlowBusy}
                onClick={connectWallet}
                aria-label="Connect a wallet"
              >
                <span className="hh-login-method-icon hh-login-method-icon--wallet" aria-hidden="true">
                  <WalletIcon />
                </span>
                <span className="hh-login-method-text">
                  <span className="hh-login-method-title">
                    {walletFlowBusy ? 'Opening wallet…' : 'Connect Wallet'}
                  </span>
                </span>
                {walletFlowBusy && <SpinnerIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
