import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n';
import { logout } from '../../services/firebase/auth.service';
import './layout.css';

import logo from '../../assets/paws_logo.png';

import { auth, db } from '../../services/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Layout() {
  const { t, i18n } = useTranslation();
  const [clinicName, setClinicName] = useState(t('layout.myClinicFallback'));

  useEffect(() => {
    let alive = true;

    const loadClinicName = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const name = snap.data()?.clinicName;
        if (!alive) return;

        setClinicName(name || t('layout.myClinicFallback'));
      } catch (e) {
        console.error('Error loading clinicName:', e);
      }
    };

    loadClinicName();
    return () => {
      alive = false;
    };
  }, [t]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-card">
          <div className="sidebar-brand">
            <div className="brand-mark">MP</div>
            <div className="brand-text">
              <div className="brand-title">{clinicName}</div>
              <div className="brand-subtitle">{t('layout.panel')}</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={t('layout.home')}
            >
              <span className="icon">🏠</span>
              <span className="label">{t('layout.home')}</span>
            </NavLink>

            <NavLink
              to="/clients"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={t('layout.clients')}
            >
              <span className="icon">👤</span>
              <span className="label">{t('layout.clients')}</span>
            </NavLink>

            <NavLink
              to="/calendar"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={t('layout.calendar')}
            >
              <span className="icon">📅</span>
              <span className="label">{t('layout.calendar')}</span>
            </NavLink>
          </nav>

          <div className="sidebar-section">
            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={t('layout.clinic')}
            >
              <span className="icon">🏥</span>
              <span className="label">{t('layout.clinic')}</span>
            </NavLink>
          </div>

          <div className="sidebar-footer">
            <div className="language-switch" title={t('layout.language')}>
              <span className="language-label">{t('layout.language')}</span>

              <button
                type="button"
                className={`lang-btn ${i18n.language === 'es' ? 'active' : ''}`}
                onClick={() => setLanguage('es')}
                aria-label="Español"
              >
                ES
              </button>

              <button
                type="button"
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                aria-label="English"
              >
                EN
              </button>
            </div>

            <button className="btn-primary" onClick={logout} title={t('layout.logout')}>
              <span className="icon">🚪</span>
              <span className="label">{t('layout.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-inner topbar-inner--full">
            <div className="topbar-left">
              <img src={logo} alt="Paws" className="topbar-logo topbar-logo--noframe" />
              <div className="topbar-title">{t('layout.appTitle')}</div>
            </div>
          </div>
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
