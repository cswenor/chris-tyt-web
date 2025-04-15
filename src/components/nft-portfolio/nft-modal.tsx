'use client'

import type { NFT } from "@/types"
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { XCircle } from "lucide-react"
import { motion } from 'framer-motion'
import React from 'react'

interface NFTModalProps {
  nft: NFT | null
  onClose: () => void
}

interface EnVoiDetailsProps {
  name: string
}

function EnVoiDetails({ name }: EnVoiDetailsProps) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">enVoi Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Name</div>
            <div className="font-mono">{name}</div>
      </CardContent>
    </Card>
  )
}

function renderPropertiesTable(properties: Record<string, string>) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {Object.entries(properties).map(([key, value]) => (
        <div key={key} className="bg-muted/50 rounded p-2">
          <div className="text-sm text-muted-foreground">{key}</div>
          <div className="font-medium">{String(value)}</div>
        </div>
      ))}
    </div>
  )
}

function resolveIpfsUrl(url: string): string {
  if (!url) return url
  // Handle ipfs:// protocol
  if (url.startsWith('ipfs://')) {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  // Handle IPFS hash format
  if (url.startsWith('/ipfs/')) {
    return `https://ipfs.io${url}`
  }
  return url
}

export function NFTModal({ nft, onClose }: NFTModalProps) {

  const metadata = JSON.parse(nft?.metadata || '{}')

  const resolvedImageUrl = resolveIpfsUrl(metadata.image)

  const [nameInfo, setNameInfo] = React.useState<{ name?: string  } | null>(null)

  React.useEffect(() => {
    if(!nft) return
    if(nft?.collectionName !== 'en.Voi') return
    async function fetchNameInfo() {
      try {
        const response = await fetch(`https://api.envoi.sh/api/token/${nft?.tokenId}`)
        if (!response.ok) throw new Error('Failed to fetch name info')
        const data = await response.json()
        setNameInfo(data.results[0])
      } catch (error) {
        console.error('Error fetching enVoi name info:', error)
        setNameInfo(null)
      }
    }
    fetchNameInfo()
  }, [nft])

  if (!nft) return null
  return (
    <Dialog.Root open={!!nft} onOpenChange={onClose}>
      <Dialog.Portal>
        <Tooltip.Provider>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="grid md:grid-cols-2 gap-6 p-6">
              {/* Left side - Image */}
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <div className="rounded-lg overflow-hidden bg-black/5">
                    {metadata.image ? (
                      <motion.img
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        src={resolvedImageUrl}
                        alt={metadata.name || `NFT #${nft.tokenId}`}
                        className="w-full h-auto object-contain"
                      />
                    ) : (
                      <div className="w-full h-64 flex items-center justify-center bg-muted">
                        <span className="text-4xl">🖼️</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right side - Metadata */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <Dialog.Title className="text-2xl font-bold">
                      {nameInfo?.name || metadata.name}
                    </Dialog.Title>
                    <Dialog.Description className="text-muted-foreground mt-1">
                      {metadata.description}
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      aria-label="Close"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </Dialog.Close>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Details</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-muted-foreground">Contract ID</div>
                    <div className="font-mono">{nft.contractId}</div>
                    <div className="text-muted-foreground">Token ID</div>
                    {nameInfo?.name ? <Tooltip.Root delayDuration={0}>
                      <Tooltip.Trigger asChild>
                        <div className="font-mono cursor-help">{nft.tokenId}</div>
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="rounded bg-popover/90 px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 select-none"
                          side="top"
                          sideOffset={5}
                        >
                          {nameInfo?.name}
                          <Tooltip.Arrow className="fill-popover/90" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root> : <div className="font-mono">{nft.tokenId}</div>}
                    <div className="text-muted-foreground">Collection</div>
                    <div className="font-mono">{nft.collectionName}</div>
                    <div className="text-muted-foreground">Mint Round</div>
                    <div className="font-mono">{nft['mint-round']}</div>
                  </CardContent>
                </Card>

                {metadata.properties && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Properties</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderPropertiesTable(metadata.properties)}
                    </CardContent>
                  </Card>
                )}

                {nameInfo?.name && (
                  <EnVoiDetails 
                    name={nameInfo.name}
                  />
                )}

                {metadata.image_integrity && (
                  <div className="text-xs text-muted-foreground">
                    Image Integrity: <span className="font-mono">{metadata.image_integrity}</span>
                  </div>
                )}
              </div>
            </div>
          </Dialog.Content>
        </Tooltip.Provider>
      </Dialog.Portal>
    </Dialog.Root>
  )
}