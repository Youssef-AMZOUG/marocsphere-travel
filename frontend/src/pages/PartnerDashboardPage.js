import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Calendar, Wallet, Star, Users, MapPin, TrendingUp, 
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, Settings,
  Bell, BarChart3, Shield, Globe, Camera, ExternalLink, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

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

export default function PartnerDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchPartnerData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/partner/register');
        return;
      }
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch partner profile
      const profileRes = await axios.get(`${API}/partners/me`, { headers });
      setPartner(profileRes.data.partner);

      // Fetch stats
      try {
        const statsRes = await axios.get(`${API}/partners/stats`, { headers });
        setStats(statsRes.data);
      } catch { /* keep empty stats */ }

      // Fetch bookings
      try {
        const bookingsRes = await axios.get(`${API}/partners/bookings`, { headers });
        setBookings(bookingsRes.data.bookings || []);
      } catch { /* keep empty bookings */ }

      // Fetch reviews for partner
      if (profileRes.data.partner?.id) {
        try {
          const reviewsRes = await axios.get(`${API}/reviews`, {
            params: { target_type: 'partner', target_id: profileRes.data.partner.id }
          });
          setReviews(reviewsRes.data.reviews || []);
        } catch { /* keep empty reviews */ }
      }
    } catch (err) {
      console.error('Failed to fetch partner data:', err);
      if (err.response?.status === 403 || err.response?.status === 404) {
        toast.error('Partner profile not found. Please register first.');
        navigate('/partner/register');
        return;
      }
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPartnerData();
  }, [fetchPartnerData]);

  const handleBookingAction = async (bookingId, action) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/partners/bookings/${bookingId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Booking ${action === 'accept' ? 'confirmed' : 'declined'}!`);
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, status: action === 'accept' ? 'confirmed' : 'cancelled' } : b
      ));
      // Refresh stats
      try {
        const statsRes = await axios.get(`${API}/partners/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(statsRes.data);
      } catch { /* ignore */ }
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${action} booking`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    );
  }

  return (
    <div data-testid="partner-dashboard" className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-midnight-500 to-midnight-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-2xl">
                👨‍💼
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{partner?.business_name}</h1>
                  {partner?.verified && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-full flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {partner?.passport_of_good && (
                    <span className="px-2 py-0.5 bg-saffron-500/20 text-saffron-300 text-xs font-medium rounded-full">
                      🏆 Passport of Good
                    </span>
                  )}
                </div>
                <p className="text-midnight-200 text-sm">{partner?.city} • {partner?.partner_type}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                <Settings className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg"
                onClick={() => navigate('/subscription?type=partner')}
              >
                Upgrade Plan
              </Button>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 mt-6 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'bookings', label: 'Bookings', icon: Calendar },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'reviews', label: 'Reviews', icon: Star },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-stone-50 text-midnight-500'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Total Bookings</span>
                  <Calendar className="w-4 h-4 text-stone-400" />
                </div>
                <p className="text-2xl font-bold text-midnight-500">{stats.total_bookings}</p>
                <p className="text-xs text-emerald-500 mt-1">+12% this month</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Revenue (MAD)</span>
                  <Wallet className="w-4 h-4 text-stone-400" />
                </div>
                <p className="text-2xl font-bold text-midnight-500">{stats.total_revenue.toLocaleString()}</p>
                <p className="text-xs text-emerald-500 mt-1">+{stats.this_month_revenue} this month</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Rating</span>
                  <Star className="w-4 h-4 text-saffron-400" />
                </div>
                <p className="text-2xl font-bold text-midnight-500">{stats.rating}</p>
                <p className="text-xs text-stone-400 mt-1">{stats.total_reviews} reviews</p>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-stone-500">Profile Views</span>
                  <TrendingUp className="w-4 h-4 text-stone-400" />
                </div>
                <p className="text-2xl font-bold text-midnight-500">{stats.views_this_month}</p>
                <p className="text-xs text-emerald-500 mt-1">+8% this month</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Bookings */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="font-semibold text-midnight-500">Pending Bookings</h3>
                  <span className="px-2 py-1 bg-saffron-100 text-saffron-600 text-xs font-medium rounded-full">
                    {bookings.filter(b => b.status === 'pending').length} awaiting
                  </span>
                </div>
                <div className="divide-y divide-stone-100">
                  {bookings.filter(b => b.status === 'pending').map((booking) => (
                    <div key={booking.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-lg">
                          {booking.traveler_country === 'France' ? '🇫🇷' : booking.traveler_country === 'Italy' ? '🇮🇹' : '🌍'}
                        </div>
                        <div>
                          <p className="font-medium text-midnight-500">{booking.traveler_name}</p>
                          <p className="text-sm text-stone-500">{booking.service} • {booking.guests} guest(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-midnight-500">{booking.date}</p>
                        <p className="text-sm text-stone-500">{booking.time}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleBookingAction(booking.id, 'accept')}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleBookingAction(booking.id, 'decline')}
                          className="border-red-200 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {bookings.filter(b => b.status === 'pending').length === 0 && (
                    <div className="p-8 text-center text-stone-400">
                      No pending bookings
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Summary */}
              <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h3 className="font-semibold text-midnight-500">Quick Stats</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-stone-500">Status</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      partner?.status === 'verified' ? 'bg-emerald-100 text-emerald-600' :
                      partner?.status === 'pending_verification' ? 'bg-saffron-100 text-saffron-600' :
                      'bg-stone-100 text-stone-600'
                    }`}>{partner?.status || 'unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-stone-500">Plan</span>
                    <span className="text-sm font-medium text-midnight-500 capitalize">{partner?.plan_id?.replace('_', ' ') || 'Free'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-stone-500">Bookings</span>
                    <span className="text-sm font-medium text-midnight-500">{stats.total_bookings}</span>
                  </div>
                  <div className="flex items-center justify-between p-2">
                    <span className="text-sm text-stone-500">Reviews</span>
                    <span className="text-sm font-medium text-midnight-500">{stats.total_reviews}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Reviews */}
            <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-semibold text-midnight-500">Recent Reviews</h3>
                <button onClick={() => setActiveTab('reviews')} className="text-sm text-terracotta-500 hover:text-terracotta-600 flex items-center gap-1">
                  View all <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-stone-100">
                {reviews.length > 0 ? reviews.slice(0, 3).map((review) => (
                  <div key={review.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-midnight-500">{review.user_name || 'Traveler'}</span>
                      <div className="flex items-center gap-1">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-saffron-400 text-saffron-400" />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="text-sm font-medium text-midnight-500">{review.title}</p>}
                    <p className="text-sm text-stone-600">{review.content}</p>
                    <p className="text-xs text-stone-400 mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
                  </div>
                )) : (
                  <div className="p-8 text-center text-stone-400">
                    <p className="text-sm">No reviews yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h3 className="font-semibold text-midnight-500">All Bookings</h3>
              <div className="flex gap-2">
                {['all', 'pending', 'confirmed', 'completed'].map((filter) => (
                  <button
                    key={filter}
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-stone-200 text-stone-600 hover:border-terracotta-400 hover:text-terracotta-600 transition-all capitalize"
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">Traveler</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-stone-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{booking.traveler_country === 'France' ? '🇫🇷' : booking.traveler_country === 'UK' ? '🇬🇧' : '🇮🇹'}</span>
                          <span className="font-medium text-midnight-500">{booking.traveler_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600">{booking.service}</td>
                      <td className="px-4 py-3 text-sm text-stone-600">{booking.date} at {booking.time}</td>
                      <td className="px-4 py-3 text-sm font-medium text-midnight-500">{booking.amount} MAD</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' :
                          booking.status === 'pending' ? 'bg-saffron-100 text-saffron-600' :
                          'bg-stone-100 text-stone-600'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="ghost" className="text-stone-400 hover:text-terracotta-500">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6">
                <h3 className="font-semibold text-midnight-500 mb-4">Booking Breakdown</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Confirmed', count: stats.confirmed_bookings || 0, color: 'bg-emerald-400' },
                    { label: 'Pending', count: stats.pending_bookings || 0, color: 'bg-saffron-400' },
                    { label: 'Completed', count: stats.completed_bookings || 0, color: 'bg-sky-400' },
                    { label: 'Cancelled', count: stats.cancelled_bookings || 0, color: 'bg-red-400' },
                  ].map(item => {
                    const total = stats.total_bookings || 1;
                    const pct = Math.round((item.count / total) * 100) || 0;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-sm text-stone-600 w-20">{item.label}</span>
                        <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-medium text-midnight-500 w-10 text-right">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-stone-100 shadow-sm p-6">
                <h3 className="font-semibold text-midnight-500 mb-4">Performance Summary</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <span className="text-sm text-stone-600">Total Revenue</span>
                    <span className="text-lg font-bold text-midnight-500">{(stats.total_revenue || 0).toLocaleString()} MAD</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <span className="text-sm text-stone-600">Average Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-saffron-400 text-saffron-400" />
                      <span className="text-lg font-bold text-midnight-500">{stats.rating || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <span className="text-sm text-stone-600">Profile Views</span>
                    <span className="text-lg font-bold text-midnight-500">{stats.views_this_month || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
                    <span className="text-sm text-stone-600">Conversion Rate</span>
                    <span className="text-lg font-bold text-midnight-500">
                      {stats.views_this_month > 0 ? Math.round((stats.total_bookings / stats.views_this_month) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-stone-100 flex items-center gap-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-midnight-500">{stats.rating || 0}</p>
                <div className="flex gap-0.5 justify-center my-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(stats.rating) ? 'fill-saffron-400 text-saffron-400' : 'text-stone-200'}`} />
                  ))}
                </div>
                <p className="text-sm text-stone-500">{stats.total_reviews} reviews</p>
              </div>
            </div>
            <div className="divide-y divide-stone-100">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review.id} className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-terracotta-100 flex items-center justify-center text-terracotta-600 font-semibold">
                        {(review.user_name || 'T')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-midnight-500">{review.user_name || 'Traveler'}</p>
                        <p className="text-xs text-stone-400">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-saffron-400 text-saffron-400" />
                      ))}
                    </div>
                  </div>
                  {review.title && <p className="font-medium text-midnight-500 mb-1">{review.title}</p>}
                  <p className="text-stone-600">{review.content}</p>
                </div>
              )) : (
                <div className="p-10 text-center text-stone-400">
                  <Star className="w-10 h-10 mx-auto mb-3 text-stone-200" />
                  <p className="font-medium text-midnight-500 mb-1">No reviews yet</p>
                  <p className="text-sm">Reviews from travelers will appear here</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
