import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Calendar, Users, Wallet, MapPin, Clock, Lightbulb, ChevronDown, Loader2, Lock, Crown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DESTINATIONS = [
  { value: 'Marrakech', emoji: '🏙' },
  { value: 'Fes', emoji: '🕌' },
  { value: 'Chefchaouen', emoji: '💎' },
  { value: 'Essaouira', emoji: '🌊' },
  { value: 'Rabat', emoji: '🏰' },
  { value: 'Merzouga', emoji: '🐪' },
  { value: 'Ouarzazate', emoji: '🎬' },
];

const TRAVELER_TYPES = [
  { value: 'solo', label: 'Solo', emoji: '🧍' },
  { value: 'couple', label: 'Couple', emoji: '👫' },
  { value: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { value: 'group', label: 'Group', emoji: '👥' },
];

const BUDGETS = [
  { value: 'budget', label: 'Budget', range: '~300-500 MAD/day' },
  { value: 'midrange', label: 'Mid-range', range: '~500-1200 MAD/day' },
  { value: 'luxury', label: 'Luxury', range: '~1200+ MAD/day' },
];

const INTERESTS = [
  { id: 'history', label: 'History', icon: '🏛' },
  { id: 'food', label: 'Food', icon: '🍽' },
  { id: 'shopping', label: 'Shopping', icon: '🛍' },
  { id: 'adventure', label: 'Adventure', icon: '🧗' },
  { id: 'culture', label: 'Culture', icon: '🎭' },
  { id: 'relaxation', label: 'Relaxation', icon: '🧖' },
  { id: 'photography', label: 'Photography', icon: '📸' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'nightlife', label: 'Nightlife', icon: '🌙' },
];

const TIME_COLORS = {
  morning: 'bg-amber-50 text-amber-700 border-amber-200',
  afternoon: 'bg-blue-50 text-blue-700 border-blue-200',
  evening: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

export default function ConciergePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    destination: 'Marrakech',
    duration: 5,
    traveler_type: 'couple',
    interests: ['history', 'food'],
    budget: 'midrange',
    start_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState({ current: 0, limit: 1, unlimited: false, maxDays: 5 });
  const [limitReached, setLimitReached] = useState(false);

  const checkUsage = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/usage/check/ai_itinerary_per_day`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // Also get max days limit
      const statusRes = await axios.get(`${API}/subscription/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => ({ data: { limits: { ai_itinerary_max_days: 5 } } }));
      
      setUsage({
        current: res.data.current,
        limit: res.data.limit,
        unlimited: res.data.limit === -1,
        maxDays: statusRes.data.limits?.ai_itinerary_max_days || 5
      });
      setLimitReached(!res.data.allowed);
      
      // Cap duration if exceeds plan limit
      if (form.duration > (statusRes.data.limits?.ai_itinerary_max_days || 5)) {
        setForm(prev => ({ ...prev, duration: statusRes.data.limits?.ai_itinerary_max_days || 5 }));
      }
    } catch (err) {
      console.error('Usage check failed:', err);
    }
  }, [form.duration]);

  useEffect(() => {
    checkUsage();
  }, [checkUsage]);

  const toggleInterest = (id) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(id)
        ? prev.interests.filter(i => i !== id)
        : [...prev.interests, id]
    }));
  };

  const handleGenerate = async () => {
    if (form.interests.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }
    
    if (limitReached) {
      toast.error(t('concierge.limitReached'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Track usage first
      if (token) {
        await axios.post(`${API}/usage/track/ai_itinerary_per_day`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      const res = await axios.post(`${API}/itineraries/generate`, form, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setResult(res.data);
      toast.success('Itinerary generated successfully!');
      
      // Update usage after success
      checkUsage();
    } catch (err) {
      if (err.response?.status === 403) {
        setLimitReached(true);
        toast.error(t('concierge.limitReached'));
      } else {
        const msg = err.response?.data?.detail || 'Failed to generate itinerary. Please try again.';
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const itinerary = result?.itinerary;
  const remainingItineraries = usage.unlimited ? '∞' : Math.max(0, usage.limit - usage.current);

  return (
    <div data-testid="concierge-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-saffron-500 mb-1">{t('concierge.title')}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-midnight-500">Plan Your Dream Trip</h1>
            <p className="text-stone-500 mt-2 text-base sm:text-lg">{t('concierge.subtitle')}</p>
          </div>
          
          {/* Usage Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-terracotta-50 to-saffron-50 border border-terracotta-100 rounded-full px-4 py-2">
              <Zap className="w-4 h-4 text-terracotta-500" />
              <span className="text-sm font-semibold text-midnight-500">
                {remainingItineraries} {usage.unlimited ? '' : `/${usage.limit}`} left today
              </span>
            </div>
            {!usage.unlimited && (
              <Button
                onClick={() => navigate('/subscription')}
                variant="outline"
                size="sm"
                className="rounded-full border-terracotta-200 text-terracotta-600 hover:bg-terracotta-50"
              >
                <Crown className="w-3.5 h-3.5 mr-1" />
                Upgrade
              </Button>
            )}
          </div>
        </div>

        {/* Limit Reached Banner */}
        {limitReached && (
          <div className="mt-4 bg-gradient-to-r from-saffron-50 to-amber-50 border border-saffron-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-saffron-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-saffron-600" />
              </div>
              <div>
                <p className="font-semibold text-saffron-700">{t('concierge.limitReached')}</p>
                <p className="text-sm text-saffron-600">{t('concierge.limitMessage')}</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/subscription')}
              className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white rounded-full"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 lg:sticky lg:top-20 lg:self-start">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-6">
            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold text-midnight-500 mb-2">Destination</label>
              <select
                data-testid="destination-select"
                value={form.destination}
                onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl bg-stone-50 text-sm focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
              >
                {DESTINATIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.emoji} {d.value}</option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-midnight-500">{t('concierge.duration')}</label>
                {!usage.unlimited && form.duration >= usage.maxDays && (
                  <span className="text-xs text-saffron-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Max for your plan
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  data-testid="duration-slider"
                  value={[form.duration]}
                  onValueChange={([v]) => setForm(p => ({ ...p, duration: Math.min(v, usage.maxDays) }))}
                  min={1}
                  max={usage.maxDays}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-bold text-midnight-500 bg-stone-50 px-3 py-1.5 rounded-lg min-w-[60px] text-center">
                  {form.duration}d
                </span>
              </div>
              {!usage.unlimited && usage.maxDays < 14 && (
                <p className="text-xs text-stone-400 mt-1">
                  Upgrade to plan up to 14 days
                </p>
              )}
            </div>

            {/* Traveler type */}
            <div>
              <label className="block text-sm font-semibold text-midnight-500 mb-2">Traveling as</label>
              <div className="grid grid-cols-2 gap-2">
                {TRAVELER_TYPES.map(t => (
                  <button
                    key={t.value}
                    data-testid={`traveler-${t.value}`}
                    onClick={() => setForm(p => ({ ...p, traveler_type: t.value }))}
                    className={`py-2.5 px-3 rounded-xl text-sm font-medium border transition-all btn-press ${
                      form.traveler_type === t.value
                        ? 'border-terracotta-400 bg-terracotta-50 text-terracotta-700'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
                    }`}
                  >
                    {t.emoji} {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-semibold text-midnight-500 mb-2">Budget Level</label>
              <div className="grid grid-cols-3 gap-2">
                {BUDGETS.map(b => (
                  <button
                    key={b.value}
                    data-testid={`budget-${b.value}`}
                    onClick={() => setForm(p => ({ ...p, budget: b.value }))}
                    className={`py-2.5 px-2 rounded-xl text-xs font-medium border transition-all text-center btn-press ${
                      form.budget === b.value
                        ? 'border-terracotta-400 bg-terracotta-50 text-terracotta-700'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div className="text-base">{b.value === 'budget' ? '💰' : b.value === 'midrange' ? '💰💰' : '💰💰💰'}</div>
                    <div className="mt-0.5 capitalize">{b.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-1.5">
                {BUDGETS.find(b => b.value === form.budget)?.range}
              </p>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-semibold text-midnight-500 mb-2">Start Date</label>
              <input
                data-testid="start-date"
                type="date"
                value={form.start_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
                className="w-full h-11 px-3 border border-stone-200 rounded-xl bg-stone-50 text-sm focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
              />
            </div>

            {/* Interests */}
            <div>
              <label className="block text-sm font-semibold text-midnight-500 mb-1">Interests</label>
              <p className="text-xs text-stone-400 mb-3">{form.interests.length} selected (min 1)</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(int => (
                  <button
                    key={int.id}
                    data-testid={`interest-${int.id}`}
                    onClick={() => toggleInterest(int.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      form.interests.includes(int.id)
                        ? 'border-terracotta-400 bg-terracotta-500 text-white pill-selected'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-white'
                    }`}
                  >
                    {int.icon} {int.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate */}
            <Button
              data-testid="generate-btn"
              onClick={handleGenerate}
              disabled={loading || form.interests.length === 0 || limitReached}
              className={`w-full rounded-xl py-6 text-base font-bold shadow-lg transition-all btn-press disabled:opacity-50 ${
                limitReached 
                  ? 'bg-stone-300 cursor-not-allowed' 
                  : 'bg-terracotta-500 hover:bg-terracotta-600 text-white hover:shadow-xl'
              }`}
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {t('concierge.generating')}</>
              ) : limitReached ? (
                <><Lock className="w-5 h-5 mr-2" /> {t('concierge.limitReached')}</>
              ) : (
                <><Sparkles className="w-5 h-5 mr-2" /> {t('concierge.generate')}</>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3" data-testid="results-panel">
          {!loading && !result && !error && (
            <div className="flex flex-col items-center justify-center text-center py-20 bg-white rounded-2xl border border-stone-100">
              <div className="text-6xl mb-4 animate-float">🗺</div>
              <h3 className="text-xl font-bold text-midnight-500 mb-2">Your Perfect Trip Awaits</h3>
              <p className="text-sm text-stone-500 max-w-xs">Fill in your preferences and let AI create a personalized day-by-day itinerary.</p>
            </div>
          )}

          {loading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-2/3 rounded-lg" />
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-stone-100 space-y-3">
                  <Skeleton className="h-6 w-1/3 rounded" />
                  <Skeleton className="h-4 w-full rounded" />
                  <Skeleton className="h-4 w-4/5 rounded" />
                  <Skeleton className="h-4 w-3/5 rounded" />
                </div>
              ))}
              <p className="text-center text-sm text-stone-400 animate-pulse-soft">
                Did you know? Fes has over 9,400 streets in its medina...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 rounded-2xl p-6 border border-red-100 text-center">
              <p className="text-red-700 font-medium mb-2">Something went wrong</p>
              <p className="text-sm text-red-500">{error}</p>
              <Button onClick={handleGenerate} className="mt-4 bg-red-600 hover:bg-red-700 text-white rounded-xl">
                Try Again
              </Button>
            </div>
          )}

          {itinerary && !loading && (
            <div className="space-y-6" data-testid="itinerary-result">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold text-midnight-500">{itinerary.title || `${form.duration}-Day ${form.destination} Adventure`}</h2>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">Planned</span>
              </div>

              {/* Days */}
              {itinerary.days && itinerary.days.length > 0 && (
                <Accordion type="multiple" defaultValue={['day-1', 'day-2']} className="space-y-3">
                  {itinerary.days.map((day) => (
                    <AccordionItem
                      key={day.day_number}
                      value={`day-${day.day_number}`}
                      className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
                    >
                      <AccordionTrigger className="px-5 py-4 hover:bg-stone-50 hover:no-underline">
                        <div className="flex items-center gap-3 text-left">
                          <span className="text-sm font-bold text-terracotta-500">Day {day.day_number}</span>
                          <span className="text-sm font-semibold text-midnight-500">{day.theme}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-5 pb-5">
                        <div className="space-y-3">
                          {day.activities?.map((act, idx) => (
                            <div key={idx} className="flex gap-3 py-3 border-t border-stone-50 first:border-0">
                              <div className="flex-shrink-0 w-20">
                                <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${TIME_COLORS[act.time_slot] || TIME_COLORS.morning}`}>
                                  {act.time_slot}
                                </span>
                                {act.start_time && <p className="text-[11px] text-stone-400 mt-1">{act.start_time}</p>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-midnight-500">{act.title}</h4>
                                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{act.description}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-400">
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{act.location}</span>
                                  {act.duration_min && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{act.duration_min}min</span>}
                                  {act.cost_mad > 0 && <span>{act.cost_mad} MAD</span>}
                                </div>
                                {act.tip && (
                                  <div className="mt-2 bg-saffron-50 rounded-lg px-3 py-2 text-[11px] text-saffron-700 flex items-start gap-1.5">
                                    <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" /> {act.tip}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {day.safety_tip && (
                          <div className="mt-3 bg-emerald-50 rounded-lg px-3 py-2 text-xs text-emerald-700 flex items-start gap-1.5">
                            <span className="flex-shrink-0">🛡</span> {day.safety_tip}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {/* Budget */}
              {itinerary.budget_estimate && (
                <div className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm">
                  <h3 className="text-sm font-bold text-midnight-500 mb-4 flex items-center gap-2"><Wallet className="w-4 h-4" /> Budget Estimate (MAD/day)</h3>
                  <div className="space-y-3">
                    {Object.entries(itinerary.budget_estimate).filter(([k]) => k !== 'total').map(([key, val]) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-stone-500 capitalize w-28">{key}</span>
                        <div className="flex-1 bg-stone-100 rounded-full h-2">
                          <div className="bg-terracotta-400 h-2 rounded-full" style={{ width: `${Math.min(100, ((val.max || 0) / 2000) * 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-midnight-500 w-28 text-right">{val.min}-{val.max}</span>
                      </div>
                    ))}
                    {itinerary.budget_estimate.total && (
                      <div className="pt-3 border-t border-stone-100 flex justify-between">
                        <span className="text-sm font-bold text-midnight-500">Total</span>
                        <span className="text-sm font-bold text-terracotta-600">{itinerary.budget_estimate.total.min}-{itinerary.budget_estimate.total.max} MAD</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Cultural Notes */}
              {itinerary.cultural_notes?.length > 0 && (
                <div className="bg-midnight-50 rounded-2xl p-5 border border-midnight-100">
                  <h3 className="text-sm font-bold text-midnight-500 mb-3">Cultural Notes</h3>
                  <ul className="space-y-2">
                    {itinerary.cultural_notes.map((note, i) => (
                      <li key={i} className="text-xs text-midnight-600 flex items-start gap-2"><span>🕌</span>{note}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Emergency */}
              {itinerary.emergency_info && (
                <div className="bg-red-50 rounded-2xl p-5 border border-red-100">
                  <h3 className="text-sm font-bold text-red-700 mb-3">Emergency Info</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-red-600">Police: <strong>{itinerary.emergency_info.police}</strong></span>
                    <span className="text-red-600">Ambulance: <strong>{itinerary.emergency_info.ambulance}</strong></span>
                    {itinerary.emergency_info.nearest_hospital && (
                      <span className="col-span-2 text-red-500">Hospital: {itinerary.emergency_info.nearest_hospital}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
