'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, Loader2 } from 'lucide-react'

export function CreateStaffDialog() {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const nama_toko = formData.get('nama_toko') as string

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nama_toko, role: 'staff' }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create staff')
      }

      setOpen(false)
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gap-2" />}>
        <PlusCircle className="w-4 h-4" />
        Tambah Staff
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Staff Baru</DialogTitle>
          <DialogDescription>
            Buat akun staff baru yang akan terhubung ke toko Anda.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="staff@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} placeholder="Minimal 6 karakter" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nama_toko">Nama Staff / Keterangan</Label>
            <Input id="nama_toko" name="nama_toko" placeholder="Contoh: Budi (Kasir 1)" />
          </div>
          <Button type="submit" className="w-full mt-4" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...
              </>
            ) : (
              'Simpan Staff'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
