import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createHistoryEntry,
  getHistoryEntry,
  updateHistoryEntry,
} from '../../../services/pets/medicalHistory.service';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function MedicalHistoryForm() {
  const { id: clientId, petId, entryId } = useParams();
  const isEdit = Boolean(entryId);
  const navigate = useNavigate();

  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;

    let alive = true;

    const load = async () => {
      setError('');
      setLoading(true);
      try {
        const data = await getHistoryEntry(clientId, petId, entryId);
        if (!alive) return;

        if (!data) {
          setError('No se encontró la entrada.');
          return;
        }

        setDate(data.date || todayISO());
        setReason(data.reason || '');
        setDiagnosis(data.diagnosis || '');
        setTreatment(data.treatment || '');
        setNotes(data.notes || '');
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Error cargando entrada');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [clientId, petId, entryId, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        date: date.trim(),
        reason: reason.trim(),
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        notes: notes.trim(),
      };

      if (!payload.date) throw new Error('La fecha es obligatoria');
      if (!payload.reason) throw new Error('El motivo es obligatorio');

      if (isEdit) {
        await updateHistoryEntry(clientId, petId, entryId, payload);
      } else {
        await createHistoryEntry(clientId, petId, payload);
      }

      navigate(`/clients/${clientId}/pets/${petId}/history`);
    } catch (e2) {
      setError(e2?.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 640 }}>
      <button
        onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
        disabled={loading}
      >
        ← Volver al historial
      </button>

      <h2 style={{ marginTop: 12 }}>
        {isEdit ? 'Editar consulta' : 'Nueva consulta'}
      </h2>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Fecha
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Motivo (obligatorio)
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Diagnóstico
          <input
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Tratamiento / Indicaciones
          <textarea
            value={treatment}
            onChange={(e) => setTreatment(e.target.value)}
            rows={3}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </label>

        {error ? <p style={{ color: 'crimson', margin: 0 }}>{error}</p> : null}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading}>
            {loading ? 'Guardando…' : 'Guardar'}
          </button>

          <button
            type="button"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
