import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Building,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { apiRequest } from '../services/api';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const MultiBusinessPage: React.FC = () => {
  const { businesses, activeBusiness, setActiveBusiness, loadBusinesses } = useBusiness();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('new') === 'true');
  const [name, setName] = useState('');
  const [type, setType] = useState('Logistics & Services');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [gstin, setGstin] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiRequest<{ business: any }>('/businesses', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          ownerName,
          email,
          phone,
          city,
          state,
          gstin,
        }),
      });

      await loadBusinesses();
      setActiveBusiness(res.business);
      setIsModalOpen(false);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to create business');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">Multi-Business Management</h1>
          <p className="text-xs text-[#929292] mt-1">
            Manage multiple enterprise entities with 100% strict data isolation, independent ledgers and dashboards.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} className="text-[#98E66B]" />
          <span>Add New Business Profile</span>
        </button>
      </div>

      {/* Security & Isolation Notice */}
      <div className="p-4 bg-[#E8F8DE]/80 border border-[#98E66B]/30 rounded-2xl flex items-start gap-3">
        <ShieldCheck size={18} className="text-[#174D40] flex-shrink-0 mt-0.5" />
        <div className="text-xs text-[#174D40]">
          <span className="font-bold">Database-Level Data Isolation:</span> Each business profile maintains its own independent customer lists, vendor directories, products, stock counts, journal entries, and GST records. Switching businesses switches your workspace context seamlessly.
        </div>
      </div>

      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {businesses.map((b) => {
          const isActive = activeBusiness?.id === b.id;
          return (
            <div
              key={b.id}
              className={`p-6 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? 'bg-white border-[#174D40] shadow-card ring-2 ring-[#174D40]/10'
                  : 'bg-white border-[#EAEAEA] shadow-soft hover:border-[#174D40]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                        isActive ? 'bg-[#174D40] text-[#98E66B]' : 'bg-[#F5F5F5] text-[#171717]'
                      }`}
                    >
                      {b.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-[#171717]">{b.name}</h3>
                      <span className="text-[11px] font-semibold text-[#929292]">{b.type}</span>
                    </div>
                  </div>

                  {isActive && (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8DE] text-[#174D40]">
                      <CheckCircle2 size={13} /> Active Entity
                    </span>
                  )}
                </div>

                <div className="py-4 space-y-2 text-xs">
                  <div className="flex justify-between text-[#929292]">
                    <span>Owner / Legal Entity:</span>
                    <span className="font-semibold text-[#171717]">{b.ownerName}</span>
                  </div>
                  <div className="flex justify-between text-[#929292]">
                    <span>Official Email:</span>
                    <span className="font-semibold text-[#171717]">{b.email}</span>
                  </div>
                  <div className="flex justify-between text-[#929292]">
                    <span>Location:</span>
                    <span className="font-semibold text-[#171717]">{b.city}, {b.state}</span>
                  </div>
                  <div className="flex justify-between text-[#929292]">
                    <span>GSTIN:</span>
                    <span className="font-mono font-semibold text-[#174D40]">{b.gstin || 'Unregistered'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#EAEAEA]">
                {isActive ? (
                  <button
                    onClick={() => navigate('/')}
                    className="w-full py-2.5 bg-[#174D40] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Currently Active (Open Dashboard)</span>
                    <ArrowRight size={14} />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveBusiness(b);
                      navigate('/');
                    }}
                    className="w-full py-2.5 bg-[#F5F5F5] hover:bg-[#174D40] hover:text-white text-[#171717] rounded-xl text-xs font-bold transition-colors"
                  >
                    Switch to this Business
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Business Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#EAEAEA] relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAEAEA]">
              <div>
                <h3 className="font-extrabold text-base text-[#171717]">Create Business Profile</h3>
                <p className="text-xs text-[#929292]">Creates an independent enterprise workspace</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#929292] hover:text-[#171717]"
              >
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="p-3 my-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#F87171]">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateBusiness} className="space-y-4 pt-3 text-xs">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Logistics India"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Industry / Type</label>
                  <input
                    type="text"
                    placeholder="e.g. Retail, Manufacturing"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Owner Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Syed Ali Hasan"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Business Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="ops@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. New Delhi"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#171717] mb-1">State</label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#171717] mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="07AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
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
                  className="px-5 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <CheckCircle2 size={15} className="text-[#98E66B]" />
                  Create Business Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
