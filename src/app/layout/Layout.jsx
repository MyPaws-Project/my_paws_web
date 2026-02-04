import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { logout } from '../../services/firebase/auth.service';
import './layout.css';

import logo from '../../assets/paws_logo.png';

import { auth, db } from '../../services/firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Layout() {
  const navigate = useNavigate();
  const [clinicName, setClinicName] = useState('Mi clínica');

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

        setClinicName(name || 'Mi clínica');
      } catch (e) {
        console.error('Error loading clinicName:', e);
      }
    };

    loadClinicName();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-card">
          <div className="sidebar-brand">
            <div className="brand-mark">MP</div>
            <div className="brand-text">
              <div className="brand-title">{clinicName}</div>
              <div className="brand-subtitle">Panel</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">🏠</span>
              <span className="label">Inicio</span>
            </NavLink>

            <NavLink
              to="/clients"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">👤</span>
              <span className="label">Clientes</span>
            </NavLink>

            <NavLink
              to="/calendar"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">📅</span>
              <span className="label">Calendario</span>
            </NavLink>
          </nav>

          <div className="sidebar-section">
            <NavLink
              to="/profile"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">🏥</span>
              <span className="label">Mi clínica</span>
            </NavLink>
          </div>

          <div className="sidebar-footer">
            <button className="btn-primary" onClick={logout}>
              <span className="icon">🚪</span>
              <span className="label">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-inner topbar-inner--full">
            <div className="topbar-left">
              <img src={logo} alt="Paws" className="topbar-logo topbar-logo--noframe" />
              <div className="topbar-title">Gestión de clínica veterinaria</div>
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
