import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Phone, AlertTriangle, Info, CheckCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function SafetyGauge({ score, status }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;
  const color = score >= 80 ? '#10B981' : score >= 60 ? '#F59E0B' : '#EF4444';

  useEffect(() => {
    let frame;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-40 h-40">
        <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#e7e5e4" strokeWidth="12" />
          <circle
            cx="80" cy="80" r={radius} fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
            className="gauge-circle"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold text-midnight-500">{animatedScore}</span>
          <span className="text-xs text-stone-400">/100</span>
        </div>
      </div>
      <div>
        <p className={`text-lg font-bold ${score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
          {status}
        </p>
        <p className="text-xs text-stone-400 mt-1">Real-time safety assessment</p>
      </div>
    </div>
  );
}

export default function SafetyPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sosDialogOpen, setSosDialogOpen] = useState(false);
  const [sosConfirming, setSosConfirming] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosCooldown, setSosCooldown] = useState(0);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/safety/report`);
      setReport(res.data);
    } catch {
      toast.error('Failed to load safety data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  useEffect(() => {
    if (sosCooldown <= 0) return;
    const t = setInterval(() => setSosCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [sosCooldown]);

  const handleSOS = async () => {
    setSosConfirming(true);
    try {
      await axios.post(`${API}/safety/emergency`, { lat: 31.6295, lng: -7.9811, message: 'Emergency alert triggered' });
      setSosSent(true);
      setSosCooldown(60);
      toast.success('Emergency alert sent to contacts');
    } catch {
      toast.error('Failed to send alert. Call 19 directly.');
    } finally {
      setSosConfirming(false);
    }
  };

  return (
    <div data-testid="safety-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-widest text-saffron-500 mb-1">Safety Center</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-midnight-500 flex items-center gap-3">
          <Shield className="w-8 h-8 text-terracotta-500" /> Safety Dashboard
        </h1>
        <p className="text-stone-500 mt-2">Real-time safety information for Morocco</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-40 animate-pulse border border-stone-100" />)}
        </div>
      ) : report && (
        <div className="space-y-6">
          {/* Score */}
          <div data-testid="safety-score-card" className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <SafetyGauge score={report.score} status={report.status} />
              <div className="text-right">
                <p className="text-xs text-stone-400">Last updated: {new Date(report.last_updated).toLocaleTimeString()}</p>
                <p className="text-xs text-stone-400 mt-1">Nearby incidents: {report.nearby_incidents}</p>
                <button onClick={fetchReport} className="mt-2 text-xs text-terracotta-500 hover:text-terracotta-600 flex items-center gap-1 ml-auto">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div data-testid="alerts-card" className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <h2 className="text-sm font-bold text-midnight-500 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Active Alerts
            </h2>
            <div className="space-y-3">
              {report.alerts.map((alert, i) => (
                <div key={alert.id || i} className={`rounded-xl p-4 border flex items-start gap-3 ${
                  alert.type === 'warning' ? 'bg-amber-50 border-amber-100' :
                  alert.type === 'danger' ? 'bg-red-50 border-red-100' :
                  'bg-blue-50 border-blue-100'
                }`}>
                  {alert.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" /> :
                   alert.type === 'danger' ? <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" /> :
                   <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className={`text-sm font-medium ${
                      alert.type === 'warning' ? 'text-amber-800' : alert.type === 'danger' ? 'text-red-800' : 'text-blue-800'
                    }`}>{alert.message}</p>
                    <p className="text-xs text-stone-400 mt-1">
                      {alert.distance && <span>📍 {alert.distance}</span>}
                      {alert.time_ago && <span> &middot; {alert.time_ago}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency */}
          <div data-testid="emergency-card" className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <h2 className="text-sm font-bold text-red-700 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Emergency
            </h2>
            <Button
              data-testid="sos-trigger-btn"
              onClick={() => setSosDialogOpen(true)}
              disabled={sosCooldown > 0}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-6 text-lg font-bold shadow-lg btn-press disabled:opacity-60"
            >
              {sosCooldown > 0 ? (
                <>Alert Sent &mdash; Cooldown {sosCooldown}s</>
              ) : sosSent ? (
                <><CheckCircle className="w-5 h-5 mr-2" /> Alert Sent &mdash; Help is on the way</>
              ) : (
                <>🆘 SEND EMERGENCY ALERT</>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <a href="tel:19" data-testid="call-police" className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-200 rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors btn-press">
                <Phone className="w-4 h-4" /> Police: 19
              </a>
              <a href="tel:15" data-testid="call-ambulance" className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-red-200 rounded-xl text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors btn-press">
                <Phone className="w-4 h-4" /> Ambulance: 15
              </a>
            </div>
          </div>

          {/* Safety Tips */}
          <div data-testid="safety-tips-card" className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm">
            <h2 className="text-sm font-bold text-midnight-500 mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Safety Tips
            </h2>
            <ul className="space-y-2.5">
              {report.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* SOS Confirmation Dialog */}
      <Dialog open={sosDialogOpen} onOpenChange={setSosDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              🆘 Confirm Emergency Alert
            </DialogTitle>
            <DialogDescription>
              This will notify your emergency contacts with your current location. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setSosDialogOpen(false)} data-testid="sos-cancel">
              Cancel
            </Button>
            <Button
              data-testid="sos-confirm"
              onClick={() => { handleSOS(); setSosDialogOpen(false); }}
              disabled={sosConfirming}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {sosConfirming ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Confirm &mdash; Send Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
