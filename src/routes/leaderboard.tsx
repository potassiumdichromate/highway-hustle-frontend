import { useEffect, useState, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Trophy, ArrowLeft, Crown, Medal, Brain, 
  Activity, Cpu, Shield, Zap, RefreshCw,
  Search, ExternalLink, ChevronRight, Loader2,
  Sparkles, Terminal
} from "lucide-react";
import logo from "@/assets/logo-flame.png";
import heroCar from "@/assets/hero-car.jpg";
import ogLogo from "@/assets/og-logo.png";
import NeuralBackground from "@/components/NeuralBackground";
import { usePrivyWalletTools } from "@/hooks/usePrivyWalletTools";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function DiagnosticBox({ label, status, active, loading }: { label: string, status: string, active?: boolean, loading?: boolean }) {
  return (
    <div className={`rounded-xl border ${active ? 'border-neon-cyan/20 bg-neon-cyan/5' : 'border-white/5 bg-white/[0.02]'} p-4 transition hover:border-white/10 backdrop-blur-sm relative overflow-hidden group`}>
      <div className="flex items-center justify-between mb-1 relative z-10">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
        {loading ? (
           <Loader2 className="h-2 w-2 animate-spin text-neon-cyan" />
        ) : (
          <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-neon-cyan animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]' : 'bg-muted-foreground/30'}`} />
        )}
      </div>
      <div className={`text-sm font-black tracking-tight ${active ? 'text-white' : 'text-muted-foreground'} uppercase relative z-10 italic`}>{status}</div>
      {active && <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
}

interface LeaderboardPlayer {
  _id: string;
  privyData?: {
    walletAddress?: string;
  };
  userGameData: {
    playerName: string;
    currency: number;
  };
  playerGameModeData: {
    bestScoreOneWay: number;
  };
  playerVehicleData: {
    selectedPlayerCarIndex: number;
  };
}

function LeaderboardPage() {
  const { activeWallet, privyAuthenticated } = usePrivyWalletTools();
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [inferenceSource, setInferenceSource] = useState<string>("0G Compute");
  const [diagnosticStatus, setDiagnosticStatus] = useState({
    garage: "Open",
    leaderboard: "Live",
    topRacer: "Analyzed",
    aiInsight: "Ready"
  });

  const fetchAiComment = useCallback(async (topPlayer: LeaderboardPlayer) => {
    setIsAiLoading(true);
    setDiagnosticStatus(prev => ({ ...prev, aiInsight: "Processing" }));
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
      const token = localStorage.getItem("hh_auth_token");
      
      // If not authenticated, we can't get the AI comment due to backend JWT requirement
      if (!token) {
        setAiComment("Sign in to unlock neural performance insights.");
        setDiagnosticStatus(prev => ({ ...prev, aiInsight: "Locked" }));
        return;
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      headers["Authorization"] = `Bearer ${token}`;

      // USE CURRENT USER'S ADDRESS for the query, NOT the top player's.
      // This satisfies the backend's enforceAuthIdentity check while still allowing comparison with topPlayer.
      const userId = activeWallet?.address || topPlayer.privyData?.walletAddress || topPlayer._id;
      
      const aiRes = await fetch(`${baseUrl}/leaderboard/ai-comment?user=${userId}&type=gate&t=${Date.now()}`, {
        headers
      });
      const aiData = await aiRes.json();
      if (aiData.success) {
        setAiComment(aiData.comment);
        if (aiData.source) setInferenceSource(aiData.source === "0g_compute" ? "0G Compute" : "Fallback");
        setDiagnosticStatus(prev => ({ ...prev, aiInsight: "Generated" }));
      } else if (aiData.code === "FORBIDDEN_IDENTITY_SCOPE") {
        console.warn("❌ Identity scope mismatch. User:", userId);
        setDiagnosticStatus(prev => ({ ...prev, aiInsight: "Identity Error" }));
      }
    } catch (err) {
      console.warn("⚠️ AI Insight failed:", err);
      setDiagnosticStatus(prev => ({ ...prev, aiInsight: "Offline" }));
    } finally {
      setIsAiLoading(false);
    }
  }, [activeWallet]);

  const fetchFullLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://highway-hustle-backend.onrender.com/api";
      const response = await fetch(`${baseUrl}/leaderboard?t=${Date.now()}`);
      const data = await response.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
        if (data.leaderboard.length > 0) {
          fetchAiComment(data.leaderboard[0]);
        }
      }
    } catch (error) {
      console.error("❌ Error fetching leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAiComment]);

  useEffect(() => {
    fetchFullLeaderboard();
  }, [fetchFullLeaderboard]);

  return (
    <div className="relative min-h-screen bg-[#050510] text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      <NeuralBackground />
      
      <div className="fixed inset-0 z-0 pointer-events-none opacity-5">
        <img src={heroCar} alt="" className="h-full w-full object-cover animate-car-cruise" />
      </div>

      <div className="relative z-10 pb-20">
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050510]/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
            <Link to="/" className="flex items-center gap-3 transition hover:opacity-80">
              <img src={logo} alt="Logo" className="h-10 w-auto" />
              <span className="font-display text-xl font-black tracking-widest text-white uppercase italic">Highway Hustle</span>
            </Link>
            
            <Link 
              to="/" 
              className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground transition hover:border-neon-cyan hover:text-white hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
              BACK TO HOME
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-12">
          {/* Diagnostic Stats */}
          <div className="mb-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <DiagnosticBox label="Vehicle Garage" status={diagnosticStatus.garage} active />
              <DiagnosticBox label="0G Leaderboard" status={diagnosticStatus.leaderboard} active loading={isLoading} />
              <DiagnosticBox label="Neural Target" status={diagnosticStatus.topRacer} active />
              <DiagnosticBox label="0G Compute" status={diagnosticStatus.aiInsight} active loading={isAiLoading} />
            </div>
            
            {/* AI Insight Section */}
            <div className="group relative overflow-hidden rounded-2xl border border-neon-cyan/20 bg-neon-cyan/[0.03] p-8 backdrop-blur-md transition hover:border-neon-cyan/40">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition duration-700">
                 <Brain className="h-24 w-24 text-neon-cyan" />
              </div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className={`p-4 rounded-full bg-neon-cyan/10 border-2 ${isAiLoading ? 'border-neon-cyan animate-pulse' : 'border-neon-cyan/30'} shadow-[0_0_20px_rgba(34,211,238,0.2)]`}>
                      <Brain className={`h-8 w-8 text-neon-cyan ${isAiLoading ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-neon-pink flex items-center justify-center border-2 border-[#0a0a1a] shadow-lg">
                      <Sparkles className="h-2.5 w-2.5 text-white animate-pulse" />
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black tracking-widest text-muted-foreground uppercase italic">
                    {inferenceSource}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-8 bg-neon-cyan/40" />
                    <span className="text-[10px] font-black tracking-[0.4em] text-neon-cyan uppercase italic">Neural Insight v5.0</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-neon-cyan/40 to-transparent" />
                  </div>
                  <div className="relative">
                    {isAiLoading ? (
                      <div className="flex flex-col gap-2">
                        <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded" />
                        <div className="h-4 w-1/2 bg-white/5 animate-pulse rounded" />
                      </div>
                    ) : (
                      <p className="text-xl font-black tracking-tight text-white/90 italic leading-relaxed">
                        "{aiComment || "Initializing neural analysis of global performance metrics. Syncing with 0G Compute network..."}"
                      </p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => leaderboard[0] && fetchAiComment(leaderboard[0])}
                  disabled={isAiLoading || isLoading || leaderboard.length === 0}
                  className="flex flex-col items-center gap-2 group/btn"
                >
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/btn:border-neon-cyan group-hover/btn:bg-neon-cyan/10 transition-all active:scale-95 shadow-lg">
                    <RefreshCw className={`h-5 w-5 text-muted-foreground group-hover/btn:text-neon-cyan transition-colors ${isAiLoading ? 'animate-spin' : ''}`} />
                  </div>
                  <span className="text-[8px] font-black tracking-widest text-muted-foreground uppercase group-hover/btn:text-neon-cyan transition-colors">REFRESH</span>
                </button>
              </div>
            </div>
          </div>

          {/* Title Section */}
          <div className="mb-12 text-center relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-40 w-40 bg-neon-pink/10 blur-[100px] animate-pulse" />
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] border border-white/10 mb-6 group transition hover:border-neon-pink/50">
              <Trophy className="h-8 w-8 text-neon-pink group-hover:scale-110 transition duration-500" />
            </div>
            <h1 className="font-display text-6xl font-black tracking-tight text-white mb-4 uppercase italic">Global Rankings</h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-white/10" />
              <p className="text-muted-foreground tracking-[0.5em] text-[10px] font-black uppercase italic">Powered by 0G Data Availability</p>
              <div className="h-px w-12 bg-white/10" />
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-[#0a0a1a]/40 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20">
                  <tr className="border-b border-white/10 bg-[#0a0a1a]/80 backdrop-blur-md">
                    <th className="px-8 py-6 font-display text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase italic">Rank</th>
                    <th className="px-8 py-6 font-display text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase italic">Hustler</th>
                    <th className="hidden md:table-cell px-8 py-6 font-display text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase italic">Network Identity</th>
                    <th className="px-8 py-6 text-right font-display text-[10px] font-black tracking-[0.4em] text-muted-foreground uppercase italic">Highway Coins</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-8 py-6">
                          <div className="h-12 w-full rounded-xl bg-white/[0.03]" />
                        </td>
                      </tr>
                    ))
                  ) : leaderboard.length > 0 ? (
                    leaderboard.map((player, index) => (
                      <tr key={player._id} className="group transition hover:bg-white/[0.04]">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <span className={`font-display text-xl font-black italic ${
                              index === 0 ? "text-neon-yellow drop-shadow-[0_0_8px_rgba(253,224,71,0.5)]" : 
                              index === 1 ? "text-slate-300" : 
                              index === 2 ? "text-amber-600" : 
                              "text-white/20"
                            }`}>
                              #{index + 1}
                            </span>
                            {index < 3 && (
                              <div className={`${index === 0 ? "text-neon-yellow" : index === 1 ? "text-slate-300" : "text-amber-600"}`}>
                                {index === 0 ? <Crown className="h-4 w-4" /> : <Medal className="h-4 w-4" />}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                             <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/10 font-display text-[10px] font-black text-muted-foreground group-hover:border-neon-pink/50 transition-colors">
                               {player.userGameData?.playerName?.slice(0, 2).toUpperCase() || "HH"}
                             </div>
                             <div className="flex flex-col">
                               <div className="font-display text-sm font-black tracking-widest text-white group-hover:text-neon-pink transition uppercase italic">
                                 {player.userGameData?.playerName || "Unnamed Pilot"}
                               </div>
                               <div className="flex items-center gap-1.5 mt-1">
                                  <div className="h-1 w-1 rounded-full bg-neon-cyan animate-pulse" />
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Active State</span>
                               </div>
                             </div>
                          </div>
                        </td>
                        <td className="hidden md:table-cell px-8 py-6">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-3 w-3 text-muted-foreground/40" />
                            <code className="text-[10px] text-muted-foreground/60 font-mono tracking-tighter">
                              {player.privyData?.walletAddress ? 
                                `${player.privyData.walletAddress.slice(0, 10)}...${player.privyData.walletAddress.slice(-8)}` : 
                                "OFF-CHAIN IDENTITY"}
                            </code>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex flex-col items-end">
                            <div className="font-display text-2xl font-black text-white group-hover:text-neon-cyan transition-colors italic tabular-nums">
                              {(player.userGameData?.currency || 0).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <Shield className="h-2.5 w-2.5 text-neon-cyan" />
                               <span className="text-[8px] font-black text-neon-cyan uppercase tracking-widest italic">Verified by 0G</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center opacity-5">
                          <Activity className="h-64 w-64 animate-ping" />
                        </div>
                        <p className="text-muted-foreground font-display text-xs font-black tracking-[0.5em] uppercase italic relative z-10">
                          INITIALIZING DATA STREAM...
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Branding */}
          <div className="mt-16 text-center">
            <div className="inline-flex flex-col items-center gap-4 px-10 py-6 rounded-3xl border border-white/5 bg-[#0a0a1a]/60 backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-pink/5 via-transparent to-neon-cyan/5 opacity-0 group-hover:opacity-100 transition duration-1000" />
                <div className="flex items-center gap-4 relative z-10">
                  <p className="text-[10px] font-black tracking-[0.4em] uppercase text-muted-foreground">
                    PROTOCOL SECURED BY
                  </p>
                  <img src={ogLogo} alt="0G" className="h-8 w-auto grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-110" />
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3.5 w-3.5 text-neon-cyan" />
                    <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">EVM Verified</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-neon-pink" />
                    <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">DA snapshots</span>
                  </div>
                  <div className="h-1 w-1 rounded-full bg-white/10" />
                  <div className="flex items-center gap-2">
                    <Brain className="h-3.5 w-3.5 text-neon-yellow" />
                    <span className="text-[9px] font-black tracking-widest text-white/40 uppercase">AI compute</span>
                  </div>
                </div>
            </div>
          </div>
        </main>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(34, 211, 238, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(34, 211, 238, 0.3);
          }
          .text-gradient-chrome {
            background: linear-gradient(to bottom, #fff 0%, #a5a5a5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
        `}</style>
      </div>
    </div>
  );
}
