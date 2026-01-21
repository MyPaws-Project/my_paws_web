import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPetById, deletePet } from '../../services/pets/pets.service';

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

  if (loading) return <div style={{ padding: 16 }}>Cargando…</div>;

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button onClick={() => navigate(`/clients/${clientId}`)} disabled={saving}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <button onClick={() => navigate(`/clients/${clientId}`)} disabled={saving}>
        ← Volver al cliente
      </button>

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ margin: 0 }}>{pet.name || 'Sin nombre'}</h1>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/edit`)}
            disabled={saving}
          >
            Editar
          </button>

          <button onClick={handleDelete} disabled={saving}>
            Eliminar
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          <b>Especie:</b> {pet.species || '—'}
        </div>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          <b>Raza:</b> {pet.breed || '—'}
        </div>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          <b>Sexo:</b> {pet.sex || '—'}
        </div>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          <b>Fecha de nacimiento:</b> {pet.birthDate || '—'}
        </div>

        {pet.notes ? (
          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <b>Notas:</b> {pet.notes}
          </div>
        ) : null}
      </div>
    </div>
  );
}
