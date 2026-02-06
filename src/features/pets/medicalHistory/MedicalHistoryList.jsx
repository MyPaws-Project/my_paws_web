import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { listHistoryEntries, deleteHistoryEntry } from '../../../services/pets/medicalHistory.service';
import './medicalHistoryList.css';

export default function MedicalHistoryList() {
  const { id: clientId, petId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      setLoading(true);
      const data = await listHistoryEntries(clientId, petId);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('No se pudo cargar el historial médico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && petId) load();
  }, [clientId, petId]);

  const handleDelete = async (entryId) => {
    const ok = window.confirm('¿Eliminar esta consulta? Esta acción no se puede deshacer.');
    if (!ok) return;

    try {
      setSaving(true);
      await deleteHistoryEntry(clientId, petId, entryId);
      await load();
    } catch (e) {
      setError('No se pudo eliminar la consulta');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mh-status">Cargando historial…</div>;

  if (error) {
    return (
      <div className="mh-page">
        <div className="mh-status">
          <p className="mh-error">{error}</p>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
            disabled={saving}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mh-page">
      <header className="mh-header">
        <div className="mh-headings">
          <h1 className="mh-title">Historial médico</h1>
        </div>

        <div className="mh-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history/new`)}
            disabled={saving}
          >
            + Agregar consulta
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
            disabled={saving}
          >
            Volver
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="card mh-empty">Todavía no hay consultas registradas.</div>
      ) : (
        <div className="mh-list">
          {items.map((x) => {
            const photoCount = Array.isArray(x.photos) ? x.photos.length : 0;

            return (
              <div key={x.id} className="card mh-item">
                <div className="mh-item-top">
                  <div className="mh-main">
                    <div className="mh-date">{x.date || 'Sin fecha'}</div>

                    <div className="mh-reason">
                      {x.reason || 'Sin motivo'}
                      {photoCount > 0 ? <span className="mh-badge">📷 {photoCount}</span> : null}
                    </div>
                  </div>

                  <div className="mh-item-actions">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        navigate(`/clients/${clientId}/pets/${petId}/history/${x.id}/edit`)
                      }
                      disabled={saving}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(x.id)}
                      disabled={saving}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className="mh-details">
                  {x.diagnosis ? (
                    <p className="mh-line">
                      <b>Diagnóstico:</b> {x.diagnosis}
                    </p>
                  ) : null}

                  {x.treatment ? (
                    <p className="mh-line">
                      <b>Tratamiento:</b> {x.treatment}
                    </p>
                  ) : null}

                  {x.notes ? (
                    <p className="mh-line mh-notes">
                      <b>Notas:</b> {x.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
