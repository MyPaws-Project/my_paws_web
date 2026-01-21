import { Outlet } from 'react-router-dom';
import { logout } from '../../services/firebase/auth.service';

export default function Layout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 200, background: '#eee', padding: 16 }}>
        <p>Sidebar</p>
      </aside>

      <main style={{ flex: 1, padding: 16 }}>
        <header
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>Topbar</span>
          <button onClick={logout}>Cerrar sesión</button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
