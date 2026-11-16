import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { INVENTORY_API } from '../config'
import { Wrapper } from './Wrapper'

export const ProductsCreate = () => {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${INVENTORY_API}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), price: Number(price), quantity: Number(quantity) }),
      })
      if (!response.ok) throw new Error(`Could not create product (${response.status})`)
      await navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create product')
      setSubmitting(false)
    }
  }

  return (
    <Wrapper title="New product">
      <form onSubmit={submit} className="card max-w-xl space-y-5 p-6">
        {error && <p className="alert-error">{error}</p>}

        <div>
          <label htmlFor="name" className="field-label">
            Name
          </label>
          <input
            id="name"
            className="field-input"
            placeholder="e.g. Wireless mouse"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="field-label">
              Price (USD)
            </label>
            <input
              id="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className="field-input"
              placeholder="0.00"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="quantity" className="field-label">
              Quantity
            </label>
            <input
              id="quantity"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              className="field-input"
              placeholder="0"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : 'Create product'}
          </button>
        </div>
      </form>
    </Wrapper>
  )
}
