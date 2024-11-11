import { useState, useEffect, useCallback } from 'react';
import { CONFIG } from '@/config';
import type { TokenHolderDisplay, TokenBalanceResponse, NFT } from '@/types';
import { setCachedData, getCachedData, clearCache } from '@/lib/cache-utils';

function useTokenHolders() {
  const [holders, setHolders] = useState<TokenHolderDisplay[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async (forceFresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch holders data
      let holdersData: TokenHolderDisplay[] | null = !forceFresh ? getCachedData('holders') : null;
      
      if (!holdersData) {
        const response = await fetch(
          `${CONFIG.APIS.NAUTILUS_INDEXER}/arc200/balances?contractId=${CONFIG.TOKEN_ID}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch token holders');
        }

        const data: TokenBalanceResponse = await response.json();
        
        holdersData = data.balances
          .filter(b => b.accountId !== CONFIG.WALLET_ADDRESS)
          .map(b => ({
            balance: parseInt(b.balance) / 1_000_000,
            address: b.accountId,
            percentage: 0 // Will be calculated below
          }))
          .sort((a, b) => b.balance - a.balance);

        const totalBalance = holdersData.reduce((sum, b) => sum + b.balance, 0);
        holdersData = holdersData.map(holder => ({
          ...holder,
          percentage: (holder.balance / totalBalance) * 100
        }));

        setCachedData('holders', holdersData);
      }

      // Fetch NFTs data
      let nftsData: NFT[] | null = !forceFresh ? getCachedData('nfts') : null;

      if (!nftsData) {
        const response = await fetch(
          `${CONFIG.APIS.NAUTILUS_INDEXER}/tokens?owner=${CONFIG.WALLET_ADDRESS}&include=all`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch NFTs');
        }

        const data = await response.json();
        nftsData = data.tokens;
        setCachedData('nfts', nftsData);
      }

      setHolders(holdersData);
      setNfts(nftsData || []);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setHolders([]);
      setNfts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      // Clear all caches - both localStorage and IndexedDB
      await clearCache();
      
      // Force reload images by revoking any existing object URLs
      if (typeof window !== 'undefined') {
        const objectUrls = Array.from(document.querySelectorAll('img'))
          .map(img => img.src)
          .filter(src => src.startsWith('blob:'));
        
        objectUrls.forEach(url => {
          URL.revokeObjectURL(url);
        });
      }

      // Fetch fresh data
      await fetchData(true);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { holders, nfts, loading, error, lastRefresh, refreshData };
}

export default useTokenHolders;