'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SyncButton() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  const handleSync = async () => {
    setLoading(true)
    setMessage(null)
    setIsError(false)

    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        if (data.count === 0) {
          setMessage('DigiFlazz sedang membatasi permintaan. Tunggu 5 menit lalu coba lagi.')
          setIsError(true)
        } else {
          setMessage(`Berhasil sync ${data.count} produk!`)
          setIsError(false)
          // Reload the page to show updated data
          setTimeout(() => window.location.reload(), 1500)
        }
      } else {
        setMessage(data.error || 'Sync gagal')
        setIsError(true)
      }
    } catch (err) {
      setMessage('Koneksi error, coba lagi')
      setIsError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className={`text-xs ${isError ? 'text-red-500' : 'text-green-500'}`}>
          {message}
        </span>
      )}
      <Button
        type="button"
        disabled={loading}
        onClick={handleSync}
        className="gap-2 h-9 px-3 text-xs w-full md:w-auto"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        {loading ? 'Syncing...' : 'Sync DigiFlazz'}
      </Button>
    </div>
  )
}
