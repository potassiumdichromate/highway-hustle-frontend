import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

type GameSearch = {
  mode?: string;
  buildUrl?: string;
  wallet?: string;
};

export const Route = createFileRoute("/game")({
  validateSearch: (search: Record<string, unknown>): GameSearch => ({
    mode: typeof search.mode === "string" ? search.mode : undefined,
    buildUrl: typeof search.buildUrl === "string" ? search.buildUrl : undefined,
    wallet: typeof search.wallet === "string" ? search.wallet : undefined,
  }),
  component: GameFramePage,
});

function GameFramePage() {
  const navigate = useNavigate();
  const { buildUrl, wallet } = Route.useSearch();

  if (!buildUrl) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="text-center">
          <p className="font-display text-sm tracking-widest text-muted-foreground uppercase">
            Invalid game build URL
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-6 rounded-md border border-border bg-card/60 px-4 py-2 text-xs font-display tracking-widest uppercase hover:border-primary"
          >
            Back Home
          </button>
        </div>
      </div>
    );
  }

  const src = `${buildUrl}${buildUrl.includes("?") ? "&" : "?"}wallet=${encodeURIComponent(
    wallet || "",
  )}`;

  return (
    <div className="fixed inset-0 z-[999] h-screen w-screen bg-black">
      <iframe
        src={src}
        className="h-full w-full border-0"
        title="Highway Hustle Game"
        allow="fullscreen; autoplay; gamepad"
      />

      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="absolute left-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/60 px-3 py-2 text-[10px] font-display tracking-[0.2em] uppercase text-white backdrop-blur hover:border-neon-pink hover:text-neon-pink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Exit
      </button>
    </div>
  );
}
