import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useConnectWallet,
  useLoginWithEmail,
  useLoginWithOAuth,
  usePrivy,
} from '@privy-io/react-auth';
import {
  getAuthSession,
  getAuthUser,
  isSessionActive,
  setAuthSession,
} from '../lib/authSession';
import {
  connectGateWallet,
  getGateWalletCurrentNetwork,
  getPrimaryGateWalletAddress,
  isGateWalletAvailable,
  switchGateWalletNetwork,
} from '../lib/gateWallet';

const WalletIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.75 7.5h13.5a3 3 0 0 1 3 3v6.75a3 3 0 0 1-3 3H6.75a3 3 0 0 1-3-3V9.75a2.25 2.25 0 0 1 2.25-2.25Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="M18.75 12.75h-2.25a1.5 1.5 0 1 0 0 3h2.25a.75.75 0 0 0 .75-.75v-1.5a.75.75 0 0 0-.75-.75Z"
      fill="currentColor"
    />
    <path
      d="M17.25 5.25H6a2.25 2.25 0 0 0-2.25 2.25v1.5"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const MailIcon = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3.6 6.6h16.8a1.8 1.8 0 0 1 1.8 1.8v7.2a1.8 1.8 0 0 1-1.8 1.8H3.6A1.8 1.8 0 0 1 1.8 15.6V8.4A1.8 1.8 0 0 1 3.6 6.6Z"
      stroke="currentColor"
      strokeWidth="1.6"
    />
    <path
      d="m3 8 8.4 5.4L19.8 8"
      stroke="currentColor"
      strokeWidth="1.6"
    />
  </svg>
);

