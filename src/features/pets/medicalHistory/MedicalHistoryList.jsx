import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  listHistoryEntries,
  deleteHistoryEntry
} from "../../../services/pets/medicalHistory.service";
import "./medicalHistoryList.css";

function toMillis(ts) {
  if (!ts) return 0;
  if (typeof ts?.toMillis === "function") return ts.toMillis();
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === "number") return ts;
  const parsed = Date.parse(ts);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function MedicalHistoryList() {
  const { id: clientId, petId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [entryToDelete, setEntryToDelete] = useState(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState("");

  const load = async (aliveRef) => {
    try {
      setErrorKey("");
      setLoading(true);

      const data = await listHistoryEntries(clientId, petId);
      if (!aliveRef.current) return;

      const list = Array.isArray(data) ? data : [];
      setItems(list);
    } catch {
      if (!aliveRef.current) return;
      setErrorKey("medicalHistory.list.errors.load");
      setItems([]);
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId || !petId) return;

    const aliveRef = { current: true };
    load(aliveRef);

    return () => {
      aliveRef.current = false;
    };
  }, [clientId, petId]);

  const sortedItems = useMemo(() => {
    const copy = [...items];
    copy.sort((a, b) => {
      const aTime = toMillis(a.updatedAt) || toMillis(a.createdAt) || toMillis(a.time_date);
      const bTime = toMillis(b.updatedAt) || toMillis(b.createdAt) || toMillis(b.time_date);
      return bTime - aTime;
    });
    return copy;
  }, [items]);

  const confirmDelete = async () => {
    if (!entryToDelete) return;

    const aliveRef = { current: true };

    try {
      setSaving(true);
      setErrorKey("");

      await deleteHistoryEntry(clientId, petId, entryToDelete);

      setEntryToDelete(null);
      await load(aliveRef);
    } catch {
      setErrorKey("medicalHistory.list.errors.delete");
      setEntryToDelete(null);
    } finally {
      setSaving(false);
      aliveRef.current = false;
    }
  };

  if (loading) {
    return <div className="mh-status">{t("medicalHistory.list.status.loading")}</div>;
  }

  if (errorKey) {
    return (
      <div className="mh-page">
        <div className="mh-status">
          <p className="mh-error">{t(errorKey)}</p>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
            disabled={saving}
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mh-page">
      <div className="mh-topbar">
        <button
          className="mh-back"
          onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
          disabled={saving}
        >
          ← {t("medicalHistory.list.actions.back")}
        </button>

        <div className="mh-center">
          <h1 className="mh-title">{t("medicalHistory.list.title")}</h1>
        </div>

        <div className="mh-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history/new`)}
            disabled={saving}
          >
            {t("medicalHistory.list.actions.add")}
          </button>
        </div>
      </div>

      {sortedItems.length === 0 ? (
        <div className="card mh-empty">{t("medicalHistory.list.empty")}</div>
      ) : (
        <div className="mh-list">
          {sortedItems.map((x) => {

            return (
              <div key={x.id} className="card mh-item">
                <div className="mh-item-top">
                  <button
                    type="button"
                    className="mh-main"
                    onClick={() =>
                      navigate(`/clients/${clientId}/pets/${petId}/history/${x.id}/edit`)
                    }
                    disabled={saving}
                    title={t("common.edit")}
                  >
                    <div className="mh-titleRow">
                      <div className="mh-typeTitle">
                        {x.type
                          ? t(`medicalHistory.form.type.${x.type}`)
                          : t("medicalHistory.list.values.noType")}
                      </div>
                    </div>
                  </button>

                  <div className="mh-item-actions">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        navigate(`/clients/${clientId}/pets/${petId}/history/${x.id}/edit`)
                      }
                      disabled={saving}
                    >
                      {t("common.edit")}
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => setEntryToDelete(x.id)}
                      disabled={saving}
                    >
                      {t("medicalHistory.list.actions.delete")}
                    </button>
                  </div>
                </div>

                <div className="mh-reason">
                  {x.reason || t("medicalHistory.list.values.noReason")}
                </div>

                <div className="mh-item-date">
                  {x.time_date || t("medicalHistory.list.values.noDate")}
                </div>

                <div className="mh-details">
                  {x.attending_veterinarian ? (
                    <p className="mh-line">
                      <span className="mh-label">
                        {t("medicalHistory.list.labels.attendingVeterinarian")}
                      </span>
                      <span className="mh-value">{x.attending_veterinarian}</span>
                    </p>
                  ) : null}

                  {x.treatment ? (
                    <p className="mh-line">
                      <span className="mh-label">
                        {t("medicalHistory.list.labels.treatment")}
                      </span>
                      <span className="mh-value">{x.treatment}</span>
                    </p>
                  ) : null}

                  {x.notes ? (
                    <p className="mh-line mh-notes">
                      <span className="mh-label">
                        {t("medicalHistory.list.labels.notes")}
                      </span>
                      <span className="mh-value">{x.notes}</span>
                    </p>
                  ) : null}

                  {entryToDelete ? (
                    <div
                      className="mh-modal-overlay"
                      onClick={() => !saving && setEntryToDelete(null)}
                      role="dialog"
                      aria-modal="true"
                    >
                      <div className="mh-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="mh-modal-header">
                          <h3 className="mh-modal-title">{t("medicalHistory.list.confirm.title")}</h3>
                        </div>

                        <p className="mh-modal-text">
                          {t("medicalHistory.list.confirm.delete")}
                        </p>

                        <div className="mh-modal-actions">
                          <button
                            className="btn-secondary"
                            type="button"
                            onClick={() => setEntryToDelete(null)}
                            disabled={saving}
                          >
                            {t("common.cancel")}
                          </button>

                          <button
                            className="btn-danger"
                            type="button"
                            onClick={confirmDelete}
                            disabled={saving}
                          >
                            {saving
                              ? t("medicalHistory.list.actions.deleting", { defaultValue: "Deleting..." })
                              : t("medicalHistory.list.actions.delete")}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}