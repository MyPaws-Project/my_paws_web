import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getClients,
  createClient,
  updateClient,
  disableClient,
} from '../../services/clients/clients.service';
import ClientForm from './ClientForm';

export default function Clients() {
  const navigate = useNavigate();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showInactive, setShowInactive] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getClients();
      setClients(data);
    } catch (err) {
      setError(err?.message || 'Error cargando clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    setError('');
    try {
      await createClient(payload);
      setShowForm(false);
      await loadClients();
    } catch (err) {
      console.error('ERROR creando cliente:', err);
      setError(err?.message || 'Error creando cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editingClient?.id) return;

    setSaving(true);
    setError('');
    try {
      await updateClient(editingClient.id, payload);
      setEditingClient(null);
      await loadClients();
    } catch (err) {
      console.error('ERROR editando cliente:', err);
      setError(err?.message || 'Error editando cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (clientId) => {
    const ok = window.confirm('¿Seguro que querés desactivar este cliente?');
    if (!ok) return;

    setSaving(true);
    setError('');
    try {
      await disableClient(clientId);
      await loadClients();
    } catch (err) {
      console.error('ERROR desactivando cliente:', err);
      setError(err?.message || 'Error desactivando cliente');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (clientId) => {
    const ok = window.confirm('¿Seguro que querés reactivar este cliente?');
    if (!ok) return;

    setSaving(true);
    setError('');
    try {
      await updateClient(clientId, { active: true });
      await loadClients();
    } catch (err) {
      console.error('ERROR reactivando cliente:', err);
      setError(err?.message || 'Error reactivando cliente');
    } finally {
      setSaving(false);
    }
  };

  const visibleClients = clients.filter((c) =>
    showInactive ? c.active === false : c.active !== false
  );

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0 }}>Clientes</h1>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowInactive((v) => !v)} disabled={saving}>
            {showInactive ? 'Ver activos' : 'Ver inactivos'}
          </button>

          <button
            onClick={() => {
              setEditingClient(null);
              setShowForm((v) => !v);
            }}
            disabled={saving}
          >
            {showForm ? 'Cancelar' : 'Nuevo cliente'}
          </button>
        </div>
      </div>

      {showForm && !editingClient && (
        <div style={{ marginTop: 16 }}>
          <ClientForm onSubmit={handleCreate} loading={saving} />
        </div>
      )}

      {editingClient && (
        <div style={{ marginTop: 16 }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Editando:</strong> {editingClient.fullName || '(Sin nombre)'}
          </div>

          <ClientForm
            onSubmit={handleUpdate}
            loading={saving}
            initialValues={editingClient}
          />

          <div style={{ marginTop: 8 }}>
            <button onClick={() => setEditingClient(null)} disabled={saving}>
              Cancelar edición
            </button>
          </div>
        </div>
      )}

      {loading && <p style={{ marginTop: 16 }}>Cargando…</p>}

      {error && <p style={{ marginTop: 16, color: 'crimson' }}>{error}</p>}

      {!loading && !error && (
        <ul style={{ marginTop: 16 }}>
          {visibleClients.length === 0 && (
            <li>
              {showInactive
                ? 'No hay clientes inactivos.'
                : 'No hay clientes activos.'}
            </li>
          )}

          {visibleClients.map((c) => (
            <li
              key={c.id}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            >
              <span style={{ flex: 1 }}>
                {/* Mantiene la misma apariencia, pero ahora es clickeable */}
                <button
                  type="button"
                  onClick={() => navigate(`/clients/${c.id}`)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    font: 'inherit',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                  title="Ver información del cliente"
                >
                  <strong>{c.fullName || '(Sin nombre)'}</strong>
                </button>

                <div style={{ fontSize: 14, opacity: 0.8 }}>
                  {c.phone || 'Sin teléfono'}
                  {c.email ? ` • ${c.email}` : ''}
                </div>
              </span>

              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingClient(c);
                }}
                disabled={saving}
              >
                Editar
              </button>

              {showInactive ? (
                <button onClick={() => handleReactivate(c.id)} disabled={saving}>
                  Reactivar
                </button>
              ) : (
                <button
                  onClick={() => handleDisable(c.id)}
                  disabled={saving || c.active === false}
                  title={
                    c.active === false ? 'Cliente desactivado' : 'Desactivar cliente'
                  }
                >
                  {c.active === false ? 'Desactivado' : 'Desactivar'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
