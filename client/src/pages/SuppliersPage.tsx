import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Building2,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  Phone,
  Mail,
  Eye,
} from 'lucide-react';
import { apiRequest } from '../services/api';
import { useBusiness } from '../context/BusinessContext';
import { Supplier } from '../types';

export const SuppliersPage: React.FC = () => {
  const { activeBusiness } = useBusiness();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewSupplier, setViewSupplier] = useState<any | null>(null);

  // Form
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [gstin, setGstin] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadSuppliers = async () => {
    if (!activeBusiness) return;
    try {
      setLoading(true);
      const res = await apiRequest<{ suppliers: Supplier[] }>('/suppliers');
      setSuppliers(res.suppliers);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, [activeBusiness]);

  const openAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setState('Maharashtra');
    setGstin('');
    setOpeningBalance(0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson || '');
    setPhone(s.phone);
    setEmail(s.email || '');
    setAddress(s.address || '');
    setCity(s.city || '');
    setState(s.state || 'Maharashtra');
    setGstin(s.gstin || '');
    setOpeningBalance(s.openingBalance);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openSupplierDetails = async (id: string) => {
    try {
      const res = await apiRequest<{ supplier: any }>(`/suppliers/${id}`);
      setViewSupplier(res.supplier);
    } catch (err: any) {
      alert('Failed: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingSupplier) {
        await apiRequest(`/suppliers/${editingSupplier.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, contactPerson, phone, email, address, city, state, gstin }),
        });
      } else {
        await apiRequest('/suppliers', {
          method: 'POST',
          body: JSON.stringify({ name, contactPerson, phone, email, address, city, state, gstin, openingBalance }),
        });
      }

      setIsModalOpen(false);
      await loadSuppliers();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string, suppName: string) => {
    if (!confirm(`Delete supplier "${suppName}"?`)) return;
    try {
      await apiRequest(`/suppliers/${id}`, { method: 'DELETE' });
      await loadSuppliers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const totalPayables = suppliers.reduce((acc, s) => acc + (s.currentBalance > 0 ? s.currentBalance : 0), 0);

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      s.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Supplier Management</h1>
          <p className="text-xs text-[#929292] mt-1">
            Vendor accounts, procurement ledger and payable balances.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Total Registered Suppliers</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">{suppliers.length}</div>
          <p className="text-[11px] text-[#929292] mt-0.5">Hardware vendors & distributors</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Total Accounts Payable</div>
          <div className="text-2xl font-extrabold text-[#171717] mt-1">
            ₹{totalPayables.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-[#929292] mt-0.5">Due to suppliers on credit terms</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-[#EAEAEA] shadow-soft">
          <div className="text-xs font-semibold text-[#929292] uppercase">Vendors with Pending Dues</div>
          <div className="text-2xl font-extrabold text-[#174D40] mt-1">
            {suppliers.filter((s) => s.currentBalance > 0).length}
          </div>
          <p className="text-[11px] text-[#929292] mt-0.5">Payables to disburse</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEAEA]">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]" />
          <input
            type="text"
            placeholder="Search by supplier or contact person..."
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
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Supplier & Contact</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Contact Person</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">Location</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px]">GSTIN</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Payable Balance</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-[11px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[#F5F5F5] transition-colors">
                  <td className="py-3.5">
                    <div className="font-bold text-[#171717] text-sm">{s.name}</div>
                    <div className="text-[11px] text-[#929292] flex items-center gap-2 mt-0.5">
                      <span>{s.phone}</span>
                      {s.email && <span>• {s.email}</span>}
                    </div>
                  </td>
                  <td className="py-3.5 font-medium text-[#171717]">{s.contactPerson || '—'}</td>
                  <td className="py-3.5 text-[#929292]">{s.city || 'N/A'}, {s.state || ''}</td>
                  <td className="py-3.5 font-mono text-[11px] font-semibold text-[#174D40]">
                    {s.gstin || 'Unregistered'}
                  </td>
                  <td className="py-3.5 text-right">
                    <span
                      className={`font-black text-sm ${
                        s.currentBalance > 0 ? 'text-amber-800' : 'text-[#174D40]'
                      }`}
                    >
                      ₹{s.currentBalance.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openSupplierDetails(s.id)}
                        className="p-1.5 text-[#929292] hover:text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors"
                        title="View Purchase Orders"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1.5 text-[#929292] hover:text-[#174D40] hover:bg-[#E8F8DE] rounded-lg transition-colors"
                        title="Edit Supplier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="p-1.5 text-[#929292] hover:text-[#F87171] hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Supplier"
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

      {/* Add / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#EAEAEA] relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <h3 className="font-extrabold text-base text-[#171717]">
                {editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}
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
                <label className="block font-semibold text-[#171717] mb-1">Company / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Asus Technologies India"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Contact Person</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Verma"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98111 22334"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="sales@vendor.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">GSTIN</label>
                  <input
                    type="text"
                    placeholder="27BBBBB0000B1Z8"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Karnataka"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              {!editingSupplier && (
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Opening Payable Balance (₹)</label>
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
                  {editingSupplier ? 'Update Supplier' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Purchase History Modal */}
      {viewSupplier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#EAEAEA] relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-bold text-base text-[#171717]">{viewSupplier.name}</h3>
                <p className="text-xs text-[#929292]">{viewSupplier.city} • GSTIN: {viewSupplier.gstin || 'None'}</p>
              </div>
              <button
                onClick={() => setViewSupplier(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="p-4 bg-[#F5F5F5] rounded-2xl flex justify-between items-center">
                <div>
                  <span className="text-[#929292] block">Current Payable Dues</span>
                  <span className="text-xl font-black text-amber-800">
                    ₹{viewSupplier.currentBalance.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#929292] block">Bills Procured</span>
                  <span className="text-xl font-bold text-[#171717]">{viewSupplier.purchases?.length || 0}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-[#171717] mb-2">Purchase Orders</h4>
                <div className="border border-[#EAEAEA] rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#F5F5F5] text-[#929292]">
                      <tr>
                        <th className="p-2.5">PO #</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5 text-right">Total</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAEAEA]">
                      {(viewSupplier.purchases || []).map((p: any) => (
                        <tr key={p.id}>
                          <td className="p-2.5 font-bold text-[#171717]">{p.purchaseNumber}</td>
                          <td className="p-2.5 text-[#929292]">{new Date(p.date).toLocaleDateString('en-IN')}</td>
                          <td className="p-2.5 text-right font-bold text-[#171717]">
                            ₹{p.grandTotal.toLocaleString('en-IN')}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="text-[10px] font-bold text-[#174D40]">{p.paymentStatus}</span>
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
    </div>
  );
};
