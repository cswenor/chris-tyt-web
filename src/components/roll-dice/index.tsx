'use client'

import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Dropdown } from "@/components/ui/Dropdown"
import { Dice6, Trophy } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import type { NFT, TokenHolderDisplay } from "@/types"
import { CopyableAddress } from "@/components/ui/copyable-address"
import { useData } from '@/providers/data-provider'
import { fetchVoiName, algodClient } from '@/lib/utils'
import { CONFIG } from "@/config"
import { Button } from "@/components/ui/button"
import { CONTRACT, abi } from "ulujs";
import { useWallet } from '@txnlab/use-wallet-react'

interface Winner {
  holder: TokenHolderDisplay
  nft: NFT
  metadata: {
    name: string
    image: string
  }
  voiName?: string | null
}

export function RollDice() {
  const { holders, nfts } = useData()
  const [winner, setWinner] = useState<Winner | null>(null)
  const [randomMethod, setRandomMethod] = useState("Exclude Creator")
  const [isRolling, setIsRolling] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { signTransactions, activeAccount } = useWallet()

  const selectWinner = async () => {
    if (!holders || holders.length === 0 || !nfts || nfts.length === 0) return

    setIsRolling(true)
    setWinner(null) 
    setIsDropdownOpen(false) 

    let filteredHolders = holders

    switch (randomMethod) {
      case 'Exclude Creator':
        filteredHolders = holders.filter(
          (holder) => holder.address !== CONFIG.WALLET_ADDRESS 
        )
        break
      case 'Cap Weight':
        filteredHolders = holders.map(holder => ({
          ...holder,
          balance: Math.min(holder.balance, 1000), 
        }))
        break
      case 'Logarithmic Scaling':
        filteredHolders = holders.map(holder => ({
          ...holder,
          balance: Math.log10(holder.balance + 1), 
        }))
        break
      case 'Equal Weights':
        filteredHolders = holders.map(holder => ({
          ...holder,
          balance: 1, 
        }))
        break
    }

    if (filteredHolders.length === 0) {
      alert("No eligible holders available for selection.")
      setIsRolling(false)
      return
    }

    const totalTokens = filteredHolders.reduce((sum, holder) => sum + holder.balance, 0)

    const randomPoint = Math.random() * totalTokens

    let accumulator = 0
    let selectedHolder: TokenHolderDisplay | null = null

    for (const holder of filteredHolders) {
      accumulator += holder.balance
      if (randomPoint <= accumulator) {
        selectedHolder = holder
        break
      }
    }

    if (!selectedHolder) {
      selectedHolder = filteredHolders[Math.floor(Math.random() * filteredHolders.length)]
    }

    const randomNFT = nfts[Math.floor(Math.random() * nfts.length)]
    const metadata = JSON.parse(randomNFT.metadata)

    const voiName = await fetchVoiName(selectedHolder.address)

    setTimeout(() => {
      setWinner({
        holder: selectedHolder!,
        nft: randomNFT,
        metadata: {
          name: metadata.name,
          image: metadata.image,
        },
        voiName,
      })
      setIsRolling(false)
    }, 2000)
  }

  // TODO: handler error
  // TODO: add loading state
  const handleTransfer = async (winner: Winner) => {
    const contractId = winner.nft.contractId;
    const tokenId = Number(winner.nft.tokenId)
    const from = CONFIG.WALLET_ADDRESS;
    const to = winner.holder.address;
    console.log({contractId, tokenId, from, to})
    const ci = new CONTRACT(contractId, algodClient, undefined, abi.arc72, {
      addr: from,
      sk: new Uint8Array()
    })
    ci.setPaymentAmount(28500);
    const arc72TransferFromR: any = await ci.arc72_transferFrom(
      from,
      to,
      tokenId
    )
    console.log({arc72TransferFromR})
    const stxns: any = await signTransactions(arc72TransferFromR.txns.map(
      (txn: string) => new Uint8Array(Buffer.from(txn, 'base64'))
    ))
    const { txid } = await algodClient.sendRawTransaction(stxns).do()
    console.log({txid})
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dice6 className="h-5 w-5" />
          Roll the Dice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Dropdown and Roll Button */}
          <div className="flex justify-center">
            <Dropdown
              triggerText="Roll the Dice"
              triggerIcon={
                isRolling ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Dice6 className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <Dice6 className="h-5 w-5" />
                )
              }
              subText={`Current approach: ${randomMethod}`}
              items={[
                { label: "Exclude Creator", onClick: () => setRandomMethod("Exclude Creator") },
                { label: "Cap Weight", onClick: () => setRandomMethod("Cap Weight") },
                { label: "Logarithmic Scaling", onClick: () => setRandomMethod("Logarithmic Scaling") },
                { label: "Equal Weights", onClick: () => setRandomMethod("Equal Weights") },
              ]}
              onMainClick={selectWinner}
              className={isRolling ? "opacity-50 cursor-not-allowed" : "w-full max-w-xs"} // Disabled styles during rolling
            />
          </div>

          {/* Winner Display */}
          <AnimatePresence mode="wait">
            {!isRolling && winner && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="bg-muted/50 rounded-lg p-6 text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Trophy className="h-12 w-12 mx-auto text-yellow-500" />
                  </motion.div>

                  <div className="space-y-4">
                    <div className="text-lg font-semibold">Winner Selected!</div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Wallet Address:
                      </div>
                      <div className="flex justify-center">
                        {winner.voiName ? (
                          <span className="font-medium">{winner.voiName}</span>
                        ) : (
                          <CopyableAddress address={winner.holder.address} variant="address" />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Prize NFT:
                      </div>
                      <div className="font-medium">{winner.metadata.name}</div>
                      <div className="mt-4">
                        <img
                          src={winner.metadata.image}
                          alt={winner.metadata.name}
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                          loading="lazy"
                        />
                      </div>
                    </div>

                    {activeAccount?.address === CONFIG.WALLET_ADDRESS ? <Button onClick={() => handleTransfer(winner)} className="mt-4">
                      Transfer to Winner
                    </Button>: null}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}