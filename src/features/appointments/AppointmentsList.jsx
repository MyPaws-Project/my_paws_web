import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { useTranslation } from "react-i18next";

import {
  listAppointmentsForVetInRange,
  deleteAppointment,
} from "../../services/appointments/appointments.service";
import { getClientById } from "../../services/clients/clients.service";
import { auth } from "../../services/firebase/firebase";

import "./appointmentsList.css";

export default function AppointmentsList() {
  const { t, i18n } = useTranslation();

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
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
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

  const formatTime = (date) => {
    if (!date) return t("appointments.list.na");
    return date.toLocaleTimeString(i18n.language, { hour: "2-digit", minute: "2-digit" });
  };

  const statusKey = (status) => (status || "scheduled").toString().toLowerCase();

  const statusLabel = (status) => {
    const key = statusKey(status);
    return t(`appointments.status.${key}`, { defaultValue: key });
  };

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

      const appts = await listAppointmentsForVetInRange(vetUid, startOfToday, startOfTomorrow);
      setItems(appts);

      const uniqueClientIds = Array.from(new Set(appts.map((a) => a.clientId).filter(Boolean)));

      const pairs = await Promise.all(
        uniqueClientIds.map(async (clientId) => {
          try {
            const c = await getClientById(clientId);
            return [clientId, c?.fullName || t("appointments.list.clientUnnamed")];
          } catch {
            return [clientId, t("appointments.list.clientLoadFailed")];
          }
        })
      );

      const map = {};
      for (const [id, name] of pairs) map[id] = name;
      setClientMap(map);
    } catch (e) {
      console.error("ERROR loading today's appointments:", e);
      setItems([]);
      setClientMap({});
      setError(t("appointments.errors.loadToday"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(user?.uid);
  }, [user?.uid]);

  async function handleDelete(id) {
    const ok = window.confirm(t("appointments.confirm.delete"));
    if (!ok) return;

    try {
      setError("");
      await deleteAppointment(id);
      await load(user?.uid);
    } catch (e) {
      console.error("ERROR deleting appointment:", e);
      setError(t("appointments.errors.delete"));
    }
  }

  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString(i18n.language, {
        weekday: "long",
        year: "numeric",
        month: "short",
        day: "2-digit",
      }),
    [i18n.language]
  );

  if (loading) return <p className="al-status">{t("appointments.list.loading")}</p>;

  return (
    <div className="al-page">
      <div className="al-head">
        <div className="al-headings">
          <h1 className="al-title">{t("appointments.list.titleToday")}</h1>
          <div className="al-date" style={{ textTransform: "capitalize" }}>
            {todayLabel}
          </div>
        </div>

        <div className="al-meta">
          <div className="al-count">
            {t("appointments.list.labels.time")}:{" "}
            <span className="al-count-strong">{items.length}</span>
          </div>
        </div>
      </div>

      {error ? <div className="al-error">{error}</div> : null}

      {items.length === 0 ? (
        <div className="al-empty card">{t("appointments.list.emptyToday")}</div>
      ) : (
        <div className="al-list">
          {items.map((a) => {
            const start = a.startTime?.toDate ? a.startTime.toDate() : null;
            const end = a.endTime?.toDate ? a.endTime.toDate() : null;

            const clientName = a.clientId
              ? clientMap[a.clientId] || t("appointments.list.clientLoading")
              : t("appointments.list.na");

            const stKey = statusKey(a.status);

            return (
              <div key={a.id} className="card al-item">
                <div className="al-item-top">
                  <div className="al-time">
                    {formatTime(start)} <span className="al-dash">–</span> {formatTime(end)}
                  </div>

                  <span className={`al-status-pill al-status-${stKey}`}>
                    {statusLabel(a.status)}
                  </span>
                </div>

                <div className="al-item-body">
                  <div className="al-row">
                    <div className="al-k">{t("appointments.list.labels.client")}</div>
                    <div className="al-v">{clientName}</div>
                  </div>

                  <div className="al-row">
                    <div className="al-k">{t("appointments.list.labels.reason")}</div>
                    <div className="al-v">{a.reason || t("appointments.list.na")}</div>
                  </div>

                  {a.notes ? (
                    <div className="al-row">
                      <div className="al-k">{t("appointments.list.labels.notes")}</div>
                      <div className="al-v">{a.notes}</div>
                    </div>
                  ) : null}
                </div>

                <div className="al-actions">
                  <button className="btn-danger" onClick={() => handleDelete(a.id)}>
                    {t("appointments.actions.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}