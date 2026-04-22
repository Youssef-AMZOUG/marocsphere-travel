import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Envelope, Lock, Eye, EyeSlash, SpinnerGap, ArrowRight, Check, X, Briefcase, MapPin } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/sonner';
import axios from 'axios';
import { ACCOUNT_ROLES, BUSINESS_ROLES, ROLE_META, getDashboardPath, storeSession, normalizeRole } from '@/lib/auth';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AUTH_BG = 'https://static.prod-images.emergentagent.com/jobs/1c3c5c79-ee24-4999-8f7c-5735c2d9eb89/images/1c63c5844919c83862ee42209057dceca208a92abe4eafab81065865088e2235.png';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    account_role: 'client',
    business_name: '',
    city: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const role = normalizeRole(form.account_role);
  const isBusinessRole = BUSINESS_ROLES.includes(role);

  const checks = {
    length: form.password.length >= 8,
    upper: /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(form.password),
  };
  const strength = Object.values(checks).filter(Boolean).length;
  const strengthColor = strength <= 1 ? '#EF4444' : strength <= 2 ? '#F59E0B' : strength <= 3 ? '#22C55E' : '#16A34A';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (isBusinessRole && (!form.business_name || !form.city)) {
      setError('Please add a business name and city for your business account');
      return;
    }
    if (strength < 2) {
      setError('Password is too weak');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        account_role: role,
        business_name: isBusinessRole ? form.business_name : null,
        city: isBusinessRole ? form.city : null,
      };

      const res = await axios.post(`${API}/auth/register`, payload);
      const user = storeSession(res.data);
      toast.success(`Welcome to MarocSphere, ${res.data.user.name}!`);
      navigate(getDashboardPath(user || res.data.user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: '#EFECE5', border: '1.5px solid transparent', fontFamily: "'Manrope', sans-serif", color: '#1C1917' };
  const focusIn = (e) => { e.target.style.backgroundColor = '#fff'; e.target.style.borderColor = '#4A6984'; };
  const focusOut = (e) => { if (!e.target.value) { e.target.style.backgroundColor = '#EFECE5'; e.target.style.borderColor = 'transparent'; } };

  const roleCards = useMemo(() => ACCOUNT_ROLES.map((item) => ({
    id: item,
    ...ROLE_META[item],
  })), []);

  return (
    <div data-testid="register-page" className="min-h-[calc(100vh-64px)] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={AUTH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>Join MarocSphere</p>
            <h2 className="text-4xl text-white font-medium leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              One platform.<br />Four account types.
            </h2>
            <p className="text-white/70 text-sm mt-4 max-w-sm" style={{ fontFamily: "'Manrope', sans-serif" }}>
              Clients plan trips. Artisans, agencies, and hotels manage bookings, history, and customer activity.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#F5F3EE' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[480px]">
          <div className="mb-8">
            <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>{t('auth.signUp')}</h1>
            <p className="mt-2 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('auth.signUpDesc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>Account type</label>
              <div className="grid grid-cols-2 gap-2">
                {roleCards.map((card) => {
                  const active = role === card.id;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, account_role: card.id }))}
                      className={`rounded-xl border p-3 text-left transition-all ${active ? 'bg-white border-[#4A6984]' : 'bg-[#EFECE5] border-transparent hover:border-[#D6D0C5]'}`}
                    >
                      <div className="text-lg mb-1">{card.emoji}</div>
                      <p className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}>{card.label}</p>
                      <p className="text-[11px] leading-4 mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{card.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                <input data-testid="register-name" type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full h-12 pl-11 pr-4 rounded-xl text-sm transition-all outline-none" style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Your full name" />
              </div>
            </div>

            {isBusinessRole && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>Business name</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                    <input
                      type="text"
                      value={form.business_name}
                      onChange={e => setForm(p => ({ ...p, business_name: e.target.value }))}
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm transition-all outline-none"
                      style={inputStyle}
                      onFocus={focusIn}
                      onBlur={focusOut}
                      placeholder={`Your ${ROLE_META[role].label.toLowerCase()} name`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                    <input
                      type="text"
                      value={form.city}
                      onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm transition-all outline-none"
                      style={inputStyle}
                      onFocus={focusIn}
                      onBlur={focusOut}
                      placeholder="Marrakech, Casablanca, Fes..."
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>Email</label>
              <div className="relative">
                <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                <input data-testid="register-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full h-12 pl-11 pr-4 rounded-xl text-sm transition-all outline-none" style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                <input data-testid="register-password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full h-12 pl-11 pr-11 rounded-xl text-sm transition-all outline-none" style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Create a password" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] transition-colors">
                  {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {form.password && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 space-y-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300" style={{ backgroundColor: i <= strength ? strengthColor : '#E7E5DF' }} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {[{ key: 'length', label: '8+ characters' }, { key: 'upper', label: 'Uppercase' }, { key: 'number', label: 'Number' }, { key: 'special', label: 'Special char' }].map(({ key, label }) => (
                      <span key={key} className="text-[11px] flex items-center gap-1" style={{ fontFamily: "'Manrope', sans-serif", color: checks[key] ? '#16A34A' : '#A8A29E' }}>
                        {checks[key] ? <Check size={12} weight="bold" /> : <X size={12} />} {label}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} data-testid="register-error" className="rounded-xl px-4 py-3 text-sm border" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA', fontFamily: "'Manrope', sans-serif" }}>
                {error}
              </motion.div>
            )}

            <button type="submit" data-testid="register-submit" disabled={loading} className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:translate-y-0" style={{ backgroundColor: '#4A6984', fontFamily: "'Manrope', sans-serif", boxShadow: '0 4px 14px rgba(74,105,132,0.3)' }}>
              {loading ? <SpinnerGap size={18} className="animate-spin" /> : <>{t('auth.signUp')} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>
            {t('auth.hasAccount')}{' '}
            <Link to="/auth/signin" data-testid="goto-signin" className="font-semibold hover:underline" style={{ color: '#4A6984' }}>{t('auth.signIn')}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
