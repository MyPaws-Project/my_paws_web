import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  createHistoryEntry,
  getHistoryEntry,
  updateHistoryEntry,
} from '../../../services/pets/medicalHistory.service';

import { db, storage, auth } from '../../../services/firebase/firebase';

import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previews = useMemo(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    return urls;
  }, [files]);

  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

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

        setExistingPhotos(Array.isArray(data.photos) ? data.photos : []);
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

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setFiles(picked);
  };

  const removePicked = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadFilesToEntry = async (finalEntryId, selectedFiles) => {
    if (!selectedFiles?.length) return;

    const user = auth?.currentUser;
    if (!user) throw new Error('Usuario no autenticado');

    const entryRef = doc(db, 'clients', clientId, 'pets', petId, 'medicalHistory', finalEntryId);

    for (const file of selectedFiles) {
      const safeName = (file.name || 'photo').replace(/\s+/g, '_');
      const path = `clinics/${user.uid}/clients/${clientId}/pets/${petId}/history/${finalEntryId}/${Date.now()}_${safeName}`;

      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(entryRef, {
        photos: arrayUnion({
          url,
          path,
          createdAt: serverTimestamp(),
        }),
        updatedAt: serverTimestamp(),
      });
    }
  };

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

      let finalEntryId = entryId;

      if (isEdit) {
        await updateHistoryEntry(clientId, petId, entryId, payload);
      } else {
        finalEntryId = await createHistoryEntry(clientId, petId, payload);
      }

      await uploadFilesToEntry(finalEntryId, files);

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

            <div className="mhf-field mhf-span-2">
              <div className="mhf-label">Fotos (opcional)</div>

              <input
                className="mhf-input"
                type="file"
                accept="image/*"
                multiple
                onChange={pickFiles}
                disabled={loading}
              />

              {previews.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 10 }}>
                  {previews.map((src, idx) => (
                    <div key={src} style={{ position: 'relative' }}>
                      <img
                        src={src}
                        alt={`preview-${idx}`}
                        style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 10 }}
                      />
                      <button
                        type="button"
                        onClick={() => removePicked(idx)}
                        disabled={loading}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          borderRadius: 999,
                          padding: '4px 8px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {existingPhotos?.length ? (
                <div style={{ marginTop: 12 }}>
                  <div className="mhf-label">Fotos ya adjuntas</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginTop: 10 }}>
                    {existingPhotos.map((p, i) => (
                      <a key={p.url || i} href={p.url} target="_blank" rel="noreferrer">
                        <img
                          src={p.url}
                          alt={`photo-${i}`}
                          style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 10 }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
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
