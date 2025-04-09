'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Modal } from "./modal"
import { useWallet } from '@txnlab/use-wallet-react'
import { fetchVoiName, formatAddress, getVoiBalance, algodClient } from '@/lib/utils'
import { CONTRACT, abi } from "ulujs";
import { CONFIG } from '@/config'

export function AppBar() {
  const { wallets, activeAccount } = useWallet()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [voiName, setVoiName] = useState<string | null>(null)
  const [ctytBalance, setCtytBalance] = useState<number | null>(null)

  useEffect(() => {
    const fetchWalletDetails = async () => {
      if (typeof window === 'undefined') return
      if (activeAccount?.address) {
        const name = await fetchVoiName(activeAccount.address)
        setVoiName(name)
        // get arc200 balance
        const ci = new CONTRACT(CONFIG.TOKEN_ID, algodClient, undefined, abi.arc200, {
          addr: activeAccount.address,
          sk: new Uint8Array()
        })
        const balanceR = await ci.arc200_balanceOf(activeAccount.address)
        let balance = 0;
        if(balanceR.success) {
          balance = Number(balanceR.returnValue) / 10 ** 6; // TODO use BigNumber
        }
        setCtytBalance(balance)
      }
    }
    fetchWalletDetails()
  }, [activeAccount?.address])

  const handleConnect = async (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    if (wallet) {
      try {
        await wallet.connect()
        setIsModalOpen(false)
      } catch (error) {
        console.error('Failed to connect:', error)
      }
    } else {
      alert(`Can't find ${walletId} wallet. Please ensure it is installed or supported.`)
    }
  }

  const handleDisconnect = async () => {
    if (activeAccount) {
      const wallet = wallets.find((w) => w.accounts.some((acc) => acc.address === activeAccount.address))
      if (wallet) {
        try {
          await wallet.disconnect()
          setVoiName(null)
          setCtytBalance(null)
        } catch (error) {
          console.error('Failed to disconnect:', error)
        }
      }
    }
  }

  return (
    <>
      {/* App Bar */}
      <div className="bg-gray-100 text-gray-800 px-6 py-4 flex justify-between items-center fixed top-0 left-0 w-full z-50 shadow-md">
        <div className="flex items-center gap-2 text-lg font-bold">
          <img src="/images/chris-tyt.png" alt="Site Icon" className="h-[40px] w-[40px]" />
          <span className="hidden sm:inline">Chris Thank You Tokens</span>
          <span className="sm:hidden">CTYT</span>
        </div>
        {activeAccount ? (
          <div className="flex items-center gap-4">
            <div>
              <span className="block text-sm font-medium">
                {voiName || formatAddress(activeAccount.address, 8)}
              </span>
              <span className="block text-xs text-gray-600">
                CTYT Balance: {ctytBalance !== null ? `${ctytBalance.toFixed(2)} CTYT` : 'Loading...'}
              </span>
            </div>
            <Button onClick={handleDisconnect} className="bg-red-500 hover:bg-red-600">
              Disconnect
            </Button>
          </div>
        ) : (
          <Button onClick={() => setIsModalOpen(true)} className="bg-blue-500 hover:bg-blue-600">
            Connect Wallet
          </Button>
        )}
        {isModalOpen && (
          <Modal onClose={() => setIsModalOpen(false)}>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Connect Wallet</h2>
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <Button
                    key={wallet.id}
                    onClick={() => handleConnect(wallet.id)}
                    className="w-full bg-gray-700 hover:bg-gray-800"
                  >
                    Connect {wallet.metadata.name}
                  </Button>
                ))}
                {wallets.length === 0 && (
                  <p className="text-gray-500">No supported wallets found. Please install a wallet.</p>
                )}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </>
  )
}