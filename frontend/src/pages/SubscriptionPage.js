import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, Sparkles, Star, Crown, Loader2, ArrowRight, Shield, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Plan icons
const PLAN_ICONS = {
  explorer: Users,
  voyager: Star,
  nomade: Crown,
};

export default function SubscriptionPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState({});
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Check for success/cancel from Stripe
  const sessionId = searchParams.get('session_id');

  const fetchData = useCallback(async () => {
    try {
      const [plansRes, statusRes] = await Promise.all([
        axios.get(`${API}/subscription/plans?plan_type=traveler`),
        axios.get(`${API}/subscription/status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }).catch(() => ({ data: { plan_id: 'explorer', authenticated: false } }))
      ]);
      
      setPlans(plansRes.data.plans);
      setCurrentPlan(statusRes.data);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const pollPaymentStatus = useCallback(async (sid, attempts = 0) => {
    const maxAttempts = 10;
    
    if (attempts >= maxAttempts) {
      toast.error('Payment verification timed out. Please check your email for confirmation.');
      return;
    }

    try {
      const res = await axios.get(`${API}/subscription/checkout/status/${sid}`);
      
      if (res.data.payment_status === 'paid') {
        toast.success(`Welcome to ${res.data.plan_id}! Your subscription is now active.`);
        // Refresh data
        fetchData();
        // Clear URL params
        navigate('/subscription', { replace: true });
      } else if (res.data.status === 'expired') {
        toast.error('Payment session expired. Please try again.');
      } else {
        // Continue polling
        setTimeout(() => pollPaymentStatus(sid, attempts + 1), 2000);
      }
    } catch (error) {
      console.error('Payment status check failed:', error);
    }
  }, [fetchData, navigate]);

  useEffect(() => {
    fetchData();
    if (sessionId) {
      pollPaymentStatus(sessionId);
    }
  }, [sessionId, fetchData, pollPaymentStatus]);

  const handleUpgrade = async (planId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please sign in to upgrade');
      navigate('/auth/signin');
      return;
    }

    setCheckingOut(true);
    setSelectedPlan(planId);

    try {
      const res = await axios.post(`${API}/subscription/checkout`, {
        plan_type: 'traveler',
        plan_id: planId,
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.url) {
        window.location.href = res.data.url;
      } else if (res.data.success) {
        toast.success(res.data.message);
        fetchData();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Unable to start checkout. Please try again.');
    } finally {
      setCheckingOut(false);
      setSelectedPlan(null);
    }
  };

  const getPlanFeatures = (plan) => {
    const lang = i18n.language;
    if (lang === 'fr' && plan.features_fr) {
      return plan.features_fr;
    }
    return plan.features || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-500" />
      </div>
    );
  }

  const planOrder = ['explorer', 'voyager', 'nomade'];

  return (
    <div data-testid="subscription-page" className="min-h-screen bg-gradient-to-b from-stone-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-terracotta-100 text-terracotta-600 text-xs font-bold uppercase tracking-wider mb-4">
            {i18n.language === 'fr' ? 'Abonnements' : i18n.language === 'ar' ? 'الاشتراكات' : 'Pricing'}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-midnight-500 mb-4">
            {i18n.language === 'fr' ? 'Choisissez Votre' : i18n.language === 'ar' ? 'اختر' : 'Choose Your'}{' '}
            <span className="gradient-text">
              {i18n.language === 'fr' ? 'Aventure' : i18n.language === 'ar' ? 'مغامرتك' : 'Adventure'}
            </span>
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            {i18n.language === 'fr' 
              ? 'Du voyageur occasionnel au nomade passionné, nous avons un plan pour vous.'
              : i18n.language === 'ar'
              ? 'من المسافر العرضي إلى الرحالة المتحمس، لدينا خطة لك.'
              : 'From casual explorer to passionate nomad, we have a plan for you.'}
          </p>
        </div>

        {/* Current Plan Banner */}
        {currentPlan?.authenticated && (
          <div className="mb-8 p-4 bg-gradient-to-r from-terracotta-50 to-saffron-50 rounded-xl border border-terracotta-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-terracotta-500" />
              <span className="text-sm text-midnight-500">
                {i18n.language === 'fr' ? 'Plan actuel:' : 'Current plan:'}{' '}
                <strong className="capitalize">{currentPlan.plan_id}</strong>
              </span>
            </div>
            {currentPlan.plan_id !== 'nomade' && (
              <span className="text-xs text-terracotta-600 font-medium">
                {i18n.language === 'fr' ? 'Passez au niveau supérieur pour plus de fonctionnalités!' : 'Upgrade for more features!'}
              </span>
            )}
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planOrder.map((planKey) => {
            const plan = plans[planKey];
            if (!plan) return null;
            
            const Icon = PLAN_ICONS[planKey] || Star;
            const isCurrentPlan = currentPlan?.plan_id === planKey;
            const isPopular = plan.popular;
            const features = getPlanFeatures(plan);

            return (
              <div
                key={planKey}
                data-testid={`plan-card-${planKey}`}
                className={`relative bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  isPopular 
                    ? 'border-terracotta-500 shadow-lg scale-105 z-10' 
                    : 'border-stone-200 hover:border-stone-300'
                } ${isCurrentPlan ? 'ring-2 ring-saffron-400' : ''}`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white text-xs font-bold py-1.5 text-center uppercase tracking-wider">
                    {i18n.language === 'fr' ? 'Le Plus Populaire' : i18n.language === 'ar' ? 'الأكثر شعبية' : 'Most Popular'}
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <div className="absolute top-0 right-4 -mt-0 bg-saffron-400 text-midnight-500 text-xs font-bold px-3 py-1 rounded-b-lg">
                    {i18n.language === 'fr' ? 'Actuel' : 'Current'}
                  </div>
                )}

                <div className={`p-8 ${isPopular ? 'pt-12' : ''}`}>
                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: plan.badge_color + '20' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: plan.badge_color }} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-midnight-500">
                        {i18n.language === 'fr' ? plan.name_fr : i18n.language === 'ar' ? plan.name_ar : plan.name}
                      </h3>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-midnight-500">
                        {plan.price === 0 ? (i18n.language === 'fr' ? 'Gratuit' : 'Free') : plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-stone-500 text-sm">
                          {plan.currency}/{i18n.language === 'fr' ? 'mois' : 'mo'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-stone-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    data-testid={`upgrade-btn-${planKey}`}
                    onClick={() => handleUpgrade(planKey)}
                    disabled={isCurrentPlan || checkingOut}
                    className={`w-full py-6 rounded-xl font-bold text-base transition-all ${
                      isCurrentPlan
                        ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                        : isPopular
                        ? 'bg-gradient-to-r from-terracotta-500 to-terracotta-600 hover:from-terracotta-600 hover:to-terracotta-700 text-white shadow-md hover:shadow-lg'
                        : planKey === 'nomade'
                        ? 'bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-600 hover:to-saffron-700 text-midnight-500 shadow-md hover:shadow-lg'
                        : 'bg-midnight-500 hover:bg-midnight-600 text-white'
                    }`}
                  >
                    {checkingOut && selectedPlan === planKey ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isCurrentPlan ? (
                      i18n.language === 'fr' ? 'Plan Actuel' : 'Current Plan'
                    ) : plan.price === 0 ? (
                      i18n.language === 'fr' ? 'Commencer Gratuitement' : 'Start Free'
                    ) : (
                      <>
                        {i18n.language === 'fr' ? 'Passer à ' : 'Upgrade to '}{plan.name}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-stone-500">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              {i18n.language === 'fr' ? 'Paiement sécurisé' : 'Secure payment'}
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-saffron-500" />
              {i18n.language === 'fr' ? 'Annuler à tout moment' : 'Cancel anytime'}
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              {i18n.language === 'fr' ? 'Garantie satisfait ou remboursé' : '30-day money back'}
            </span>
          </div>
        </div>

        {/* FAQ Link */}
        <div className="mt-8 text-center">
          <a 
            href="/#faq" 
            className="text-terracotta-500 hover:text-terracotta-600 text-sm font-medium underline underline-offset-4"
          >
            {i18n.language === 'fr' ? 'Questions fréquentes sur les abonnements' : 'Frequently asked questions about subscriptions'}
          </a>
        </div>
      </div>
    </div>
  );
}
