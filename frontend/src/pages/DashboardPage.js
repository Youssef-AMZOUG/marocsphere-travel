import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Compass, CalendarBlank, Users, Heart, ChatCircle, Star, 
  SpinnerGap, Crown, ArrowRight, Sparkle
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const ITINERARY_BG = 'https://static.prod-images.emergentagent.com/jobs/1c3c5c79-ee24-4999-8f7c-5735c2d9eb89/images/30bc3278ff94618992262924ebdb9b78b4957900c02928b035704567a569ca13.png';

const PLAN_LABELS = {
  explorer: { name: 'Explorer', accent: '#4A6984' },
  voyager: { name: 'Voyager', accent: '#4A6984' },
  nomade: { name: 'Nomade', accent: '#C17754' },
};

const SIDEBAR_NAV = [
  { id: 'explorer', labelKey: 'dashboard.explorer', icon: Compass, href: '/dashboard' },
  { id: 'reservations', labelKey: 'dashboard.reservations', icon: CalendarBlank, href: '/itineraries' },
  { id: 'guides', labelKey: 'dashboard.guides', icon: Users, href: '/map' },
  { id: 'favoris', labelKey: 'dashboard.favorites', icon: Heart, href: '/destinations' },
  { id: 'messages', labelKey: 'dashboard.messages', icon: ChatCircle, href: '/chat' },
];

const MOCK_GUIDES = [
  { name: 'Hassan M.', area: 'Medina', rating: 4.9, certified: true },
  { name: 'Youssef B.', area: 'Palmeraie', rating: 4.8, certified: true },
  { name: 'Farid K.', area: 'Souks', rating: 4.7, certified: true },
];

