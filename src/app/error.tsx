'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <Button
          onClick={() => reset()}
          variant="outline"
        >
          Try again
        </Button>
      </div>
    </main>
  )
}