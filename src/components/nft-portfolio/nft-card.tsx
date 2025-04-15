'use client'

import type { NFT, NFTMetadata } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import React from "react"

interface NFTCardProps {
  nft: NFT
  metadata: NFTMetadata
  onClick: () => void
}

export function NFTCard({ nft, metadata, onClick }: NFTCardProps) {
  const getImageUrl = (url: string) => {
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/')
    }
    return url
  }

  const [nameInfo, setNameInfo] = React.useState<{ name?: string  } | null>(null)

  React.useEffect(() => {
    if(nft.collectionName !== 'en.Voi') return
    async function fetchNameInfo() {
      try {
        const response = await fetch(`https://api.envoi.sh/api/token/${nft.tokenId}`)
        if (!response.ok) throw new Error('Failed to fetch name info')
        const data = await response.json()
        setNameInfo(data.results[0])
      } catch (error) {
        console.error('Error fetching enVoi name info:', error)
        setNameInfo(null)
      }
    }
    fetchNameInfo()
  }, [nft.tokenId])

  const displayMetadata = {
    ...metadata,
    name: nameInfo?.name || metadata.name
  }

  return (
    <Card 
      className="cursor-pointer group transition-all duration-300 hover:shadow-lg"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="relative w-full pt-[100%] overflow-hidden">
          <div className="absolute inset-0">
            {displayMetadata.image ? (
              <img 
                src={getImageUrl(displayMetadata.image)}
                alt={displayMetadata.name || `NFT #${nft.tokenId}`}
                className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                <span className="text-2xl">🖼️</span>
              </div>
            )}
          </div>
        </div>
        <p className="mt-2 font-medium text-center truncate">
          {displayMetadata.name || `NFT #${nft.tokenId}`}
        </p>
      </CardContent>
    </Card>
  )
}