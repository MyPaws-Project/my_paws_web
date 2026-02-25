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
    } catch (e) {
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
      const aTime = toMillis(a.updatedAt) || toMillis(a.createdAt) || toMillis(a.date);
      const bTime = toMillis(b.updatedAt) || toMillis(b.createdAt) || toMillis(b.date);
      return bTime - aTime;
    });
    return copy;
  }, [items]);

  const handleDelete = async (entryId) => {
    const ok = window.confirm(t("medicalHistory.list.confirm.delete"));
    if (!ok) return;

    const aliveRef = { current: true };

    try {
      setSaving(true);
      setErrorKey("");

      await deleteHistoryEntry(clientId, petId, entryId);

      await load(aliveRef);
    } catch (e) {
      setErrorKey("medicalHistory.list.errors.delete");
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
          <p className="mh-subtitle">
            {sortedItems.length} {sortedItems.length === 1 ? "registro" : "registros"}
          </p>
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
            const photoCount = Array.isArray(x.photos) ? x.photos.length : 0;

            return (
              <div key={x.id} className="card mh-item">
                <div className="mh-item-top">
                  <button
                    type="button"
                    className="mh-main"
                    onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history/${x.id}/edit`)}
                    disabled={saving}
                    title={t("common.edit")}
                  >
                    <div className="mh-topline">
                      <div className="mh-date">
                        {x.date || t("medicalHistory.list.values.noDate")}
                      </div>

                      {photoCount > 0 ? (
                        <span className="mh-badge" title={t("medicalHistory.list.labels.photos")}>
                          📷 {photoCount}
                        </span>
                      ) : null}
                    </div>

                    <div className="mh-reason">
                      {x.reason || t("medicalHistory.list.values.noReason")}
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
                      onClick={() => handleDelete(x.id)}
                      disabled={saving}
                    >
                      {t("medicalHistory.list.actions.delete")}
                    </button>
                  </div>
                </div>

                <div className="mh-details">
                  {x.diagnosis ? (
                    <p className="mh-line">
                      <b>{t("medicalHistory.list.labels.diagnosis")}:</b> {x.diagnosis}
                    </p>
                  ) : null}

                  {x.treatment ? (
                    <p className="mh-line">
                      <b>{t("medicalHistory.list.labels.treatment")}:</b> {x.treatment}
                    </p>
                  ) : null}

                  {x.notes ? (
                    <p className="mh-line mh-notes">
                      <b>{t("medicalHistory.list.labels.notes")}:</b> {x.notes}
                    </p>
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