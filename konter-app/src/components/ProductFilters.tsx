'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function ProductFilters({ 
  categories, 
  brands, 
  basePath 
}: { 
  categories: string[], 
  brands: string[],
  basePath: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentCategory = searchParams.get('category') || ''
  const currentBrand = searchParams.get('brand') || ''

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams()
    if (val) params.set('category', val)
    // reset brand when category changes or cleared
    router.push(`${basePath}?${params.toString()}`)
  }

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams()
    const cat = searchParams.get('category') || ''
    if (cat) params.set('category', cat)
    if (val) params.set('brand', val)
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Kategori</label>
        <select 
          value={currentCategory} 
          onChange={handleCategoryChange}
          className="w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-md p-2 text-sm"
        >
          <option value="">Semua Kategori</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">Provider / Brand</label>
        <select 
          value={currentBrand} 
          onChange={handleBrandChange}
          className="w-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-md p-2 text-sm"
          disabled={!currentCategory && brands.length === 0}
        >
          <option value="">Semua Provider</option>
          {brands.map(b => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
