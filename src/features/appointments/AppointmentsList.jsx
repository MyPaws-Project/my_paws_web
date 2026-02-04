import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import {
  listAppointmentsForVetInRange,
  deleteAppointment,
} from "../../services/appointments/appointments.service";
import { getClientById } from "../../services/clients/clients.service";
import { auth } from "../../services/firebase/firebase";

import "./appointmentsList.css";

export default function AppointmentsList() {
  const [user, setUser] = useState(null);

  const [items, setItems] = useState([]);
  const [clientMap, setClientMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  function getTodayRange() {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0
    );
    return { startOfToday, startOfTomorrow };
  }

  async function load(vetUid) {
    if (!vetUid) {
      setItems([]);
      setClientMap({});
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { startOfToday, startOfTomorrow } = getTodayRange();

      const appts = await listAppointmentsForVetInRange(
        vetUid,
        startOfToday,
        startOfTomorrow
      );
      setItems(appts);

      const uniqueClientIds = Array.from(
        new Set(appts.map((a) => a.clientId).filter(Boolean))
      );

      const pairs = await Promise.all(
        uniqueClientIds.map(async (clientId) => {
          try {
            const c = await getClientById(clientId);
            return [clientId, c?.fullName || "(Cliente sin nombre)"];
          } catch {
            return [clientId, "(No se pudo cargar cliente)"];
          }
        })
      );

      const map = {};
      for (const [id, name] of pairs) map[id] = name;
      setClientMap(map);
    } catch (e) {
      console.error("ERROR cargando citas del día:", e);
      setItems([]);
      setClientMap({});
      setError("No se pudieron cargar las consultas de hoy.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(user?.uid);
  }, [user?.uid]);

  async function handleDelete(id) {
    const ok = window.confirm("¿Eliminar este turno?");
    if (!ok) return;

    try {
      setError("");
      await deleteAppointment(id);
      await load(user?.uid);
    } catch (e) {
      console.error("ERROR eliminando turno:", e);
      setError("No se pudo eliminar el turno.");
    }
  }

  const todayLabel = new Date().toLocaleDateString();

  if (loading) return <p className="al-status">Cargando consultas de hoy...</p>;

  return (
    <div className="al-wrap">
      <div className="al-head">
        <h3 className="al-title">Consultas de hoy</h3>
        <span className="al-date">{todayLabel}</span>
      </div>

      {error ? <p className="al-error">{error}</p> : null}

      {items.length === 0 ? (
        <p className="al-empty">No hay turnos agendados para hoy.</p>
      ) : (
        <div className="al-list">
          {items.map((a) => {
            const start = a.startTime?.toDate ? a.startTime.toDate() : null;
            const end = a.endTime?.toDate ? a.endTime.toDate() : null;

            return (
              <div key={a.id} className="al-item card">
                <div className="al-row">
                  <div className="al-main">
                    <div className="al-line">
                      <b>Hora:</b>{" "}
                      {start
                        ? start.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                      {" - "}
                      {end
                        ? end.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </div>

                    <div className="al-line">
                      <b>Cliente:</b>{" "}
                      {a.clientId ? clientMap[a.clientId] || "Cargando..." : "-"}
                    </div>

                    <div className="al-line">
                      <b>Motivo:</b> {a.reason || "-"} {" · "}
                      <b>Estado:</b> {a.status || "scheduled"}
                    </div>

                    {a.notes ? (
                      <div className="al-line">
                        <b>Notas:</b> {a.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="al-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => handleDelete(a.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
