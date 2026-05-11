import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, ArrowLeft, Crown, Medal, Brain, Activity } from "lucide-react";
import logo from "@/assets/logo-flame.png";
import heroCar from "@/assets/hero-car.jpg";
import ogLogo from "@/assets/og-logo.png";
import NeuralBackground from "@/components/NeuralBackground";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function DiagnosticBox({ label, status, active }: { label: string, status: string, active?: boolean }) {
  return (
    <div className={`rounded-xl border ${active ? 'border-neon-cyan/20 bg-neon-cyan/5' : 'border-white/5 bg-white/[0.02]'} p-4 transition hover:border-white/10 backdrop-blur-sm`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{label}</span>
        <div className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-neon-cyan animate-pulse' : 'bg-muted-foreground/30'}`} />
      </div>
      <div className={`text-sm font-black tracking-tight ${active ? 'text-white' : 'text-muted-foreground'} uppercase`}>{status}</div>
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

const INDEX_TO_CAR_NAME: Record<number, string> = {
  0: "Cyber Coupe",
  5: "Pickup Truck",
  6: "Hyper Drift SUV",
  8: "Stealth Jeep",
  10: "Proto Racer",
  11: "CTR Interceptor",
  12: "Muscle Monster",
  13: "F1 Phantom"
};

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardPlayer[]>([]);
  const [aiComment, setAiComment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFullLeaderboard = async () => {
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
        const response = await fetch(`${baseUrl}/leaderboard?t=${Date.now()}`);
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
          
          // Fetch AI comment for top player
          if (data.leaderboard.length > 0) {
            const token = localStorage.getItem("hh_auth_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const aiRes = await fetch(`${baseUrl}/leaderboard/ai-comment?user=${data.leaderboard[0].privyData?.walletAddress || data.leaderboard[0]._id}&type=gate&t=${Date.now()}`, {
              headers
            });
            const aiData = await aiRes.json();
            if (aiData.success) {
              setAiComment(aiData.comment);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFullLeaderboard();
  }, []);

  return (
    <div className="relative min-h-screen bg-[#050510] text-foreground font-sans selection:bg-primary/30 overflow-x-hidden">
      {/* 3D Neural Background */}
      <NeuralBackground />
      
      {/* Optional: Subtle Hero Car Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-10">
        <img 
          src={heroCar} 
          alt="" 
          className="h-full w-full object-cover animate-car-cruise" 
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#050510]/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3 transition hover:opacity-80">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <span className="font-display text-xl font-black tracking-widest text-white">HIGHWAY HUSTLE</span>
          </Link>
          
          <Link 
            to="/" 
            className="group flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 font-display text-[10px] font-bold tracking-[0.2em] text-muted-foreground transition hover:border-neon-pink hover:text-white hover:shadow-[0_0_15px_oklch(0.7_0.3_330/0.4)]"
          >
            <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
            BACK TO HOME
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Neural Analysis Header */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <DiagnosticBox label="Vehicle Garage" status="Open" active />
            <DiagnosticBox label="Leaderboard" status="Live" active />
            <DiagnosticBox label="Top Racer" status="Analyzed" active />
            <DiagnosticBox label="AI Insight" status="Generated" active />
          </div>
          
          <div className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 p-6 backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
               <Brain className="h-12 w-12 text-neon-cyan" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
              <div className="px-4 py-1.5 rounded-full bg-neon-cyan/20 border border-neon-cyan/30 text-neon-cyan text-[10px] font-black tracking-widest uppercase">
                Neural Insight
              </div>
              <p className="text-sm font-bold tracking-wide text-white/90 italic">
                "{aiComment || "Initializing neural analysis of global performance metrics..."}"
              </p>
            </div>
          </div>
        </div>

        <div className="mb-12 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neon-pink/10 ring-1 ring-neon-pink/30 mb-6">
            <Trophy className="h-8 w-8 text-neon-pink drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
          </div>
          <h1 className="font-display text-5xl font-black tracking-[0.1em] text-gradient-chrome mb-4 uppercase">Global Rankings</h1>
          <p className="text-muted-foreground tracking-widest text-xs font-bold uppercase opacity-60">The World's Fastest Hustlers</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] shadow-2xl">
          <div className="max-h-[75vh] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-white/5 bg-[#0a0a1a]">
                  <th className="px-4 md:px-8 py-5 font-display text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">Rank</th>
                  <th className="px-4 md:px-8 py-5 font-display text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">Player</th>
                  <th className="hidden md:table-cell px-8 py-5 font-display text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">Wallet</th>
                  <th className="px-4 md:px-8 py-5 text-right font-display text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-8 py-4">
                        <div className="h-10 w-full rounded bg-white/5" />
                      </td>
                    </tr>
                  ))
                ) : leaderboard.length > 0 ? (
                  leaderboard.map((player, index) => (
                    <tr key={player._id} className="group transition hover:bg-white/[0.03]">
                      <td className="px-4 md:px-8 py-5">
                        <div className="flex items-center gap-2 md:gap-3">
                          <span className={`font-display text-base md:text-lg font-black ${index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-400" : index === 2 ? "text-amber-600" : "text-white/40"}`}>
                            #{index + 1}
                          </span>
                          {index < 3 && (
                            <div className={`${index === 0 ? "text-yellow-400" : index === 1 ? "text-slate-400" : "text-amber-600"}`}>
                              {index === 0 ? <Crown className="h-3 w-3 md:h-4 md:w-4" /> : <Medal className="h-3 w-3 md:h-4 md:w-4" />}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-8 py-5">
                        <div className="flex items-center gap-2 md:gap-3">
                           <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 font-display text-[8px] md:text-[10px] font-bold text-muted-foreground shrink-0">
                             {player.userGameData?.playerName?.slice(0, 2).toUpperCase() || "HH"}
                           </div>
                           <div className="font-display text-xs md:text-sm font-bold tracking-wider text-white group-hover:text-neon-pink transition uppercase truncate max-w-[80px] sm:max-w-none">
                             {player.userGameData?.playerName || "Unknown"}
                           </div>
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-8 py-5">
                        <code className="text-[10px] text-muted-foreground/60 font-mono">
                          {player.privyData?.walletAddress ? 
                            `${player.privyData.walletAddress.slice(0, 6)}...${player.privyData.walletAddress.slice(-4)}` : 
                            "N/A"}
                        </code>
                      </td>
                      <td className="px-4 md:px-8 py-5 text-right">
                        <div className="font-display text-base md:text-xl font-black text-white group-hover:text-neon-cyan transition-colors">
                          {(player.userGameData?.currency || 0).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground font-display text-xs tracking-widest uppercase">
                      NO DATA AVAILABLE
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-16 text-center reveal-up is-visible">
            <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md">
                <p className="text-[10px] font-black tracking-[0.4em] uppercase bg-gradient-to-r from-neon-pink via-primary to-neon-cyan bg-clip-text text-transparent">
                  SECURED BY
                </p>
                <img src={ogLogo} alt="0G" className="h-6 w-auto animate-neon-pulse" />
                <p className="text-[10px] font-black tracking-[0.4em] uppercase bg-gradient-to-r from-neon-cyan via-primary to-neon-pink bg-clip-text text-transparent">
                  DATA AVAILABILITY FOR TRUE FAIRNESS
                </p>
            </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(244, 63, 94, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(244, 63, 94, 0.4);
        }
      `}</style>
      </div>
    </div>
  );
}
