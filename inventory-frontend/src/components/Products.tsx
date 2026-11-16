import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { INVENTORY_API } from '../config'
import type { Product } from '../types'
import { Wrapper } from './Wrapper'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const response = await fetch(`${INVENTORY_API}/products`)
        if (!response.ok) throw new Error(`Request failed (${response.status})`)
        const content: Product[] = await response.json()
        setProducts(content)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load products')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const del = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      const response = await fetch(`${INVENTORY_API}/product/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(`Delete failed (${response.status})`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete product')
    }
  }

  return (
    <Wrapper
      title="Products"
      actions={
        <Link to="/create" className="btn btn-primary">
          + Add product
        </Link>
      }
    >
      {error && <p className="alert-error mb-4">{error}</p>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">ID</th>
                <th scope="col" className="px-4 py-3 font-medium">Name</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Price</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Quantity</th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Loading products…
                  </td>
                </tr>
              ) : products.length === 0 && !error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No products yet.{' '}
                    <Link to="/create" className="font-medium text-indigo-600 hover:underline">
                      Add one
                    </Link>
                    .
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="max-w-40 truncate px-4 py-3 font-mono text-xs text-slate-500" title={product.id}>
                      {product.id}
                    </td>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{currency.format(product.price)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className={product.quantity === 0 ? 'text-red-600 dark:text-red-400' : ''}>
                        {product.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" className="btn btn-danger px-3 py-1.5" onClick={() => del(product.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Wrapper>
  )
}
