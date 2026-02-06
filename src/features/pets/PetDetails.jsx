import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPetById, disablePet, reactivatePet } from '../../services/pets/pets.service';
import './petDetails.css';

const sexLabel = (sex) => {
  if (sex === 'male') return 'Macho';
  if (sex === 'female') return 'Hembra';
  return '—';
};

const formatList = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  return arr.join(', ');
};

export default function PetDetails() {
  const { id: clientId, petId } = useParams();
  const navigate = useNavigate();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isInactive = useMemo(() => pet?.active === false, [pet]);

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

  const handleDisable = async () => {
    const ok = window.confirm('¿Seguro que querés desactivar esta mascota? Podés reactivarla luego.');
    if (!ok) return;

    try {
      setError('');
      setSaving(true);

      await disablePet(clientId, petId);

      setPet((prev) => (prev ? { ...prev, active: false } : prev));
      navigate(`/clients/${clientId}`);
    } catch (e) {
      setError('No se pudo desactivar la mascota');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async () => {
    const ok = window.confirm('¿Reactivar esta mascota?');
    if (!ok) return;

    try {
      setError('');
      setSaving(true);

      await reactivatePet(clientId, petId);

      setPet((prev) => (prev ? { ...prev, active: true } : prev));
    } catch (e) {
      setError('No se pudo reactivar la mascota');
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
        <div>
          <h1 className="pd-title">{pet?.name || 'Sin nombre'}</h1>
          {isInactive ? <p className="pd-badge">Inactiva</p> : null}
        </div>

        <div className="pd-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
            disabled={saving || isInactive}
            title={isInactive ? 'Reactivá la mascota para gestionar su historial' : undefined}
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

          {isInactive ? (
            <button className="btn-secondary" onClick={handleReactivate} disabled={saving}>
              Reactivar
            </button>
          ) : (
            <button className="btn-danger" onClick={handleDisable} disabled={saving}>
              Desactivar
            </button>
          )}
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
            <div className="pd-value">{sexLabel(pet?.sex)}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">Fecha de nacimiento</div>
            <div className="pd-value">{pet?.birthDate || '—'}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">Peso actual</div>
            <div className="pd-value">
              {typeof pet?.weightKg === 'number' ? `${pet.weightKg} kg` : '—'}
            </div>
          </div>


          <div className="pd-item pd-span-2">
            <div className="pd-label">Alergias</div>
            <div className="pd-value">{formatList(pet?.allergies)}</div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">Enfermedades crónicas</div>
            <div className="pd-value">{formatList(pet?.chronicIllnesses)}</div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">Medicación actual</div>
            <div className="pd-value">{formatList(pet?.currentMedication)}</div>
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
