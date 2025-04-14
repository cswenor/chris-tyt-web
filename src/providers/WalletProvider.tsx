'use client'

import { WalletProvider, WalletManager, NetworkId, WalletId } from '@txnlab/use-wallet-react'

const manager = new WalletManager({
  wallets: [
    {
      id: WalletId.KIBISIS,
      metadata: {
        name: 'KIBISIS',
        icon: '../../public/images/chris-tyt.png',
      },
    },
    {
      id: WalletId.LUTE,
      options: {
        siteName: 'Your Site Name',
      },
      metadata: {
        name: 'LUTE',
        icon: '../../public/images/chris-tyt.png',
      },
    },
    {
      id: WalletId.BIATEC,
      options: {
        projectId: 'your-biatec-project-id',
      },
      metadata: {
        name: 'BIATEC',
        icon: '../../public/images/chris-tyt.png',
      },
    },
    {
      id: WalletId.WALLETCONNECT,
      options: {
        projectId: 'your-walletconnect-project-id', // Replace with your WalletConnect v2 project ID
        relayUrl: 'wss://relay.walletconnect.com', // WalletConnect v2 relay URL
        metadata: {
          name: 'WALLET CONNECT',
          description: 'Connect with any WalletConnect-compatible wallet',
          url: 'https://yourwebsite.com',
          icons: ['../../public/images/chris-tyt.png'],
        },
      },
    },
  ],
  networks: {
    [NetworkId.MAINNET]: {
      algod: {
        baseServer: 'https://mainnet-api.voi.nodely.dev',
        port: '',
        token: '',
      },
    },
    [NetworkId.TESTNET]: {
      algod: {
        baseServer: 'https://testnet-api.algonode.cloud',
        port: '',
        token: '',
      },
    },
  },
  defaultNetwork: NetworkId.MAINNET,
})

export function WalletProviderWrapper({ children }: { children: React.ReactNode }) {
  return <WalletProvider manager={manager}>{children}</WalletProvider>
}