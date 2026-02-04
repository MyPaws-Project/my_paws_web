import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getClients,
  createClient,
  updateClient,
  disableClient,
} from '../../services/clients/clients.service';
import ClientForm from './ClientForm';
import './clients.css';

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

  const visibleClients = useMemo(() => {
    return clients.filter((c) => (showInactive ? c.active === false : c.active !== false));
  }, [clients, showInactive]);

  const openCreate = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const startEdit = (c) => {
    setShowForm(false);
    setEditingClient(c);
  };

  return (
    <div className="clients-page">
      <header className="clients-header">
        <div className="clients-titlewrap">
          <h1 className="clients-title">Clientes</h1>
          <p className="clients-subtitle">
            {showInactive ? 'Listado de clientes inactivos.' : 'Listado de clientes activos.'}
          </p>
        </div>

        <div className="clients-actions">
          <button
            className="btn-secondary"
            onClick={() => setShowInactive((v) => !v)}
            disabled={saving}
          >
            {showInactive ? 'Ver activos' : 'Ver inactivos'}
          </button>

          <button className="btn-primary" onClick={openCreate} disabled={saving}>
            Nuevo cliente
          </button>
        </div>
      </header>

      {(showForm && !editingClient) && (
        <section className="card clients-card">
          <div className="card-header">
            <h3 className="card-title">Nuevo cliente</h3>
            <button className="btn-secondary" onClick={cancelForm} disabled={saving}>
              Cancelar
            </button>
          </div>

          <ClientForm onSubmit={handleCreate} loading={saving} />
        </section>
      )}

      {editingClient && (
        <section className="card clients-card">
          <div className="card-header">
            <h3 className="card-title">
              Editando: {editingClient.fullName || '(Sin nombre)'}
            </h3>
            <button className="btn-secondary" onClick={cancelForm} disabled={saving}>
              Cancelar
            </button>
          </div>

          <ClientForm
            onSubmit={handleUpdate}
            loading={saving}
            initialValues={editingClient}
          />
        </section>
      )}

      {loading && <p className="clients-status">Cargando…</p>}
      {error && <p className="clients-error">{error}</p>}

      {!loading && !error && (
        <section className="card clients-card">
          <div className="card-header">
            <h3 className="card-title">
              {showInactive ? 'Clientes inactivos' : 'Clientes activos'}
            </h3>
            <span className="clients-count">{visibleClients.length}</span>
          </div>

          {visibleClients.length === 0 ? (
            <p className="clients-empty">
              {showInactive ? 'No hay clientes inactivos.' : 'No hay clientes activos.'}
            </p>
          ) : (
            <div className="clients-list">
              {visibleClients.map((c) => (
                <div key={c.id} className="client-row">
                  <button
                    type="button"
                    className="client-main"
                    onClick={() => navigate(`/clients/${c.id}`)}
                    title="Ver información del cliente"
                  >
                    <div className="client-name">
                      {c.fullName || '(Sin nombre)'}
                      <span className={`pill ${c.active === false ? 'pill-off' : 'pill-on'}`}>
                        {c.active === false ? 'Inactivo' : 'Activo'}
                      </span>
                    </div>

                    <div className="client-meta">
                      {c.phone || 'Sin teléfono'}
                      {c.email ? ` • ${c.email}` : ''}
                    </div>
                  </button>

                  <div className="client-actions">
                    <button className="btn-secondary" onClick={() => startEdit(c)} disabled={saving}>
                      Editar
                    </button>

                    {showInactive ? (
                      <button className="btn-primary" onClick={() => handleReactivate(c.id)} disabled={saving}>
                        Reactivar
                      </button>
                    ) : (
                      <button
                        className="btn-danger"
                        onClick={() => handleDisable(c.id)}
                        disabled={saving || c.active === false}
                        title={c.active === false ? 'Cliente desactivado' : 'Desactivar cliente'}
                      >
                        Desactivar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
