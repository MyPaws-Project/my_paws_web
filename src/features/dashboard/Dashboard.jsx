import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getClients } from '../../services/clients/clients.service';

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
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'end',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: '6px 0 0', opacity: 0.8 }}>
            Clientes activos: <b>{activeCount}</b>
          </p>
        </div>

        <button onClick={() => navigate('/clients')}>Ver todos los clientes</button>
      </div>

      <div style={{ padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
        <h3 style={{ margin: 0 }}>Clientes recientes</h3>

        {error ? <p style={{ color: 'crimson', marginTop: 10 }}>{error}</p> : null}

        {recentClients.length === 0 ? (
          <p style={{ marginTop: 12, opacity: 0.75 }}>
            No hay clientes para mostrar.
          </p>
        ) : (
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            {recentClients.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                style={{
                  textAlign: 'left',
                  padding: 12,
                  border: '1px solid #eee',
                  borderRadius: 10,
                  background: 'white',
                  cursor: 'pointer',
                  width: '100%',
                  color: '#111',
                }}
                title="Abrir módulo Clientes"
              >
                <div style={{ fontWeight: 700 }}>
                  {c.fullName || 'Sin nombre'}{' '}
                  <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 12 }}>
                    · {c.active === false ? 'Inactivo' : 'Activo'}
                  </span>
                </div>
                <div style={{ fontSize: 13, opacity: 0.8 }}>
                  {c.email || c.phone || 'Sin contacto'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
