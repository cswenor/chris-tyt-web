'use client'

import { CopyableAddress } from "@/components/ui/copyable-address"
import type { TokenHolderDisplay } from '@/types'
import { useState } from 'react'

interface HoldersTableProps {
  holders: TokenHolderDisplay[]
  itemsPerPage?: number
}

export function HoldersTable({ holders, itemsPerPage = 10 }: HoldersTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  
  const totalPages = Math.ceil(holders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedHolders = holders.slice(startIndex, startIndex + itemsPerPage)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-2 border-b">Address</th>
              <th className="text-right p-2 border-b">Balance</th>
              <th className="text-right p-2 border-b">Share %</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHolders.map((holder) => (
              <tr key={holder.address} className="group hover:bg-muted/50">
                <td className="p-2 border-b">
                  <CopyableAddress 
                    address={holder.address}
                    name={holder.name}
                    variant={"name"}
                    truncateLength={8}
                  />
                </td>
                <td className="p-2 border-b text-right">
                  {holder.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 6
                  })}
                </td>
                <td className="p-2 border-b text-right text-muted-foreground">
                  {holder.percentage.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}