import { useState, useEffect, useCallback, useMemo } from 'react'
import type { NFT, ContractGroup, NFTResponse } from "@/types"
import { CONFIG } from '@/config'

export function useNFTPortfolio() {
  const [nfts, setNfts] = useState<NFT[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null)
  const [activeContractId, setActiveContractId] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchNFTs = useCallback(async () => {
    try {
      const response = await fetch(
        `${CONFIG.APIS.MIMIR_INDEXER}/nft-indexer/v1/tokens?owner=${CONFIG.WALLET_ADDRESS}&limit=1000`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch NFTs');
      }

      const data: NFTResponse = await response.json();
      return data.tokens;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch NFTs');
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nftsData = await fetchNFTs();
      setNfts(nftsData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, [fetchNFTs]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const groupedNfts = useMemo(() => {
    const grouped = nfts.reduce((acc: { [key: number]: ContractGroup }, nft) => {
      if (!acc[nft.contractId]) {
        const metadata = JSON.parse(nft.metadata)
        acc[nft.contractId] = {
          contractId: nft.contractId,
          collectionName: nft.collectionName,
          description: metadata.description,
          nfts: []
        }
      }
      acc[nft.contractId].nfts.push(nft)
      return acc
    }, {})

    return Object.values(grouped).sort((a, b) => 
      a.collectionName?.localeCompare(b.collectionName)
    )
  }, [nfts])

  const activeGroup = useMemo(() => 
    groupedNfts.find(group => group.contractId === activeContractId),
    [groupedNfts, activeContractId]
  )

  useEffect(() => {
    if (groupedNfts.length > 0 && !activeContractId) {
      setActiveContractId(groupedNfts[0].contractId)
    }
  }, [groupedNfts, activeContractId])

  useEffect(() => {
    const updateItemsPerPage = () => {
      setItemsPerPage(window.innerWidth >= 768 ? 12 : 4)
    }

    updateItemsPerPage()
    window.addEventListener('resize', updateItemsPerPage)
    return () => window.removeEventListener('resize', updateItemsPerPage)
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeGroup])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = activeGroup 
    ? Math.ceil(activeGroup.nfts.length / itemsPerPage)
    : 0

  const currentPageItems = activeGroup?.nfts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  ) ?? []

  return {
    loading,
    error,
    nfts,
    selectedNFT,
    setSelectedNFT,
    activeContractId,
    setActiveContractId,
    groupedNfts,
    activeGroup,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    totalPages,
    currentPageItems,
    lastRefresh,
    refreshData
  }
}