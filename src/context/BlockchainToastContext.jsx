import React, { createContext, useContext, useState, useCallback } from 'react';
import BlockchainToast from '../components/BlockchainToast';

const BlockchainToastContext = createContext();

export const useBlockchainToast = () => {
  const context = useContext(BlockchainToastContext);
  if (!context) {
    throw new Error('useBlockchainToast must be used within BlockchainToastProvider');
  }
  return context;
};

export const BlockchainToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ title, description, txHash, duration = 6000 }) => {
    console.log('🔔 Showing blockchain toast:', { title, txHash });
    
    setToast({
      title,
      description,
      txHash,
      duration,
      id: Date.now()
    });

    // Auto-dismiss after duration
    setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return (
    <BlockchainToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {toast && <BlockchainToast toast={toast} onClose={hideToast} />}
    </BlockchainToastContext.Provider>
  );
};