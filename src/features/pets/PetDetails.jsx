import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getPetById, disablePet, reactivatePet } from "../../services/pets/pets.service";
import "./petDetails.css";

const formatList = (arr, fallback) => {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  return arr.join(", ");
};

export default function PetDetails() {
  const { id: clientId, petId } = useParams();
  const navigate = useNavigate();
  const { t } =useTranslation();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorKey, setErrorKey] = useState("");

  const isInactive = useMemo(() => pet?.active === false, [pet]);

  const NA = t("pets.details.values.na");

  const sexLabel = (sex) => {
    if (sex === "male") return t("pets.details.values.sex.male");
    if (sex === "female") return t("pets.details.values.sex.female");
    return NA;
  };

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setErrorKey("");
        setLoading(true);

        const data = await getPetById(clientId, petId);
        if (!alive) return;

        if (!data) {
          setPet(null);
          setErrorKey("pets.details.errors.notFound");
          return;
        }

        setPet(data);
      } catch (e) {
        if (!alive) return;
        setErrorKey("pets.details.errors.load");
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (clientId && petId) load();

    return () => {
      alive = false;
    };
  }, [clientId, petId]);

  const handleDisable = async () => {
    const ok = window.confirm(t("pets.details.confirm.disable"));
    if (!ok) return;

    try {
      setErrorKey("");
      setSaving(true);

      await disablePet(clientId, petId);

      setPet((prev) => (prev ? { ...prev, active: false } : prev));
      navigate(`/clients/${clientId}`);
    } catch (e) {
      setErrorKey("pets.details.errors.disable");
    } finally {
      setSaving(false);
    }
  };

  const handleReactivate = async () => {
    const ok = window.confirm(t("pets.details.confirm.reactivate"));
    if (!ok) return;

    try {
      setErrorKey("");
      setSaving(true);

      await reactivatePet(clientId, petId);

      setPet((prev) => (prev ? { ...prev, active: true } : prev));
    } catch (e) {
      setErrorKey("pets.details.errors.reactivate");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pd-status">{t("pets.details.status.loading")}</div>;

  if (errorKey) {
    return (
      <div className="pd-page">
        <div className="pd-status">
          <p className="pd-error">{t(errorKey)}</p>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}`)}
            disabled={saving}
          >
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pd-page">
      <button className="pd-back" onClick={() => navigate(`/clients/${clientId}`)} disabled={saving}>
        ← {t("pets.details.actions.backToClient")}
      </button>

      <header className="pd-header">
        <div>
          <h1 className="pd-title">{pet?.name || t("common.unnamed")}</h1>
          {isInactive ? <p className="pd-badge">{t("pets.details.badges.inactive")}</p> : null}
        </div>

        <div className="pd-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
            disabled={saving || isInactive}
            title={isInactive ? t("pets.details.tooltips.historyNeedsActive") : undefined}
          >
            {t("pets.details.actions.medicalHistory")}
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/edit`)}
            disabled={saving}
          >
            {t("common.edit")}
          </button>

          {isInactive ? (
            <button className="btn-secondary" onClick={handleReactivate} disabled={saving}>
              {t("common.reactivate")}
            </button>
          ) : (
            <button className="btn-danger" onClick={handleDisable} disabled={saving}>
              {t("common.disable")}
            </button>
          )}
        </div>
      </header>

      <section className="card pd-card">
        <div className="pd-grid">
          <div className="pd-item">
            <div className="pd-label">{t("pets.details.labels.species")}</div>
            <div className="pd-value">{pet?.species || NA}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">{t("pets.details.labels.breed")}</div>
            <div className="pd-value">{pet?.breed || NA}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">{t("pets.details.labels.sex")}</div>
            <div className="pd-value">{sexLabel(pet?.sex)}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">{t("pets.details.labels.birthDate")}</div>
            <div className="pd-value">{pet?.birthDate || NA}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">{t("pets.details.labels.currentWeight")}</div>
            <div className="pd-value">
              {typeof pet?.weightKg === "number"
                ? `${pet.weightKg} ${t("pets.details.values.weightUnit")}`
                : NA}
            </div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">{t("pets.details.labels.allergies")}</div>
            <div className="pd-value">{formatList(pet?.allergies, NA)}</div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">{t("pets.details.labels.chronicIllnesses")}</div>
            <div className="pd-value">{formatList(pet?.chronicIllnesses, NA)}</div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">{t("pets.details.labels.currentMedication")}</div>
            <div className="pd-value">{formatList(pet?.currentMedication, NA)}</div>
          </div>

          {pet?.notes ? (
            <div className="pd-item pd-span-2">
              <div className="pd-label">{t("common.notes")}</div>
              <div className="pd-value">{pet.notes}</div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
