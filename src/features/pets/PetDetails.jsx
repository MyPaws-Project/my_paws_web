import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getPetById, disablePet, reactivatePet } from "../../services/pets/pets.service";
import { uploadPetImage } from "../../services/cloudinary/cloudinary.service";
import { addPetPhoto, listPetPhotos } from "../../services/pets/petPhotos.service";

import "./petDetails.css";

const formatList = (arr, fallback) => {
  if (!Array.isArray(arr) || arr.length === 0) return fallback;
  return arr.join(", ");
};

export default function PetDetails() {
  const { id: clientId, petId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");

  const [photos, setPhotos] = useState([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [errorKey, setErrorKey] = useState("");

  const isInactive = useMemo(() => pet?.active === false, [pet]);
  const NA = t("pets.details.values.na");

  const sexLabel = (sex) => {
    if (sex === "male") return t("pets.details.values.sex.male");
    if (sex === "female") return t("pets.details.values.sex.female");
    return NA;
  };

  const loadPhotos = async () => {
    try {
      setLoadingPhotos(true);
      const data = await listPetPhotos(clientId, petId);
      setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading photos:", err);
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
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

    if (clientId && petId) {
      load();
      loadPhotos();
    }

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

  const handleUploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorKey("");
      setUploading(true);

      const result = await uploadPetImage(file, clientId, petId);
      await addPetPhoto(clientId, petId, result);

      setPhotoUrl(result.url);
      await loadPhotos();
    } catch (err) {
      console.error(err);
      setErrorKey("pets.details.errors.uploadPhoto");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleOpenAlbum = async () => {
    setAlbumOpen(true);
    await loadPhotos();
  };

  const handleCloseAlbum = () => {
    setAlbumOpen(false);
    setSelectedPhoto(null);
  };

  const handleOpenViewer = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleCloseViewer = () => {
    setSelectedPhoto(null);
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
      <div className="pd-topbar">
        <button
          className="pd-back"
          onClick={() => navigate(`/clients/${clientId}`)}
          disabled={saving}
        >
          ← {t("pets.details.actions.backToClient")}
        </button>

        <div className="pd-head">
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
      </div>

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

      <section className="card pd-card pd-photos">
        <div className="pd-photos-header">
          <h2 className="pd-photos-title">{t("pets.details.photos.title")}</h2>

          <button
            className="btn-secondary"
            onClick={handleOpenAlbum}
            disabled={saving || uploading}
            title={t("pets.details.photos.actions.openAlbumTitle")}
          >
            {t("pets.details.photos.actions.openAlbum", { count: photos.length })}
          </button>
        </div>

        <div className="pd-upload-row">
          <input
            className="pd-file"
            type="file"
            accept="image/*"
            onChange={handleUploadPhoto}
            disabled={uploading || saving}
          />

          {uploading ? <span className="pd-uploading">{t("pets.details.photos.status.uploading")}</span> : null}
        </div>

        {photoUrl ? (
          <div className="pd-preview">
            <img src={photoUrl} alt={t("pets.details.photos.previewAlt")} />
          </div>
        ) : null}
      </section>

      {albumOpen ? (
        <div className="pd-album-overlay" onClick={handleCloseAlbum} role="dialog" aria-modal="true">
          <div className="pd-album" onClick={(e) => e.stopPropagation()}>
            <div className="pd-album-header">
              <h3 className="pd-album-title">
                {t("pets.details.photos.albumTitle", { name: pet?.name || t("common.unnamed") })}
              </h3>

              <button className="btn-secondary" onClick={handleCloseAlbum}>
                {t("common.close")}
              </button>
            </div>

            {loadingPhotos ? (
              <p className="pd-album-status">{t("pets.details.photos.status.loading")}</p>
            ) : photos.length === 0 ? (
              <p className="pd-album-status">{t("pets.details.photos.status.empty")}</p>
            ) : (
              <div className="pd-album-grid">
                {photos.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="pd-album-thumb"
                    onClick={() => handleOpenViewer(p)}
                    title={t("pets.details.photos.actions.open")}
                  >
                    <img src={p.url} alt={t("pets.details.photos.thumbAlt")} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {selectedPhoto ? (
        <div className="pd-viewer-overlay" onClick={handleCloseViewer} role="dialog" aria-modal="true">
          <div className="pd-viewer" onClick={(e) => e.stopPropagation()}>
            <button className="pd-viewer-close" type="button" onClick={handleCloseViewer}>
              ✕
            </button>
            <img className="pd-viewer-img" src={selectedPhoto.url} alt={t("pets.details.photos.viewerAlt")} />
          </div>
        </div>
      ) : null}
    </div>
  );
}