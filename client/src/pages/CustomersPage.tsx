import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Users,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  Mail,
  Building,
  CreditCard,
  Eye,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Customer } from '../types';

export const CustomersPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewCustomer, setViewCustomer] = useState<any | null>(null);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  // Payment Receipt Form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('UPI');
  const [payRef, setPayRef] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [gstin, setGstin] = useState('');
  const [customerType, setCustomerType] = useState('Corporate');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCustomers = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await apiRequest<{ customers: Customer[] }>('/customers');
      setCustomers(res.customers);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [activeBusiness]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setState('Maharashtra');
    setGstin('');
    setCustomerType('Corporate');
    setOpeningBalance(0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || '');
    setAddress(c.address || '');
    setCity(c.city || '');
    setState(c.state || 'Maharashtra');
    setGstin(c.gstin || '');
    setCustomerType(c.customerType);
    setOpeningBalance(c.openingBalance);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openCustomerDetails = async (id: string) => {
    try {
      const res = await apiRequest<{ customer: any }>(`/customers/${id}`);
      setViewCustomer(res.customer);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomer) return;
    setPaySubmitting(true);
    try {
      await apiRequest(`/customers/${paymentCustomer.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          amount: payAmount,
          paymentMethod: payMethod,
          referenceNumber: payRef,
        }),
      });
      setPaymentCustomer(null);
      setPayAmount(0);
      setPayRef('');
      await loadCustomers();
    } catch (err: any) {
      alert(err.message || 'Payment recording failed');
    } finally {
      setPaySubmitting(false);
    }
  };

  const openPaymentModal = (c: Customer) => {
    setPaymentCustomer(c);
    setPayAmount(c.currentBalance > 0 ? c.currentBalance : 0);
    setPayRef('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingCustomer) {
        await apiRequest(`/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, phone, email, address, city, state, gstin, customerType }),
        });
      } else {
        await apiRequest('/customers', {
          method: 'POST',
          body: JSON.stringify({ name, phone, email, address, city, state, gstin, customerType, openingBalance }),
        });
      }

      setIsModalOpen(false);
      await loadCustomers();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, custName: string) => {
    if (!confirm(`Delete customer "${custName}"?`)) return;
    try {
      await apiRequest(`/customers/${id}`, { method: 'DELETE' });
      await loadCustomers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalReceivables = customers.reduce((acc, c) => acc + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Customer Directory</h1>
          <p className="text-xs text-[#929292] mt-1">
            Accounts receivable, credit tracking and complete sales history per customer.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Total Active Clients</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">{customers.length}</div>
          <p className="text-[11px] text-[#929292] mt-0.5">Corporate & retail partners</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Total Accounts Receivable</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">
            ₹{totalReceivables.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#929292] mt-0.5">Outstanding invoice dues</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Clients with Credit Balances</div>
          <div className="text-2xl font-extrabold text-[#174D40] mt-1">
            {customers.filter((c) => c.currentBalance > 0).length}
          </div>
          <p className="text-[11px] text-[#929292] mt-0.5">Pending payments to collect</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or GSTIN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#EAEAEA] shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAEAEA] text-[#929292]">
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Customer & Contact</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Type</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">City / State</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">GSTIN</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Outstanding Receivable</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[#F5F5F5] transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-[#171717] text-sm">{c.name}</div>
                    <div className="text-[11px] text-[#929292] flex items-center gap-2 mt-0.5">
                      <span>{c.phone}</span>
                      {c.email && <span>• {c.email}</span>}
                    </div>
                  </td>
                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-[#F5F5F5] text-[#171717] text-[10px] font-bold">
                      {c.customerType}
                    </span>
                  </td>
                  <td className="py-3.5 text-[#929292]">{c.city || 'N/A'}, {c.state || ''}</td>
                  <td className="py-3.5 font-mono text-[11px] font-semibold text-[#174D40]">
                    {c.gstin || 'Unregistered'}
                  </td>
                  <td className="py-3.5 text-right">
                    <span
                      className={`font-black text-sm ${
                        c.currentBalance > 0 ? 'text-[#F87171]' : 'text-[#174D40]'
                      }`}
                    >
                      ₹{c.currentBalance.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.currentBalance > 0 && (
                        <button
                          onClick={() => openPaymentModal(c)}
                          className="px-2 py-1 text-[11px] font-bold text-[#174D40] bg-[#E8F8DE] hover:bg-[#d9f2cb] rounded-lg transition-colors flex items-center gap-1"
                          title="Record Customer Payment"
                        >
                          <CreditCard size={13} /> Collect
                        </button>
                      )}
                      <button
                        onClick={() => openCustomerDetails(c.id)}
                        className="p-1.5 text-[#929292] hover:text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors"
                        title="View Purchase History"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(c)}
                        className="p-1.5 text-[#929292] hover:text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.id, c.name)}
                        className="p-1.5 text-[#929292] hover:text-[#F87171] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Customer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EAEAEA] relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">
                {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
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
                <label className="block font-semibold text-[#171717] mb-1">Customer / Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Reliance Retail Ventures"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="billing@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Maharashtra"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">GSTIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="27AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Customer Category</label>
                  <select
                    value={customerType}
                    onChange={(e) => setCustomerType(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  >
                    <option value="Corporate">Corporate / B2B</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Regular">Regular / Retail</option>
                  </select>
                </div>
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Opening Receivable Balance (₹)</label>
                  <input
                    type="number"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              )}

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
                  {editingCustomer ? 'Update Client' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Details & History Modal */}
      {viewCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-bold text-base text-[#171717]">{viewCustomer.name}</h3>
                <p className="text-xs text-[#929292]">{viewCustomer.customerType} • GSTIN: {viewCustomer.gstin || 'None'}</p>
              </div>
              <button
                onClick={() => setViewCustomer(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-4 bg-[#F5F5F5] rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[#929292] block">Current Outstanding Balance</span>
                  <span className="text-xl font-black text-[#174D40]">
                    ₹{viewCustomer.currentBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#929292] block">Total Invoices Issued</span>
                  <span className="text-xl font-bold text-[#171717]">{viewCustomer.sales?.length || 0}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-[#171717] mb-2">Transaction History</h4>
                <div className="border border-[#EAEAEA] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F5F5F5] text-[#929292]">
                      <tr>
                        <th className="p-2.5">Invoice #</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Amount</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {(viewCustomer.sales || []).map((s: any) => (
                        <tr key={s.id}>
                          <td className="p-2.5 font-bold text-[#171717]">{s.invoiceNumber}</td>
                          <td className="p-2.5 text-[#929292]">{new Date(s.date).toLocaleDateString('en-IN')}</td>
                          <td className="p-2.5 text-right font-bold text-[#171717]">
                            ₹{s.grandTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="text-[10px] font-bold text-[#174D40]">{s.paymentStatus}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Collect Payment Modal */}
      {paymentCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-extrabold text-base text-[#171717]">Record Payment Receipt</h3>
                <p className="text-xs text-[#929292]">Customer: {paymentCustomer.name}</p>
              </div>
              <button
                onClick={() => setPaymentCustomer(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4 pt-3 text-xs">
              <div className="p-3 bg-[#F5F5F5] rounded-xl flex justify-between items-center">
                <span className="text-[#929292]">Current Due Balance:</span>
                <span className="text-base font-black text-[#F87171]">
                  ₹{paymentCustomer.currentBalance.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Payment Amount Received (₹) *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    value={payAmount}
                    onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs font-bold text-[#171717]"
                  />
                  <button
                    type="button"
                    onClick={() => setPayAmount(paymentCustomer.currentBalance)}
                    className="px-3 py-1 bg-[#E8F8DE] text-[#174D40] text-[11px] font-bold rounded-xl whitespace-nowrap"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                >
                  <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / RTGS)</option>
                  <option value="CASH">Cash on Hand</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-TXN-98442"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#EAEAEA]">
                <button
                  type="button"
                  onClick={() => setPaymentCustomer(null)}
                  className="px-4 py-2 text-xs font-bold text-[#929292]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="px-5 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={15} className="text-[#98E66B]" />
                  {paySubmitting ? 'Recording...' : 'Record Payment & Reconcile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
