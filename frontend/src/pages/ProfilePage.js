import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  User, Envelope, Phone, Globe, Heart, Palette, FloppyDisk, SpinnerGap,
  CaretLeft, Check, Compass, Camera, Mountains, ForkKnife,
  Buildings, ShoppingBag
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TRAVEL_STYLES = [
  { id: 'adventure', label: 'Adventure', icon: Mountains },
  { id: 'cultural', label: 'Cultural', icon: Buildings },
  { id: 'relaxation', label: 'Relaxation', icon: Heart },
  { id: 'foodie', label: 'Foodie', icon: ForkKnife },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'budget', label: 'Budget', icon: ShoppingBag },
];

const INTERESTS = [
  'Medinas & Souks', 'Desert & Sahara', 'Mountains & Hiking',
  'Beach & Coast', 'History & Museums', 'Food & Cooking',
  'Art & Crafts', 'Nightlife', 'Wellness & Hammam',
  'Architecture', 'Music & Festivals', 'Shopping',
];

const AVATAR_COLORS = [
  '#4A6984', '#6B7A64', '#C17754', '#725C70', '#D4A017',
  '#DC2626', '#0891B2', '#C026D3', '#EA580C', '#4F46E5',
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Fran\u00e7ais' },
  { code: 'ar', label: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  { code: 'es', label: 'Espa\u00f1ol' },
  { code: 'de', label: 'Deutsch' },
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [travelStyle, setTravelStyle] = useState('');
  const [interests, setInterests] = useState([]);
  const [avatarColor, setAvatarColor] = useState('#4A6984');

  const token = localStorage.getItem('token');
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  useEffect(() => {
    if (!token) { navigate('/auth/signin'); return; }
    axios.get(`${API}/auth/me`, { headers })
      .then(res => {
        const u = res.data.user;
        setUser(u);
        setName(u.name || '');
        setPhone(u.phone || '');
        setBio(u.bio || '');
        setPreferredLanguage(u.preferred_language || 'en');
        setTravelStyle(u.travel_style || '');
        setInterests(u.interests || []);
        setAvatarColor(u.avatar_color || '#4A6984');
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [token, navigate, headers]);

  const toggleInterest = (interest) => {
    setInterests(prev => prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const res = await axios.put(`${API}/auth/profile`, {
        name: name.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        preferred_language: preferredLanguage,
        travel_style: travelStyle || undefined,
        interests: interests.length > 0 ? interests : undefined,
        avatar_color: avatarColor,
      }, { headers });
      if (res.data.token) localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" style={{ backgroundColor: '#F5F3EE' }}>
        <SpinnerGap size={32} className="animate-spin" style={{ color: '#4A6984' }} />
      </div>
    );
  }

  const initial = (name || 'U')[0].toUpperCase();

  const inputCls = "w-full h-12 px-4 rounded-xl text-sm transition-all outline-none";
  const inputStyle = { backgroundColor: '#EFECE5', border: '1.5px solid transparent', fontFamily: "'Manrope', sans-serif", color: '#1C1917' };
  const focusIn = (e) => { e.target.style.backgroundColor = '#fff'; e.target.style.borderColor = '#4A6984'; };
  const focusOut = (e) => { if (!e.target.value) { e.target.style.backgroundColor = '#EFECE5'; e.target.style.borderColor = 'transparent'; } };

  return (
    <div data-testid="profile-page" className="min-h-[80vh]" style={{ backgroundColor: '#F5F3EE' }}>
      <div className="max-w-2xl mx-auto px-6 py-8">
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 text-sm font-medium mb-8 transition-colors hover:opacity-70" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>
          <CaretLeft size={16} /> {t('profile.backToDashboard')}
        </button>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-medium shadow-lg" style={{ backgroundColor: avatarColor, fontFamily: "'Playfair Display', serif" }}>
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-medium" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>Edit Profile</h1>
            <p className="text-sm mt-0.5" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{user?.email}</p>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Basic Info */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-6 border space-y-5" style={{ borderColor: '#E7E5DF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>
              <User size={16} /> {t('profile.basicInfo')}
            </h2>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('profile.fullName')} *</label>
              <input data-testid="profile-name" type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="Your full name" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('profile.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2" size={16} style={{ color: '#A8A29E' }} />
                <input data-testid="profile-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`${inputCls} pl-10`} style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder="+212 600 000 000" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('profile.bio')}</label>
              <textarea data-testid="profile-bio" value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200} className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none resize-none" style={inputStyle} onFocus={focusIn} onBlur={focusOut} placeholder={t('profile.bioPlaceholder')} />
              <p className="text-[10px] mt-1 text-right" style={{ color: '#A8A29E' }}>{bio.length}/200</p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{t('profile.preferredLanguage')}</label>
              <select data-testid="profile-language" value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} className={inputCls} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </motion.section>

          {/* Avatar Color */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl p-6 border space-y-4" style={{ borderColor: '#E7E5DF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>
              <Palette size={16} /> {t('profile.avatarColor')}
            </h2>
            <div className="flex flex-wrap gap-2.5">
              {AVATAR_COLORS.map(color => (
                <button key={color} data-testid={`avatar-color-${color.replace('#', '')}`} onClick={() => setAvatarColor(color)} className="w-10 h-10 rounded-xl transition-all" style={{ backgroundColor: color, outline: avatarColor === color ? '2px solid #1C1917' : '2px solid transparent', outlineOffset: '2px', transform: avatarColor === color ? 'scale(1.1)' : 'scale(1)' }}>
                  {avatarColor === color && <Check size={16} weight="bold" className="mx-auto" style={{ color: '#fff' }} />}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Travel Style */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl p-6 border space-y-4" style={{ borderColor: '#E7E5DF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>
              <Compass size={16} /> {t('profile.travelStyle')}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {TRAVEL_STYLES.map(s => {
                const isActive = travelStyle === s.id;
                return (
                  <button key={s.id} data-testid={`travel-style-${s.id}`} onClick={() => setTravelStyle(s.id)} className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all" style={{ borderColor: isActive ? '#4A6984' : '#E7E5DF', backgroundColor: isActive ? '#4A6984' : 'transparent', color: isActive ? '#fff' : '#57534E' }}>
                    <s.icon size={20} />
                    <span className="text-[11px] font-medium" style={{ fontFamily: "'Manrope', sans-serif" }}>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* Interests */}
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl p-6 border space-y-4" style={{ borderColor: '#E7E5DF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] flex items-center gap-2" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>
              <Heart size={16} /> {t('profile.interests')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map(interest => {
                const isActive = interests.includes(interest);
                return (
                  <button key={interest} data-testid={`interest-${interest.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => toggleInterest(interest)} className="px-4 py-2 rounded-full text-xs font-medium border transition-all" style={{ backgroundColor: isActive ? '#4A6984' : 'transparent', color: isActive ? '#fff' : '#57534E', borderColor: isActive ? '#4A6984' : '#E7E5DF', fontFamily: "'Manrope', sans-serif" }}>
                    {interest}
                  </button>
                );
              })}
            </div>
          </motion.section>

          {/* Save */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <button data-testid="save-profile-btn" onClick={handleSave} disabled={saving || !name.trim()} className="w-full h-12 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 disabled:opacity-60" style={{ backgroundColor: '#4A6984', fontFamily: "'Manrope', sans-serif", boxShadow: '0 4px 14px rgba(74,105,132,0.3)' }}>
              {saving ? <SpinnerGap size={18} className="animate-spin" /> : <><FloppyDisk size={18} /> {t('profile.saveProfile')}</>}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

