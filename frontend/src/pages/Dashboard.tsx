import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { walletApi, transactionsApi } from '../api/client'

interface Wallet {
  id: number
  balance: number
  currency: string
  available_credit: number | null
}

interface Transaction {
  id: number
  amount: number
  type: string
  description: string | null
  created_at: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      walletApi.getMe(),
      transactionsApi.getMe({ limit: 5 }),
    ])
      .then(([walletRes, txRes]) => {
        setWallet(walletRes.data)
        setTransactions(txRes.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: wallet?.currency || 'USD',
    }).format(Math.abs(amount))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">
          Welcome back, {user?.full_name}
        </h1>
        <p className="text-slate-600 mt-1">
          Here's an overview of your account
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">
            Available Balance
          </h3>
          <p className="font-display font-bold text-3xl text-primary-700">
            {wallet ? formatAmount(wallet.balance) : '$0.00'}
          </p>
        </div>
        {user?.role === 'customer' && wallet?.available_credit != null && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 mb-1">
              Available Credit
            </h3>
            <p className="font-display font-bold text-3xl text-accent-600">
              {formatAmount(wallet.available_credit)}
            </p>
            <Link
              to="/credit"
              className="mt-2 inline-block text-sm text-primary-600 font-medium hover:underline"
            >
              Draw from credit →
            </Link>
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-1">
            Account Type
          </h3>
          <p className="font-display font-semibold text-xl capitalize text-slate-700">
            {user?.role}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h2 className="font-display font-semibold text-lg">Quick Actions</h2>
          </div>
          <div className="p-4 flex flex-wrap gap-3">
            <Link
              to="/wallet"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Deposit
            </Link>
            <Link
              to="/wallet"
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            >
              Withdraw
            </Link>
            {user?.role === 'customer' && (
              <Link
                to="/credit"
                className="px-4 py-2 bg-accent-500 text-white rounded-lg font-medium hover:bg-accent-600 transition-colors"
              >
                Draw Credit
              </Link>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="font-display font-semibold text-lg">Recent Transactions</h2>
            <Link
              to="/transactions"
              className="text-sm text-primary-600 font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {transactions.length === 0 ? (
              <p className="p-6 text-slate-500 text-sm">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 flex justify-between items-center hover:bg-slate-50"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {tx.description || tx.type}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={
                      tx.amount >= 0
                        ? 'text-green-600 font-medium'
                        : 'text-red-600 font-medium'
                    }
                  >
                    {tx.amount >= 0 ? '+' : ''}{formatAmount(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
