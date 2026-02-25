import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { createHistoryEntry, getHistoryEntry, updateHistoryEntry } from "../../../services/pets/medicalHistory.service";

import { db, storage, auth } from "../../../services/firebase/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import "./medicalHistoryForm.css";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function MedicalHistoryForm() {
  const { id: clientId, petId, entryId } = useParams();
  const isEdit = Boolean(entryId);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const [date, setDate] = useState(todayISO());
  const [reason, setReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  const [existingPhotos, setExistingPhotos] = useState([]);
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState("");

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  useEffect(() => {
    if (!isEdit) return;

    let alive = true;

    const load = async () => {
      setErrorKey("");
      setLoading(true);

      try {
        const data = await getHistoryEntry(clientId, petId, entryId);
        if (!alive) return;

        if (!data) {
          setErrorKey("medicalHistory.form.errors.notFound");
          return;
        }

        setDate(data.date || todayISO());
        setReason(data.reason || "");
        setDiagnosis(data.diagnosis || "");
        setTreatment(data.treatment || "");
        setNotes(data.notes || "");
        setExistingPhotos(Array.isArray(data.photos) ? data.photos : []);
      } catch {
        if (!alive) return;
        setErrorKey("medicalHistory.form.errors.load");
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [clientId, petId, entryId, isEdit]);

  const goBack = () => {
    navigate(`/clients/${clientId}/pets/${petId}/history`);
  };

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
    if (!user) {
      setErrorKey("medicalHistory.form.errors.needAuth");
      return;
    }

    const entryRef = doc(db, "clients", clientId, "pets", petId, "medicalHistory", finalEntryId);

    for (const file of selectedFiles) {
      const safeName = (file.name || "photo").replace(/\s+/g, "_");
      const path = `clinics/${user.uid}/clients/${clientId}/pets/${petId}/history/${finalEntryId}/${Date.now()}_${safeName}`;

      const storageRef = ref(storage, path);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await updateDoc(entryRef, {
        photos: arrayUnion({
          url,
          path,
          createdAt: serverTimestamp()
        }),
        updatedAt: serverTimestamp()
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorKey("");
    setLoading(true);

    try {
      const payload = {
        date: date.trim(),
        reason: reason.trim(),
        diagnosis: diagnosis.trim(),
        treatment: treatment.trim(),
        notes: notes.trim()
      };

      if (!payload.date) {
        setErrorKey("medicalHistory.form.errors.dateRequired");
        return;
      }

      if (!payload.reason) {
        setErrorKey("medicalHistory.form.errors.reasonRequired");
        return;
      }

      let finalEntryId = entryId;

      if (isEdit) {
        await updateHistoryEntry(clientId, petId, entryId, payload);
      } else {
        finalEntryId = await createHistoryEntry(clientId, petId, payload);
      }

      await uploadFilesToEntry(finalEntryId, files);

      navigate(`/clients/${clientId}/pets/${petId}/history`);
    } catch {
      setErrorKey("medicalHistory.form.errors.save");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mhf-page">
      <div className="mhf-header">
        <button className="mhf-back" onClick={goBack} disabled={loading}>
          ← {t("medicalHistory.form.actions.backToHistory")}
        </button>

        <h1 className="mhf-title">
          {isEdit ? t("medicalHistory.form.titleEdit") : t("medicalHistory.form.titleNew")}
        </h1>

        <div className="mhf-topspacer" />
      </div>

      <div className="card mhf-form">
        <form onSubmit={handleSubmit}>
          <div className="mhf-grid">
            <label className="mhf-field">
              <span className="mhf-label">{t("medicalHistory.form.fields.date")}</span>
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
              <span className="mhf-label">{t("medicalHistory.form.fields.reasonRequired")}</span>
              <input
                className="mhf-input"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={loading}
              />
            </label>

            <label className="mhf-field mhf-span-2">
              <span className="mhf-label">{t("medicalHistory.form.fields.diagnosis")}</span>
              <input
                className="mhf-input"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={loading}
              />
            </label>

            <label className="mhf-field mhf-span-2">
              <span className="mhf-label">{t("medicalHistory.form.fields.treatment")}</span>
              <textarea
                className="mhf-textarea"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </label>

            <label className="mhf-field mhf-span-2">
              <span className="mhf-label">{t("common.notes")}</span>
              <textarea
                className="mhf-textarea"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                disabled={loading}
              />
            </label>

            <div className="mhf-field mhf-span-2">
              <div className="mhf-label">{t("medicalHistory.form.fields.photosOptional")}</div>

              <input
                className="mhf-input"
                type="file"
                accept="image/*"
                multiple
                onChange={pickFiles}
                disabled={loading}
              />

              {previews.length ? (
                <div className="mhf-previews">
                  {previews.map((src, idx) => (
                    <div key={src} className="mhf-thumb">
                      <img src={src} alt={`preview-${idx + 1}`} />
                      <button
                        type="button"
                        className="mhf-remove"
                        onClick={() => removePicked(idx)}
                        disabled={loading}
                        aria-label={t("common.close")}
                        title={t("common.close")}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {existingPhotos?.length ? (
                <div style={{ marginTop: 12 }}>
                  <div className="mhf-label">{t("medicalHistory.form.fields.existingPhotos")}</div>

                  <div className="mhf-existing">
                    {existingPhotos.map((p, i) => (
                      <a
                        key={p.url || i}
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mhf-thumb"
                        title={t("common.view")}
                      >
                        <img src={p.url} alt={`existing-${i + 1}`} />
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {errorKey ? <p className="mhf-error">{t(errorKey)}</p> : null}

          <div className="mhf-actions">
            <div className="mhf-actions-left">
              <button className="btn-secondary" type="button" onClick={goBack} disabled={loading}>
                {t("medicalHistory.form.actions.cancel")}
              </button>
            </div>

            <div className="mhf-actions-right">
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? t("medicalHistory.form.actions.saving") : t("medicalHistory.form.actions.save")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}