import { useState, useEffect } from "react";
import { useLoginWithEmail, usePrivy, useLoginWithOAuth } from "@privy-io/react-auth";
import { X, Mail, Wallet } from "lucide-react";
import logo from "@/assets/logo-flame.png";

interface CustomLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomLoginModal({ isOpen, onClose }: CustomLoginModalProps) {
  const { authenticated, login } = usePrivy();
  const { initOAuth } = useLoginWithOAuth();
  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ DIAGNOSTIC: Log every time authenticated changes
  useEffect(() => {
    if (authenticated && isOpen) {
      onClose();
    }
  }, [authenticated, isOpen, onClose]);

  // ✅ DIAGNOSTIC: Log email state changes
  useEffect(() => {
  }, [emailState]);

  if (!isOpen) return null;

  const handleSendCode = async () => {
    if (!email) return;
    try {
      setLoading(true);
      await sendCode({ email });
      setCodeSent(true);
    } catch (err) {
      console.error("❌ [Modal] Failed to send OTP code:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) return;
    try {
      setLoading(true);
      await loginWithCode({ code });
    } catch (err) {
      console.error("❌ [Modal] OTP verify failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletLogin = () => {
    // Show only wallet options in the Privy modal
    login({ loginMethods: ["wallet"] });
  };

  const handleGoogleLogin = () => {
    // Trigger Google OAuth directly
    initOAuth({ provider: "google" });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[450px] overflow-hidden rounded-[2rem] border-2 border-[#ff00ff]/30 bg-[#0a0a1a] shadow-[0_0_50px_rgba(255,0,255,0.15)] animate-in fade-in zoom-in duration-300">
        
        {/* Striped Top Bar */}
        <div className="h-1.5 w-full bg-[repeating-linear-gradient(45deg,#ff00ff,#ff00ff_10px,#00ffff_10px,#00ffff_20px)] opacity-80" />

        <button 
          onClick={onClose}
          className="absolute right-6 top-8 rounded-full bg-white/5 p-2 text-muted-foreground transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center px-10 pb-12 pt-12">
          {/* App Logo */}
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a] p-4 shadow-[0_0_30px_rgba(255,0,255,0.1)] border border-white/5">
            <img src={logo} alt="Logo" className="h-full w-auto object-contain" />
          </div>

          <h2 className="mb-2 font-display text-5xl font-black tracking-widest text-[#ff00ff] uppercase text-shadow-glow">
            SIGN IN
          </h2>
          <p className="mb-10 text-center text-sm font-bold tracking-wider text-muted-foreground">
            Email, Google, or Wallet.
          </p>

          <div className="w-full space-y-4">
            {/* Email Input Section */}
            <div className="space-y-3">
              <label className="block pl-1 text-xs font-black tracking-[0.2em] text-white uppercase opacity-80">
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00ffff] transition-colors group-focus-within:text-[#ff00ff]" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 font-sans text-sm font-bold text-white placeholder:text-muted-foreground/40 focus:border-[#ff00ff]/50 focus:outline-none focus:ring-1 focus:ring-[#ff00ff]/50 transition-all"
                />
              </div>

              {!codeSent ? (
                <button 
                  onClick={handleSendCode}
                  disabled={loading || !email}
                  className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#ff00ff] to-[#d400d4] font-display text-sm font-black tracking-[0.2em] text-white shadow-[0_0_20px_rgba(255,0,255,0.3)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,0,255,0.5)] active:scale-[0.98] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Code"}
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-4 font-sans text-sm font-bold text-white placeholder:text-muted-foreground/40 focus:border-[#ff00ff]/50 focus:outline-none focus:ring-1 focus:ring-[#ff00ff]/50 transition-all text-center tracking-[0.4em]"
                  />
                  <button 
                    onClick={handleVerifyCode}
                    disabled={loading || !code}
                    className="h-14 w-full rounded-2xl bg-gradient-to-r from-[#ff00ff] to-[#d400d4] font-display text-sm font-black tracking-[0.2em] text-white shadow-[0_0_20px_rgba(255,0,255,0.3)] transition hover:scale-[1.02] active:scale-[0.98] uppercase disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Login"}
                  </button>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center px-4">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <span className="relative bg-[#0a0a1a] px-4 font-display text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase">
                OR
              </span>
            </div>

            {/* Wallet Button — uses login() for proper auth session */}
            <button 
              onClick={handleWalletLogin}
              className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#ff00ff] to-[#d400d4] font-display text-sm font-black tracking-[0.2em] text-white shadow-[0_0_20px_rgba(255,0,255,0.2)] transition hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,0,255,0.4)] active:scale-[0.98] uppercase"
            >
              <Wallet className="h-5 w-5" />
              CONNECT WALLET
            </button>

            {/* Google Button — uses login() for proper auth session */}
            <button 
              onClick={handleGoogleLogin}
              className="flex h-14 w-full items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 font-display text-sm font-black tracking-[0.2em] text-white transition hover:bg-white/10 active:scale-[0.98] uppercase"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white p-1.5">
                <svg viewBox="0 0 24 24" className="h-full w-full">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              GOOGLE
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .text-shadow-glow {
          text-shadow: 0 0 20px rgba(255, 0, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
