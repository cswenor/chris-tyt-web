'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { HoldersTable } from "./holders-table"
import { useTokenHolders } from "./useTokenHolders"
import { LoadingCard, ErrorCard } from '@/components/ui/status-cards'
import { useState } from "react"
import { CONFIG } from '@/config'

export function TokenHolders() {
  const { 
    holders, 
    loading, 
    error
  } = useTokenHolders()
  const [search, setSearch] = useState("")

  if (loading) {
    return <LoadingCard />
  }

  if (error) {
    return <ErrorCard message={error} />
  }

  const filteredHolders = holders.filter(holder => 
    (holder.address.toLowerCase().includes(search.toLowerCase())
    || holder.name.toLowerCase().includes(search.toLowerCase()))
    && (holder.balance > 0)
    && !(CONFIG.EXCLUDED_ADDRESSES as unknown as string[]).includes(holder.address as string)
  )

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Token Holders</span>
          <span className="text-sm text-muted-foreground">
            Total Holders: {holders.length}
          </span>
        </CardTitle>
        <input
          type="text"
          placeholder="Search by address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mt-2 px-3 py-2 border rounded-md"
        />
      </CardHeader>
      <CardContent>
        <HoldersTable holders={filteredHolders} />
      </CardContent>
    </Card>
  )
}