const GoogleIcon = ({ size = 18 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 48 48"
  >
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.115 32.091 28.905 35 24 35c-6.075 0-11-4.925-11-11s4.925-11 11-11c2.803 0 5.367 1.059 7.313 2.787l5.657-5.657C33.91 6.053 29.173 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917Z"
    />
    <path
      fill="#FF3D00"
      d="m6.306 14.691 6.571 4.818C14.655 16.104 18.961 13 24 13c2.803 0 5.367 1.059 7.313 2.787l5.657-5.657C33.91 6.053 29.173 4 24 4c-7.837 0-14.426 4.497-17.694 10.691Z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c4.81 0 9.204-1.844 12.543-4.857l-5.792-4.894C28.909 35.188 26.571 36 24 36c-4.877 0-9.055-2.885-11.045-7.055l-6.6 5.081C9.584 39.411 16.319 44 24 44Z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083 43.6 20 42 20H24v8h11.303a11.996 11.996 0 0 1-4.103 5.249l.003-.002 5.792 4.894C36.67 38.366 44 34 44 24c0-1.341-.138-2.651-.389-3.917Z"
    />
  </svg>
);

const GateWalletIcon = ({ size = 20 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="12" fill="white" />
    <path
      d="M7 12L10 15L17 8"
      stroke="#a940ff"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const theme = {
  bg: 'var(--theme-bg-deep)',
  surface: 'var(--theme-card-bg)',
  panel: 'var(--theme-card-surface)',
  text: 'var(--theme-text)',
  subtext: 'var(--theme-text-soft)',
  primary: 'var(--theme-accent-magenta)',
  primaryDark: 'var(--theme-accent-violet)',
  ring: 'rgba(210,75,255,0.45)',
};

const styles = {
  dialog: {
    padding: 0,
    border: '1px solid rgba(0, 212, 255, 0.3)',
    borderRadius: 24,
    maxWidth: 480,
    width: '92vw',
    background: 'rgba(10, 1, 24, 0.85)',
    backdropFilter: 'blur(20px)',
    boxShadow:
      '0 28px 80px rgba(0,0,0,0.85), 0 0 40px rgba(255, 0, 110, 0.35), inset 0 1px 1px rgba(255,255,255,0.1)',
    overflow: 'hidden',
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    margin: 0,
    zIndex: 99999,
  },
  container: {
    position: 'relative',
    padding: 28,
    background: 'transparent',
    color: '#ffffff',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: 15,
    lineHeight: 1.45,
  },
  close: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 999,
    border: '1px solid rgba(255, 0, 110, 0.4)',
    background: 'rgba(255, 0, 110, 0.1)',
    backdropFilter: 'blur(10px)',
    color: '#ff006e',
    fontSize: 22,
    lineHeight: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    transition: 'all 0.3s ease',
  },
  hero: {
    textAlign: 'center',
    padding: '36px 16px 28px',
    background:
      'radial-gradient(1200px 600px at 10% 0%, rgba(255, 0, 110, 0.2), transparent 60%), radial-gradient(900px 500px at 90% 100%, rgba(6, 255, 165, 0.15), transparent 60%), linear-gradient(135deg, rgba(10, 1, 24, 0.6) 0%, rgba(114, 9, 183, 0.2) 40%, rgba(58, 12, 163, 0.15) 72%, rgba(10, 1, 24, 0.8) 100%)',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    border: '1px solid rgba(255, 0, 110, 0.2)',
  },
  heroGlow: {
    position: 'absolute',
    inset: -60,
    background:
      'radial-gradient(800px 180px at 50% -20%, rgba(255, 0, 110, 0.2), transparent)',
  },
  logo: {
    width: 72,
    height: 72,
    objectFit: 'contain',
    borderRadius: 12,
    border: '1px solid rgba(255, 0, 110, 0.3)',
  },
  title: {
    margin: '16px 0 6px',
    fontSize: 28,
    fontWeight: 900,
    letterSpacing: 0.8,
    fontFamily: "'Orbitron', sans-serif",
    background: 'linear-gradient(90deg, #ff006e, #06ffa5)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 22px rgba(255, 0, 110, 0.4)',
  },
  subtitle: {
    margin: '4px 0 0',
    color: '#06ffa5',
    fontSize: 14,
    fontFamily: "'Orbitron', sans-serif",
    letterSpacing: 0.1,
  },
  btnIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    marginRight: 8,
  },
  primary: {
    padding: '14px 20px',
    borderRadius: 12,
    border: '1px solid rgba(255, 0, 110, 0.6)',
    background: 'linear-gradient(135deg, rgba(255, 0, 110, 0.3) 0%, rgba(67, 97, 238, 0.2) 100%)',
    color: '#06ffa5',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow:
      '0 10px 30px rgba(255, 0, 110, 0.25), 0 0 20px rgba(6, 255, 165, 0.15)',
    letterSpacing: 0.3,
    transition: 'all 0.3s ease',
  },
  primaryAlt: {
    padding: '14px 16px',
    borderRadius: 12,
    border: '1px solid rgba(67, 97, 238, 0.4)',
    background: 'rgba(67, 97, 238, 0.1)',
    backdropFilter: 'blur(10px)',
    color: '#4361ee',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  divider: {
    margin: '12px 0 10px',
    height: 1,
    background:
      'linear-gradient(90deg, transparent, rgba(255, 0, 110, 0.3), transparent)',
  },
  oauthRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  oauth: {
    flex: 1,
    minWidth: 130,
    padding: '11px 14px',
    borderRadius: 12,
    border: '1px solid rgba(67, 97, 238, 0.3)',
    background: 'rgba(67, 97, 238, 0.08)',
    backdropFilter: 'blur(10px)',
    color: '#4361ee',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 14,
    transition: 'all 0.3s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    marginTop: 8,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    textAlign: 'left',
  },
  labelText: {
    fontSize: 14,
    fontWeight: 600,
    color: '#06ffa5',
  },
  input: {
    padding: '12px 14px',
    borderRadius: 12,
    border: `1px solid rgba(67, 97, 238, 0.4)`,
    background: 'rgba(67, 97, 238, 0.08)',
    backdropFilter: 'blur(10px)',
    color: '#ffffff',
    outline: 'none',
    fontSize: 14,
    transition: 'all 0.3s ease',
  },
  hint: {
    fontSize: 12,
    color: '#06ffa5',
    marginTop: 2,
    opacity: 0.7,
  },
  actionsRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginTop: 10,
  },
  ghost: {
    padding: '11px 14px',
    borderRadius: 12,
    border: '1px solid rgba(255, 0, 110, 0.2)',
    background: 'rgba(255, 0, 110, 0.05)',
    backdropFilter: 'blur(8px)',
    color: '#ff006e',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.3s ease',
  },
  gateBtn: {
    padding: '14px 18px',
    borderRadius: 12,
    border: '1px solid rgba(255, 0, 110, 0.4)',
    background: 'linear-gradient(180deg, rgba(255, 0, 110, 0.25) 0%, rgba(114, 9, 183, 0.15) 100%)',
    color: '#06ffa5',
    cursor: 'pointer',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px -5px rgba(255, 0, 110, 0.3)',
    letterSpacing: 0.2,
    transition: 'all 0.3s ease',
    width: '100%',
    marginTop: '10px',
    position: 'relative',
    overflow: 'hidden',
  },
  error: {
    margin: '12px 0 8px',
    padding: '12px 14px',
    borderRadius: 12,
    background: 'rgba(255, 0, 110, 0.1)',
    color: '#ff6b9d',
    fontSize: 13,
    textAlign: 'left',
    border: '1px solid rgba(255, 0, 110, 0.3)',
    backdropFilter: 'blur(10px)',
  },
};

const getErrorMessage = (err, fallback) => {
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = err.message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
};

const allowedChain = {
  caip2: 'eip155:16661',
  decimalChainId: 16661,
  hexChainId: '0x4115',
  chainName: '0G Mainnet',
  rpcUrls: ['https://evmrpc.0g.ai'],
  blockExplorerUrls: ['https://chainscan.0g.ai'],
};

function normalizeChainId(chainId) {
  if (!chainId) return undefined;
  if (chainId.startsWith('0x')) {
    const parsed = Number.parseInt(chainId, 16);
    return Number.isFinite(parsed) ? String(parsed) : chainId;
  }
  return chainId;
}

function getNetworkLabel(network) {
  if (network === null) return 'All Networks';
  if (!network) return 'Unknown';
  return network.name || network.chainId;
}

function summarizeAddress(address) {
  if (!address || typeof address !== 'string') return 'none';
  const trimmed = address.trim();
  if (!trimmed) return 'none';
  if (trimmed.length <= 10) return trimmed;
  return `${trimmed.slice(0, 6)}...${trimmed.slice(-4)}`;
}

function safeSerialize(value) {
  if (!value) return null;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (err) {
    return null;
  }
}

function safeParseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function getPrivyConnectionsSnapshot() {
  if (typeof window === 'undefined') {
    return { raw: null, parsed: null, error: null, key: null };
  }
  const keys = ['privy:connections', 'privy:connection'];
  let raw = null;
  let key = null;
  for (const candidate of keys) {
    const value = localStorage.getItem(candidate);
    if (value) {
      raw = value;
      key = candidate;
      break;
    }
  }
  if (!raw) return { raw: null, parsed: null, error: null, key: null };
  try {
    return { raw, parsed: JSON.parse(raw), error: null, key };
  } catch (err) {
    return { raw, parsed: null, error: err?.message || err, key };
  }
}

function extractWalletAddresses(value) {
  const results = new Set();
  const visited = new Set();

  const visit = (node) => {
    if (!node) return;
    if (typeof node === 'string') {
      if (node.startsWith('0x') && node.length === 42) {
        results.add(node);
      }
      return;
    }
    if (typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    Object.values(node).forEach(visit);
  };

  visit(value);
  return Array.from(results);
}

function getCandidateProviderTag(candidate) {
  if (!candidate || typeof candidate !== 'object') return '';
  return [candidate.type, candidate.providerName, candidate.provider]
    .filter(Boolean)
    .join('|')
    .toLowerCase();
}

function getCandidateAddress(candidate) {
  if (!candidate || typeof candidate !== 'object') return '';
  return (
    candidate.address ||
    candidate.walletAddress ||
    candidate.publicAddress ||
    candidate?.wallet?.address ||
    ''
  );
}

function getCandidateEmail(candidate) {
  if (!candidate || typeof candidate !== 'object') return '';
  return candidate.email || candidate.emailAddress || '';
}

function getCandidateIdentifier(candidate) {
  if (!candidate || typeof candidate !== 'object') return '';
  return (
    getCandidateAddress(candidate) ||
    getCandidateEmail(candidate) ||
    candidate.username ||
    candidate.subject ||
    ''
  );
}

function collectConnectionCandidates(value) {
  const results = [];
  const visited = new Set();

  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (visited.has(node)) return;
    visited.add(node);
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }

    const hasSignal =
      'type' in node ||
      'providerName' in node ||
      'provider' in node ||
      'address' in node ||
      'walletAddress' in node ||
      'publicAddress' in node ||
      'email' in node ||
      'emailAddress' in node ||
      'username' in node ||
      'subject' in node;

    if (hasSignal) {
      results.push(node);
    }

    Object.values(node).forEach(visit);
  };

  visit(value);
  return results;
}

