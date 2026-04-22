import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Eye, EyeSlash, SpinnerGap, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const AUTH_BG = 'https://static.prod-images.emergentagent.com/jobs/1c3c5c79-ee24-4999-8f7c-5735c2d9eb89/images/1c63c5844919c83862ee42209057dceca208a92abe4eafab81065865088e2235.png';

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirm) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API}/auth/reset-password`, { token, new_password: password });
      setSuccess(true);
      toast.success(t('auth.passwordReset'));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { backgroundColor: '#EFECE5', border: '1.5px solid transparent', fontFamily: "'Manrope', sans-serif", color: '#1C1917' };
  const focusIn = (e) => { e.target.style.backgroundColor = '#fff'; e.target.style.borderColor = '#4A6984'; };
  const focusOut = (e) => { if (!e.target.value) { e.target.style.backgroundColor = '#EFECE5'; e.target.style.borderColor = 'transparent'; } };

  if (!token) {
    return (
      <div data-testid="reset-password-page" className="min-h-[calc(100vh-56px)] flex">
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <img src={AUTH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
        <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#F5F3EE' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-[420px] text-center">
            <h1 className="text-2xl font-medium mb-3" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>{t('auth.invalidLink')}</h1>
            <p className="text-sm mb-8" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('auth.invalidLinkDesc')}</p>
            <Link to="/auth/forgot-password" className="text-sm font-semibold hover:underline" style={{ color: '#4A6984', fontFamily: "'Manrope', sans-serif" }}>{t('auth.requestNew')}</Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="reset-password-page" className="min-h-[calc(100vh-56px)] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={AUTH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <p className="text-white/60 text-xs uppercase tracking-[0.2em] mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>Account Recovery</p>
            <h2 className="text-4xl text-white font-medium leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              Almost There
            </h2>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12" style={{ backgroundColor: '#F5F3EE' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-[420px]">
          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: '#DCFCE7' }}>
                <CheckCircle size={32} weight="fill" style={{ color: '#16A34A' }} />
              </div>
              <h1 className="text-2xl font-medium" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>{t('auth.passwordReset')}</h1>
              <p className="mt-3 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('auth.passwordResetDesc')}</p>
              <button data-testid="go-to-signin" onClick={() => navigate('/auth/signin')} className="mt-8 px-8 py-3 rounded-full text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ backgroundColor: '#4A6984', fontFamily: "'Manrope', sans-serif" }}>
                {t('auth.signIn')}
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>{t('auth.setNewPassword')}</h1>
                <p className="mt-2 text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('auth.setNewPasswordDesc')}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{t('auth.newPassword')}</label>
                  <div className="relative">
                    <input data-testid="reset-password" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full h-12 px-4 pr-11 rounded-xl text-sm transition-all outline-none" style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder={t('auth.newPassword')} />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A8A29E] hover:text-[#1C1917] transition-colors">
                      {showPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{t('auth.confirmPassword')}</label>
                  <input data-testid="reset-confirm" type={showPass ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full h-12 px-4 rounded-xl text-sm transition-all outline-none" style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder={t('auth.confirmPassword')} />
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} data-testid="reset-error" className="rounded-xl px-4 py-3 text-sm border" style={{ backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA', fontFamily: "'Manrope', sans-serif" }}>
                    {error}
                  </motion.div>
                )}

                <button type="submit" data-testid="reset-submit" disabled={loading} className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ backgroundColor: '#4A6984', fontFamily: "'Manrope', sans-serif", boxShadow: '0 4px 14px rgba(74,105,132,0.3)' }}>
                  {loading ? <SpinnerGap size={18} className="animate-spin" /> : t('auth.resetPasswordBtn')}
                </button>
              </form>

              <div className="mt-8 text-center">
                <Link to="/auth/signin" data-testid="back-to-signin" className="inline-flex items-center gap-2 text-sm font-medium hover:underline" style={{ fontFamily: "'Manrope', sans-serif", color: '#4A6984' }}>
                  <ArrowLeft size={16} /> {t('auth.backToSignIn')}
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
