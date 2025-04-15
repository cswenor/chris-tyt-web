'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dice6, Trophy } from "lucide-react"
import { motion, AnimatePresence } from 'framer-motion'
import type { NFT, TokenHolderDisplay } from "@/types"
import { CopyableAddress } from "@/components/ui/copyable-address"
import { useData } from '@/providers/data-provider'
import algosdk from 'algosdk'
import { CONFIG } from '@/config'
import { useNetwork, useWallet } from '@txnlab/use-wallet-react'

interface Winner {
  holder: TokenHolderDisplay
  nft: NFT
  metadata: {
    name: string
    image: string
  }
}

export function RollDice() {
  const { activeAccount, signTransactions, algodClient } = useWallet();
  const { activeNetwork } = useNetwork();
  const { holders, nfts, loading } = useData()
  const [winner, setWinner] = useState<Winner | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)

  const selectWinner = () => {
    if (holders.length === 0 || nfts.length === 0) return
    
    setIsRolling(true)
    
    // Filter out excluded addresses using type assertion to handle string array
    const eligibleHolders = holders.filter(holder => 
      !(CONFIG.EXCLUDED_ADDRESSES as unknown as string[]).includes(holder.address as string)
    )
    
    // Calculate total tokens for weighting
    const totalTokens = eligibleHolders.reduce((sum, holder) => sum + holder.balance, 0)
    
    // Generate random number between 0 and total tokens
    const randomPoint = Math.random() * totalTokens
    
    // Find the winner based on weighted probability
    let accumulator = 0
    let selectedHolder = eligibleHolders[0]
    
    for (const holder of eligibleHolders) {
      accumulator += holder.balance
      if (randomPoint <= accumulator) {
        selectedHolder = holder
        break
      }
    }

    // Filter out 'en.Voi' NFTs and select random NFT from remaining ones
    const eligibleNFTs = nfts.filter(nft => nft.collectionName !== 'en.Voi')
    const randomNFT = eligibleNFTs[Math.floor(Math.random() * eligibleNFTs.length)]
    const metadata = JSON.parse(randomNFT.metadata)

    // Simulate dice roll animation timing
    setTimeout(() => {
      setWinner({
        holder: selectedHolder,
        nft: randomNFT,
        metadata: {
          name: metadata.name,
          image: metadata.image
        }
      })
      setIsRolling(false)
    }, 2000)
  }

  // TODO replace with new version of ulujs compatile with algosdk v3
  const handleTransfer = async () => {
    if (!activeAccount) {
      alert('Please connect your wallet')
      return
    }
    if (!winner) {
      alert('No winner selected')
      return
    }
    if(activeNetwork !== 'voi-mainnet') {
      alert('This feature is only available on the Voi Mainnet')
      return
    }
    setIsTransferring(true)
    try {

      const suggestedParams = await algodClient.getTransactionParams().do();

      const method = algosdk.ABIMethod.fromSignature("arc72_transferFrom(address,address,uint256)void")

      const args = [
        CONFIG.WALLET_ADDRESS,
        winner.holder.address,
        BigInt(winner.nft.tokenId)
      ]

      const encodedArgs = args.map((arg, index) => {
        return (method.args[index].type as any).encode(arg); 
      });

      const vtxns = []

      const boxCost = 28500;
      const txnCount = 1; // REM leave as 1 for now could be used for future use case to send multiple NFTs

      for(let i = 0; i < txnCount; i++) {

        const txns = []

        const accInfo = await algodClient.accountInformation(algosdk.getApplicationAddress(winner.nft.contractId)).do();
        const { amount: balance, minBalance } = accInfo;
        const availableBalance = balance - minBalance;
        const totalBoxCost = txnCount * boxCost;

        // REM ensure the box cost is covered
        if(availableBalance > totalBoxCost) {
          txns.push(
            algosdk.makePaymentTxnWithSuggestedParamsFromObject({
              sender: activeAccount?.address,
            receiver: algosdk.getApplicationAddress(winner.nft.contractId),
            amount: boxCost,
            note: new TextEncoder().encode(`Transfer NFT ${i}`),
            suggestedParams
          })
        )
      }

      txns.push(algosdk.makeApplicationCallTxnFromObject({
        sender: activeAccount?.address,
        appIndex: winner.nft.contractId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [
         method.getSelector(),
         ...encodedArgs
        ],
        suggestedParams
      }))

      const txgroup = algosdk.assignGroupID(txns);

      const request = new algosdk.modelsv2.SimulateRequest({
        txnGroups: [
          new algosdk.modelsv2.SimulateRequestTransactionGroup({
             txns: txgroup.map((value, index) => {
              return algosdk.decodeSignedTransaction(algosdk.encodeUnsignedSimulateTransaction(value))
            })
           }),
         ],
         allowEmptySignatures: true,
         allowUnnamedResources: true,
         fixSigners: true // REM new 
       });

       const resp = await algodClient.simulateTransactions(request).do();

       // TODO check if the transaction is successful

       const utxns = txns.map(t => Buffer.from(algosdk.encodeUnsignedTransaction(t)).toString("base64"))

       vtxns.push(utxns)
      }

       const stxns = await signTransactions(vtxns.map(v =>v.map(u => new Uint8Array(Buffer.from(u, 'base64')))))

       const res = await algodClient.sendRawTransaction(stxns as Uint8Array[]).do();

       console.log({ res })

    } catch (error) {
      console.error('Transfer failed:', error)
    } finally {
      setIsTransferring(false)
    }
  }

  if (loading || holders.length === 0 || nfts.length === 0) {
    return null
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dice6 className="h-5 w-5" />
          Roll them Dice
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="text-muted-foreground">
            Press the button below to show an example of randomly selecting a winner from the token holders.
            The chance of winning is proportional to the amount of tokens they hold - 
            the more tokens they have, the better their chances!
          </div>

          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={selectWinner}
              disabled={isRolling}
              className="relative overflow-hidden"
            >
              {isRolling ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Dice6 className="h-5 w-5" />
                </motion.div>
              ) : (
                <>
                  <Dice6 className="h-5 w-5 mr-2" />
                  Roll the Dice
                </>
              )}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {winner && !isRolling && (
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
                        <CopyableAddress 
                          address={winner.holder.address}
                          variant="address"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground mb-1">
                        Prize NFT:
                      </div>
                      <div className="font-medium">
                        {winner.metadata.name}
                      </div>
                      <div className="mt-4">
                        <img
                          src={winner.metadata.image}
                          alt={winner.metadata.name}
                          className="w-32 h-32 object-cover rounded-lg mx-auto"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  </div>
                  {activeAccount?.address === CONFIG.WALLET_ADDRESS && (
                    <div className="mt-6">
                      <Button
                        onClick={handleTransfer}
                        disabled={isTransferring}
                        variant="secondary"
                    >
                      {isTransferring ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Dice6 className="h-4 w-4" />
                          </motion.div>
                          Transferring...
                        </>
                      ) : (
                        'Transfer NFT'
                      )}
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}