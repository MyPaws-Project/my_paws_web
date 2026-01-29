import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  listHistoryEntries,
  deleteHistoryEntry,
} from '../../../services/pets/medicalHistory.service';

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
      setItems(data);
    } catch (e) {
      setError('No se pudo cargar el historial médico');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && petId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, petId]);

  const handleDelete = async (entryId) => {
    const ok = window.confirm(
      '¿Eliminar esta consulta? Esta acción no se puede deshacer.'
    );
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

  if (loading) return <div style={{ padding: 16 }}>Cargando historial…</div>;

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button
          onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
          disabled={saving}
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 820 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ margin: 0 }}>Historial médico</h1>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() =>
              navigate(`/clients/${clientId}/pets/${petId}/history/new`)
            }
            disabled={saving}
          >
            + Agregar consulta
          </button>

          <button
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
            disabled={saving}
          >
            Volver
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p style={{ marginTop: 12 }}>Todavía no hay consultas registradas.</p>
      ) : (
        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {items.map((x) => (
            <div
              key={x.id}
              style={{
                padding: 12,
                border: '1px solid #ddd',
                borderRadius: 12,
                background: '#fff',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div>
                  <b>{x.date || 'Sin fecha'}</b>
                  <div style={{ opacity: 0.85 }}>
                    {x.reason || 'Sin motivo'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() =>
                      navigate(
                        `/clients/${clientId}/pets/${petId}/history/${x.id}/edit`
                      )
                    }
                    disabled={saving}
                  >
                    Editar
                  </button>

                  <button onClick={() => handleDelete(x.id)} disabled={saving}>
                    Eliminar
                  </button>
                </div>
              </div>

              {x.diagnosis ? (
                <p style={{ margin: '8px 0 0' }}>
                  <b>Diagnóstico:</b> {x.diagnosis}
                </p>
              ) : null}

              {x.treatment ? (
                <p style={{ margin: '6px 0 0' }}>
                  <b>Tratamiento:</b> {x.treatment}
                </p>
              ) : null}

              {x.notes ? (
                <p style={{ margin: '6px 0 0', opacity: 0.9 }}>
                  <b>Notas:</b> {x.notes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
