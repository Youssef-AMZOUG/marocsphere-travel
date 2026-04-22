import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Envelope, SpinnerGap, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AUTH_BG = 'https://static.prod-images.emergentagent.com/jobs/1c3c5c79-ee24-4999-8f7c-5735c2d9eb89/images/1c63c5844919c83862ee42209057dceca208a92abe4eafab81065865088e2235.png';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      if (res.data.reset_token) setResetToken(res.data.reset_token);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="forgot-password-page" className="min-h-[calc(100vh-64px)] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={AUTH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>Account Recovery</p>
            <h2 className="text-4xl text-white font-medium leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              We'll Help You<br />Get Back In
            </h2>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#F5F3EE' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[420px]">
          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#DCFCE7' }}>
                <CheckCircle size={32} weight="fill" style={{ color: '#16A34A' }} />
              </div>
              <h1 className="text-2xl font-medium" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>{t('auth.checkEmail')}</h1>
              <p className="mt-3 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>
                {t('auth.checkEmailDesc')} <span className="font-semibold" style={{ color: '#1C1917' }}>{email}</span>{t('auth.checkEmailDesc2')}
              </p>
              {resetToken && (
                <div className="mt-6 p-4 rounded-2xl border" style={{ backgroundColor: '#fff', borderColor: '#E7E5DF' }}>
                  <p className="text-xs mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>Reset link:</p>
                  <Link to={`/auth/reset-password?token=${resetToken}`} data-testid="reset-link" className="text-sm font-semibold hover:underline" style={{ color: '#4A6984' }}>
                    {t('auth.clickToReset')}
                  </Link>
                </div>
              )}
              <Link to="/auth/signin" className="inline-flex items-center gap-2 mt-8 text-sm font-medium hover:underline" style={{ fontFamily: "'Manrope', sans-serif", color: '#4A6984' }}>
                <ArrowLeft size={16} /> {t('auth.backToSignIn')}
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>{t('auth.resetPassword')}</h1>
                <p className="mt-2 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('auth.resetDesc')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{t('auth.email')}</label>
                  <div className="relative">
                    <Envelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A29E]" size={18} />
                    <input
                      data-testid="forgot-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 rounded-xl text-sm transition-all outline-none"
                      style={{ backgroundColor: '#EFECE5', border: '1.5px solid transparent', fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}
                      onFocus={e => { e.target.style.backgroundColor = '#fff'; e.target.style.borderColor = '#4A6984'; }}
                      onBlur={e => { if (!e.target.value) { e.target.style.backgroundColor = '#EFECE5'; e.target.style.borderColor = 'transparent'; } }}
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} data-testid="forgot-error" className="rounded-xl px-4 py-3 text-sm border" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA', fontFamily: "'Manrope', sans-serif" }}>
                    {error}
                  </motion.div>
                )}

                <button type="submit" data-testid="forgot-submit" disabled={loading} className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ backgroundColor: '#4A6984', fontFamily: "'Manrope', sans-serif", boxShadow: '0 4px 14px rgba(74,105,132,0.3)' }}>
                  {loading ? <SpinnerGap size={18} className="animate-spin" /> : t('auth.sendResetLink')}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link to="/auth/signin" data-testid="back-to-signin" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ fontFamily: "'Manrope', sans-serif", color: '#4A6984' }}>
                  <ArrowLeft size={16} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
