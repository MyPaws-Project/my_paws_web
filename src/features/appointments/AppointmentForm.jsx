import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { auth } from "../../services/firebase/firebase";
import { createAppointment } from "../../services/appointments/appointments.service";
import { getClients } from "../../services/clients/clients.service";
import "./appointmentForm.css";

function safeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatHour(d) {
  if (!d) return "-";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(d) {
  if (!d) return "-";
  return d.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default function AppointmentForm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const start = params.get("start");
  const end = params.get("end");

  const startDate = useMemo(() => safeDate(start), [start]);
  const endDate = useMemo(() => safeDate(end), [end]);

  const [clients, setClients] = useState([]);
  const [clientId, setClientId] = useState("");

  const [reason, setReason] = useState("Consulta");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState("");

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
        setError("No se pudieron cargar los clientes.");
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const handleCreate = async () => {
    setError("");

    const user = auth.currentUser;
    if (!user) {
      setError("Tenés que iniciar sesión.");
      return;
    }

    if (!start || !end) {
      setError("Falta start o end en la URL.");
      return;
    }

    if (!clientId) {
      setError("Seleccioná un cliente.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Fecha inválida.");
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
      setError("No se pudo crear el turno.");
    } finally {
      setSaving(false);
    }
  };

  const dayLabel = formatDay(startDate);
  const timeLabel = `${formatHour(startDate)} – ${formatHour(endDate)}`;

  return (
    <div className="af-page">
      <button className="af-back" onClick={() => navigate(-1)} disabled={saving}>
        ← Volver
      </button>

      <h1 className="af-title">Nuevo turno</h1>

      <div className="af-meta card">
        <div className="af-meta-day">{dayLabel}</div>
        <div className="af-meta-time">{timeLabel}</div>
      </div>

      <div className="card af-form">
        <div className="af-grid">
          <div className="af-field af-span-2">
            <label className="af-label">Cliente</label>
            <select
              className="af-input"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={loadingClients || saving}
            >
              {clients.length === 0 ? (
                <option value="">(No hay clientes activos)</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || "(Sin nombre)"}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="af-field af-span-2">
            <label className="af-label">Motivo</label>
            <input
              className="af-input"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="af-field af-span-2">
            <label className="af-label">Notas</label>
            <textarea
              className="af-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={saving}
            />
          </div>
        </div>

        {error ? <p className="af-error">{error}</p> : null}

        <div className="af-actions">
          <button className="btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
            Cancelar
          </button>

          <button
            className="btn-primary"
            onClick={handleCreate}
            disabled={saving || loadingClients}
          >
            {saving ? "Creando…" : "Crear turno"}
          </button>
        </div>
      </div>
    </div>
  );
}
