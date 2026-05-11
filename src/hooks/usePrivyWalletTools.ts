import { useCallback, useMemo } from 'react';
import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth';

const ZERO_G_CHAIN = {
  caip2: 'eip155:16661',
  decimalChainId: 16661,
  hexChainId: '0x4115',
  chainName: '0G Mainnet',
  rpcUrls: ['https://evmrpc.0g.ai'],
  blockExplorerUrls: ['https://chainscan.0g.ai'],
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
};

const isEmbedded = (w: any) => String(w?.connectorType || '').toLowerCase() === 'embedded';

export function getPrimaryPrivyWallet(user: any, wallets: any[]) {
  const connected = Array.isArray(wallets) ? wallets : [];
  const external = connected.find((w) => w?.address && !isEmbedded(w));
  if (external) return external;
  if (connected[0]?.address) return connected[0];
  if (!user) return undefined;
  if (user.wallet?.address) return user.wallet;
  if (Array.isArray(user.embeddedWallets) && user.embeddedWallets[0]?.address)
    return user.embeddedWallets[0];
  const linked = Array.isArray(user.linkedAccounts) ? user.linkedAccounts : [];
  return linked.find((a: any) => a?.type === 'wallet' && a?.address);
}

export function usePrivyWalletTools() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();

  const privyWallet = useMemo(() => getPrimaryPrivyWallet(user, wallets), [user, wallets]);
  const walletFromStorage = typeof window !== 'undefined' ? localStorage.getItem('walletAddress') : null;

  // Prefer Privy wallet; fall back to a minimal object from localStorage
  const activeWallet = privyWallet || (walletFromStorage ? { address: walletFromStorage } : null);

  // Highway Hustle uses custom auth (localStorage token), not Privy's standard session.
  // So we don't require `authenticated` — just that Privy is ready and a wallet address exists.
  const canUsePrivy = Boolean(ready && activeWallet?.address);

  const switchToZeroG = useCallback(async () => {
    const wallet = activeWallet;
    if (!wallet) throw new Error('No wallet connected');
    if (wallet.switchChain) {
      try {
        await wallet.switchChain(ZERO_G_CHAIN.hexChainId);
        return;
      } catch (e: any) {
        if (e?.code === 4001) throw new Error('Chain switch rejected by user.');
        // fall through to window.ethereum approach
      }
    }
    // Fallback: window.ethereum directly (adds chain if unknown)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ZERO_G_CHAIN.hexChainId }],
        });
      } catch (switchErr: any) {
        if (switchErr?.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: ZERO_G_CHAIN.hexChainId,
              chainName: ZERO_G_CHAIN.chainName,
              nativeCurrency: ZERO_G_CHAIN.nativeCurrency,
              rpcUrls: ZERO_G_CHAIN.rpcUrls,
              blockExplorerUrls: ZERO_G_CHAIN.blockExplorerUrls,
            }],
          });
        } else {
          throw switchErr;
        }
      }
    }
  }, [activeWallet]);

  return {
    privyReady: ready,
    privyAuthenticated: authenticated,
    wallets,
    activeWallet,
    canUsePrivy,
    allowedChain: ZERO_G_CHAIN,
    sendPrivyTransaction: sendTransaction,
    switchToZeroG,
  };
}
