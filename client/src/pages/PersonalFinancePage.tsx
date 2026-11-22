import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CheckCircle2,
  X,
  Target,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { PersonalTransaction } from '../types';

export const PersonalFinancePage: React.FC = () => {
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Transaction Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('EXPENSE');
  const [category, setCategory] = useState('Groceries & Dining');
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [savingsBucket, setSavingsBucket] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const loadPersonalData = async () => {
    try {
      setLoading(true);
      const [txRes, bRes] = await Promise.all([
        apiRequest<{ transactions: PersonalTransaction[]; summary: any }>('/personal-finance/transactions'),
        apiRequest<{ budgets: any[] }>('/personal-finance/budgets'),
      ]);
      setTransactions(txRes.transactions);
      setSummary(txRes.summary);
      setBudgets(bRes.budgets);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersonalData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/personal-finance/transactions', {
        method: 'POST',
        body: JSON.stringify({
          type,
          category,
          amount,
          description,
          paymentMethod,
          savingsBucket: type === 'INCOME' ? savingsBucket : undefined,
        }),
      });

      setIsModalOpen(false);
      setAmount(0);
      setDescription('');
      await loadPersonalData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Personal Wealth & Finance</h1>
          <p className="text-xs text-[#929292] mt-1">
            Private, sovereign finance space strictly segregated from company balance sheets.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>Add Personal Entry</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-[11px] font-semibold text-[#929292] uppercase">Monthly Inflow (Salary/Draw)</div>
          <div className="text-2xl font-black text-[#174D40] mt-1">
            ₹{summary?.totalIncome?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-[11px] font-semibold text-[#929292] uppercase">Personal Outflow</div>
          <div className="text-2xl font-black text-[#F87171] mt-1">
            ₹{summary?.totalExpense?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-[11px] font-semibold text-[#929292] uppercase">Net Savings</div>
          <div className="text-2xl font-black text-[#171717] mt-1">
            ₹{summary?.netSavings?.toLocaleString('en-IN') || 0}
          </div>
        </div>

        <div className="p-5 bg-[#E8F8DE] rounded-2xl border border-[#98E66B]/30 shadow-soft">
          <div className="text-[11px] font-bold text-[#174D40] uppercase">Savings Ratio</div>
          <div className="text-2xl font-black text-[#174D40] mt-1">
            {summary?.savingsRate || 0}%
          </div>
        </div>
      </div>

      {/* Budgets & Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Budget Goals */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#174D40]" />
              <h3 className="font-extrabold text-sm text-[#171717]">Monthly Budgets & Caps</h3>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            {budgets.map((b) => (
              <div key={b.id} className="space-y-1.5 p-3 bg-[#F5F5F5] rounded-2xl">
                <div className="flex justify-between font-bold text-[#171717]">
                  <span>{b.category}</span>
                  <span>
                    ₹{b.spent.toLocaleString('en-IN')} / ₹{b.monthlyLimit.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full bg-[#EAEAEA] h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      b.progress > 90 ? 'bg-[#F87171]' : 'bg-[#174D40]'
                    }`}
                    style={{ width: `${Math.min(100, b.progress)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] text-[#929292]">
                  <span>{b.progress}% utilized</span>
                  <span>₹{b.remaining.toLocaleString('en-IN')} remaining</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Personal Transactions */}
        <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
            <div className="flex items-center gap-2">
              <PiggyBank size={18} className="text-[#174D40]" />
              <h3 className="font-extrabold text-sm text-[#171717]">Personal Transaction History</h3>
            </div>
          </div>

          <div className="divide-y divide-[#EAEAEA] text-xs max-h-80 overflow-y-auto">
            {transactions.map((t) => {
              const isInc = t.type === 'INCOME';
              return (
                <div key={t.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-[#171717]">{t.category}</div>
                    <div className="text-[10px] text-[#929292]">
                      {t.description || t.paymentMethod} • {new Date(t.date).toLocaleDateString('en-IN')}
                    </div>
                  </div>
                  <span className={`font-black text-sm ${isInc ? 'text-[#174D40]' : 'text-[#F87171]'}`}>
                    {isInc ? `+₹${t.amount.toLocaleString('en-IN')}` : `-₹${t.amount.toLocaleString('en-IN')}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">Add Personal Transaction</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#F5F5F5] rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('EXPENSE')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'EXPENSE' ? 'bg-[#174D40] text-white' : 'text-[#929292]'
                  }`}
                >
                  Personal Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('INCOME')}
                  className={`py-2 text-xs font-bold rounded-lg transition-all ${
                    type === 'INCOME' ? 'bg-[#174D40] text-white' : 'text-[#929292]'
                  }`}
                >
                  Income / Inflow
                </button>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Groceries, Investments, Dining"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Weekend supermarket shopping"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#929292]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-[#174D40] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} className="text-[#98E66B]" />
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
