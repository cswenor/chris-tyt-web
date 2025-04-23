'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { CopyableAddress } from "@/components/ui/copyable-address"
import { formatNumber } from "@/lib/utils"
import { useTokenDetails } from "./useTokenDetails"
import { CONFIG } from "@/config"
import * as Tooltip from '@radix-ui/react-tooltip'

export function TokenDetails() {
  const { voiBalance, loading } = useTokenDetails(CONFIG.WALLET_ADDRESS)

  return (
    <Tooltip.Provider delayDuration={300}>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Token Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="font-medium text-sm text-muted-foreground">
                Creator Wallet Address
              </p>
              <CopyableAddress
                address={CONFIG.WALLET_ADDRESS}
                variant="address"
              />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm text-muted-foreground">
                Token ID
              </p>
              <div className="flex items-center gap-2">
                <CopyableAddress
                  address={CONFIG.TOKEN_ID.toString()}
                  variant="numeric"
                />
                <a
                  href={`https://voiager.xyz/token/${CONFIG.TOKEN_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View on Voiager ↗
                </a>
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm text-muted-foreground">
                VOI Balance
              </p>
              <p>
                {loading ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  `${formatNumber(voiBalance)} VOI`
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Tooltip.Provider>
  )
}