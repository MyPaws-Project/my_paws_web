import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";

import { auth } from "../../services/firebase/firebase";
import { createAppointment } from "../../services/appointments/appointments.service";
import { getClients } from "../../services/clients/clients.service";

import "./appointmentForm.css";

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function AppointmentForm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const { t, i18n } = useTranslation();

  const start = params.get("start");
  const end = params.get("end");

  const startDate = useMemo(() => safeDate(start), [start]);
  const endDate = useMemo(() => safeDate(end), [end]);

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");

  const [reason, setReason] = useState(t("appointments.form.defaults.reason"));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState("");

  const formatHour = (d) => {
    if (!d) return t("appointments.form.na");
    try {
      return d.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
    } catch {
      return t("appointments.form.na");
    }
  };

  const formatDay = (d) => {
    if (!d) return t("appointments.form.na");
    try {
      return d.toLocaleDateString(i18n.language, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return t("appointments.form.na");
    }
  };

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        setError("");

        const data = await getClients();
        const active = (data || []).filter((c) => c.active !== false);

        setClients(active);
        if (active.length) setClientId(active[0].id);
      } catch (e) {
        console.error(e);
        setError(t("appointments.form.errors.loadClients"));
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setReason((prev) => (prev?.trim() ? prev : t("appointments.form.defaults.reason")));
  }, [t]);

  const handleCreate = async () => {
    setError("");

    const user = auth.currentUser;
    if (!user) {
      setError(t("appointments.form.errors.needLogin"));
      return;
    }

    if (!start || !end) {
      setError(t("appointments.form.errors.missingRange"));
      return;
    }

    if (!clientId) {
      setError(t("appointments.form.errors.pickClient"));
      return;
    }

    if (!startDate || !endDate) {
      setError(t("appointments.form.errors.invalidDate"));
      return;
    }

    try {
      setSaving(true);

      await createAppointment({
        vetId: user.uid,
        clientId,
        petId: null,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        reason,
        notes,
        status: "scheduled",
      });

      navigate("/calendar");
    } catch (e) {
      console.error(e);
      setError(t("appointments.form.errors.create"));
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = formatDay(startDate);
  const timeLabel = `${formatHour(startDate)} – ${formatHour(endDate)}`;

  return (
    <div className="af-page">
      <div className="af-header">
        <button className="af-back" onClick={() => navigate(-1)} disabled={saving}>
          ← {t("appointments.form.actions.back")}
        </button>

        <h1 className="af-title">{t("appointments.form.titleNew")}</h1>
      </div>

      <div className="af-meta card">
        <div className="af-meta-day" style={{ textTransform: "capitalize" }}>
          {dayLabel}
        </div>
        <div className="af-meta-time">{timeLabel}</div>
      </div>

      <div className="card af-form">
        <div className="af-grid">
          <div className="af-field af-span-2">
            <label className="af-label">{t("appointments.form.labels.client")}</label>
            <select
              className="af-input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loadingClients || saving}
            >
              {clients.length === 0 ? (
                <option value="">{t("appointments.form.emptyClients")}</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || t("common.unnamed")}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="af-field af-span-2">
            <label className="af-label">{t("appointments.form.labels.reason")}</label>
            <input
              className="af-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={saving}
              placeholder={t("appointments.form.placeholders.reason")}
            />
          </div>

          <div className="af-field af-span-2">
            <label className="af-label">{t("appointments.form.labels.notes")}</label>
            <textarea
              className="af-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={saving}
              placeholder={t("appointments.form.placeholders.notes")}
            />
          </div>
        </div>

        {error ? <p className="af-error">{error}</p> : null}

        <div className="af-actions">
          <button className="btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
            {t("common.cancel")}
          </button>

          <button className="btn-primary" onClick={handleCreate} disabled={saving || loadingClients}>
            {saving ? t("appointments.form.actions.creating") : t("appointments.form.actions.create")}
          </button>
        </div>
      </div>
    </div>
  );
}