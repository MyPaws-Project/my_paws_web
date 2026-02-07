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

  const statusLabel = (status) => {
    const key = (status || "scheduled").toString().toLowerCase();
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
    () => new Date().toLocaleDateString(i18n.language),
    [i18n.language]
  );

  if (loading) return <p className="al-status">{t("appointments.list.loading")}</p>;

  return (
    <div className="al-wrap">
      <div className="al-head">
        <h3 className="al-title">{t("appointments.list.titleToday")}</h3>
        <span className="al-date">{todayLabel}</span>
      </div>

      {error ? <p className="al-error">{error}</p> : null}

      {items.length === 0 ? (
        <p className="al-empty">{t("appointments.list.emptyToday")}</p>
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
                      <b>{t("appointments.list.labels.time")}:</b> {formatTime(start)} {" - "}{" "}
                      {formatTime(end)}
                    </div>

                    <div className="al-line">
                      <b>{t("appointments.list.labels.client")}:</b>{" "}
                      {a.clientId
                        ? clientMap[a.clientId] || t("appointments.list.clientLoading")
                        : t("appointments.list.na")}
                    </div>

                    <div className="al-line">
                      <b>{t("appointments.list.labels.reason")}:</b> {a.reason || t("appointments.list.na")}{" "}
                      {" · "}
                      <b>{t("appointments.list.labels.status")}:</b> {statusLabel(a.status)}
                    </div>

                    {a.notes ? (
                      <div className="al-line">
                        <b>{t("appointments.list.labels.notes")}:</b> {a.notes}
                      </div>
                    ) : null}
                  </div>

                  <div className="al-actions">
                    <button className="btn-secondary" onClick={() => handleDelete(a.id)}>
                      {t("appointments.actions.delete")}
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
