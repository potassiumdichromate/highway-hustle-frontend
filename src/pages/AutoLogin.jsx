import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { autoLogin } from '../api/auth';
import { setAuthSession } from '../lib/authSession';
import {
  getJwtFromUrl,
  getSourceFromUrl,
  clearAutoLoginParams,
} from '../lib/browserAutoLogin';

/**
 * AutoLogin page — handles browser-based JWT auto-login.
 *
 * URL format:  /?token=<JWT>&source=browser
 *   or:        /auto-login?token=<JWT>&source=browser
 *
 * Flow:
 *   1. Read `token` and `source` from URL
 *   2. POST to backend /api/player/login/auto  { jwt, source }
 *   3. On success → persist session, redirect to /license
 *   4. On failure → redirect to / (login page)
 *
 * Reference: guesstheai/guess_the_ai_frontend/src/pages/AutoLogin.tsx
 */
export default function AutoLogin() {
  const navigate = useNavigate();
  const attemptedRef = useRef(false);

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  useEffect(() => {
    // Prevent double-firing in StrictMode
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const jwt = getJwtFromUrl();
    const source = getSourceFromUrl() || 'browser';

    console.log('[AutoLogin] page mounted', {
      href: window.location.href,
      hasJwt: Boolean(jwt),
      source,
      timestamp: new Date().toISOString(),
    });

    // Fallback timeout — if nothing happens in 7s, go back
    const timeoutId = window.setTimeout(() => {
      console.warn('[AutoLogin] fallback timeout reached, going back');
      goBack();
    }, 7000);

    const complete = async () => {
      if (!jwt) {
        console.warn('[AutoLogin] no token param found, returning to login');
        navigate('/', { replace: true });
        return;
      }

      try {
        console.log('[AutoLogin] calling backend auto-login');
        const response = await autoLogin({ jwt, source });

        if (!response?.success) {
          console.error('[AutoLogin] backend returned failure', response);
          navigate('/', { replace: true });
          return;
        }

        const playerData = response.data;
        const walletAddress = playerData?.privyData?.walletAddress || '';

        // Build a session object compatible with authSession.js
        const session = {
          source: 'browser',
          loginType: 'browser_jwt',
          userId: '',
          email: '',
          walletAddress,
          wallet: {
            address: walletAddress,
            connectorType: 'browser_jwt',
            walletClientType: 'browser_jwt',
            chainId: '',
          },
          linkedAccounts: [],
          timestamp: new Date().toISOString(),
        };

        // Persist auth session so isSessionActive() returns true
        setAuthSession({ session, user: playerData });

        // Also store walletAddress directly (used by DriverLicense, Game, etc.)
        if (walletAddress) {
          localStorage.setItem('walletAddress', walletAddress);
        }

        // Clean up URL params
        clearAutoLoginParams();

        console.log('[AutoLogin] success — redirecting to /license');
        navigate('/license', { replace: true });
      } catch (err) {
        console.error('[AutoLogin] unexpected error', err);
        navigate('/', { replace: true });
      }
    };

    complete().finally(() => window.clearTimeout(timeoutId));
    return () => window.clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: '#0a0a0a',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          border: '3px solid rgba(255,255,255,0.18)',
          borderTopColor: '#00d4ff',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div
        style={{
          color: '#00d4ff',
          fontFamily: "'Orbitron', monospace",
          fontSize: 13,
          letterSpacing: 1,
        }}
      >
        Logging you in...
      </div>
      <button
        onClick={goBack}
        style={{
          marginTop: 16,
          padding: '10px 16px',
          borderRadius: 999,
          border: '1px solid rgba(0, 212, 255, 0.5)',
          background: 'transparent',
          color: '#00d4ff',
          fontFamily: "'Orbitron', monospace",
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Go Back
      </button>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
