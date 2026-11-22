import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { apiRequest } from '../services/api';
import { AlertCircle, ArrowRight, Building, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadBusinesses, setActiveBusiness } = useBusiness();

  // Step 1: User, Step 2: Business details
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Business
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Retail & Wholesale');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [gstin, setGstin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ token: string; user: any; business: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          businessName: businessName || `${name}'s Company`,
          businessType,
          city: city || 'Mumbai',
          state: state || 'Maharashtra',
          gstin: gstin || undefined,
        }),
      });

      login(res.token, res.user);
      if (res.business) {
        localStorage.setItem('multisolve_business_id', res.business.id);
        setActiveBusiness(res.business);
      }
      await loadBusinesses();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center items-center p-4">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 border border-[#EAEAEA] shadow-card space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#174D40] flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 relative">
              <span className="absolute inset-0 bg-[#98E66B] rounded-sm transform rotate-45 scale-75"></span>
              <span className="absolute inset-0.5 bg-[#174D40] rounded-sm transform rotate-45 scale-50"></span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#171717] tracking-tight">Create MULTISOLVE Account</h2>
          <p className="text-xs text-[#929292]">Start your unified business ecosystem in under 60 seconds</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#F87171] flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-3">
            <span className="font-bold text-[11px] text-[#929292] uppercase tracking-wider">
              1. Master Admin Credentials
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Syed Ali Hasan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Mobile Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Work Email *</label>
                <input
                  type="email"
                  required
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Password *</label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-[#EAEAEA]">
            <span className="font-bold text-[11px] text-[#929292] uppercase tracking-wider">
              2. Primary Business Profile
            </span>
            <div>
              <label className="block font-semibold text-[#171717] mb-1">Business / Trade Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. MULTISOLVE Enterprises"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#171717] mb-1">Business Vertical</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white"
                >
                  <option value="Retail & Wholesale">Retail & Wholesale</option>
                  <option value="IT & Hardware Distribution">IT & Hardware Distribution</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Services">Services</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-[#171717] mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  placeholder="27AABCM8812E1ZK"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white"
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
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#171717] mb-1">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-[#F5F5F5] text-xs text-[#171717] p-2.5 rounded-xl border border-transparent"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#174D40] hover:bg-[#133E34] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 mt-4"
          >
            {loading ? 'Creating Ecosystem...' : 'Register & Launch Workspace'}
            {!loading && <ArrowRight size={14} className="text-[#98E66B]" />}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#EAEAEA]">
          <p className="text-xs text-[#929292]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#174D40] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
