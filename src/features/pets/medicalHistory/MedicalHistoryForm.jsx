import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import {
  createHistoryEntry,
  getHistoryEntry,
  updateHistoryEntry
} from "../../../services/pets/medicalHistory.service";

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
      } catch (e) {
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
      setErrorKey("medicalHistory.form.errors.needLogin");
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
    } catch (e2) {
      setErrorKey(isEdit ? "medicalHistory.form.errors.update" : "medicalHistory.form.errors.create");
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
        ← {t("medicalHistory.form.actions.backToHistory")}
      </button>

      <h1 className="mhf-title">
        {isEdit ? t("medicalHistory.form.titleEdit") : t("medicalHistory.form.titleNew")}
      </h1>

      {errorKey ? <p className="mhf-error">{t(errorKey)}</p> : null}

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
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 10,
                    marginTop: 10
                  }}
                >
                  {previews.map((src, idx) => (
                    <div key={src} style={{ position: "relative" }}>
                      <img
                        src={src}
                        alt={t("medicalHistory.form.alts.preview", { index: idx + 1 })}
                        style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10 }}
                      />
                      <button
                        type="button"
                        onClick={() => removePicked(idx)}
                        disabled={loading}
                        style={{
                          position: "absolute",
                          top: 6,
                          right: 6,
                          borderRadius: 999,
                          padding: "4px 8px",
                          cursor: "pointer"
                        }}
                        aria-label={t("medicalHistory.form.actions.removePhoto")}
                        title={t("medicalHistory.form.actions.removePhoto")}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {existingPhotos?.length ? (
                <div style={{ marginTop: 12 }}>
                  <div className="mhf-label">{t("medicalHistory.form.labels.existingPhotos")}</div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: 10,
                      marginTop: 10
                    }}
                  >
                    {existingPhotos.map((p, i) => (
                      <a key={p.url || i} href={p.url} target="_blank" rel="noreferrer">
                        <img
                          src={p.url}
                          alt={t("medicalHistory.form.alts.existingPhoto", { index: i + 1 })}
                          style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10 }}
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
              {loading ? t("medicalHistory.form.actions.saving") : t("medicalHistory.form.actions.save")}
            </button>

            <button
              className="btn-secondary"
              type="button"
              onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
              disabled={loading}
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
