import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { createHistoryEntry, getHistoryEntry, updateHistoryEntry } from "../../../services/pets/medicalHistory.service";

import "./medicalHistoryForm.css";

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function MedicalHistoryForm() {
  const { id: clientId, petId, entryId } = useParams();
  const isEdit = Boolean(entryId);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const [type, setType] = useState("consult");
  const [attendingVeterinarian, setAttendingVeterinarian] = useState("");
  const [timeDate, setTimeDate] = useState(todayISO());

  const [reason, setReason] = useState("");
  const [treatment, setTreatment] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState("");


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

        setType(data.type || "consult");
        setAttendingVeterinarian(data.attending_veterinarian || "");
        setTimeDate(data.time_date || todayISO());

        setReason(data.reason || "");
        setTreatment(data.treatment || "");
        setNotes(data.notes || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorKey("");
    setLoading(true);

    try {
      const payload = {
        type: String(type || "").toLowerCase().trim(),
        attending_veterinarian: attendingVeterinarian.trim(),
        time_date: timeDate.trim(),
        reason: reason.trim(),
        treatment: treatment.trim(),
        notes: notes.trim()
      };

      if (!payload.time_date) {
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
              <span className="mhf-label">{t("medicalHistory.form.fields.timeDate")}</span>
              <input
                className="mhf-input"
                type="date"
                value={timeDate}
                onChange={(e) => setTimeDate(e.target.value)}
                required
                disabled={loading}
              />
            </label>

            <label className="mhf-field">
              <span className="mhf-label">{t("medicalHistory.form.fields.type")}</span>
              <select
                className="mhf-input"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={loading}
              >
                <option value="consult">{t("medicalHistory.form.type.consult")}</option>
                <option value="control">{t("medicalHistory.form.type.control")}</option>
                <option value="surgery">{t("medicalHistory.form.type.surgery")}</option>
              </select>
            </label>

            <label className="mhf-field">
              <span className="mhf-label">{t("medicalHistory.form.fields.attendingVeterinarian")}</span>
              <input
                className="mhf-input"
                value={attendingVeterinarian}
                onChange={(e) => setAttendingVeterinarian(e.target.value)}
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