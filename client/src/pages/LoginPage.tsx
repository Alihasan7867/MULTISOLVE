import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { apiRequest } from '../services/api';
import { AlertCircle, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { loadBusinesses } = useBusiness();

  const [email, setEmail] = useState('admin@multisolve.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ token: string; user: any; businesses: any[] }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      login(res.token, res.user);
      if (res.businesses && res.businesses.length > 0) {
        localStorage.setItem('multisolve_business_id', res.businesses[0].id);
      }
      await loadBusinesses();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = () => {
    setEmail('admin@multisolve.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-[#EAEAEA] shadow-card space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#174D40] flex items-center justify-center shadow-sm">
            <div className="w-6 h-6 relative">
              <span className="absolute inset-0 bg-[#98E66B] rounded-sm transform rotate-45 scale-75"></span>
              <span className="absolute inset-0.5 bg-[#174D40] rounded-sm transform rotate-45 scale-50"></span>
            </div>
          </div>
          <h2 className="text-2xl font-black text-[#171717] tracking-tight">
            MULTI<span className="text-[#174D40]">SOLVE</span>
          </h2>
          <p className="text-xs text-[#929292]">Unified Business Management Ecosystem</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-[#F87171] flex items-center gap-2">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Credentials Pill */}
        <div
          onClick={handleQuickDemoLogin}
          className="p-3 bg-[#E8F8DE] rounded-2xl border border-[#98E66B]/40 flex items-center justify-between cursor-pointer hover:bg-[#dff5d1] transition-colors"
        >
          <div className="flex items-center gap-2 text-xs">
            <Sparkles size={15} className="text-[#174D40]" />
            <div>
              <span className="font-bold text-[#174D40]">Prefilled Demo Account:</span>
              <div className="text-[11px] text-[#174D40]/80">admin@multisolve.com / admin123</div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#174D40] underline">Use</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#171717] mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929292]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#171717] mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#929292]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F5F5F5] text-xs text-[#171717] pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-[#174D40] focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#174D40] hover:bg-[#133E34] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            {!loading && <ArrowRight size={14} className="text-[#98E66B]" />}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#EAEAEA]">
          <p className="text-xs text-[#929292]">
            Don&apos;t have an enterprise account?{' '}
            <Link to="/register" className="font-bold text-[#174D40] hover:underline">
              Register Business
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
