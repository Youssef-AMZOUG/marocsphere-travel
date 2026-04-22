import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { List, X, Globe, CaretDown, SignOut, UserCircle, Compass } from '@phosphor-icons/react';

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch { setUser(null); } } else { setUser(null); }
  }, [location]);

  const NAV = [
    { label: t('nav.destinations'), href: '/destinations' },
    { label: t('nav.aiConcierge'), href: '/concierge' },
    { label: t('nav.map'), href: '/map' },
    { label: t('nav.safety'), href: '/safety' },
    { label: t('nav.myTrips'), href: '/itineraries' },
  ];

  const LANGS = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Fran\u00e7ais' },
    { code: 'ar', name: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629' },
  ];

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    setMobileOpen(false); setLangOpen(false); setUserOpen(false);
  }, [location]);

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const isRTL = i18n.language === 'ar';
  const isActive = (href) => location.pathname === href;
  const currentLang = LANGS.find(l => l.code === i18n.language) || LANGS[0];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setUserOpen(false);
    navigate('/');
  };

  return (
    <nav
      data-testid="navbar"
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${scrolled ? 'shadow-sm' : ''}`}
      style={{ backgroundColor: scrolled ? 'rgba(245,243,238,0.97)' : 'rgba(245,243,238,0.92)', backdropFilter: 'blur(12px)', borderColor: '#E7E5DF' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" data-testid="logo-link" className="text-xl font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', serif", color: '#1C1917' }}>
            MarocSphere
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV.map(item => (
              <Link
                key={item.href}
                to={item.href}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  color: isActive(item.href) ? '#4A6984' : '#57534E',
                  backgroundColor: isActive(item.href) ? 'rgba(74,105,132,0.08)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setUserOpen(false); }}
                data-testid="language-select"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/60"
                style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}
              >
                <Globe size={14} />
                <span>{currentLang.code.toUpperCase()}</span>
              </button>
              {langOpen && (
                <div className={`absolute top-full mt-1 ${isRTL ? 'left-0' : 'right-0'} bg-white rounded-xl shadow-lg border py-1 min-w-[130px] z-50`} style={{ borderColor: '#E7E5DF' }}>
                  {LANGS.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { i18n.changeLanguage(lang.code); setLangOpen(false); }}
                      className="w-full px-3 py-2 text-sm text-left hover:bg-[#F5F3EE] transition-colors flex items-center justify-between"
                      style={{ fontFamily: "'Manrope', sans-serif", color: i18n.language === lang.code ? '#4A6984' : '#57534E', fontWeight: i18n.language === lang.code ? 600 : 400 }}
                    >
                      {lang.name}
                      {i18n.language === lang.code && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#4A6984' }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SOS */}
            <Link
              to="/safety"
              data-testid="sos-button"
              className="hidden sm:flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors hover:bg-red-100"
              style={{ backgroundColor: '#FEF2F2', color: '#DC2626', fontFamily: "'Manrope', sans-serif" }}
            >
              {t('nav.sos')}
            </Link>

            {/* User */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => { setUserOpen(!userOpen); setLangOpen(false); }}
                  data-testid="user-menu-toggle"
                  className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ backgroundColor: user.avatar_color || '#4A6984' }}>
                    {(user.name || 'U')[0].toUpperCase()}
                  </div>
                  <span className="hidden sm:block text-[13px] font-medium max-w-[80px] truncate" style={{ fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}>{user.name?.split(' ')[0]}</span>
                </button>
                {userOpen && (
                  <div className={`absolute top-full mt-1 ${isRTL ? 'left-0' : 'right-0'} bg-white rounded-xl shadow-lg border py-1 min-w-[180px] z-50`} style={{ borderColor: '#E7E5DF' }}>
                    <div className="px-3 py-2 border-b" style={{ borderColor: '#E7E5DF' }}>
                      <p className="text-sm font-medium" style={{ fontFamily: "'Manrope', sans-serif", color: '#1C1917' }}>{user.name}</p>
                      <p className="text-[11px]" style={{ color: '#A8A29E' }}>{user.email}</p>
                    </div>
                    <Link to="/dashboard" data-testid="menu-dashboard" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F5F3EE] transition-colors" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>
                      <Compass size={15} /> Dashboard
                    </Link>
                    <Link to="/profile" data-testid="menu-profile" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[#F5F3EE] transition-colors" style={{ fontFamily: "'Manrope', sans-serif", color: '#57534E' }}>
                      <UserCircle size={15} /> {t('nav.profile')}
                    </Link>
                    <div className="border-t mt-1 pt-1" style={{ borderColor: '#E7E5DF' }}>
                      <button onClick={handleLogout} data-testid="logout-btn" className="flex items-center gap-2 px-3 py-2 text-sm w-full hover:bg-red-50 transition-colors" style={{ fontFamily: "'Manrope', sans-serif", color: '#DC2626' }}>
                        <SignOut size={15} /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth/signin"
                data-testid="signin-button"
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-white transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: '#4A6984', fontFamily: "'Manrope', sans-serif" }}
              >
                {t('nav.signIn')}
              </Link>
            )}

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-1.5 rounded-lg hover:bg-white/60 transition-colors"
              data-testid="mobile-menu-toggle"
              style={{ color: '#57534E' }}
            >
              {mobileOpen ? <X size={20} /> : <List size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 border-t pt-3" style={{ borderColor: '#E7E5DF' }}>
            {user && (
              <Link to="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium mb-1" style={{ fontFamily: "'Manrope', sans-serif", backgroundColor: 'rgba(74,105,132,0.08)', color: '#4A6984' }}>
                Dashboard
              </Link>
            )}
            {NAV.map(item => (
              <Link
                key={item.href}
                to={item.href}
                data-testid={`mobile-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  fontFamily: "'Manrope', sans-serif",
                  color: isActive(item.href) ? '#4A6984' : '#57534E',
                  backgroundColor: isActive(item.href) ? 'rgba(74,105,132,0.08)' : 'transparent',
                }}
              >
                {item.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-3 mt-3 pt-3 border-t" style={{ borderColor: '#E7E5DF' }}>
              <Link to="/safety" className="px-3 py-1.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}>
                {t('nav.sos')}
              </Link>
              {user && (
                <button onClick={handleLogout} className="px-3 py-1.5 text-xs font-semibold" style={{ color: '#DC2626' }}>
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
