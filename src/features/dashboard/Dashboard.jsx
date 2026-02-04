import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients } from '../../services/clients/clients.service';
import AppointmentsList from '../appointments/AppointmentsList';
import './dashboard.css';

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts?.toMillis === 'function') return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'number') return ts;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [activeCount, setActiveCount] = useState('—');
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError('');
        const data = await getClients();
        if (!alive) return;

        setClients(data);

        const count = data.filter((c) => c.active !== false).length;
        setActiveCount(count);
      } catch (e) {
        if (!alive) return;
        setError('No se pudieron cargar los clientes');
        setActiveCount('—');
        setClients([]);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const recentClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      const aTime = toMillis(a.updatedAt) || toMillis(a.createdAt);
      const bTime = toMillis(b.updatedAt) || toMillis(b.createdAt);
      return bTime - aTime;
    });

    return sorted.filter((c) => c.active !== false).slice(0, 5);
  }, [clients]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Inicio</h1>
          <p className="dashboard-subtitle">
            Clientes activos: <b>{activeCount}</b>
          </p>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Clientes recientes</h3>
            <button className="btn-primary" onClick={() => navigate('/clients')}>
              Ver todos los clientes
            </button>
          </div>

          {error && <p style={{ color: 'crimson' }}>{error}</p>}

          {recentClients.length === 0 ? (
            <p className="dashboard-subtitle">No hay clientes para mostrar.</p>
          ) : (
            <div className="client-list">
              {recentClients.map((c) => (
                <button
                  key={c.id}
                  className="client-item"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <div className="client-name">
                    {c.fullName || 'Sin nombre'} · {c.active === false ? 'Inactivo' : 'Activo'}
                  </div>
                  <div className="client-meta">{c.email || c.phone || 'Sin contacto'}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Consultas de hoy</h3>
            <button className="btn-primary" onClick={() => navigate('/calendar')}>
              Ver calendario
            </button>
          </div>

          <AppointmentsList />
        </div>
      </div>
    </div>
  );
}
