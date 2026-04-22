import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Shield, CheckCircle, XCircle, Clock, 
  AlertTriangle, TrendingUp, DollarSign, Eye, FileText, Settings,
  Search, Filter, ChevronRight, ExternalLink, Loader2, RefreshCw,
  Building2, MapPin, Phone, Mail, Calendar, Star, Flag, Ban
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PARTNER_TYPE_LABELS = {
  guide: { label: 'Licensed Guide', color: 'bg-blue-100 text-blue-700' },
  riad: { label: 'Riad / Hotel', color: 'bg-purple-100 text-purple-700' },
  restaurant: { label: 'Restaurant', color: 'bg-orange-100 text-orange-700' },
  activity: { label: 'Activity Provider', color: 'bg-green-100 text-green-700' },
  transport: { label: 'Transport', color: 'bg-yellow-100 text-yellow-700' },
  artisan: { label: 'Artisan', color: 'bg-pink-100 text-pink-700' },
};

const ACTION_LABELS = {
  partner_approved: 'Partner verified',
  partner_rejected: 'Partner rejected',
  flag_resolved: 'Flag resolved',
};

function StatCard({ label, value, icon: Icon, sub, subColor }) {
  return (
    <div data-testid={`stat-${label.toLowerCase().replace(/\s+/g, '-')}`} className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-stone-500">{label}</span>
        <Icon className="w-4 h-4 text-stone-400" />
      </div>
      <p className="text-2xl font-bold text-midnight-500">{value}</p>
      {sub && <p className={`text-xs mt-1 ${subColor || 'text-stone-400'}`}>{sub}</p>}
    </div>
  );
}

