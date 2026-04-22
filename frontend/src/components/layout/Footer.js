import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Mail, Phone, Shield } from 'lucide-react';

const SOCIAL_LINKS = [
  { name: 'Facebook', href: 'https://web.facebook.com/profile.php?id=61580800362931', testId: 'social-facebook', icon: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { name: 'Instagram', href: 'https://instagram.com/marocsphere', testId: 'social-instagram', icon: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { name: 'X', href: 'https://x.com/marocsphere', testId: 'social-x', icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { name: 'LinkedIn', href: 'https://linkedin.com/company/marocsphere', testId: 'social-linkedin', icon: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { name: 'YouTube', href: 'https://youtube.com/@marocsphere', testId: 'social-youtube', icon: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
  { name: 'Substack', href: 'https://marocsphere.substack.com/', testId: 'social-substack', icon: 'M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z' },
];

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer data-testid="footer" className="bg-midnight-500 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h2
              className="text-2xl font-extrabold tracking-tight mb-4"
              style={{
                background: 'linear-gradient(135deg, #E2725B, #EFA293)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              MarocSphere
            </h2>
            <p className="text-midnight-200 text-sm leading-relaxed mb-5">
              {t('footer.description')}
            </p>
            {/* Social Media Links */}
            <div className="flex gap-2.5">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.name}
                  data-testid={s.testId}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-terracotta-500 flex items-center justify-center transition-colors"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d={s.icon} /></svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-saffron-400 mb-4">
              {t('footer.explore')}
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: t('nav.destinations'), href: '/' },
                { label: t('nav.aiConcierge'), href: '/concierge' },
                { label: t('nav.map'), href: '/map' },
                { label: t('nav.myTrips'), href: '/itineraries' },
              ].map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-midnight-200 hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-saffron-400 mb-4">
              {t('footer.safety')}
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-midnight-200">
                <Phone className="w-3.5 h-3.5 text-red-400" /> {t('footer.police')}: 19
              </li>
              <li className="flex items-center gap-2 text-sm text-midnight-200">
                <Phone className="w-3.5 h-3.5 text-red-400" /> {t('footer.ambulance')}: 15
              </li>
              <li>
                <Link to="/safety" className="flex items-center gap-2 text-sm text-midnight-200 hover:text-white transition-colors">
                  <Shield className="w-3.5 h-3.5" /> {t('footer.safetyDashboard')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-saffron-400 mb-4">
              {t('footer.contact')}
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-sm text-midnight-200">
                <MapPin className="w-3.5 h-3.5" /> Marrakech, Morocco
              </li>
              <li className="flex items-center gap-2 text-sm text-midnight-200">
                <Mail className="w-3.5 h-3.5" /> hello@marocsphere.com
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-midnight-400 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-midnight-300 text-xs">
            &copy; {new Date().getFullYear()} MarocSphere. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-midnight-300 hover:text-white text-xs transition-colors">{t('footer.privacy')}</a>
            <a href="#" className="text-midnight-300 hover:text-white text-xs transition-colors">{t('footer.terms')}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
