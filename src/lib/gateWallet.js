/**
 * Gate Wallet integration functions
 */

/**
 * Check if Gate Wallet is available
 */
export const isGateWalletAvailable = () => {
  return typeof window !== 'undefined' && window.okxwallet && window.okxwallet.okxchain;
};

/**
 * Connect to Gate Wallet
 */
export const connectGateWallet = async () => {
  if (!isGateWalletAvailable()) {
    throw new Error('Gate Wallet is not available');
  }

  try {
    const accounts = await window.okxwallet.okxchain.request({
      method: 'eth_requestAccounts',
    });
    
    return {
      accounts,
      success: true,
    };
  } catch (error) {
    console.error('Failed to connect Gate Wallet:', error);
    throw error;
  }
};

/**
 * Get primary Gate Wallet address
 */
export const getPrimaryGateWalletAddress = (accountInfo) => {
  if (!accountInfo || !accountInfo.accounts || accountInfo.accounts.length === 0) {
    return null;
  }
  return accountInfo.accounts[0];
};

/**
 * Get current network from Gate Wallet
 */
export const getGateWalletCurrentNetwork = async () => {
  if (!isGateWalletAvailable()) {
    throw new Error('Gate Wallet is not available');
  }

  try {
    const chainId = await window.okxwallet.okxchain.request({
      method: 'eth_chainId',
    });
    
    return chainId;
  } catch (error) {
    console.error('Failed to get Gate Wallet network:', error);
    throw error;
  }
};

/**
 * Switch Gate Wallet network
 */
export const switchGateWalletNetwork = async (chainId) => {
  if (!isGateWalletAvailable()) {
    throw new Error('Gate Wallet is not available');
  }

  try {
    await window.okxwallet.okxchain.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId }],
    });
  } catch (error) {
    console.error('Failed to switch Gate Wallet network:', error);
    throw error;
  }
};
