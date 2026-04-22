import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Building2, User, Mail, Lock, Phone, MapPin, FileText, Camera, 
  Check, ArrowRight, Loader2, Shield, Star, Wallet, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PARTNER_TYPES = [
  { id: 'guide', label: 'Licensed Guide', icon: User, desc: 'Certified tourist guide' },
  { id: 'riad', label: 'Riad / Hotel', icon: Building2, desc: 'Accommodation provider' },
  { id: 'restaurant', label: 'Restaurant', icon: Building2, desc: 'Food & dining' },
  { id: 'activity', label: 'Activity Provider', icon: Star, desc: 'Tours & experiences' },
  { id: 'transport', label: 'Transport', icon: Building2, desc: 'Transfers & rentals' },
  { id: 'artisan', label: 'Artisan', icon: Building2, desc: 'Crafts & workshops' },
];

const CITIES = [
  'Marrakech', 'Fes', 'Chefchaouen', 'Essaouira', 'Casablanca', 
  'Rabat', 'Tangier', 'Agadir', 'Ouarzazate', 'Merzouga'
];

export default function PartnerRegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    // Step 1 - Account
    name: '',
    email: '',
    password: '',
    phone: '',
    // Step 2 - Business
    business_name: '',
    partner_type: '',
    city: 'Marrakech',
    address: '',
    description: '',
    license_number: '',
    // Step 3 - Additional
    languages: ['french', 'arabic'],
    years_experience: '',
    website: '',
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleLanguage = (lang) => {
    setForm(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const validateStep = (stepNum) => {
    if (stepNum === 1) {
      if (!form.name || !form.email || !form.password || !form.phone) {
        toast.error('Please fill in all required fields');
        return false;
      }
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return false;
      }
    }
    if (stepNum === 2) {
      if (!form.business_name || !form.partner_type || !form.city) {
        toast.error('Please fill in all required fields');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setLoading(true);
    try {
      const res = await axios.post(`${API}/partners/register`, form);
      toast.success('Partner registration submitted! We will review your application.');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('partner_id', res.data.partner.id);
      navigate('/partner/dashboard');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="partner-register-page" className="min-h-screen bg-gradient-to-b from-midnight-500 to-midnight-600 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
            <Building2 className="w-4 h-4 text-saffron-400" />
            <span className="text-sm text-white/90 font-medium">Partner Program</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Join MarocSphere Partners
          </h1>
          <p className="text-midnight-200">
            Connect with 50,000+ travelers and grow your business
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  s === step 
                    ? 'bg-terracotta-500 text-white scale-110' 
                    : s < step 
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white/20 text-white/50'
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 rounded-full ${s < step ? 'bg-emerald-500' : 'bg-white/20'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step 1 - Account */}
          {step === 1 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-midnight-500 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-terracotta-500" />
                Account Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm('email', e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Password *</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="+212 XXX XXX XXX"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 - Business */}
          {step === 2 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-midnight-500 mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-terracotta-500" />
                Business Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={form.business_name}
                    onChange={(e) => updateForm('business_name', e.target.value)}
                    placeholder="Your business or service name"
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Partner Type *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PARTNER_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => updateForm('partner_type', type.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          form.partner_type === type.id
                            ? 'border-terracotta-400 bg-terracotta-50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <type.icon className={`w-5 h-5 mb-1 ${form.partner_type === type.id ? 'text-terracotta-500' : 'text-stone-400'}`} />
                        <p className="text-sm font-medium text-midnight-500">{type.label}</p>
                        <p className="text-xs text-stone-400">{type.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">City *</label>
                    <select
                      value={form.city}
                      onChange={(e) => updateForm('city', e.target.value)}
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                    >
                      {CITIES.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">License # (if applicable)</label>
                    <input
                      type="text"
                      value={form.license_number}
                      onChange={(e) => updateForm('license_number', e.target.value)}
                      placeholder="Guide license number"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm('description', e.target.value)}
                    placeholder="Tell travelers about your services..."
                    rows={3}
                    className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3 - Additional */}
          {step === 3 && (
            <div className="p-6 sm:p-8">
              <h2 className="text-xl font-bold text-midnight-500 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-terracotta-500" />
                Additional Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {['french', 'arabic', 'english', 'spanish', 'german', 'italian'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all capitalize ${
                          form.languages.includes(lang)
                            ? 'border-terracotta-400 bg-terracotta-500 text-white'
                            : 'border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={form.years_experience}
                      onChange={(e) => updateForm('years_experience', e.target.value)}
                      placeholder="e.g., 5"
                      min="0"
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Website (optional)</label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => updateForm('website', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:ring-2 focus:ring-terracotta-200 focus:border-terracotta-400 outline-none transition"
                    />
                  </div>
                </div>
                
                {/* Plan Preview */}
                <div className="mt-6 p-4 bg-gradient-to-r from-saffron-50 to-amber-50 rounded-xl border border-saffron-200">
                  <h3 className="font-semibold text-midnight-500 mb-2">You're signing up for: Free Listing</h3>
                  <ul className="text-sm text-stone-600 space-y-1">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic profile visibility</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 5 bookings per month</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic analytics</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 15% commission on bookings</li>
                  </ul>
                  <p className="text-xs text-saffron-600 mt-2">Upgrade anytime to Partner (490 MAD/mo) or Partner Pro (1,490 MAD/mo)</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="px-6 sm:px-8 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={prevStep} className="rounded-xl">
                Back
              </Button>
            ) : (
              <Link to="/auth/signin" className="text-sm text-stone-500 hover:text-terracotta-500">
                Already a partner? Sign in
              </Link>
            )}
            
            {step < 3 ? (
              <Button onClick={nextStep} className="bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-xl">
                Continue <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white rounded-xl"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  <>Complete Registration <Check className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <Shield className="w-8 h-8 text-saffron-400 mx-auto mb-2" />
            <p className="text-sm text-white/80">Verified Badge</p>
          </div>
          <div className="p-4">
            <Star className="w-8 h-8 text-saffron-400 mx-auto mb-2" />
            <p className="text-sm text-white/80">50K+ Travelers</p>
          </div>
          <div className="p-4">
            <Wallet className="w-8 h-8 text-saffron-400 mx-auto mb-2" />
            <p className="text-sm text-white/80">Weekly Payouts</p>
          </div>
        </div>
      </div>
    </div>
  );
}
