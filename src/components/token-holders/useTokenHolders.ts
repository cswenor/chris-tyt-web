import { useState, useEffect, useCallback } from 'react'
import { CONFIG } from '@/config'
import type { TokenHolderDisplay, TokenBalanceResponse } from '@/types'
import envoiSDK from '@xarmian/envoi-sdk';

const resolver = envoiSDK.init({
  token: "",
  url: CONFIG.APIS.VOI_NODE,
  port: 443
});

export function useTokenHolders() {
  const [holders, setHolders] = useState<TokenHolderDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [searchTerm, setSearchTerm] = useState('') 

  const fetchHolders = useCallback(async () => {
    try {
      const response = await fetch(
        `${CONFIG.APIS.NAUTILUS_INDEXER}/arc200/balances?contractId=${CONFIG.TOKEN_ID}`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch token holders')
      }

      const data: TokenBalanceResponse = await response.json()
 
      const resolvedNames: Record<string, string> = {};
      for (const balance of data.balances) {
        if(balance.accountId in resolvedNames) {
          continue;
        }
        const nameResult = await resolver.http.getNameFromAddress(balance.accountId);
        const name = Array.isArray(nameResult) ? nameResult[0] : nameResult;
        resolvedNames[balance.accountId] = name;
      }

      // Filter out creator wallet and calculate percentages
      const holdersData = data.balances
        .filter(b => b.accountId !== CONFIG.WALLET_ADDRESS)
        .map(b => ({
          balance: parseInt(b.balance) / 1_000_000,
          address: b.accountId,
          name: resolvedNames[b.accountId],
          percentage: 0
        }))
        .sort((a, b) => b.balance - a.balance)

      const totalBalance = holdersData.reduce((sum, b) => sum + b.balance, 0)
      
      return holdersData.map(holder => ({
        ...holder,
        percentage: (holder.balance / totalBalance) * 100
      }))
    } catch (error) {
      throw new Error('Failed to fetch token holders')
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const holdersData = await fetchHolders()
      setHolders(holdersData)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setHolders([])
    } finally {
      setLoading(false)
    }
  }, [fetchHolders])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredHolders = holders.filter(holder =>
    holder.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    holder.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return { 
    holders: filteredHolders, 
    loading, 
    error, 
    lastRefresh,
    refreshData: fetchData,
    setSearchTerm 
  }
}