function normalizeConnectionCandidates(candidates) {
  if (!Array.isArray(candidates)) return [];
  return candidates.map((candidate) => ({
    type: candidate?.type || 'unknown',
    providerName: candidate?.providerName || candidate?.provider || '',
    identifier: getCandidateIdentifier(candidate),
    verifiedAt: candidate?.verifiedAt || null,
    address: getCandidateAddress(candidate),
    email: getCandidateEmail(candidate),
    walletClientType: candidate?.walletClientType || '',
  }));
}

function resolveWalletAddressFromConnections(candidates) {
  if (!Array.isArray(candidates)) return '';
  const withAddress = candidates
    .map((candidate) => ({
      candidate,
      address: getCandidateAddress(candidate),
    }))
    .filter((item) => Boolean(item.address));

  if (!withAddress.length) return '';
  const walletCandidate = withAddress.find((item) =>
    getCandidateProviderTag(item.candidate).includes('wallet')
  );
  return walletCandidate?.address || withAddress[0].address;
}

function resolveEmailFromConnections(candidates) {
  if (!Array.isArray(candidates)) return '';
  const withEmail = candidates
    .map((candidate) => ({
      candidate,
      email: getCandidateEmail(candidate),
    }))
    .filter((item) => Boolean(item.email));

  if (!withEmail.length) return '';
  const emailCandidate = withEmail.find((item) =>
    getCandidateProviderTag(item.candidate).includes('email')
  );
  return emailCandidate?.email || withEmail[0].email;
}

