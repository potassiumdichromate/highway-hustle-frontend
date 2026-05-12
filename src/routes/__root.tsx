import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";

import { Toaster } from "sonner";
import AIAssistant from "@/components/AIAssistant";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // No shellComponent — this is a CSR app (vite dev / createRoot).
  // shellComponent renders <html> inside React which lands inside <div#root>
  // and causes the "html cannot be a child of div" hydration crash.
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

// Calls backend /player/login once after Privy auth so hh_auth_token is always set
function AuthSync() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const attempted = useRef(false);

  useEffect(() => {
    if (!authenticated) {
      attempted.current = false;
      return;
    }
    if (attempted.current) return;

    const wallet =
      wallets.find((w) => w.address) ??
      (user?.wallet?.address ? user.wallet : null) ??
      ((user?.embeddedWallets as any)?.[0]?.address
        ? (user?.embeddedWallets as any)[0]
        : null);

    if (!wallet?.address) return;
    attempted.current = true;

    const baseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      "https://highway-hustle-backend.onrender.com/api";

    fetch(`${baseUrl}/player/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: wallet.address,
        privyMetaData: {
          address: wallet.address,
          type: (wallet as any).connectorType ?? "embedded",
        },
      }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data?.token) {
          localStorage.setItem("hh_auth_token", result.data.token);
          localStorage.setItem("walletAddress", wallet.address!.toLowerCase());
          window.dispatchEvent(new Event("hh-session-changed"));
        }
      })
      .catch(() => {});
  }, [authenticated, wallets, user]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || "cmhfx1cl20001l10d4l0w8u4j"}
      config={{
        loginMethods: ["email", "wallet", "google"],
        appearance: {
          theme: "dark",
          accentColor: "#f43f5e",
          showWalletLoginFirst: false,
        },
        supportedChains: [{
          id: 16661,
          name: "0G Mainnet",
          network: "0g-mainnet",
          nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
          rpcUrls: {
            default: { http: ["https://evmrpc.0g.ai"] },
            public: { http: ["https://evmrpc.0g.ai"] },
          },
          blockExplorers: {
            default: { name: "0G Scan", url: "https://chainscan.0g.ai" },
          },
          testnet: false,
        }],
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthSync />
        <Outlet />
        <AIAssistant />
        <Toaster position="top-right" theme="dark" richColors />
      </QueryClientProvider>
    </PrivyProvider>
  );
}
