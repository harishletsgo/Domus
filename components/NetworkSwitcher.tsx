'use client';

import { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

interface NetworkSwitcherProps {
  targetChainId: number;
  targetChainName: string;
  onNetworkSwitched?: () => void;
}

export function NetworkSwitcher({ 
  targetChainId, 
  targetChainName, 
  onNetworkSwitched 
}: NetworkSwitcherProps) {
  const { wallets } = useWallets();
  const [switching, setSwitching] = useState(false);
  const [currentChainId, setCurrentChainId] = useState<number | null>(null);
  const [justSwitched, setJustSwitched] = useState(false);

  const currentWallet = wallets[0];

  // Function to get current chain ID from various sources
  const getCurrentChainId = async (): Promise<number | null> => {
    // First try to get from Privy wallet
    if (currentWallet?.chainId) {
      const chainId = typeof currentWallet.chainId === 'string' ? 
        parseInt(currentWallet.chainId) : 
        currentWallet.chainId;
      return chainId;
    }

    // Fallback to direct ethereum provider query
    if (window.ethereum) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        return parseInt(chainId, 16);
      } catch (error) {
        console.error('Failed to get chain ID from ethereum provider:', error);
      }
    }

    return null;
  };

  // Update chain ID when wallet changes or on mount
  useEffect(() => {
    const updateChainId = async () => {
      const chainId = await getCurrentChainId();
      setCurrentChainId(chainId);
    };

    updateChainId();

    // Listen for chain changes
    if (window.ethereum?.on) {
      const handleChainChanged = (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        setCurrentChainId(newChainId);
        console.log('Chain changed to:', newChainId);
        
        // If we just switched and now we're on the correct network, mark it
        if (newChainId === targetChainId) {
          setJustSwitched(true);
          // Hide the component after a brief success display
          setTimeout(() => {
            setJustSwitched(false);
          }, 3000);
        }
      };

      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        if (window.ethereum?.removeListener) {
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, [currentWallet]);

  const isCorrectNetwork = currentChainId === targetChainId;

  const switchNetwork = async () => {
    if (!window.ethereum) {
      toast.error('No Ethereum wallet detected');
      return;
    }

    setSwitching(true);
    try {
      const chainIdHex = '0x' + targetChainId.toString(16);
      
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      // Wait a moment for the switch to complete and update state
      setTimeout(async () => {
        const newChainId = await getCurrentChainId();
        setCurrentChainId(newChainId);
        if (newChainId === targetChainId) {
          setJustSwitched(true);
          setTimeout(() => setJustSwitched(false), 3000);
        }
        toast.success(`Switched to ${targetChainName}`);
        onNetworkSwitched?.();
      }, 1000);
    } catch (error: any) {
      // If the network is not added, try to add it
      if (error.code === 4902) {
        try {
          const networkConfig = getNetworkConfig(targetChainId);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
          
          // Wait a moment for the add/switch to complete and update state
          setTimeout(async () => {
            const newChainId = await getCurrentChainId();
            setCurrentChainId(newChainId);
            if (newChainId === targetChainId) {
              setJustSwitched(true);
              setTimeout(() => setJustSwitched(false), 3000);
            }
            toast.success(`Added and switched to ${targetChainName}`);
            onNetworkSwitched?.();
          }, 1000);
        } catch (addError) {
          console.error('Failed to add network:', addError);
          toast.error(`Failed to add ${targetChainName} network`);
        }
      } else {
        console.error('Failed to switch network:', error);
        toast.error(`Failed to switch to ${targetChainName}`);
      }
    } finally {
      setSwitching(false);
    }
  };

  const getNetworkConfig = (chainId: number) => {
    const configs: { [key: number]: any } = {
      11155111: {
        chainId: '0xaa36a7',
        chainName: 'Sepolia Test Network',
        nativeCurrency: {
          name: 'Sepolia Ether',
          symbol: 'SEP',
          decimals: 18,
        },
        rpcUrls: [
          'https://sepolia.infura.io/v3/',
          'https://rpc.sepolia.org',
          'https://eth-sepolia.public.blastapi.io',
        ],
        blockExplorerUrls: ['https://sepolia.etherscan.io/'],
      },
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
          name: 'Ether',
          symbol: 'ETH',
          decimals: 18,
        },
        rpcUrls: ['https://mainnet.infura.io/v3/'],
        blockExplorerUrls: ['https://etherscan.io/'],
      },
    };
    return configs[chainId];
  };

  // Show success message briefly after switching, then hide component
  if (isCorrectNetwork && justSwitched) {
    return (
      <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
        <CheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">✓ Successfully switched to {targetChainName}</span>
      </div>
    );
  }

  // Hide component completely if on correct network and not just switched
  if (isCorrectNetwork && !justSwitched) {
    return null;
  }

  // Show warning if on wrong network
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">Wrong Network</h3>
          <p className="text-sm text-yellow-700 mt-1">
            Please switch to {targetChainName} to continue.
            {currentChainId && !isNaN(currentChainId) && (
              <span className="block mt-1">
                Current: Chain ID {currentChainId}
              </span>
            )}
          </p>
          <div className="mt-3 flex space-x-3">
            <button
              onClick={switchNetwork}
              disabled={switching}
              className="bg-yellow-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {switching ? 'Switching...' : `Switch to ${targetChainName}`}
            </button>
            <a
              href="https://chainlist.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center"
            >
              Add Networks
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