function resolveDiscordFromConnections(candidates) {
  if (!Array.isArray(candidates)) return '';
  const discordCandidate = candidates.find((candidate) =>
    getCandidateProviderTag(candidate).includes('discord')
  );
  return getCandidateIdentifier(discordCandidate) || '';
}

function resolveUserIdFromConnections(candidates) {
  if (!Array.isArray(candidates)) return '';
  const userIdCandidate = candidates.find(
    (candidate) =>
      candidate?.privyUserId ||
      candidate?.userId ||
      candidate?.user_id ||
      candidate?.id
  );
  return (
    userIdCandidate?.privyUserId ||
    userIdCandidate?.userId ||
    userIdCandidate?.user_id ||
    userIdCandidate?.id ||
    ''
  );
}

function resolveLoginTypeFromConnections(candidates, fallback) {
  if (!Array.isArray(candidates)) return fallback || 'unknown';
  const tags = candidates.map(getCandidateProviderTag);

  if (tags.some((tag) => tag.includes('discord'))) return 'discord';
  if (tags.some((tag) => tag.includes('google'))) return 'google';
  if (tags.some((tag) => tag.includes('email'))) return 'email';
  if (tags.some((tag) => tag.includes('sms'))) return 'sms';
  if (tags.some((tag) => tag.includes('wallet'))) return 'wallet';

  return fallback || 'unknown';
}

function getLinkedAccountIdentifier(account) {
  if (!account || typeof account !== 'object') return '';
  return (
    account.address ||
    account.email ||
    account.username ||
    account.subject ||
    ''
  );
}

function normalizeLinkedAccounts(accounts) {
  if (!Array.isArray(accounts)) return [];
  return accounts.map((account) => ({
    type: account?.type || 'unknown',
    providerName: account?.providerName || '',
    identifier: getLinkedAccountIdentifier(account),
    verifiedAt: account?.verifiedAt || null,
  }));
}

function getDiscordIdentifier(accounts) {
  if (!Array.isArray(accounts)) return '';
  const discordAccount = accounts.find(
    (account) =>
      account?.providerName === 'discord' || account?.type === 'discord_oauth'
  );
  return discordAccount ? getLinkedAccountIdentifier(discordAccount) : '';
}

