import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar, CheckCircle2, Coins, Clock3, Loader2, ShieldCheck, Star, TrendingUp, UserRound, Wallet } from 'lucide-react';
import { getSessionHeaders, normalizeRole } from '@/lib/auth';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EMPTY_STATS = {
  total_bookings: 0,
  pending_bookings: 0,
  confirmed_bookings: 0,
  completed_bookings: 0,
  cancelled_bookings: 0,
  total_revenue: 0,
  this_month_revenue: 0,
  rating: 0,
  total_reviews: 0,
  views_this_month: 0,
};

const ROLE_CONFIG = {
  artisan: {
    title: 'Artisan dashboard',
    headline: 'Craft orders, quotes, and client history',
    emoji: '🧵',
    accent: '#9C6644',
    badge: 'Artisan Studio',
    summary: 'Track requests, quote conversations, and completed services.',
    metricLabels: ['Orders', 'Pending quotes', 'Completed', 'Revenue'],
    historyTitle: 'Order history',
    historyEmpty: 'No artisan orders yet.',
  },
  agency: {
    title: 'Agency dashboard',
    headline: 'Packages, reservations, and quote pipeline',
    emoji: '🧳',
    accent: '#4A6984',
    badge: 'Travel Agency',
    summary: 'Follow group bookings, itinerary requests, and revenue flow.',
    metricLabels: ['Requests', 'Pending quotes', 'Confirmed', 'Revenue'],
    historyTitle: 'Booking history',
    historyEmpty: 'No agency bookings yet.',
  },
  hotel: {
    title: 'Hotel dashboard',
    headline: 'Reservations, occupancy, and guest history',
    emoji: '🏨',
    accent: '#2F6B57',
    badge: 'Hospitality',
    summary: 'Manage stays, arrivals, and guest follow-ups.',
    metricLabels: ['Reservations', 'Pending check-ins', 'Confirmed', 'Revenue'],
    historyTitle: 'Guest history',
    historyEmpty: 'No hotel reservations yet.',
  },
};

const fmtMoney = (value) => `${Number(value || 0).toLocaleString()} MAD`;

const StatCard = ({ label, value, icon: Icon, accent }) => (
  <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-400">{label}</p>
      <span className="p-2 rounded-xl" style={{ backgroundColor: `${accent}16`, color: accent }}>
        <Icon size={16} />
      </span>
    </div>
    <p className="text-2xl font-semibold text-stone-900">{value}</p>
  </div>
);

