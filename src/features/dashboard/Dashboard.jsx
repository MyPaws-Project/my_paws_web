import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getClients } from "../../services/clients/clients.service";
import AppointmentsList from "../appointments/AppointmentsList";

import "./dashboard.css";

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "number") return ts;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [clients, setClients] = useState([]);
  const [activeCount, setActiveCount] = useState("—");
  const [errorKey, setErrorKey] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setErrorKey("");
        const data = await getClients();
        if (!alive) return;

        const list = Array.isArray(data) ? data : [];
        setClients(list);

        const count = list.filter((c) => c.active !== false).length;
        setActiveCount(count);
      } catch (e) {
        if (!alive) return;
        setErrorKey("dashboard.errors.loadClients");
        setActiveCount("—");
        setClients([]);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, []);

  const recentClients = useMemo(() => {
    const sorted = [...clients].sort((a, b) => {
      const aTime = toMillis(a.updatedAt) || toMillis(a.createdAt);
      const bTime = toMillis(b.updatedAt) || toMillis(b.createdAt);
      return bTime - aTime;
    });

    return sorted.filter((c) => c.active !== false).slice(0, 5);
  }, [clients]);

  const statusLabel = (client) =>
    client?.active === false ? t("common.inactive") : t("common.active");

  const contactLabel = (client) =>
    client?.email || client?.phone || t("dashboard.recentClients.noContact");

  return (
    <div className="dash-page">
      <header className="dash-topbar">
        <div className="dash-topspacer" />
        <div className="dash-head">
          <h1 className="dash-title">{t("dashboard.title")}</h1>
          <p className="dash-subtitle">
            {t("dashboard.activeClients")} <b>{activeCount}</b>
          </p>
        </div>
        <div className="dash-topspacer" />
      </header>

      <div className="dash-grid">
        <section className="card dash-card">
          <div className="dash-cardhead">
            <h3 className="dash-cardtitle">{t("dashboard.recentClients.title")}</h3>
            <button className="btn-primary" onClick={() => navigate("/clients")}>
              {t("dashboard.recentClients.actions.viewAll")}
            </button>
          </div>

          {errorKey ? <p className="dash-error">{t(errorKey)}</p> : null}

          {recentClients.length === 0 ? (
            <p className="dash-empty">{t("dashboard.recentClients.empty")}</p>
          ) : (
            <div className="dash-clientlist">
              {recentClients.map((c) => (
                <button
                  key={c.id}
                  className="dash-clientitem"
                  onClick={() => navigate(`/clients/${c.id}`)}
                >
                  <div className="dash-clientrow">
                    <span className="dash-clientname">
                      {c.fullName || t("common.unnamed")}
                    </span>
                    <span
                      className={`dash-badge ${
                        c.active === false ? "inactive" : "active"
                      }`}
                    >
                      {statusLabel(c)}
                    </span>
                  </div>
                  <div className="dash-clientmeta">{contactLabel(c)}</div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="card dash-card">
          <div className="dash-cardhead">
            <h3 className="dash-cardtitle">{t("dashboard.today.title")}</h3>
            <button className="btn-primary" onClick={() => navigate("/calendar")}>
              {t("dashboard.today.actions.viewCalendar")}
            </button>
          </div>

          <AppointmentsList />
        </section>
      </div>
    </div>
  );
}