function SidebarItem({ item, active, t }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      data-testid={`sidebar-${item.id}`}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
      style={{
        backgroundColor: active ? '#fff' : 'transparent',
        color: active ? '#4A6984' : '#57534E',
        fontFamily: "'Manrope', sans-serif",
        fontWeight: active ? 600 : 400,
        boxShadow: active ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <Icon size={20} weight={active ? 'fill' : 'regular'} />
      {t(item.labelKey)}
    </Link>
  );
}

function StatCard({ value, label, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl border p-5 transition-all hover:shadow-md"
      style={{ borderColor: '#E7E5DF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
    >
      <p className="text-3xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>
        {label}
      </p>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [trips, setTrips] = useState([]);
  const [activeNav, setActiveNav] = useState('explorer');

  const token = localStorage.getItem('token');
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchData = useCallback(async () => {
    try {
      const [userRes, subRes, tripsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { headers }).catch(() => null),
        axios.get(`${API}/subscription/status`, { headers }).catch(() => null),
        axios.get(`${API}/itineraries`, { headers }).catch(() => null),
      ]);
      if (userRes?.data?.user) setUser(userRes.data.user);
      if (subRes?.data) setSubscription(subRes.data);
      if (tripsRes?.data?.itineraries) setTrips(tripsRes.data.itineraries);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (!token) { navigate('/auth/signin'); return; }
    fetchData();
  }, [token, navigate, fetchData]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center" style={{ backgroundColor: '#F5F3EE' }}>
        <SpinnerGap size={32} className="animate-spin" style={{ color: '#4A6984' }} />
      </div>
    );
  }

  const planId = subscription?.plan_id || 'explorer';
  const planInfo = PLAN_LABELS[planId] || PLAN_LABELS.explorer;
  const firstName = (user?.name || 'Traveler').split(' ')[0];
  const initial = firstName[0]?.toUpperCase() || 'T';
  const latestTrip = trips[0];

  return (
    <div data-testid="user-dashboard" className="min-h-[80vh] flex" style={{ backgroundColor: '#F5F3EE' }}>
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r p-6 flex-shrink-0" style={{ backgroundColor: '#F5F3EE', borderColor: '#E7E5DF' }}>
        <div className="mb-8">
          <p className="text-lg font-medium" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>{t('dashboard.breadcrumb')}</p>
          <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>{firstName} {user?.name?.split(' ')[1]?.[0] || ''}.</p>
        </div>

        <nav className="space-y-1 flex-1">
          {SIDEBAR_NAV.map(item => (
            <SidebarItem key={item.id} item={item} active={activeNav === item.id} t={t} />
          ))}
        </nav>

        <div className="mt-auto pt-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: '#4A6984', color: '#fff', fontFamily: "'Manrope', sans-serif" }}>
            {t('dashboard.tourist')}
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 lg:px-8 py-4 border-b" style={{ borderColor: '#E7E5DF' }}>
          <p className="text-sm" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>
            {t('dashboard.breadcrumb')} / <span style={{ color: '#1C1917', fontWeight: 500 }}>{t('dashboard.explorer')}</span>
          </p>
          <div className="flex items-center gap-3">
            <Link to="/subscription" data-testid="upgrade-plan-btn" className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors hover:bg-white" style={{ borderColor: '#E7E5DF', color: '#57534E', fontFamily: "'Manrope', sans-serif" }}>
              <Crown size={14} /> {planInfo.name}
            </Link>
            <Link to="/profile" data-testid="user-avatar-link" className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: user?.avatar_color || '#4A6984' }}>
              {initial}
            </Link>
          </div>
        </div>

        <div className="px-6 lg:px-8 py-6 space-y-6 max-w-4xl">
          {/* Hero Itinerary Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden"
            style={{ minHeight: '200px' }}
          >
            <img src={ITINERARY_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#4A6984]/90 to-[#4A6984]/60" />
            <div className="relative z-10 p-6 sm:p-8">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: "'Manrope', sans-serif", backdropFilter: 'blur(12px)' }}>
                <Sparkle size={12} weight="fill" /> {t('dashboard.aiItinerary')} &middot; {t('dashboard.basedOnPrefs')}
              </div>
              <h2 className="text-2xl sm:text-3xl text-white font-medium mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                {latestTrip ? (latestTrip.data?.title || `${latestTrip.destination} — ${latestTrip.duration} ${t('dashboard.day')}s`) : 'Marrakech — 3 ' + t('dashboard.day') + 's'}
              </h2>
              <p className="text-white/70 text-sm mb-6" style={{ fontFamily: "'Manrope', sans-serif" }}>
                {latestTrip ? `${latestTrip.destination} \u00b7 ${latestTrip.duration} ${t('dashboard.day')}s` : 'Medina \u00b7 Souks \u00b7 Palais Bahia \u00b7 Jardins Majorelle'}
              </p>
              <Link
                to={latestTrip ? '/itineraries' : '/concierge'}
                data-testid="hero-itinerary-cta"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: '#fff', color: '#1C1917', fontFamily: "'Manrope', sans-serif" }}
              >
                {latestTrip ? t('dashboard.viewItinerary') : t('dashboard.planYourTrip')} <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid — 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard value="24" label={t('dashboard.guidesAvailable')} delay={0.1} />
            <StatCard value={latestTrip ? `${Math.max(0, Math.ceil((new Date(latestTrip.created_at || Date.now()) - new Date()) / 86400000 + 12))}` : '12'} label={t('dashboard.beforeTrip')} delay={0.15} />
            <StatCard value={trips.length || '7'} label={t('dashboard.savedActivities')} delay={0.2} />
            <StatCard value="4.9" label={t('dashboard.avgRating')} delay={0.25} />
          </div>

          {/* Two Panels Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Guides Near You */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: '#E7E5DF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E7E5DF' }}>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}>
                  {t('dashboard.guidesNearYou')}
                </h3>
                <Link to="/map" className="text-xs font-medium" style={{ color: '#4A6984', fontFamily: "'Manrope', sans-serif" }}>
                  {t('dashboard.viewAll')}
                </Link>
              </div>
              <div className="divide-y" style={{ borderColor: '#F5F3EE' }}>
                {MOCK_GUIDES.map((guide, i) => (
                  <motion.div
                    key={guide.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F5F3EE]/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}>{guide.name}</p>
                        <p className="text-xs" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{guide.area} &middot; {t('dashboard.certified')}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#4A6984' }}>
                      {guide.rating} <Star size={12} weight="fill" style={{ color: '#D4A017' }} />
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Recommended Itinerary */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white rounded-2xl border overflow-hidden"
              style={{ borderColor: '#E7E5DF', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#E7E5DF' }}>
                <h3 className="text-sm font-semibold" style={{ fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}>
                  {t('dashboard.recommendedItinerary')}
                </h3>
                <Link to="/concierge" className="text-xs font-medium" style={{ color: '#4A6984', fontFamily: "'Manrope', sans-serif" }}>
                  {t('dashboard.modify')}
                </Link>
              </div>
              <div className="px-5 py-2">
                {[
                  { day: `${t('dashboard.day')} 1`, activity: 'Medina + Souks' },
                  { day: `${t('dashboard.day')} 2`, activity: 'Jardins Majorelle' },
                  { day: `${t('dashboard.day')} 3`, activity: 'Mellah artisanal' },
                ].map((item, i) => (
                  <motion.div
                    key={item.day}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-center gap-3 py-3.5 border-b last:border-0"
                    style={{ borderColor: '#F5F3EE' }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#4A6984' }} />
                    <div>
                      <p className="text-sm font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}>{item.day}</p>
                      <p className="text-xs" style={{ fontFamily: "'Manrope', sans-serif", color: '#A8A29E' }}>{item.activity}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
