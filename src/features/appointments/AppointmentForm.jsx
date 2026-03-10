import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";

import { auth } from "../../services/firebase/firebase";
import { createAppointment, getAppointment, updateAppointment, } from "../../services/appointments/appointments.service";
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
  const { appointmentId } = useParams();
  const isEdit = Boolean(appointmentId);

  const { t, i18n } = useTranslation();

  const start = params.get("start");
  const end = params.get("end");

  const queryStartDate = useMemo(() => safeDate(start), [start]);
  const queryEndDate = useMemo(() => safeDate(end), [end]);

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");

  const [startDate, setStartDate] = useState(queryStartDate);
  const [endDate, setEndDate] = useState(queryEndDate);

  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingAppointment, setLoadingAppointment] = useState(isEdit);
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

        if (!isEdit && active.length) {
          setClientId(active[0].id);
        }
      } catch (e) {
        console.error(e);
        setError(t("appointments.form.errors.loadClients"));
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [isEdit, t]);

  useEffect(() => {
    if (!isEdit) {
      setReason((prev) => (prev?.trim() ? prev : t("appointments.form.defaults.reason")));
    }
  }, [isEdit, t]);

  useEffect(() => {
    if (!isEdit) {
      setStartDate(queryStartDate);
      setEndDate(queryEndDate);
      setLoadingAppointment(false);
      return;
    }

    let alive = true;

    const loadAppointment = async () => {
      try {
        setLoadingAppointment(true);
        setError("");

        const appt = await getAppointment(appointmentId);

        if (!alive) return;

        if (!appt) {
          setError(t("appointments.form.errors.load"));
          return;
        }

        setClientId(appt.clientId || "");
        setReason(
          appt.reason?.trim()
            ? appt.reason
            : t("appointments.form.defaults.reason")
        );
        setNotes(appt.notes || "");

        const loadedStart = appt.startTime?.toDate
          ? appt.startTime.toDate()
          : safeDate(appt.startTime);

        const loadedEnd = appt.endTime?.toDate
          ? appt.endTime.toDate()
          : safeDate(appt.endTime);

        setStartDate(loadedStart);
        setEndDate(loadedEnd);
      } catch (e) {
        console.error(e);
        if (!alive) return;
        setError(t("appointments.form.errors.load"));
      } finally {
        if (alive) setLoadingAppointment(false);
      }
    };

    loadAppointment();

    return () => {
      alive = false;
    };
  }, [appointmentId, isEdit, t]);

  const handleSubmit = async () => {
    setError("");

    const user = auth.currentUser;
    if (!user) {
      setError(t("appointments.form.errors.needLogin"));
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

    if (!isEdit && (!start || !end)) {
      setError(t("appointments.form.errors.missingRange"));
      return;
    }

    try {
      setSaving(true);

      const payload = {
        vetId: user.uid,
        clientId,
        petId: null,
        startTime: Timestamp.fromDate(startDate),
        endTime: Timestamp.fromDate(endDate),
        reason,
        notes,
        status: "scheduled",
      };

      if (isEdit) {
        await updateAppointment(appointmentId, payload);
      } else {
        await createAppointment(payload);
      }

      navigate("/calendar");
    } catch (e) {
      console.error(e);
      setError(
        isEdit
          ? t("appointments.form.errors.update")
          : t("appointments.form.errors.create")
      );
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = formatDay(startDate);
  const timeLabel = `${formatHour(startDate)} – ${formatHour(endDate)}`;

  if (loadingClients || loadingAppointment) {
    return <p className="af-status">{t("appointments.form.loading")}</p>;
  }

  return (
    <div className="af-page">
      <div className="af-header">
        <button className="af-back" onClick={() => navigate(-1)} disabled={saving}>
          ← {t("appointments.form.actions.back")}
        </button>

        <h1 className="af-title">
          {isEdit
            ? t("appointments.form.titleEdit")
            : t("appointments.form.titleNew")}
        </h1>
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

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={saving || loadingClients || loadingAppointment}
          >
            {saving
              ? isEdit
                ? t("appointments.form.actions.saving")
                : t("appointments.form.actions.creating")
              : isEdit
                ? t("appointments.form.actions.save")
                : t("appointments.form.actions.create")}
          </button>
        </div>
      </div>
    </div>
  );
}