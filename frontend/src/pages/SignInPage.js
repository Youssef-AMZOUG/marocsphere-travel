import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Envelope, Lock, Eye, EyeSlash, SpinnerGap, ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/sonner';
import axios from 'axios';
import { getDashboardPath, storeSession } from '@/lib/auth';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AUTH_BG = 'https://static.prod-images.emergentagent.com/jobs/1c3c5c79-ee24-4999-8f7c-5735c2d9eb89/images/1c63c5844919c83862ee42209057dceca208a92abe4eafab81065865088e2235.png';

export default function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/login`, form);
      const user = storeSession(res.data);
      toast.success(`Welcome back, ${res.data.user.name}!`);
      navigate(getDashboardPath(user || res.data.user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="signin-page" className="min-h-[calc(100vh-64px)] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={AUTH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>Welcome to</p>
            <h2 className="text-4xl text-white font-medium leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Your Moroccan<br />Adventure Awaits
            </h2>
            <p className="text-white/70 text-sm mt-4 max-w-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
              AI-powered itineraries, real-time safety, and 200+ curated landmarks across Morocco.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#F5F3EE' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10">
            <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>
              {t('auth.signIn')}
            </h1>
            <p className="mt-2 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>
              Sign in and we’ll send you to the right dashboard automatically.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{t('auth.email')}</label>
              <div className="relative">
                <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                <input
                  data-testid="signin-email"
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full h-12 pl-11 pr-4 rounded-xl text-sm transition-all outline-none"
                  style={{ backgroundColor: '#EFECE5', border: '1.5px solid transparent', fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                <input
                  data-testid="signin-password"
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full h-12 pl-11 pr-11 rounded-xl text-sm transition-all outline-none"
                  style={{ backgroundColor: '#EFECE5', border: '1.5px solid transparent', fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}
                  placeholder="Enter your password"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] transition-colors">
                  {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/auth/forgot-password" data-testid="goto-forgot-password" className="text-xs font-medium hover:underline" style={{ fontFamily: "'Manrope', sans-serif", color: '#4A6984' }}>
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} data-testid="signin-error" className="rounded-xl px-4 py-3 text-sm border" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA', fontFamily: "'Manrope', sans-serif" }}>
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              data-testid="signin-submit"
              disabled={loading}
              className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0"
              style={{ backgroundColor: '#4A6984', fontFamily: "'Manrope', sans-serif", boxShadow: '0 4px 14px rgba(74,105,132,0.3)' }}
            >
              {loading ? <SpinnerGap size={18} className="animate-spin" /> : <>{t('auth.signIn')} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>
            {t('auth.noAccount')}{' '}
            <Link to="/auth/register" data-testid="goto-register" className="font-semibold hover:underline" style={{ color: '#4A6984' }}>{t('auth.signUp')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