export default function BusinessDashboardPage({ role: roleProp = 'artisan' }) {
  const navigate = useNavigate();
  const role = normalizeRole(roleProp);
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.artisan;
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async () => {
    const headers = getSessionHeaders();
    try {
      const profileRes = await axios.get(`${API}/partners/me`, { headers });
      const profile = profileRes.data.partner;
      setPartner(profile);

      try {
        const statsRes = await axios.get(`${API}/partners/stats`, { headers });
        setStats(statsRes.data || EMPTY_STATS);
      } catch {
        setStats(EMPTY_STATS);
      }

      try {
        const bookingsRes = await axios.get(`${API}/partners/bookings`, { headers });
        setBookings(bookingsRes.data.bookings || []);
      } catch {
        setBookings([]);
      }

      if (profile?.id) {
        try {
          const reviewsRes = await axios.get(`${API}/reviews`, { params: { target_type: 'partner', target_id: profile.id } });
          setReviews(reviewsRes.data.reviews || []);
        } catch {
          setReviews([]);
        }
      }
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 404) {
        toast.error('Create your business profile first.');
        navigate('/auth/register', { replace: true });
        return;
      }
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (!token) {
      navigate('/auth/signin', { replace: true });
      return;
    }
    if (user?.account_role && normalizeRole(user.account_role) !== role && user.account_role !== 'client') {
      // Still load the requested dashboard route.
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, role]);

  const metricValues = useMemo(() => {
    const totalBookings = stats.total_bookings || bookings.length || 0;
    const pending = stats.pending_bookings || bookings.filter((b) => b.status === 'pending').length;
    const confirmed = stats.confirmed_bookings || bookings.filter((b) => b.status === 'confirmed').length;
    const revenue = stats.total_revenue || bookings
      .filter((b) => ['confirmed', 'completed'].includes(b.status))
      .reduce((sum, b) => sum + Number(b.amount || 0), 0);

    return {
      totalBookings,
      pending,
      confirmed,
      revenue,
    };
  }, [stats, bookings]);

  const recentBookings = bookings.slice(0, 6);
  const recentReviews = reviews.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: config.accent }} />
      </div>
    );
  }

  const businessName = partner?.business_name || `${config.badge} account`;
  const location = partner?.city || 'Morocco';
  const avgRating = Number(stats.rating || 0).toFixed(1);
  const completionRate = metricValues.totalBookings ? Math.round((stats.completed_bookings / metricValues.totalBookings) * 100) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="bg-gradient-to-r from-stone-950 to-stone-800 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs tracking-[0.18em] uppercase text-white/70">
                <span>{config.emoji}</span>
                {config.badge}
              </div>
              <h1 className="mt-4 text-3xl font-semibold">{config.title}</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/70">{config.headline} — {config.summary}</p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/subscription?type=partner" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/10">
                <Wallet size={16} />
                Upgrade
              </Link>
              <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-stone-900">
                <UserRound size={16} />
                Switch dashboard
              </Link>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'history', label: 'History' },
              { id: 'analytics', label: 'Analytics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-t-xl px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-stone-50 text-stone-900' : 'text-white/65 hover:text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={config.metricLabels[0]} value={metricValues.totalBookings} icon={Calendar} accent={config.accent} />
              <StatCard label={config.metricLabels[1]} value={metricValues.pending} icon={Clock3} accent={config.accent} />
              <StatCard label={config.metricLabels[2]} value={metricValues.confirmed} icon={CheckCircle2} accent={config.accent} />
              <StatCard label={config.metricLabels[3]} value={fmtMoney(metricValues.revenue)} icon={Coins} accent={config.accent} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <h2 className="font-semibold text-stone-900">{config.historyTitle}</h2>
                  <Link to="/dashboard" className="text-sm font-medium" style={{ color: config.accent }}>View full</Link>
                </div>
                <div className="divide-y">
                  {recentBookings.length > 0 ? recentBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between px-5 py-4">
                      <div>
                        <p className="font-medium text-stone-900">{booking.client_name || booking.traveler_name || 'Guest'}</p>
                        <p className="text-sm text-stone-500">{booking.service || booking.package || booking.title || 'Service request'} · {booking.date || new Date(booking.created_at || Date.now()).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">{fmtMoney(booking.amount || 0)}</p>
                        <p className="text-xs uppercase tracking-[0.16em] text-stone-400">{booking.status || 'pending'}</p>
                      </div>
                    </div>
                  )) : (
                    <div className="px-5 py-10 text-center text-stone-500">
                      {config.historyEmpty}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <h2 className="font-semibold text-stone-900">Performance</h2>
                </div>
                <div className="space-y-4 px-5 py-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-stone-600">Completion rate</span>
                      <span className="font-medium text-stone-900">{completionRate}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full" style={{ width: `${completionRate}%`, backgroundColor: config.accent }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Rating</p>
                      <div className="mt-2 flex items-center gap-2 text-xl font-semibold text-stone-900">
                        <Star className="h-5 w-5" style={{ color: config.accent }} />
                        {avgRating}
                      </div>
                    </div>
                    <div className="rounded-xl bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Reviews</p>
                      <p className="mt-2 text-xl font-semibold text-stone-900">{stats.total_reviews || 0}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-dashed p-4" style={{ borderColor: `${config.accent}40` }}>
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5" style={{ color: config.accent }} />
                      <div>
                        <p className="font-medium text-stone-900">{businessName}</p>
                        <p className="text-sm text-stone-500">{location} · {partner?.verified ? 'Verified' : 'Pending verification'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <h2 className="font-semibold text-stone-900">Recent reviews</h2>
                <button onClick={() => setActiveTab('analytics')} className="text-sm font-medium" style={{ color: config.accent }}>
                  See analytics
                </button>
              </div>
              <div className="divide-y">
                {recentReviews.length > 0 ? recentReviews.map((review) => (
                  <div key={review.id} className="px-5 py-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-stone-900">{review.user_name || 'Traveler'}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" style={{ color: config.accent }} />
                        <span className="text-sm text-stone-600">{review.rating || 0}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-stone-600">{review.content || review.body || 'No review text'}</p>
                  </div>
                )) : (
                  <div className="px-5 py-10 text-center text-stone-500">No reviews yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <h2 className="font-semibold text-stone-900">{config.historyTitle}</h2>
              <span className="text-sm text-stone-500">{bookings.length} records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-stone-50 text-xs uppercase tracking-[0.16em] text-stone-400">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Service</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bookings.length > 0 ? bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-stone-50/60">
                      <td className="px-5 py-4">
                        <div className="font-medium text-stone-900">{booking.client_name || booking.traveler_name || 'Guest'}</div>
                        <div className="text-xs text-stone-400">{booking.client_email || booking.traveler_email || ''}</div>
                      </td>
                      <td className="px-5 py-4 text-sm text-stone-600">{booking.service || booking.package || booking.title || 'Service request'}</td>
                      <td className="px-5 py-4 text-sm text-stone-600">{booking.date || new Date(booking.created_at || Date.now()).toLocaleDateString()}</td>
                      <td className="px-5 py-4 text-sm font-medium text-stone-900">{fmtMoney(booking.amount || 0)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-stone-600">
                          {booking.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" className="px-5 py-10 text-center text-stone-500">{config.historyEmpty}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <h2 className="mb-4 font-semibold text-stone-900">Booking breakdown</h2>
              <div className="space-y-3">
                {[
                  { label: 'Confirmed', value: stats.confirmed_bookings || 0 },
                  { label: 'Pending', value: stats.pending_bookings || 0 },
                  { label: 'Completed', value: stats.completed_bookings || 0 },
                  { label: 'Cancelled', value: stats.cancelled_bookings || 0 },
                ].map((item) => {
                  const total = stats.total_bookings || bookings.length || 1;
                  const pct = Math.round((item.value / total) * 100);
                  return (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-stone-600">{item.label}</span>
                        <span className="font-medium text-stone-900">{item.value}</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: config.accent }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
              <h2 className="mb-4 font-semibold text-stone-900">Performance summary</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
                  <span className="text-sm text-stone-600">Revenue</span>
                  <span className="text-lg font-semibold text-stone-900">{fmtMoney(metricValues.revenue)}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
                  <span className="text-sm text-stone-600">Profile views</span>
                  <span className="text-lg font-semibold text-stone-900">{stats.views_this_month || 0}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-stone-50 p-4">
                  <span className="text-sm text-stone-600">Conversion</span>
                  <span className="text-lg font-semibold text-stone-900">{metricValues.totalBookings > 0 ? Math.round((metricValues.totalBookings / Math.max(1, stats.views_this_month || metricValues.totalBookings)) * 100) : 0}%</span>
                </div>
                <div className="rounded-xl border border-dashed p-4" style={{ borderColor: `${config.accent}40` }}>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="mt-0.5 h-5 w-5" style={{ color: config.accent }} />
                    <div>
                      <p className="font-medium text-stone-900">Next action</p>
                      <p className="text-sm text-stone-500">Keep your profile active and keep customer response times low to improve bookings.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
