import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { creditApi, walletApi } from '../api/client'

interface CreditLine {
  id: number
  limit_amount: number
  used_amount: number
  available_amount: number
  currency: string
  status: string
}

export default function LineOfCredit() {
  const { user } = useAuth()
  const [credit, setCredit] = useState<CreditLine | null>(null)
  const [loading, setLoading] = useState(true)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchCredit = () => {
    creditApi.getMe()
      .then((res) => setCredit(res.data))
      .catch(() => setCredit(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchCredit()
  }, [])

  const handleDraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      await creditApi.draw({ amount: numAmount, description: description || undefined })
      setMessage({ type: 'success', text: 'Funds drawn successfully and added to your wallet!' })
      setAmount('')
      setDescription('')
      fetchCredit()
    } catch (err: unknown) {
      const detail = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response
        ? (err.response.data as { detail?: string }).detail
        : 'Draw failed'
      setMessage({ type: 'error', text: detail || 'Draw failed' })
    } finally {
      setSubmitting(false)
    }
  }

  if (user?.role !== 'customer' && user?.role !== 'admin') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h2 className="font-display font-semibold text-amber-800">Line of Credit</h2>
        <p className="text-amber-700 mt-2">
          Line of credit is only available for customer accounts. Investors can view fund performance from the dashboard.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!credit) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <p className="text-amber-700">No credit line found for your account.</p>
      </div>
    )
  }

  const formatAmount = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: credit.currency }).format(val)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Line of Credit</h1>
        <p className="text-slate-600 mt-1">Draw from your credit line to add funds to your wallet</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Credit Limit</h3>
            <p className="font-display font-bold text-2xl text-slate-800">
              {formatAmount(credit.limit_amount)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Used</h3>
            <p className="font-display font-bold text-2xl text-amber-600">
              {formatAmount(credit.used_amount)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Available to Draw</h3>
            <p className="font-display font-bold text-2xl text-accent-600">
              {formatAmount(credit.available_amount)}
            </p>
            <p className="text-xs text-slate-500 mt-1">Status: {credit.status}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="font-display font-semibold text-lg mb-4">Draw from Credit</h3>
          <form onSubmit={handleDraw} className="space-y-4">
            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={credit.available_amount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={`Max ${formatAmount(credit.available_amount)}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g. Working capital"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || credit.available_amount <= 0}
              className="w-full py-3 px-4 bg-accent-500 text-white font-semibold rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Processing...' : 'Draw to Wallet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
