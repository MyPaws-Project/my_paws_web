import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import { auth } from "../../services/firebase/firebase";
import { createAppointment } from "../../services/appointments/appointments.service";
import { getClients } from "../../services/clients/clients.service";

export default function AppointmentForm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);

  const start = params.get("start");
  const end = params.get("end");

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

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
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

  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Nuevo turno</h2>

      <p style={{ opacity: 0.8 }}>
        Start: <b>{start || "-"}</b>
        <br />
        End: <b>{end || "-"}</b>
      </p>

      <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
        <label>
          Cliente
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            disabled={loadingClients || saving}
            style={{ width: "100%" }}
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
        </label>

        <label>
          Motivo
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: "100%" }}
            disabled={saving}
          />
        </label>

        <label>
          Notas
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            style={{ width: "100%" }}
            disabled={saving}
          />
        </label>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => navigate(-1)} disabled={saving}>
            Volver
          </button>
          <button onClick={handleCreate} disabled={saving || loadingClients}>
            {saving ? "Creando…" : "Crear turno"}
          </button>
        </div>
      </div>
    </div>
  );
}
