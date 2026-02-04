import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPetById, deletePet } from '../../services/pets/pets.service';
import './petDetails.css';

export default function PetDetails() {
  const { id: clientId, petId } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError('');
        setLoading(true);

        const data = await getPetById(clientId, petId);

        if (!alive) return;

        if (!data) {
          setPet(null);
          setError('Mascota no encontrada');
          return;
        }

        setPet(data);
      } catch (e) {
        if (!alive) return;
        setError('No se pudo cargar la mascota');
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (clientId && petId) load();

    return () => {
      alive = false;
    };
  }, [clientId, petId]);

  const handleDelete = async () => {
    const ok = window.confirm(
      '¿Seguro que querés eliminar esta mascota? Esta acción no se puede deshacer.'
    );
    if (!ok) return;

    try {
      setError('');
      setSaving(true);

      await deletePet(clientId, petId);

      navigate(`/clients/${clientId}`);
    } catch (e) {
      setError('No se pudo eliminar la mascota');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pd-status">Cargando…</div>;

  if (error) {
    return (
      <div className="pd-page">
        <div className="pd-status">
          <p className="pd-error">{error}</p>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}`)}
            disabled={saving}
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <button
        className="pd-back"
        onClick={() => navigate(`/clients/${clientId}`)}
        disabled={saving}
      >
        ← Volver al cliente
      </button>

      <header className="pd-header">
        <h1 className="pd-title">{pet?.name || 'Sin nombre'}</h1>

        <div className="pd-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
            disabled={saving}
          >
            Historial médico
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/edit`)}
            disabled={saving}
          >
            Editar
          </button>

          <button className="btn-danger" onClick={handleDelete} disabled={saving}>
            Eliminar
          </button>
        </div>
      </header>

      <section className="card pd-card">
        <div className="pd-grid">
          <div className="pd-item">
            <div className="pd-label">Especie</div>
            <div className="pd-value">{pet?.species || '—'}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">Raza</div>
            <div className="pd-value">{pet?.breed || '—'}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">Sexo</div>
            <div className="pd-value">{pet?.sex || '—'}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">Fecha de nacimiento</div>
            <div className="pd-value">{pet?.birthDate || '—'}</div>
          </div>

          {pet?.notes ? (
            <div className="pd-item pd-span-2">
              <div className="pd-label">Notas</div>
              <div className="pd-value">{pet.notes}</div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
