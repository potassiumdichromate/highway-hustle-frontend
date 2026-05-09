import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';

const WalletContext = createContext();
const ZERO_G_CHAIN_ID_HEX = '0x4115';
const ZERO_G_CHAIN_ID_DEC = 16661;
const zeroGChainParams = {
  chainId: ZERO_G_CHAIN_ID_HEX,
  chainName: '0G Mainnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: ['https://evmrpc.0g.ai'],
  blockExplorerUrls: ['https://chainscan.0g.ai'],
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

// Prefer MetaMask when multiple wallet extensions are injected
function getPreferredProvider() {
  const providers = window.ethereum?.providers;
  if (Array.isArray(providers) && providers.length > 0) {
    return providers.find(p => p.isMetaMask && !p.isZerion && !p.isCoinbaseWallet)
      || providers.find(p => p.isMetaMask)
      || providers[0];
  }
  return window.ethereum;
}

export const WalletProvider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState(null);

  const isZeroGChainId = (chainId) => {
    if (!chainId) return false;
    if (typeof chainId === 'string') {
      if (chainId.toLowerCase() === ZERO_G_CHAIN_ID_HEX) return true;
      const parsed = Number.parseInt(chainId, 16);
      return parsed === ZERO_G_CHAIN_ID_DEC;
    }
    return Number(chainId) === ZERO_G_CHAIN_ID_DEC;
  };

  const ensureZeroGChain = async (eth) => {
    if (!eth) return false;
    try {
      const chainId = await eth.request({ method: 'eth_chainId' });
      if (isZeroGChainId(chainId)) return true;
      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ZERO_G_CHAIN_ID_HEX }],
        });
        return true;
      } catch (switchError) {
        if (switchError?.code === 4902) {
          await eth.request({
            method: 'wallet_addEthereumChain',
            params: [zeroGChainParams],
          });
          const nextChainId = await eth.request({ method: 'eth_chainId' });
          return isZeroGChainId(nextChainId);
        }
        if (switchError?.code === 4001) {
          setError('Please switch to 0G Mainnet to continue.');
        } else {
          console.error('Failed to switch to 0G Mainnet:', switchError);
          setError('Failed to switch to 0G Mainnet.');
        }
        return false;
      }
    } catch (err) {
      console.error('Error checking network:', err);
      setError('Failed to check network.');
      return false;
    }
  };

  const handleChainChanged = async (chainId) => {
    if (!isZeroGChainId(chainId)) {
      setError('Please switch to 0G Mainnet to continue.');
      setAccount(null);
      setProvider(null);
      return;
    }
    setError(null);
    const eth = getPreferredProvider();
    if (eth) {
      setProvider(new ethers.BrowserProvider(eth));
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    const eth = getPreferredProvider();
    if (eth) {
      eth.on('accountsChanged', handleAccountsChanged);
      eth.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (eth) {
        eth.removeListener('accountsChanged', handleAccountsChanged);
        eth.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setAccount(null);
      setProvider(null);
    } else {
      setAccount(accounts[0]);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const eth = getPreferredProvider();
      if (!eth) {
        console.log('No wallet detected');
        return;
      }
      const chainId = await eth.request({ method: 'eth_chainId' });
      if (!isZeroGChainId(chainId)) {
        setError('Please switch to 0G Mainnet to continue.');
        setAccount(null);
        setProvider(null);
        return;
      }
      const accounts = await eth.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setError(null);
        setAccount(accounts[0]);
        setProvider(new ethers.BrowserProvider(eth));
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      const eth = getPreferredProvider();
      if (!eth) {
        setError('MetaMask is not installed. Please install it to continue.');
        return;
      }
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      const isOnZeroG = await ensureZeroGChain(eth);
      if (!isOnZeroG) {
        setAccount(null);
        setProvider(null);
        return;
      }
      setAccount(accounts[0]);
      setProvider(new ethers.BrowserProvider(eth));
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
  };

  const value = {
    account,
    isConnecting,
    error,
    provider,
    connectWallet,
    disconnectWallet,
    isConnected: !!account,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
