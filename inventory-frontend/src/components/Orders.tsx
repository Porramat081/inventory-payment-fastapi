import { useEffect, useState, type FormEvent } from 'react'
import { INVENTORY_API, PAYMENT_API } from '../config'
import type { Product } from '../types'
import { Wrapper } from './Wrapper'

// Must match the fee the payment service charges (payment/main.py).
const FEE_RATE = 0.2
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

type Lookup = { status: 'idle' | 'loading' | 'notfound' } | { status: 'found'; product: Product }

export const Orders = () => {
  const [id, setId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [lookup, setLookup] = useState<Lookup>({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null)

  const productId = id.trim()

  useEffect(() => {
    if (!productId) return
    const controller = new AbortController()
    // Debounce so the API isn't hit on every keystroke.
    const timer = setTimeout(async () => {
      setLookup({ status: 'loading' })
      try {
        const response = await fetch(`${INVENTORY_API}/product/${encodeURIComponent(productId)}`, {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('not found')
        const content = await response.json()
        setLookup({
          status: 'found',
          product: {
            id: content.pk ?? productId,
            name: content.name,
            price: Number(content.price),
            quantity: Number(content.quantity),
          },
        })
      } catch {
        if (!controller.signal.aborted) setLookup({ status: 'notfound' })
      }
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [productId])

  const current: Lookup = productId ? lookup : { status: 'idle' }
  const product = current.status === 'found' ? current.product : null
  const qty = Math.max(0, Math.floor(Number(quantity)) || 0)
  const unitTotal = product ? product.price * (1 + FEE_RATE) : 0

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const response = await fetch(`${PAYMENT_API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, quantity: qty }),
      })
      if (!response.ok) throw new Error(`Order failed (${response.status})`)
      setResult({ ok: true, text: 'Thank you for your order! It will be completed shortly.' })
      setId('')
      setQuantity('1')
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : 'Order failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Wrapper title="Checkout">
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form onSubmit={submit} className="card space-y-5 p-6">
          <p className="text-sm text-slate-500 dark:text-slate-400">Buy your favorite product.</p>

          {result && (
            <p
              className={
                result.ok
                  ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'alert-error'
              }
            >
              {result.text}
            </p>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="product" className="field-label">
                Product ID
              </label>
              <input
                id="product"
                className="field-input font-mono"
                placeholder="Paste a product ID"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
              />
              <p className="mt-1.5 min-h-5 text-xs text-slate-500">
                {current.status === 'loading' && 'Looking up product…'}
                {current.status === 'notfound' && (
                  <span className="text-red-600 dark:text-red-400">Product not found</span>
                )}
                {product && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {product.name} · {product.quantity} in stock
                  </span>
                )}
              </p>
            </div>
            <div>
              <label htmlFor="quantity" className="field-label">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                className="field-input"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <button className="btn btn-primary w-full py-2.5" type="submit" disabled={submitting || !product}>
            {submitting ? 'Placing order…' : 'Buy'}
          </button>
        </form>

        <aside className="card h-fit p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">Order summary</h2>
          {product ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Unit price</dt>
                <dd className="tabular-nums">{currency.format(product.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Fee ({FEE_RATE * 100}%)</dt>
                <dd className="tabular-nums">{currency.format(product.price * FEE_RATE)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Quantity</dt>
                <dd className="tabular-nums">× {qty}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-semibold dark:border-slate-800">
                <dt>Total</dt>
                <dd className="tabular-nums">{currency.format(unitTotal * qty)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-slate-500">Enter a product ID to see the price.</p>
          )}
        </aside>
      </div>
    </Wrapper>
  )
}
