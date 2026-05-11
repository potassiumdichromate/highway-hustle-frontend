import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";

import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import logo from "../assets/logo-flame.png";


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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Highway Hustle" },
      { name: "description", content: "Highway Hustle" },
      { name: "author", content: "Highway Hustle" },
      { property: "og:title", content: "Highway Hustle" },
      { property: "og:description", content: "Highway Hustle" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@HighwayHustle" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "sonner";
import AIAssistant from "@/components/AIAssistant";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || "cmhfx1cl20001l10d4l0w8u4j"}
      config={{
        loginMethods: ["email", "wallet", "google", "discord"],
        appearance: {
          theme: "dark",
          accentColor: "#f43f5e",
          showWalletLoginFirst: false,
          logo: (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '100%',
              padding: '20px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #110c1d 0%, #251635 100%)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              marginBottom: '10px'
            }}>
              <img src={logo} alt="Highway Hustle" style={{ height: '90px', width: 'auto', marginBottom: '15px' }} />
              <div style={{ 
                fontFamily: 'Orbitron, sans-serif', 
                fontWeight: 900, 
                fontSize: '20px', 
                letterSpacing: '3px',
                color: '#f43f5e',
                textShadow: '0 0 15px rgba(244, 63, 94, 0.8)',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}>
                HIGHWAY HUSTLE
              </div>
            </div>
          ),
        },
        supportedChains: [{
          id: 16661,
          name: '0G Mainnet',
          network: '0g-mainnet',
          nativeCurrency: {
            name: '0G',
            symbol: '0G',
            decimals: 18,
          },
          rpcUrls: {
            default: {
              http: ['https://evmrpc.0g.ai'],
            },
            public: {
              http: ['https://evmrpc.0g.ai'],
            },
          },
          blockExplorers: {
            default: {
              name: '0G Scan',
              url: 'https://chainscan.0g.ai',
            },
          },
          testnet: false,
        }],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          }
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Outlet />
        <AIAssistant />
        <Toaster position="top-right" theme="dark" richColors />
      </QueryClientProvider>
    </PrivyProvider>
  );
}
