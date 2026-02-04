import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

import { auth } from "../../services/firebase/firebase";
import { listAppointmentsForVet } from "../../services/appointments/appointments.service";
import { getClientById } from "../../services/clients/clients.service";

import "./appointmentsCalendar.css";

function toDateMaybe(ts) {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  if (ts instanceof Date) return ts;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeStatus(s) {
  const v = String(s || "scheduled").toLowerCase().trim();
  if (["cancelled", "canceled"].includes(v)) return "cancelled";
  if (["done", "completed", "complete", "finished"].includes(v)) return "done";
  if (["scheduled", "confirmed", "pending"].includes(v)) return "scheduled";
  return v || "scheduled";
}

function statusLabel(s) {
  const v = normalizeStatus(s);
  if (v === "scheduled") return "Programado";
  if (v === "cancelled") return "Cancelado";
  if (v === "done") return "Realizado";
  return v;
}

function fmtTime(d) {
  if (!d) return "";
  try {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function fmtDateOnly(d) {
  if (!d) return "";
  try {
    return d.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return "";
  }
}

function fmtRange(start, end) {
  if (!start) return "";
  const s = fmtTime(start);
  const e = end ? fmtTime(end) : "";
  return e ? `${s}–${e}` : s;
}

function ymd(date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function AppointmentsCalendar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedAppt, setSelectedAppt] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    let alive = true;

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
            const start = toDateMaybe(a.startTime);
            const end = toDateMaybe(a.endTime);
            if (!start) return null;

            const clientName = a.clientId
              ? clientMap[a.clientId] || "Cliente"
              : "Cliente";

            const reason = a.reason || "Consulta";
            const status = normalizeStatus(a.status || "scheduled");

            return {
              id: a.id,
              title: clientName,
              start,
              end: end || undefined,
              classNames: [`ac-ev--${status}`],
              extendedProps: {
                reason,
                status,
                notes: a.notes || "",
                clientId: a.clientId || null,
                petId: a.petId || null,
                clientName,
              },
            };
          })
          .filter(Boolean);

        if (!alive) return;
        setEvents(evs);
      } catch (e) {
        console.error("ERROR cargando calendario:", e);
        const msg = String(e?.message || "");
        if (msg.includes("building")) {
          setError(
            "El índice del calendario se está creando en Firebase. Esperá un momento y tocá Reintentar."
          );
        } else if (msg.toLowerCase().includes("index")) {
          setError("Falta crear un índice en Firestore para el calendario.");
        } else {
          setError(msg || "No se pudo cargar el calendario.");
        }
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [user?.uid, reloadKey]);

  const nowScrollTime = useMemo(() => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}:00`;
  }, []);

  const countByDay = useMemo(() => {
    const map = {};
    for (const e of events) {
      if (!e?.start) continue;
      const key = ymd(e.start);
      map[key] = (map[key] || 0) + 1;
    }
    return map;
  }, [events]);

  if (loading) return <p className="ac-status">Cargando calendario...</p>;
  if (!user?.uid) return <p className="ac-status">Tenés que iniciar sesión.</p>;

  return (
    <div className="ac-page">
      <div className="ac-header">
        <div className="ac-headings">
          <h1 className="ac-title">Calendario de turnos</h1>
          <p className="ac-subtitle">
            {events.length} turno(s) · Horario 08:00–20:00 · Click en un turno para ver detalles
          </p>
        </div>

        <div className="ac-actions">
          <button className="btn-secondary" onClick={() => navigate("/dashboard")}>
            Volver
          </button>

          <button className="btn-secondary" onClick={() => setReloadKey((k) => k + 1)}>
            Reintentar
          </button>
        </div>
      </div>

      {error ? <div className="ac-error">{error}</div> : null}

      <div className="card ac-calendar">
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
          scrollTime={nowScrollTime}
          moreLinkClick="popover"
          fixedWeekCount={false}
          views={{
            dayGridMonth: {
              dayMaxEvents: 0,
            },
          }}
          dayCellContent={(arg) => {
            const n = arg.dayNumberText;
            const key = ymd(arg.date);
            const count = countByDay[key] || 0;

            return (
              <div className="ac-daycell">
                <div className="ac-daynum">{n}</div>
                {count > 0 ? (
                  <div className="ac-daybadge">{count} turnos</div>
                ) : null}
              </div>
            );
          }}
          eventClick={(info) => {
            info.jsEvent.preventDefault();

            const ev = info.event;
            const props = ev.extendedProps || {};

            setSelectedAppt({
              id: ev.id,
              start: ev.start,
              end: ev.end,
              reason: props.reason || "Consulta",
              status: normalizeStatus(props.status || "scheduled"),
              notes: props.notes || "",
              clientId: props.clientId || null,
              petId: props.petId || null,
              clientName: props.clientName || ev.title || "Cliente",
            });
          }}
          eventContent={(arg) => {
            const props = arg.event.extendedProps || {};
            const clientName = props.clientName || arg.event.title || "Cliente";
            const reason = props.reason || "Consulta";

            const start = arg.event.start;
            const end = arg.event.end;

            return (
              <div className="fc-appt">
                <div className="fc-appt-time">{fmtRange(start, end)}</div>
                <div className="fc-appt-title">{clientName}</div>
                <div className="fc-appt-reason">{reason}</div>
              </div>
            );
          }}
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
        />
      </div>

      <p className="ac-help">Haz click sobre una hora libre para crear un turno.</p>

      {selectedAppt ? (
        <div
          className="ac-modal-backdrop"
          onClick={() => setSelectedAppt(null)}
          role="presentation"
        >
          <div
            className="ac-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ac-modal-head">
              <div>
                <div className="ac-modal-title">{selectedAppt.clientName}</div>
                <div className="ac-modal-sub">
                  {fmtDateOnly(selectedAppt.start)}
                  {selectedAppt.start
                    ? ` · ${fmtRange(selectedAppt.start, selectedAppt.end)}`
                    : ""}
                </div>
              </div>

              <button className="ac-modal-close" onClick={() => setSelectedAppt(null)}>
                ✕
              </button>
            </div>

            <div className="ac-modal-body">
              <div className="ac-kv">
                <span>Motivo</span>
                <strong>{selectedAppt.reason}</strong>
              </div>

              <div className="ac-kv">
                <span>Estado</span>
                <strong className={`ac-status-pill ac-status-${selectedAppt.status}`}>
                  {statusLabel(selectedAppt.status)}
                </strong>
              </div>

              {selectedAppt.notes ? (
                <div className="ac-notes">
                  <div className="ac-notes-label">Notas</div>
                  <div className="ac-notes-box">{selectedAppt.notes}</div>
                </div>
              ) : null}

              <div className="ac-modal-actions">
                {selectedAppt.clientId ? (
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/clients/${selectedAppt.clientId}`)}
                  >
                    Ver cliente
                  </button>
                ) : null}

                <button
                  className="btn-primary"
                  onClick={() => navigate(`/appointments/${selectedAppt.id}/edit`)}
                >
                  Editar turno
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