function PartnerCard({ partner, selected, onSelect }) {
  return (
    <button
      data-testid={`partner-card-${partner.id}`}
      onClick={() => onSelect(partner)}
      className={`w-full p-4 text-left hover:bg-stone-50 transition-colors ${
        selected ? 'bg-terracotta-50 border-l-4 border-terracotta-500' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-stone-500" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-midnight-500 truncate">{partner.business_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PARTNER_TYPE_LABELS[partner.partner_type]?.color || 'bg-stone-100 text-stone-600'}`}>
              {PARTNER_TYPE_LABELS[partner.partner_type]?.label || partner.partner_type}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-stone-400">
        <Clock className="w-3 h-3" />
        {new Date(partner.created_at).toLocaleDateString()}
      </div>
    </button>
  );
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [pendingPartners, setPendingPartners] = useState([]);
  const [stats, setStats] = useState(null);
  const [contentFlags, setContentFlags] = useState([]);
  const [activity, setActivity] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, partnersRes, flagsRes, activityRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, { headers }).catch(() => null),
        axios.get(`${API}/admin/partners/pending`, { headers }).catch(() => null),
        axios.get(`${API}/admin/flags`, { headers }).catch(() => null),
        axios.get(`${API}/admin/activity`, { headers }).catch(() => null),
      ]);

      if (statsRes) setStats(statsRes.data);
      if (partnersRes) setPendingPartners(partnersRes.data.partners || []);
      if (flagsRes) setContentFlags(flagsRes.data.flags || []);
      if (activityRes) setActivity(activityRes.data.activity || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      toast.error('Failed to load dashboard. Make sure you have admin access.');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (!token) {
      toast.error('Please sign in first');
      navigate('/auth/signin');
      return;
    }
    fetchData();
  }, [token, navigate, fetchData]);

  const handleVerifyPartner = async (partnerId, action) => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/admin/partners/${partnerId}/${action}`, {}, { headers });
      toast.success(action === 'approve' ? 'Partner verified successfully!' : 'Partner application rejected');
      setPendingPartners(prev => prev.filter(p => p.id !== partnerId));
      setSelectedPartner(null);
      // Refresh stats
      const statsRes = await axios.get(`${API}/admin/stats`, { headers });
      setStats(statsRes.data);
      const actRes = await axios.get(`${API}/admin/activity`, { headers });
      setActivity(actRes.data.activity || []);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Action failed. Please try again.';
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveFlag = async (flagId) => {
    try {
      await axios.post(`${API}/admin/flags/${flagId}/resolve`, {}, { headers });
      toast.success('Flag resolved');
      setContentFlags(prev => prev.map(f => f.id === flagId ? { ...f, status: 'resolved' } : f));
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const filteredPartners = pendingPartners.filter(p => {
    const matchesSearch = p.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.contact_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || p.partner_type === filterType;
    return matchesSearch && matchesFilter;
  });

  const pendingFlagsCount = contentFlags.filter(f => f.status === 'pending').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <Loader2 className="w-8 h-8 animate-spin text-midnight-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <Shield className="w-16 h-16 text-stone-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-midnight-500 mb-2">Admin Access Required</h2>
          <p className="text-stone-500 mb-4">You don't have admin privileges to access this dashboard.</p>
          <Button onClick={() => navigate('/')} className="bg-terracotta-500 hover:bg-terracotta-600 text-white">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-stone-100">
      {/* Header */}
      <div className="bg-midnight-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-terracotta-500 flex items-center justify-center font-bold">MS</div>
              <div>
                <h1 className="text-lg font-bold">MarocSphere Admin</h1>
                <p className="text-xs text-midnight-200">Back Office</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={fetchData} data-testid="refresh-btn" className="text-white/70 hover:text-white hover:bg-white/10">
                <RefreshCw className="w-4 h-4" />
              </Button>
              <div className="w-8 h-8 rounded-full bg-terracotta-500 flex items-center justify-center text-sm font-bold">A</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4 -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'verification', label: 'Partner Verification', icon: Shield, badge: stats.pending_verifications },
              { id: 'moderation', label: 'Content Moderation', icon: Flag, badge: pendingFlagsCount },
              { id: 'users', label: 'Users', icon: Users },
            ].map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all ${
                  activeTab === tab.id ? 'bg-stone-100 text-midnight-500' : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">{tab.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.total_users.toLocaleString()} icon={Users} sub={`${stats.total_partners} partners`} />
              <StatCard label="Pending Verifications" value={stats.pending_verifications} icon={Shield} sub="Awaiting review" subColor="text-saffron-500" />
              <StatCard label="Total Revenue" value={`${stats.total_revenue.toLocaleString()} MAD`} icon={DollarSign} />
              <StatCard label="Total Reviews" value={stats.total_reviews} icon={Star} sub={`${stats.pending_flags} flags pending`} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pending Verifications Preview */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                  <h3 className="font-semibold text-midnight-500 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-saffron-500" />
                    Pending Partner Verifications
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('verification')} className="text-terracotta-500 hover:text-terracotta-600">
                    View all <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="divide-y divide-stone-100">
                  {pendingPartners.slice(0, 3).map((partner) => (
                    <div key={partner.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-stone-500" />
                        </div>
                        <div>
                          <p className="font-medium text-midnight-500">{partner.business_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${PARTNER_TYPE_LABELS[partner.partner_type]?.color || 'bg-stone-100 text-stone-600'}`}>
                              {PARTNER_TYPE_LABELS[partner.partner_type]?.label || partner.partner_type}
                            </span>
                            <span className="text-xs text-stone-400">{partner.city}</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => { setSelectedPartner(partner); setActiveTab('verification'); }} className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-lg">
                        Review
                      </Button>
                    </div>
                  ))}
                  {pendingPartners.length === 0 && (
                    <div className="p-8 text-center text-stone-400">
                      <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                      <p>All partners verified</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h3 className="font-semibold text-midnight-500">Recent Activity</h3>
                </div>
                <div className="divide-y divide-stone-100">
                  {activity.length > 0 ? activity.slice(0, 5).map((a) => (
                    <div key={a.id} className="p-4">
                      <p className="text-sm text-midnight-500">
                        <span className="font-medium">{ACTION_LABELS[a.action] || a.action}</span>
                        <span className="text-stone-500"> — {a.target_name}</span>
                      </p>
                      <p className="text-xs text-stone-400 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-stone-400">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="text-sm">No activity yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Partner Verification Tab */}
        {activeTab === 'verification' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    data-testid="partner-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search partners..."
                    className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400"
                  />
                </div>
                <select
                  data-testid="partner-filter"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta-200"
                >
                  <option value="all">All Types</option>
                  <option value="guide">Guides</option>
                  <option value="riad">Riads</option>
                  <option value="restaurant">Restaurants</option>
                  <option value="activity">Activities</option>
                  <option value="transport">Transport</option>
                  <option value="artisan">Artisans</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-stone-100">
                  <h3 className="font-semibold text-midnight-500">Pending Verification ({filteredPartners.length})</h3>
                </div>
                <div className="divide-y divide-stone-100 max-h-[600px] overflow-y-auto">
                  {filteredPartners.map((partner) => (
                    <PartnerCard key={partner.id} partner={partner} selected={selectedPartner?.id === partner.id} onSelect={setSelectedPartner} />
                  ))}
                  {filteredPartners.length === 0 && (
                    <div className="p-8 text-center text-stone-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-300" />
                      <p>No pending verifications</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Partner Details */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                {selectedPartner ? (
                  <>
                    <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                      <h3 className="font-semibold text-midnight-500">Application Details</h3>
                      <span className="px-3 py-1 bg-saffron-100 text-saffron-600 text-xs font-medium rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pending Review
                      </span>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Business Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-xs text-stone-400">Business Name</p><p className="font-medium text-midnight-500">{selectedPartner.business_name}</p></div>
                          <div><p className="text-xs text-stone-400">Partner Type</p><span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${PARTNER_TYPE_LABELS[selectedPartner.partner_type]?.color || 'bg-stone-100'}`}>{PARTNER_TYPE_LABELS[selectedPartner.partner_type]?.label || selectedPartner.partner_type}</span></div>
                          <div><p className="text-xs text-stone-400">City</p><p className="font-medium text-midnight-500 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-stone-400" />{selectedPartner.city}</p></div>
                          <div><p className="text-xs text-stone-400">License Number</p><p className="font-medium text-midnight-500">{selectedPartner.license_number || 'N/A'}</p></div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Contact Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div><p className="text-xs text-stone-400">Contact Name</p><p className="font-medium text-midnight-500">{selectedPartner.contact_name || selectedPartner.name || 'N/A'}</p></div>
                          <div><p className="text-xs text-stone-400">Email</p><p className="font-medium text-midnight-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-stone-400" />{selectedPartner.contact_email || selectedPartner.email || 'N/A'}</p></div>
                          <div><p className="text-xs text-stone-400">Phone</p><p className="font-medium text-midnight-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-stone-400" />{selectedPartner.contact_phone || selectedPartner.phone || 'N/A'}</p></div>
                          <div><p className="text-xs text-stone-400">Experience</p><p className="font-medium text-midnight-500">{selectedPartner.years_experience || 'N/A'} years</p></div>
                        </div>
                      </div>

                      {selectedPartner.description && (
                        <div>
                          <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Description</h4>
                          <p className="text-stone-600 text-sm leading-relaxed">{selectedPartner.description}</p>
                        </div>
                      )}

                      {selectedPartner.languages?.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">Languages</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedPartner.languages.map((lang) => (
                              <span key={lang} className="px-3 py-1 bg-stone-100 text-stone-600 text-sm rounded-full capitalize">{lang}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                        <Button
                          data-testid="approve-partner-btn"
                          onClick={() => handleVerifyPartner(selectedPartner.id, 'approve')}
                          disabled={actionLoading}
                          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-5"
                        >
                          {actionLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                          Approve & Verify
                        </Button>
                        <Button
                          data-testid="reject-partner-btn"
                          onClick={() => handleVerifyPartner(selectedPartner.id, 'reject')}
                          disabled={actionLoading}
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-5"
                        >
                          <XCircle className="w-5 h-5 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-12 text-center text-stone-400">
                    <Shield className="w-16 h-16 mx-auto mb-4 text-stone-200" />
                    <p className="text-lg font-medium text-stone-500">Select a partner to review</p>
                    <p className="text-sm">Click on a partner from the list to see their application details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Moderation Tab */}
        {activeTab === 'moderation' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
                <h3 className="font-semibold text-midnight-500">Content Flags</h3>
                <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                  {pendingFlagsCount} pending
                </span>
              </div>
              <div className="divide-y divide-stone-100">
                {contentFlags.length > 0 ? contentFlags.map((flag) => (
                  <div key={flag.id} data-testid={`flag-${flag.id}`} className={`p-4 ${flag.status === 'resolved' ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          flag.type === 'review' ? 'bg-orange-100' : flag.type === 'profile' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          <AlertTriangle className={`w-5 h-5 ${
                            flag.type === 'review' ? 'text-orange-500' : flag.type === 'profile' ? 'text-purple-500' : 'text-blue-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium text-midnight-500">{flag.content}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-stone-400">
                            <span className="capitalize">{flag.type}</span>
                            <span>Reported by: {flag.reporter}</span>
                            <span>{new Date(flag.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      {flag.status === 'pending' ? (
                        <Button size="sm" onClick={() => handleResolveFlag(flag.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">
                          Resolve
                        </Button>
                      ) : (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs font-medium rounded-full">Resolved</span>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-stone-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-emerald-300" />
                    <p>No content flags</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-midnight-500 mb-2">User Management</h3>
            <p className="text-stone-500 mb-2">Total registered users: <span className="font-bold">{stats.total_users}</span></p>
            <p className="text-sm text-stone-400">Full user management coming in next update</p>
          </div>
        )}
      </div>
    </div>
  );
}
