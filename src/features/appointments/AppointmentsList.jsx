import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import {
  listAppointmentsForVetInRange,
  deleteAppointment,
} from "../../services/appointments/appointments.service";
import { getClientById } from "../../services/clients/clients.service";
import { auth } from "../../services/firebase/firebase";

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
      await deleteAppointment(id);
      await load(user?.uid);
    } catch (e) {
      console.error("ERROR eliminando turno:", e);
      setError("No se pudo eliminar el turno.");
    }
  }

  if (loading) return <p>Cargando consultas de hoy...</p>;

  const todayLabel = new Date().toLocaleDateString();

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h3 style={{ margin: 0 }}>Consultas de hoy</h3>
        <span style={{ opacity: 0.75 }}>{todayLabel}</span>
      </div>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {items.length === 0 ? (
        <p>No hay turnos agendados para hoy.</p>
      ) : (
        <div style={{ marginTop: 12 }}>
          {items.map((a) => {
            const start = a.startTime?.toDate ? a.startTime.toDate() : null;
            const end = a.endTime?.toDate ? a.endTime.toDate() : null;

            return (
              <div
                key={a.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div>
                      <strong>Hora:</strong>{" "}
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

                    <div style={{ marginTop: 6 }}>
                      <strong>Cliente:</strong>{" "}
                      {a.clientId
                        ? clientMap[a.clientId] || "Cargando..."
                        : "-"}
                    </div>

                    <div style={{ marginTop: 6 }}>
                      <strong>Motivo:</strong> {a.reason || "-"}
                      {" · "}
                      <strong>Estado:</strong> {a.status || "scheduled"}
                    </div>

                    {a.notes ? (
                      <div style={{ marginTop: 6 }}>
                        <strong>Notas:</strong> {a.notes}
                      </div>
                    ) : null}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      minWidth: 140,
                    }}
                  >
                    <button onClick={() => handleDelete(a.id)}>Eliminar</button>
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
