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

  const ensureZeroGChain = async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (isZeroGChainId(chainId)) return true;
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ZERO_G_CHAIN_ID_HEX }],
        });
        return true;
      } catch (switchError) {
        if (switchError?.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [zeroGChainParams],
          });
          const nextChainId = await window.ethereum.request({
            method: 'eth_chainId',
          });
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
    if (window.ethereum) {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
    }
  };

  useEffect(() => {
    // Check if already connected
    checkIfWalletIsConnected();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
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
      if (!window.ethereum) {
        console.log('MetaMask not detected');
        return;
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (!isZeroGChainId(chainId)) {
        setError('Please switch to 0G Mainnet to continue.');
        setAccount(null);
        setProvider(null);
        return;
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        setError(null);
        setAccount(accounts[0]);
        const ethersProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(ethersProvider);
      }
    } catch (err) {
      console.error('Error checking wallet connection:', err);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install it to continue.');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const isOnZeroG = await ensureZeroGChain();
      if (!isOnZeroG) {
        setAccount(null);
        setProvider(null);
        return;
      }

      setAccount(accounts[0]);
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
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
