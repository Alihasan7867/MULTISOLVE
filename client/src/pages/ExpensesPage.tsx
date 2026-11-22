import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Receipt,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Tag,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Expense, ExpenseCategory } from '../types';
import { useSearchParams } from 'react-router-dom';

export const ExpensesPage: React.FC = () => {
  const { activeBusiness } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Add Expense Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const [expRes, catRes] = await Promise.all([
        apiRequest<{ expenses: Expense[]; totalAmount: number }>('/expenses'),
        apiRequest<{ categories: ExpenseCategory[] }>('/expenses/categories'),
      ]);
      setExpenses(expRes.expenses);
      setTotalAmount(expRes.totalAmount);
      setCategories(catRes.categories);

      if (catRes.categories.length > 0 && !categoryId) {
        setCategoryId(catRes.categories[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [activeBusiness]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      await apiRequest('/expenses', {
        method: 'POST',
        body: JSON.stringify({
          categoryId,
          title,
          amount,
          date,
          paymentMethod,
          referenceNumber,
          description,
        }),
      });

      setIsModalOpen(false);
      setTitle('');
      setAmount(0);
      setReferenceNumber('');
      setDescription('');
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record expense');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, expTitle: string) => {
    if (!confirm(`Delete expense "${expTitle}"?`)) return;
    try {
      await apiRequest(`/expenses/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.referenceNumber && e.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchCat = selectedCategory ? e.categoryId === selectedCategory : true;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Expense Tracking</h1>
          <p className="text-xs text-[#929292] mt-1">
            Track business operating costs. Journal entries post to the general ledger automatically.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Total Operating Expenditure</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">
            ₹{totalAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#929292] mt-0.5">Across all categories</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Recorded Transactions</div>
          <div className="text-2xl font-extrabold text-[#174D40] mt-1">{expenses.length} Entries</div>
          <p className="text-[11px] text-[#929292] mt-0.5">Audited financial vouchers</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Expense Categories</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">{categories.length}</div>
          <p className="text-[11px] text-[#929292] mt-0.5">Rent, Payroll, Utilities, Supplies</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search expense description or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl px-3 py-2 text-xs font-semibold text-[#171717] focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Expense Item</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Category</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Date</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Payment Mode</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Reference #</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Amount</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-[#F5F5F5] transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-[#171717] text-sm">{e.title}</div>
                    {e.description && <div className="text-[11px] text-[#929292]">{e.description}</div>}
                  </td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8DE] text-[#174D40] text-[10px] font-bold">
                      {e.category.name}
                    </span>
                  </td>
                  <td className="py-3.5 text-[#929292]">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                  <td className="py-3.5 font-semibold text-[#171717]">{e.paymentMethod}</td>
                  <td className="py-3.5 font-mono text-[11px] text-[#929292]">{e.referenceNumber || '—'}</td>
                  <td className="py-3.5 text-right font-black text-sm text-[#171717]">
                    ₹{e.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => handleDelete(e.id, e.title)}
                      className="p-1.5 text-[#929292] hover:text-[#F87171] hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">Record Business Expense</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 my-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#F87171]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-3 text-xs">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Expense Title / Payee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Office Rent for Nov 2026, Tata Power Bill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Category *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="0.00"
                    value={amount || ''}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717] font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="UPI">UPI</option>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Debit / Credit Card</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Reference / Transaction #</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-998811223"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
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
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={15} className="text-[#98E66B]" />
                  Save Expense & Post Journal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
