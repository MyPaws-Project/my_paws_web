import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createHistoryEntry,
  getHistoryEntry,
  updateHistoryEntry,
} from '../../../services/pets/medicalHistory.service';
import './medicalHistoryForm.css';

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
    <div className="mhf-page">
      <button
        className="mhf-back"
        onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
        disabled={loading}
      >
        ← Volver al historial
      </button>

      <h1 className="mhf-title">{isEdit ? 'Editar consulta' : 'Nueva consulta'}</h1>

      {error ? <p className="mhf-error">{error}</p> : null}

      <div className="card mhf-form">
        <form onSubmit={handleSubmit}>
          <div className="mhf-grid">
            <label className="mhf-field">
              <span className="mhf-label">Fecha</span>
              <input
                className="mhf-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                disabled={loading}
              />
            </label>

            <label className="mhf-field">
              <span className="mhf-label">Motivo (obligatorio)</span>
              <input
                className="mhf-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={loading}
              />
            </label>

            <label className="mhf-field mhf-span-2">
              <span className="mhf-label">Diagnóstico</span>
              <input
                className="mhf-input"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="mhf-field mhf-span-2">
              <span className="mhf-label">Tratamiento / Indicaciones</span>
              <textarea
                className="mhf-textarea"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </label>

            <label className="mhf-field mhf-span-2">
              <span className="mhf-label">Notas</span>
              <textarea
                className="mhf-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </label>
          </div>

          <div className="mhf-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Guardando…' : 'Guardar'}
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
