import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getClients,
  createClient,
  updateClient,
  disableClient,
} from "../../services/clients/clients.service";
import ClientForm from "./ClientForm";
import "./clients.css";

const normalize = (s) =>
  (s ?? "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export default function Clients() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [showInactive, setShowInactive] = useState(false);
  const [search, setSearch] = useState("");

  const loadClients = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getClients();
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || t("clients.errors.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleCreate = async (payload) => {
    setSaving(true);
    setError("");
    try {
      await createClient(payload);
      setShowForm(false);
      await loadClients();
    } catch (err) {
      console.error("ERROR creando cliente:", err);
      setError(err?.message || t("clients.errors.create"));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    if (!editingClient?.id) return;

    setSaving(true);
    setError("");
    try {
      await updateClient(editingClient.id, payload);
      setEditingClient(null);
      await loadClients();
    } catch (err) {
      console.error("ERROR editando cliente:", err);
      setError(err?.message || t("clients.errors.update"));
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (clientId) => {
    const ok = window.confirm(t("clients.confirm.disable"));
    if (!ok) return;

    setSaving(true);
    setError("");
    try {
      await disableClient(clientId);
      await loadClients();
    } catch (err) {
      console.error("ERROR desactivando cliente:", err);
      setError(err?.message || t("clients.errors.disable"));
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async (clientId) => {
    const ok = window.confirm(t("clients.confirm.reactivate"));
    if (!ok) return;

    setSaving(true);
    setError("");
    try {
      await updateClient(clientId, { active: true });
      await loadClients();
    } catch (err) {
      console.error("ERROR reactivando cliente:", err);
      setError(err?.message || t("clients.errors.reactivate"));
    } finally {
      setSaving(false);
    }
  };

  const visibleClients = useMemo(() => {
    const list = clients.filter((c) =>
      showInactive ? c.active === false : c.active !== false
    );

    const q = normalize(search);
    if (!q) return list;

    return list.filter((c) => {
      const fullName = normalize(c.fullName);
      const phone = normalize(c.phone);
      const email = normalize(c.email);
      return fullName.includes(q) || phone.includes(q) || email.includes(q);
    });
  }, [clients, showInactive, search]);

  const openCreate = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const startEdit = (c) => {
    setShowForm(false);
    setEditingClient(c);
  };

  const toggleInactive = () => {
    setShowInactive((v) => !v);
    setSearch("");
    setShowForm(false);
    setEditingClient(null);
  };

  const subtitle = showInactive
    ? t("clients.subtitleInactive")
    : t("clients.subtitleActive");

  return (
    <div className="clients-page">
      <div className="clients-topbar">
        <button
          className="clients-back"
          onClick={() => navigate("/dashboard")}
          disabled={saving}
        >
          ← {t("common.back")}
        </button>

        <div className="clients-topcenter">
          <h1 className="clients-title">{t("clients.title")}</h1>
          <p className="clients-subtitle">{subtitle}</p>
        </div>

        <div className="clients-topactions">
          <input
            className="clients-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("clients.searchPlaceholder")}
            disabled={saving || loading}
          />

          <button className="btn-secondary" onClick={toggleInactive} disabled={saving}>
            {showInactive
              ? t("clients.actions.viewActive")
              : t("clients.actions.viewInactive")}
          </button>

          <button className="btn-primary" onClick={openCreate} disabled={saving}>
            {t("clients.actions.new")}
          </button>
        </div>
      </div>

      {showForm && !editingClient ? (
        <section className="card clients-card">
          <ClientForm onSubmit={handleCreate} loading={saving} onCancel={cancelForm} />
        </section>
      ) : null}

      {editingClient ? (
        <section className="card clients-card">
          <ClientForm
            onSubmit={handleUpdate}
            loading={saving}
            initialValues={editingClient}
            onCancel={cancelForm}
          />
        </section>
      ) : null}

      {loading ? <p className="clients-status">{t("common.loading")}</p> : null}
      {error ? <p className="clients-error">{error}</p> : null}

      {!loading && !error ? (
        <section className="card clients-card">
          <div className="card-header">
            <h3 className="card-title">
              {showInactive ? t("clients.list.inactiveTitle") : t("clients.list.activeTitle")}
            </h3>
            <span className="clients-count">{visibleClients.length}</span>
          </div>

          {visibleClients.length === 0 ? (
            <p className="clients-empty">
              {search
                ? t("clients.empty.search")
                : showInactive
                ? t("clients.empty.inactive")
                : t("clients.empty.active")}
            </p>
          ) : (
            <div className="clients-list">
              {visibleClients.map((c) => (
                <div key={c.id} className="client-row">
                  <button
                    type="button"
                    className="client-main"
                    onClick={() => navigate(`/clients/${c.id}`)}
                    title={t("clients.actions.viewDetails")}
                  >
                    <div className="client-name">
                      {c.fullName || t("common.unnamed")}
                      <span className={`pill ${c.active === false ? "pill-off" : "pill-on"}`}>
                        {c.active === false ? t("common.inactive") : t("common.active")}
                      </span>
                    </div>

                    <div className="client-meta">
                      {c.phone || t("clients.meta.noPhone")}
                      {c.email ? ` • ${c.email}` : ""}
                    </div>
                  </button>

                  <div className="client-actions">
                    <button className="btn-secondary" onClick={() => startEdit(c)} disabled={saving}>
                      {t("common.edit")}
                    </button>

                    {showInactive ? (
                      <button
                        className="btn-primary"
                        onClick={() => handleReactivate(c.id)}
                        disabled={saving}
                      >
                        {t("common.reactivate")}
                      </button>
                    ) : (
                      <button
                        className="btn-danger"
                        onClick={() => handleDisable(c.id)}
                        disabled={saving || c.active === false}
                        title={
                          c.active === false
                            ? t("clients.actions.alreadyDisabled")
                            : t("common.disable")
                        }
                      >
                        {t("common.disable")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}