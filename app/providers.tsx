'use client';

import { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'clpispdty00lu108wptiquu9r'}
      config={{
        loginMethods: ['wallet', 'email', 'google', 'twitter', 'discord'],
        appearance: {
          theme: 'light',
          accentColor: '#0ea5e9',
          logo: 'https://s3.wasabisys.com/defenseark/domus/domus_logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: {
          id: 11155111,
          name: 'Sepolia',
          network: 'sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'Sepolia Ether',
            symbol: 'SEP',
          },
          rpcUrls: {
            default: {
              http: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
            },
            public: {
              http: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
            },
          },
          blockExplorers: {
            default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
          },
          testnet: true,
        },
        supportedChains: [
          {
            id: 11155111,
            name: 'Sepolia',
            network: 'sepolia',
            nativeCurrency: {
              decimals: 18,
              name: 'Sepolia Ether',
              symbol: 'SEP',
            },
            rpcUrls: {
              default: {
                http: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
              },
              public: {
                http: ['https://sepolia.infura.io/v3/YOUR_INFURA_KEY'],
              },
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
            },
            testnet: true,
          },
          {
            id: 1,
            name: 'Ethereum',
            network: 'homestead',
            nativeCurrency: {
              decimals: 18,
              name: 'Ether',
              symbol: 'ETH',
            },
            rpcUrls: {
              default: {
                http: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
              },
              public: {
                http: ['https://mainnet.infura.io/v3/YOUR_INFURA_KEY'],
              },
            },
            blockExplorers: {
              default: { name: 'Etherscan', url: 'https://etherscan.io' },
            },
            testnet: false,
          },
        ],
      }}
    >
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </PrivyProvider>
  );
}