function LoginModal({ open, onClose, logoSrc }) {
  const navigate = useNavigate();
  const dialogRef = useRef(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [emailStep, setEmailStep] = useState('enter-email');
  const [error, setError] = useState('');
  const [gateConnecting, setGateConnecting] = useState(false);

  // Get user info from Privy
  const { user, isReady } = usePrivy();
  
  console.log('[LoginModal] Privy initialized:', { isReady, user: user?.id });

  useEffect(() => {
    const linkedAccounts = Array.isArray(user?.linkedAccounts)
      ? user.linkedAccounts
          .map((account) => account?.providerName || account?.type)
          .filter(Boolean)
      : [];

    console.log('[LoginModal] Privy state update', {
      isReady,
      userId: user?.id || 'none',
      hasWallet: !!user?.wallet?.address,
      walletAddress: summarizeAddress(user?.wallet?.address),
      hasEmail: !!user?.email?.address,
      linkedAccounts,
    });

    const connections = getPrivyConnectionsSnapshot();
    const connectionAddresses = extractWalletAddresses(connections.parsed);
    console.log('[LoginModal] privy:connections snapshot', {
      hasRaw: !!connections.raw,
      rawLength: connections.raw ? connections.raw.length : 0,
      key: connections.key || 'none',
      parsedType: connections.parsed ? typeof connections.parsed : 'none',
      parsedKeys:
        connections.parsed && typeof connections.parsed === 'object'
          ? Object.keys(connections.parsed)
          : [],
      walletAddresses: connectionAddresses.map(summarizeAddress),
      error: connections.error || null,
    });
  }, [isReady, user]);

  const persistAuthSession = ({ source, loginType, wallet, walletAddress }) => {
    const connections = getPrivyConnectionsSnapshot();
    const connectionCandidates = collectConnectionCandidates(connections.parsed);
    const normalizedConnections = normalizeConnectionCandidates(connectionCandidates);
    const connectionWalletAddress = resolveWalletAddressFromConnections(connectionCandidates);
    const connectionEmail = resolveEmailFromConnections(connectionCandidates);
    const connectionDiscord = resolveDiscordFromConnections(connectionCandidates);
    const connectionUserId = resolveUserIdFromConnections(connectionCandidates);
    const resolvedWalletAddress =
      walletAddress ||
      connectionWalletAddress ||
      wallet?.address ||
      user?.wallet?.address ||
      '';
    const resolvedUserId = user?.id || connectionUserId || '';
    const fallbackLoginType =
      loginType || wallet?.walletClientType || user?.wallet?.walletClientType;
    const resolvedLoginType = resolveLoginTypeFromConnections(
      connectionCandidates,
      fallbackLoginType
    );
    const resolvedEmail = connectionEmail || user?.email?.address || '';
    const resolvedDiscord =
      connectionDiscord || getDiscordIdentifier(user?.linkedAccounts);
    const linkedAccounts = normalizedConnections.length
      ? normalizedConnections
      : normalizeLinkedAccounts(user?.linkedAccounts);

    const session = {
      source: source || 'privy',
      loginType: resolvedLoginType,
      userId: resolvedUserId,
      email: resolvedEmail,
      walletAddress: resolvedWalletAddress,
      wallet: {
        address: resolvedWalletAddress,
        connectorType:
          wallet?.connectorType || user?.wallet?.connectorType || '',
        walletClientType:
          wallet?.walletClientType || user?.wallet?.walletClientType || '',
        chainId: wallet?.chainId || user?.wallet?.chainId || '',
      },
      linkedAccounts,
      timestamp: new Date().toISOString(),
    };

    const privyMetaData = {
      address: resolvedWalletAddress,
      discord: resolvedDiscord,
      email: resolvedEmail,
      type: resolvedLoginType,
      privyUserId: resolvedUserId,
    };

    const userSnapshot = safeSerialize(user);
    const sessionPayload = {
      session,
      user: userSnapshot === null ? undefined : userSnapshot,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('privyMetaData', JSON.stringify(privyMetaData));
    }

    console.log('[LoginModal] Persisting auth session', {
      session,
      hasUserSnapshot: !!userSnapshot,
      userSnapshot,
      privyMetaData,
      privyConnections: {
        hasRaw: !!connections.raw,
        rawLength: connections.raw ? connections.raw.length : 0,
        key: connections.key || 'none',
        parsedType: connections.parsed ? typeof connections.parsed : 'none',
        walletAddresses: extractWalletAddresses(connections.parsed).map(summarizeAddress),
        candidates: normalizedConnections,
        error: connections.error || null,
      },
    });

    return setAuthSession(sessionPayload);
  };

  useEffect(() => {
    if (!user) return;
    const existingSession = getAuthSession();
    if (!existingSession) {
      console.log('[LoginModal] No session found; creating from Privy user');
      persistAuthSession({ source: 'privy', loginType: 'privy' });
      return;
    }

    console.log('[LoginModal] Refreshing session with latest Privy user data');
    persistAuthSession({
      source: existingSession.source || 'privy',
      loginType: existingSession.loginType,
      walletAddress: existingSession.walletAddress,
    });
  }, [user]);

  useEffect(() => {
    if (!isReady || !user || typeof window === 'undefined') return;
    let attempts = 0;
    let lastRaw = null;
    const maxAttempts = 8;
    const interval = setInterval(() => {
      attempts += 1;
      const connections = getPrivyConnectionsSnapshot();
      if (!connections.raw) {
        if (attempts >= maxAttempts) clearInterval(interval);
        return;
      }

      if (connections.raw === lastRaw) {
        if (attempts >= maxAttempts) clearInterval(interval);
        return;
      }
      lastRaw = connections.raw;

      const connectionCandidates = collectConnectionCandidates(connections.parsed);
      const connectionWalletAddress = resolveWalletAddressFromConnections(connectionCandidates);
      const connectionEmail = resolveEmailFromConnections(connectionCandidates);
      const storedPrivyMetaData = safeParseJson(localStorage.getItem('privyMetaData'));

      const needsUpdate =
        (connectionWalletAddress &&
          (!storedPrivyMetaData || !storedPrivyMetaData.address)) ||
        (connectionEmail && (!storedPrivyMetaData || !storedPrivyMetaData.email));

      console.log('[LoginModal] Checking privy:connections for metadata sync', {
        key: connections.key || 'none',
        walletAddress: summarizeAddress(connectionWalletAddress),
        hasEmail: !!connectionEmail,
        hasStoredMeta: !!storedPrivyMetaData,
        storedAddress: summarizeAddress(storedPrivyMetaData?.address),
        storedEmail: !!storedPrivyMetaData?.email,
        needsUpdate,
      });

      if (needsUpdate) {
        console.log('[LoginModal] Syncing privyMetaData from privy:connections');
        persistAuthSession({ source: 'privy', loginType: 'privy' });
        clearInterval(interval);
        return;
      }

      if (attempts >= maxAttempts) clearInterval(interval);
    }, 500);

    return () => clearInterval(interval);
  }, [isReady, user]);

  const handleLoginSuccess = async (loginData) => {
    try {
      console.log('[LoginModal] handleLoginSuccess called', {
        loginDataType: typeof loginData,
        loginDataKeys:
          loginData && typeof loginData === 'object' ? Object.keys(loginData) : [],
      });
      console.log('[LoginModal] Login success, checking localStorage');
      const session = getAuthSession();
      const userSnapshot = getAuthUser();
      const privyMetaData = localStorage.getItem('privyMetaData');
      
      console.log('[LoginModal] Login data stored in localStorage:', {
        hasSession: !!session,
        session,
        hasUserSnapshot: !!userSnapshot,
        privyUserId: userSnapshot?.id || session?.userId || 'none',
        privyMetaData: privyMetaData ? JSON.parse(privyMetaData) : 'none',
        timestamp: new Date().toISOString(),
      });

      if (isSessionActive()) {
        console.log('[LoginModal] Session verified, closing modal and navigating');
        if (dialogRef.current?.open) {
          dialogRef.current.close();
        }
        onClose?.();
        
        // Navigate to license page after a short delay to allow modal to close
        setTimeout(() => {
          console.log('[LoginModal] Navigating to /license');
          navigate('/license');
        }, 300);
      } else {
        console.error('[LoginModal] Login failed - no session in localStorage');
        setError('Login failed - no session saved');
      }
    } catch (err) {
      console.error('[LoginModal] Error in handleLoginSuccess:', err);
      setError('An error occurred. Please try again.');
    }
  };

  const { connectWallet } = useConnectWallet({
    onSuccess: async (wallet) => {
      console.log('[LoginModal] ✅ connectWallet onSuccess fired with wallet:', wallet);
      const address = wallet?.address;
      if (!address) {
        console.warn('[LoginModal] Wallet connect succeeded but no address found');
        setError('Connected wallet has no address. Please try again.');
        return;
      }
      try {
        const walletType = wallet?.walletClientType || 'unknown';
        console.log('[LoginModal] Privy user snapshot during wallet login', {
          isReady,
          userId: user?.id || 'none',
          hasEmail: !!user?.email?.address,
        });

        console.log('[LoginModal] Saving wallet login session', {
          walletAddress: address,
          walletType,
        });

        const session = persistAuthSession({
          source: 'wallet',
          loginType: walletType,
          wallet,
        });

        if (session) {
          console.log('[LoginModal] Wallet login session saved, handling success');
          await handleLoginSuccess(session);
        } else {
          console.error('[LoginModal] Failed to save wallet login session');
          setError('Login failed. Please try again.');
        }
      } catch (err) {
        console.error('[LoginModal] Wallet login failed from wallet connect', err);
        setError('Wallet login failed. Please try again.');
        return;
      }
      onClose?.();
    },
    onError: (err) => {
      console.error('[LoginModal] ❌ connectWallet onError fired:', err);
      setError(getErrorMessage(err, 'Failed to connect wallet'));
    },
  });

  const { initOAuth, loading: oauthLoading } = useLoginWithOAuth({
    onComplete: async () => {
      // After OAuth completes, user info will be available in the Privy user hook
      // Save the Privy session details locally
      try {
        console.log('[LoginModal] OAuth onComplete user snapshot', {
          isReady,
          userId: user?.id || 'none',
          hasWallet: !!user?.wallet?.address,
          walletAddress: summarizeAddress(user?.wallet?.address),
          hasEmail: !!user?.email?.address,
        });
        console.log('[LoginModal] OAuth completed, saving session');
        const oauthProvider =
          user?.linkedAccounts?.find((acc) => acc.type === 'oauth')?.providerName ||
          'google';
        const session = persistAuthSession({
          source: 'oauth',
          loginType: oauthProvider,
        });

        if (session) {
          console.log('[LoginModal] OAuth login session saved, handling success');
          await handleLoginSuccess(session);
        } else {
          console.error('[LoginModal] Failed to save OAuth login session');
          setError('Login failed. Please try again.');
        }
      } catch (err) {
        console.error('[LoginModal] OAuth login failed', err);
        setError('Failed to complete OAuth login. Please try again.');
        return;
      }
    },
    onError: (err) => {
      setError(getErrorMessage(err, 'OAuth error'));
    },
  });

  const { sendCode, loginWithCode, state: emailState } = useLoginWithEmail({
    onComplete: async () => {
      // After email login completes, save the Privy session details locally
      try {
        console.log('[LoginModal] Email onComplete user snapshot', {
          isReady,
          userId: user?.id || 'none',
          hasWallet: !!user?.wallet?.address,
          walletAddress: summarizeAddress(user?.wallet?.address),
          hasEmail: !!user?.email?.address,
        });
        console.log('[LoginModal] Email login completed, saving session');
        const session = persistAuthSession({
          source: 'email',
          loginType: 'email',
        });

        if (session) {
          console.log('[LoginModal] Email login session saved, handling success');
          await handleLoginSuccess(session);
        } else {
          console.error('[LoginModal] Failed to save email login session');
          setError('Login failed. Please try again.');
        }
      } catch (err) {
        console.error('[LoginModal] Email login failed', err);
        setError('Failed to complete email login. Please try again.');
        return;
      }
    },
    onError: (err) => setError(getErrorMessage(err, 'Email login error')),
  });

  useEffect(() => {
    console.log('[LoginModal] Resetting modal state', { open });
    setError('');
    setEmail('');
    setCode('');
    setEmailStep('enter-email');
  }, [open]);

  useEffect(() => {
    console.log('[LoginModal] Dialog visibility update', {
      open,
      dialogOpen: dialogRef.current?.open,
    });
    if (open && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
    if (!open && dialogRef.current?.open) {
      dialogRef.current.close();
    }
    let styleTag;
    if (typeof document !== 'undefined') {
      styleTag = document.createElement('style');
      styleTag.setAttribute('data-login-modal-backdrop', 'true');
      styleTag.innerHTML =
        'dialog::backdrop{background:rgba(10,10,18,.6);backdrop-filter:saturate(1.2) blur(4px);}';
      document.head.appendChild(styleTag);
    }
    return () => {
      if (styleTag && styleTag.parentNode) {
        styleTag.parentNode.removeChild(styleTag);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!emailState?.status) return;
    console.log('[LoginModal] Email auth state changed', { status: emailState.status });
  }, [emailState?.status]);

  useEffect(() => {
    console.log('[LoginModal] OAuth loading state', { oauthLoading });
  }, [oauthLoading]);

  useEffect(() => {
    console.log('[LoginModal] Gate wallet connecting state', { gateConnecting });
  }, [gateConnecting]);

  const handleConnectWallet = () => {
    console.log('[LoginModal] 🔌 Connect wallet button clicked');
    try {
      if (dialogRef.current?.open) {
        console.log('[LoginModal] Closing dialog');
        dialogRef.current.close();
      }
    } catch (err) {
      console.error('[LoginModal] Error closing dialog:', err);
    }
    console.log('[LoginModal] Calling onClose');
    onClose?.();
    console.log('[LoginModal] About to call connectWallet()');
    setTimeout(() => {
      try {
        console.log('[LoginModal] 🚀 Triggering connectWallet hook');
        console.log('[LoginModal] connectWallet function:', connectWallet);
        connectWallet();
        console.log('[LoginModal] connectWallet() called');
      } catch (err) {
        console.error('[LoginModal] Error calling connectWallet:', err);
        setError('Failed to initiate wallet connection. Please try again.');
      }
    }, 50);
  };

  const handleGateConnect = async () => {
    if (gateConnecting) return;
    setError('');
    setGateConnecting(true);

    try {
      if (!isGateWalletAvailable()) {
        throw new Error('Gate Wallet not detected. Please install or enable it.');
      }

      // 1. Connect first
      const accountInfo = await connectGateWallet();
      const address = getPrimaryGateWalletAddress(accountInfo);

      if (!address) {
        throw new Error('Gate Wallet did not return an address.');
      }

      console.log('[LoginModal] Gate Wallet connected', {
        address: summarizeAddress(address),
        accountCount: Array.isArray(accountInfo?.accounts) ? accountInfo.accounts.length : 0,
      });

      // 2. Check Network
      let network = await getGateWalletCurrentNetwork().catch(() => undefined);
      const rawChainId = typeof network === 'string' ? network : network?.chainId;

      const normalized = normalizeChainId(network?.chainId);
      const normalizedFromRaw = normalizeChainId(rawChainId);
      const allowed = String(allowedChain.decimalChainId);

      console.log('[LoginModal] Gate Wallet network response', {
        rawNetwork: network,
        rawChainId,
        normalized,
        normalizedFromRaw,
        allowed,
      });

      // If network is null (All Networks) or mismatch, try to switch
      if (network === null || (normalized && normalized !== allowed)) {
        try {
          await switchGateWalletNetwork(allowedChain.hexChainId);
          // Re-check network after switch
          network = await getGateWalletCurrentNetwork().catch(() => undefined);
          console.log('[LoginModal] Gate Wallet network after switch', { network });
        } catch (switchError) {
          console.warn('Failed to auto-switch network:', switchError);
        }
      }

      // 3. Verify Final Network State
      const finalNormalized = normalizeChainId(network?.chainId);
      console.log('[LoginModal] Gate Wallet network final check', {
        network,
        finalNormalized,
        allowed,
      });
      if (network === null) {
        throw new Error(
          'Gate Wallet is set to All Networks. Please select 0G Mainnet manually.'
        );
      }

      if (!finalNormalized || finalNormalized !== allowed) {
        throw new Error(
          `Gate Wallet is on ${getNetworkLabel(network)}. Please switch to ${allowedChain.chainName}.`
        );
      }

      // 4. Proceed to Backend Login
      console.log('[LoginModal] Logging in with Gate Wallet address:', address);

      const session = persistAuthSession({
        source: 'gate_wallet',
        loginType: 'gate_wallet',
        walletAddress: address,
      });

      console.log('[LoginModal] Gate Wallet login session saved', {
        hasSession: !!session,
        walletAddress: summarizeAddress(address),
      });

      if (session) {
        console.log('[LoginModal] Gate Wallet login successful, handling success');
        localStorage.setItem('sessionWallet', 'VERIFIED');
        await handleLoginSuccess(session);
      } else {
        console.error('[LoginModal] Failed to save Gate Wallet login session');
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('Gate wallet connection error:', err);
      setError(err?.message || 'Failed to connect Gate Wallet.');
    } finally {
      setGateConnecting(false);
    }
  };

  const onEmailSubmit = (event) => {
    event?.preventDefault();
    console.log('[LoginModal] Email submit - sending code to:', email);
    setError('');
    sendCode({ email })
      .then(() => {
        console.log('[LoginModal] Code sent successfully');
        setEmailStep('enter-code');
      })
      .catch((err) => {
        console.error('[LoginModal] Failed to send code:', err);
        if (err && typeof err === 'object' && 'message' in err) {
          setError(String(err.message));
        } else {
          setError('Failed to send code');
        }
      });
  };

  const onCodeSubmit = (event) => {
    event?.preventDefault();
    console.log('[LoginModal] Code submit - verifying code');
    setError('');
    loginWithCode({ code }).catch((err) => {
      console.error('[LoginModal] Failed to login with code:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String(err.message));
      } else {
        setError('Invalid code');
      }
    });
  };

  const isSendingCode = emailState?.status === 'sending-code';
  const isSubmittingCode = emailState?.status === 'submitting-code';

  return (
    <dialog
      ref={dialogRef}
      style={styles.dialog}
      onCancel={onClose}
      aria-modal="true"
    >
      <div style={styles.container}>
        <button
          onClick={onClose}
          aria-label="Close"
          style={styles.close}
          type="button"
        >
          ×
        </button>

        <div style={styles.hero}>
          <div style={styles.heroGlow} />
          {logoSrc && (
            <img
              src={logoSrc}
              alt="Logo"
              style={{
                height: '120px',
                width: '120px',
                background: 'black',
                borderRadius: '100px',
                padding: '10px',
              }}
            />
          )}
          <h2 style={styles.title}>HIGHWAY HUSTLE</h2>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form
          style={styles.form}
          onSubmit={emailStep === 'enter-email' ? onEmailSubmit : onCodeSubmit}
        >
          {emailStep === 'enter-email' ? (
            <>
              <label style={styles.label}>
                <span style={styles.labelText}>Email address</span>
                <input
                  type="email"
                  required
                  placeholder="Enter email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  style={styles.input}
                />
                <small style={styles.hint}>
                  We&apos;ll email you a 6‑digit OTP.
                </small>
              </label>
              <div style={styles.actionsRow}>
                <button
                  type="submit"
                  style={{ ...styles.primary, width: '100%' }}
                  disabled={isSendingCode}
                >
                  {isSendingCode ? 'Sending…' : 'Send OTP'}
                </button>
              </div>
            </>
          ) : (
            <>
              <label style={styles.label}>
                <span style={styles.labelText}>Enter 6‑digit code</span>
                <input
                  type="text"
                  pattern="[0-9]{6}"
                  inputMode="numeric"
                  placeholder="123456"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  style={styles.input}
                />
                <small style={styles.hint}>
                  Didn&apos;t get it? Check spam or resend after a moment.
                </small>
              </label>
              <div style={styles.actionsRow}>
                <button
                  type="button"
                  onClick={() => {
                    setCode('');
                    setEmail('');
                    setEmailStep('enter-email');
                  }}
                  style={styles.ghost}
                >
                  Edit email
                </button>
                <button
                  type="submit"
                  style={{ ...styles.primary, width: '100%' }}
                  disabled={isSubmittingCode}
                >
                  {isSubmittingCode ? 'Verifying…' : 'Verify & continue'}
                </button>
              </div>
            </>
          )}
        </form>

        {/* <div style={{ marginTop: 14 }}>
          <button
            style={styles.gateBtn}
            onClick={handleGateConnect}
            disabled={gateConnecting}
            type="button"
          >
            <span style={styles.btnIcon}>
              <GateWalletIcon />
            </span>
            <span>{gateConnecting ? 'Connecting...' : 'Connect Gate Wallet'}</span>
          </button>
        </div> */}

        <div style={{ marginTop: 14, display: 'flex' }}>
          <button
            style={{ ...styles.primary, width: '100%' }}
            onClick={handleConnectWallet}
            type="button"
          >
            <span style={styles.btnIcon}>
              <WalletIcon />
            </span>
            <span>Connect wallet</span>
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={styles.divider} />
          <div style={styles.oauthRow}>
            <button
              style={styles.oauth}
              disabled={oauthLoading}
              onClick={() => initOAuth({ provider: 'google' })}
              aria-label="Continue with Google"
              type="button"
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <GoogleIcon />
                <span style={{ marginLeft: 8 }}>Google</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export default LoginModal;
