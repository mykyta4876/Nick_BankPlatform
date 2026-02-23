import { useState, useEffect } from 'react'
import { walletApi } from '../api/client'

interface Wallet {
  id: number
  balance: number
  currency: string
  available_credit: number | null
}

export default function Wallet() {
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchWallet = () => {
    walletApi.getMe()
      .then((res) => setWallet(res.data))
      .catch(() => setWallet(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchWallet()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' })
      return
    }
    setSubmitting(true)
    setMessage(null)
    try {
      if (action === 'deposit') {
        await walletApi.deposit({ amount: numAmount, description: description || undefined })
        setMessage({ type: 'success', text: 'Deposit successful!' })
      } else {
        await walletApi.withdraw({ amount: numAmount, description: description || undefined })
        setMessage({ type: 'success', text: 'Withdrawal successful!' })
      }
      setAmount('')
      setDescription('')
      fetchWallet()
    } catch (err: unknown) {
      const detail = err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response
        ? (err.response.data as { detail?: string }).detail
        : 'Operation failed'
      setMessage({ type: 'error', text: detail || 'Operation failed' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const formatAmount = (val: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: wallet?.currency || 'USD' }).format(val)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Wallet</h1>
        <p className="text-slate-600 mt-1">Manage your funds</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Current Balance</h3>
          <p className="font-display font-bold text-4xl text-primary-700">
            {wallet ? formatAmount(wallet.balance) : '$0.00'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setAction('deposit')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                action === 'deposit' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setAction('withdraw')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                action === 'withdraw' ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Withdraw
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder={action === 'deposit' ? 'e.g. Wire transfer' : 'e.g. ATM withdrawal'}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Processing...' : action === 'deposit' ? 'Deposit' : 'Withdraw'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
