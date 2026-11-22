import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  User as UserIcon,
  CheckCircle2,
  Lock,
  Save,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { apiRequest } from '../services/api';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { activeBusiness, loadBusinesses } = useBusiness();

  // Business form
  const [businessName, setBusinessName] = useState(activeBusiness?.name || '');
  const [businessType, setBusinessType] = useState(activeBusiness?.type || '');
  const [gstin, setGstin] = useState(activeBusiness?.gstin || '');
  const [phone, setPhone] = useState(activeBusiness?.phone || '');
  const [email, setEmail] = useState(activeBusiness?.email || '');
  const [city, setCity] = useState(activeBusiness?.city || '');
  const [state, setState] = useState(activeBusiness?.state || '');
  const [monthlySalesGoal, setMonthlySalesGoal] = useState<number>(activeBusiness?.monthlySalesGoal || 500000);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;
    setSaving(true);
    setSuccessMsg(null);

    try {
      await apiRequest(`/businesses/${activeBusiness.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: businessName,
          type: businessType,
          gstin,
          phone,
          email,
          city,
          state,
          monthlySalesGoal,
        }),
      });

      await loadBusinesses();
      setSuccessMsg('Business settings updated successfully!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#EAEAEA] shadow-soft">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171717] tracking-tight">System & Entity Settings</h1>
          <p className="text-xs text-[#929292] mt-1">
            Configure business identity, GST registration numbers, sales goals and user credentials.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-[#E8F8DE] border border-[#98E66B]/40 text-[#174D40] rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Business Profile Settings */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAEAEA] shadow-soft space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EAEAEA]">
          <div className="w-10 h-10 rounded-2xl bg-[#E8F8DE] text-[#174D40] flex items-center justify-center font-bold">
            <Building size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">Active Enterprise Profile</h3>
            <p className="text-xs text-[#929292]">Changes apply to invoices, purchase orders and tax reports</p>
          </div>
        </div>

        <form onSubmit={handleSaveBusiness} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#171717] mb-1">Company / Business Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1">Business Vertical / Industry</label>
              <input
                type="text"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1">Registered GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs font-mono text-[#174D40] font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1">Monthly Sales Goal (₹)</label>
              <input
                type="number"
                value={monthlySalesGoal}
                onChange={(e) => setMonthlySalesGoal(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs font-bold text-[#171717]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1">Official Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#171717] mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-[#F5F5F5] border border-[#EAEAEA] rounded-xl p-2.5 text-xs text-[#171717]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[#174D40] hover:bg-[#133E34] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs"
            >
              <Save size={15} className="text-[#98E66B]" />
              {saving ? 'Saving...' : 'Save Enterprise Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* User Account Details */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAEAEA] shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-[#EAEAEA]">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F5F5] text-[#171717] flex items-center justify-center font-bold">
            <UserIcon size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-[#171717]">User Profile & Security</h3>
            <p className="text-xs text-[#929292]">Authenticated identity and role permissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-[#F5F5F5] rounded-2xl">
            <span className="text-[#929292] block">Name</span>
            <span className="font-bold text-[#171717] text-sm">{user?.name}</span>
          </div>
          <div className="p-4 bg-[#F5F5F5] rounded-2xl">
            <span className="text-[#929292] block">Email</span>
            <span className="font-bold text-[#171717] text-sm">{user?.email}</span>
          </div>
          <div className="p-4 bg-[#F5F5F5] rounded-2xl">
            <span className="text-[#929292] block">Role Permissions</span>
            <span className="font-bold text-[#174D40] text-sm">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
