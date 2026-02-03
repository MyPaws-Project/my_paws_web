import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { auth } from "../../services/firebase/firebase";
import { listAppointmentsForVet } from "../../services/appointments/appointments.service";
import { getClientById } from "../../services/clients/clients.service";

export default function AppointmentsCalendar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function load() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const appts = await listAppointmentsForVet(user.uid);

        const uniqueClientIds = Array.from(
          new Set(appts.map((a) => a.clientId).filter(Boolean))
        );

        const pairs = await Promise.all(
          uniqueClientIds.map(async (clientId) => {
            try {
              const c = await getClientById(clientId);
              return [clientId, c?.fullName || "(Cliente)"];
            } catch {
              return [clientId, "(Cliente)"];
            }
          })
        );

        const clientMap = {};
        for (const [id, name] of pairs) clientMap[id] = name;

        const evs = appts
          .map((a) => {
            const start = a.startTime?.toDate ? a.startTime.toDate() : null;
            const end = a.endTime?.toDate ? a.endTime.toDate() : null;
            if (!start) return null;

            const clientName = a.clientId
              ? clientMap[a.clientId] || "Cliente"
              : "Cliente";

            return {
              id: a.id,
              title: clientName,
              start,
              end: end || undefined,
              extendedProps: {
                reason: a.reason || "Consulta",
                status: a.status || "scheduled",
                notes: a.notes || "",
                clientId: a.clientId || null,
                petId: a.petId || null,
              },
            };
          })
          .filter(Boolean);

        setEvents(evs);
      } catch (e) {
        console.error("ERROR cargando calendario:", e);
        const msg = String(e?.message || "");
        if (msg.includes("building")) {
          setError(
            "El índice del calendario se está creando en Firebase. Esperá un momento y tocá Reintentar."
          );
        } else if (msg.includes("index")) {
          setError(
            "Falta crear un índice en Firestore para el calendario."
          );
        } else {
          setError(msg || "No se pudo cargar el calendario.");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user?.uid, reloadKey]);

  if (loading) return <p>Cargando calendario...</p>;
  if (!user?.uid) return <p>Tenés que iniciar sesión.</p>;

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 10,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>Calendario de turnos</h2>
          <p style={{ margin: "6px 0 0", opacity: 0.75 }}>
            {events.length} turno(s) · Horario 08:00–20:00
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => navigate("/dashboard")}>Volver</button>
            <button onClick={() => setReloadKey((k) => k + 1)}>Reintentar</button>
            <button onClick={() => navigate("/appointments/new")}>
                + Nuevo turno
            </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            border: "1px solid #ffd6d6",
            background: "#fff5f5",
            color: "#b00020",
            padding: 10,
            borderRadius: 10,
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 12,
          padding: 10,
          background: "white",
        }}
      >
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          nowIndicator={true}
          height="75vh"
          expandRows={true}
          allDaySlot={false}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          weekends={true}
          selectable={true}
          selectMirror={true}
          events={events}

          dateClick={(info) => {
            const start = info.date;
            const end = new Date(start.getTime() + 30 * 60 * 1000);
            navigate(
              `/appointments/new?start=${encodeURIComponent(
                start.toISOString()
              )}&end=${encodeURIComponent(end.toISOString())}`
            );
          }}

          select={(info) => {
            navigate(
              `/appointments/new?start=${encodeURIComponent(
                info.start.toISOString()
              )}&end=${encodeURIComponent(info.end.toISOString())}`
            );
          }}

          eventDidMount={(info) => {
            const { reason, status } = info.event.extendedProps || {};
            const parts = [];
            if (reason) parts.push(reason);
            if (status) parts.push(`Estado: ${status}`);
            if (parts.length) info.el.title = parts.join(" · ");
          }}
        />
      </div>

      <p style={{ marginTop: 10, opacity: 0.65, fontSize: 12 }}>
        Haz click sobre una hora libre para crear un turno.
      </p>
    </div>
  );
}
