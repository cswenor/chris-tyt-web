'use client'

import { useEffect, useState } from 'react'
import { Welcome } from '@/components/welcome'
import { TokenDetails } from '@/components/token-details'
import { NFTPortfolio } from '@/components/nft-portfolio'
import { TokenHolders } from '@/components/token-holders'
import { RollDice } from '@/components/roll-dice'
import {
  WalletProvider,
  WalletManager,
  NetworkConfigBuilder,
  WalletId,
  useWallet,
  useNetwork
} from '@txnlab/use-wallet-react'
import { Power, Wallet } from 'lucide-react'
import envoiSDK from '@xarmian/envoi-sdk';
import toast from 'react-hot-toast';

// Initialize with Algod node configuration
const resolver = envoiSDK.init({
  token: '',
  url: 'https://mainnet-api.voi.nodely.dev',
  port: 443
});

const networks = new NetworkConfigBuilder()
  .addNetwork('voi-mainnet', {
    algod: {
      token: '',
      baseServer: 'https://mainnet-api.voi.nodely.dev',
      port: ''
    },
    isTestnet: false,
    genesisHash: 'r20fSQI8gWe/kFZziNonSPCXLwcQmH/nxROvnnueWOk=',
    genesisId: 'voimain-v1.0',
    caipChainId: 'algorand:r20fSQI8gWe_kFZziNonSPCXLwcQmH_n'
  })
  .addNetwork('voi-testnet', {
    algod: {
      token: '',
      baseServer: 'https://testnet-api.voi.nodely.dev',
      port: ''
    },
    isTestnet: true,
    genesisHash: 'IXnoWtviVVJW5LGivNFc0Dq14V3kqaXuK2u5OQrdVZo=',
    genesisId: 'voitest-v1'
  })
  .build()

const allowedNetworks = ['voi-mainnet', 'voi-testnet', 'mainnet', "testnet", "localnet"];

type NetworkMetadata = {
  [key: string]: {
    name: string;
    icon?: string;
  }
}

const networkMetadata: NetworkMetadata = {
  'voi-mainnet': {
    name: 'Voi Mainnet',
    icon: 'https://asset-verification.nautilus.sh/icons/0.png'
  },
  'voi-testnet': {
    name: 'Voi Testnet',
    icon: 'https://asset-verification.nautilus.sh/icons/0.png'
  },
  'mainnet': {
    name: 'Algorand Mainnet',
  },
  'testnet': {
    name: 'Algorand Testnet',
  },
  'localnet': {
    name: 'Localnet',
  }
}

const manager = new WalletManager({
  wallets: [
    WalletId.KIBISIS,
    WalletId.LUTE, // TODO add lute wallet support, requires testing and resolution of Account not found error
    //WalletId.BIATEC, // TODO add biatec wallet (walletconnect) support, requires testing
    //WalletId.WALLETCONNECT // TODO add walletconnect wallet support, requires testing
  ],
  networks,
  defaultNetwork: 'voi-mainnet'
})

function WalletConnect() {
  const { activeAccount, activeWallet, wallets } = useWallet()
  const { activeNetwork, setActiveNetwork } = useNetwork()
  const [showModal, setShowModal] = useState(false)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [nameInfo, setNameInfo] = useState<any>(null)

  useEffect(() => {
    if(!activeAccount || activeNetwork !== 'voi-mainnet') return;
    const fetchNameInfo = async () => {
      const name = await resolver.http.getNameFromAddress(activeAccount?.address);
      setNameInfo(name);
    };
    fetchNameInfo();
  }, [activeAccount]);

  console.log({activeAccount, activeWallet, wallets, nameInfo})

  const connect = async (walletId: string) => {
    setConnecting(walletId)
    try {
      await wallets?.find(w => w.id === walletId)?.connect()
      setConnecting(null)
      setShowModal(false)
    } catch (error) {
      console.error('Connection error:', error)
      setConnecting(null)
    }
  }

  const disconnect = () => {
    activeWallet?.disconnect()
  }

  const copyToClipboard = async () => {
    const textToCopy = activeAccount?.address;
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        toast.success('Address copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy address');
      }
    }
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 w-full backdrop-blur-sm bg-white/50 z-50 py-4">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex gap-2 justify-end">
            {activeAccount ? (
              <>
                <select
                  value={activeNetwork}
                  onChange={(e) => setActiveNetwork(e.target.value)}
                  className="p-2 bg-white text-gray-800 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm cursor-pointer text-sm"
                >
                  {allowedNetworks.map((network) => (
                    <option key={network} value={network}>
                      {networkMetadata[network]?.name || network}
                    </option>
                  ))}
                </select>
                <button
                  className="px-4 py-2 bg-white text-gray-800 rounded-xl hover:bg-gray-50 flex items-center gap-2 border border-gray-200 shadow-sm cursor-pointer"
                  onClick={copyToClipboard}
                  title="Click to copy"
                >
                  <img src={activeWallet?.metadata?.icon} alt={activeWallet?.metadata?.name} className="w-6 h-6 rounded-full" />
                  <span className="text-sm text-gray-500 hidden sm:inline">Connected as</span>
                  {nameInfo ? nameInfo : `${activeAccount.address.slice(0, 6)}...${activeAccount.address.slice(-4)}`}
                </button>
                <button
                  onClick={disconnect}
                  className="p-2 bg-white text-red-500 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm"
                  aria-label="Disconnect wallet"
                >
                  <Power size={20} />
                </button>
              </>
            ) : (
              <>
                <select
                  value={activeNetwork}
                  onChange={(e) => setActiveNetwork(e.target.value)}
                  className="p-2 bg-white text-gray-800 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm cursor-pointer text-sm"
                >
                  {allowedNetworks.map((network) => (
                    <option key={network} value={network}>
                      {networkMetadata[network]?.name || network}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowModal(true)}
                  className="px-4 py-2 bg-white text-gray-800 rounded-xl hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center gap-2"
                >
                  <Wallet size={20} />
                  <span className="hidden sm:inline">Wallet</span>
                  Connect
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full border border-gray-200 m-auto">
            <h2 className="text-xl font-bold mb-6 text-gray-800">Select Wallet</h2>
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={() => connect(wallet.id)}
                  disabled={connecting === wallet.id}
                  className="w-full px-6 py-4 bg-gray-50 text-gray-800 rounded-xl hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 flex items-center justify-between group transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <img src={wallet.metadata?.icon} alt={wallet.id} className="w-8 h-8 rounded-full" />
                    <span className="font-medium">{wallet.metadata?.name}</span>
                  </div>
                  {connecting === wallet.id && (
                    <span className="text-sm text-gray-500">Connecting...</span>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full px-6 py-4 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 border border-gray-200 transition-all shadow-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function Home() {
  return (
    <WalletProvider manager={manager}>
      <main className="min-h-screen bg-background py-24">
        <WalletConnect />
        <div className="container max-w-4xl mx-auto px-4">
          <Welcome />
          <TokenDetails />
          <NFTPortfolio />
          <TokenHolders />
          <RollDice />
        </div>
      </main>
    </WalletProvider>
  )
}