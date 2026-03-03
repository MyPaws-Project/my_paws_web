import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getPetById, deletePet, updatePet } from "../../services/pets/pets.service";
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

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [photos, setPhotos] = useState([]);
  const [photoTitle, setPhotoTitle] = useState("");
  const [photoDescription, setPhotoDescription] = useState("");
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [albumOpen, setAlbumOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [pendingPreview, setPendingPreview] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [vaccinesOpen, setVaccinesOpen] = useState(true);
  const [vaccineModalOpen, setVaccineModalOpen] = useState(false);
  const [newVaccineName, setNewVaccineName] = useState("");

  const [errorKey, setErrorKey] = useState("");

  const NA = t("pets.details.values.na");

  const vaccines = Array.isArray(pet?.vaccines) ? pet.vaccines : [];

  const genderLabel = (gender) => {
    if (gender === "male") return t("pets.details.values.gender.male");
    if (gender === "female") return t("pets.details.values.gender.female");
    return NA;
  };

  const handleDelete = () => {
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      setErrorKey("");
      setSaving(true);

      await deletePet(clientId, petId);

      setDeleteModalOpen(false);
      navigate(`/clients/${clientId}`);
    } catch (e) {
      console.error(e);
      setErrorKey("pets.details.errors.delete");
      setDeleteModalOpen(false);
    } finally {
      setSaving(false);
    }
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

  const handlePickPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorKey("");
    setPendingFile(file);

    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    const url = URL.createObjectURL(file);
    setPendingPreview(url);
    e.target.value = "";
  };

  const handleCancelPending = () => {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview("");
    setPhotoTitle("");
    setPhotoDescription("");
  };

  const handleSavePendingPhoto = async () => {
    if (!pendingFile) return;

    try {
      setErrorKey("");
      setUploading(true);

      const result = await uploadPetImage(pendingFile, clientId, petId);

      await addPetPhoto(clientId, petId, {
        url: result.url,
        publicId: result.publicId,
        title: photoTitle.trim(),
        description: photoDescription.trim(),
      });

      await loadPhotos();
      handleCancelPending();
    } catch (err) {
      console.error(err);
      setErrorKey("pets.details.errors.uploadPhoto");
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

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

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const normalizeKey = (s) =>
    (s ?? "")
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const saveVaccines = async (updated) => {
    try {
      setErrorKey("");
      setSaving(true);

      await updatePet(clientId, petId, { vaccines: updated });

      setPet((prev) => (prev ? { ...prev, vaccines: updated } : prev));
    } catch (e) {
      console.error(e);
      setErrorKey("pets.details.errors.updateVaccines");
    } finally {
      setSaving(false);
    }
  };

  const addVaccineOrDose = async (name) => {
    const cleanName = (name ?? "").trim();
    if (!cleanName) return;

    const key = normalizeKey(cleanName);
    const today = todayISO();

    const current = Array.isArray(pet?.vaccines) ? pet.vaccines : [];
    const idx = current.findIndex((v) => v?.key === key);

    let updated = [...current];

    if (idx >= 0) {
      const doses = Array.isArray(updated[idx].doses) ? updated[idx].doses : [];
      if (!doses.includes(today)) {
        updated[idx] = { ...updated[idx], doses: [...doses, today] };
      }
    } else {
      updated = [...current, { name: cleanName, key, doses: [today] }];
    }

    await saveVaccines(updated);
  };

  const addDoseToday = async (vaccineKey) => {
    const today = todayISO();

    const current = Array.isArray(pet?.vaccines) ? pet.vaccines : [];
    const idx = current.findIndex((v) => v?.key === vaccineKey);
    if (idx < 0) return;

    const updated = [...current];
    const doses = Array.isArray(updated[idx].doses) ? updated[idx].doses : [];
    if (doses.includes(today)) return;

    updated[idx] = { ...updated[idx], doses: [...doses, today] };

    await saveVaccines(updated);
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

        <div className="pd-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history`)}
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

          <button
            className="btn-danger"
            onClick={handleDelete}
            disabled={saving}
          >
            {t("common.delete")}
          </button>
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
            <div className="pd-label">{t("pets.details.labels.gender")}</div>
            <div className="pd-value">{genderLabel(pet?.gender)}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">{t("pets.details.labels.birthDate")}</div>
            <div className="pd-value">{pet?.birthDate || NA}</div>
          </div>

          <div className="pd-item">
            <div className="pd-label">{t("pets.details.labels.weight")}</div>
            <div className="pd-value">
              {typeof pet?.weight === "number"
                ? `${pet.weight} ${t("pets.details.values.weightUnit")}`
                : NA}
            </div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">{t("pets.details.labels.allergies")}</div>
            <div className="pd-value">{formatList(pet?.allergies, NA)}</div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">{t("pets.details.labels.illnesses")}</div>
            <div className="pd-value">{formatList(pet?.illnesses, NA)}</div>
          </div>

          <div className="pd-item pd-span-2">
            <div className="pd-label">{t("pets.details.labels.medication")}</div>
            <div className="pd-value">{formatList(pet?.medication, NA)}</div>
          </div>

          {pet?.notes ? (
            <div className="pd-item pd-span-2">
              <div className="pd-label">{t("common.notes")}</div>
              <div className="pd-value">{pet.notes}</div>
            </div>
          ) : null}
        </div>
      </section>
      <section className="card pd-card pd-vaccines">
        <div className="pd-vaccines-header">
          <h2 className="pd-vaccines-title">{t("pets.details.vaccines.title")}</h2>

          <div className="pd-vaccines-actions">
            <button
              className="btn-secondary"
              type="button"
              onClick={() => setVaccinesOpen((v) => !v)}
            >
              {vaccinesOpen ? t("pets.details.vaccines.actions.hide") : t("pets.details.vaccines.actions.show")}
            </button>

            <button
              className="btn-primary"
              type="button"
              onClick={() => setVaccineModalOpen(true)}
            >
              {t("pets.details.vaccines.actions.addVaccine")}
            </button>
          </div>
        </div>

        {vaccinesOpen ? (
          vaccines.length === 0 ? (
            <p className="pd-vaccines-empty">{t("pets.details.vaccines.empty")}</p>
          ) : (
            <div className="pd-vaccines-list">
              {vaccines.map((v) => (
                <div key={v.key || v.name} className="pd-vaccine">
                  <div className="pd-vaccine-top">
                    <div className="pd-vaccine-name">{v.name || NA}</div>

                    <button
                      className="btn-secondary"
                      type="button"
                      onClick={() => addDoseToday(v.key)}
                    >
                      {t("pets.details.vaccines.actions.addDose")}
                    </button>
                  </div>

                  <div className="pd-vaccine-doses">
                    {Array.isArray(v.doses) && v.doses.length > 0
                      ? v.doses.map((d) => (
                        <span key={d} className="pd-dose-chip">
                          {d}
                        </span>
                      ))
                      : <span className="pd-vaccine-no-doses">{t("pets.details.vaccines.noDoses")}</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : null}
      </section>

      <section className="card pd-card pd-photos">
        <div className="pd-photos-header">
          <h2 className="pd-photos-title">{t("pets.details.photos.title")}</h2>

          <button
            className="btn-secondary"
            onClick={handleOpenAlbum}
            disabled={saving || uploading}
          >
            {t("pets.details.photos.actions.openAlbum", { count: photos.length })}
          </button>
        </div>

        <div className="pd-upload-row">
          <input
            className="pd-input"
            value={photoTitle}
            onChange={(e) => setPhotoTitle(e.target.value)}
            placeholder={t("pets.details.photos.fields.titlePlaceholder")}
            disabled={uploading || saving}
            maxLength={60}
          />

          <textarea
            className="pd-textarea"
            value={photoDescription}
            onChange={(e) => setPhotoDescription(e.target.value)}
            placeholder={t("pets.details.photos.fields.descPlaceholder")}
            disabled={uploading || saving}
            rows={3}
            maxLength={250}
          />

          <input
            id="pd-file"
            className="pd-file-hidden"
            type="file"
            accept="image/*"
            onChange={handlePickPhoto}
            disabled={uploading || saving}
          />

          <div className="pd-upload-actions">
            <label
              className={`btn-secondary ${uploading || saving ? "is-disabled" : ""}`}
              htmlFor="pd-file"
            >
              {t("pets.details.photos.actions.pick")}
            </label>
          </div>

          {pendingPreview ? (
            <>
              <div className="pd-preview">
                <img src={pendingPreview} alt={t("pets.details.photos.previewAlt")} />
              </div>

              <div className="pd-upload-bottom">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={handleCancelPending}
                  disabled={uploading || saving || !pendingFile}
                >
                  {t("common.cancel")}
                </button>

                <button
                  className="btn-primary"
                  type="button"
                  onClick={handleSavePendingPhoto}
                  disabled={uploading || saving || !pendingFile}
                >
                  {uploading
                    ? t("pets.details.photos.actions.saving")
                    : t("pets.details.photos.actions.save")}
                </button>
              </div>
            </>
          ) : null}

          {uploading ? (
            <span className="pd-uploading">{t("pets.details.photos.status.uploading")}</span>
          ) : null}
        </div>
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
                  >
                    <div className="pd-thumb-imgwrap">
                      <img src={p.url} alt={p.title || t("pets.details.photos.thumbAlt")} />
                    </div>

                    <div className="pd-thumb-meta">
                      {p.title ? <div className="pd-thumb-title">{p.title}</div> : null}
                      {p.description ? <div className="pd-thumb-desc">{p.description}</div> : null}
                    </div>
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

            <div className="pd-viewer-meta">
              {selectedPhoto.title ? <div className="pd-viewer-title">{selectedPhoto.title}</div> : null}
              {selectedPhoto.description ? <div className="pd-viewer-desc">{selectedPhoto.description}</div> : null}
            </div>
          </div>
        </div>
      ) : null}


      {vaccineModalOpen ? (
        <div
          className="pd-modal-overlay"
          onClick={() => setVaccineModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <h3 className="pd-modal-title">{t("pets.details.vaccines.modal.title")}</h3>
            </div>

            <input
              className="pd-input"
              value={newVaccineName}
              onChange={(e) => setNewVaccineName(e.target.value)}
              placeholder={t("pets.details.vaccines.modal.namePlaceholder")}
              maxLength={40}
            />

            <div className="pd-modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setVaccineModalOpen(false);
                  setNewVaccineName("");
                }}
              >
                {t("common.cancel")}
              </button>

              <button
                className="btn-primary"
                type="button"
                onClick={async () => {
                  await addVaccineOrDose(newVaccineName);
                  setVaccineModalOpen(false);
                  setNewVaccineName("");
                }}
              >
                {t("pets.details.vaccines.modal.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteModalOpen ? (
        <div
          className="pd-modal-overlay"
          onClick={() => !saving && setDeleteModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <h3 className="pd-modal-title">{t("pets.details.deleteModal.title")}</h3>
            </div>

            <p className="pd-modal-text">
              {t("pets.details.deleteModal.text", { name: pet?.name || t("common.unnamed") })}
            </p>

            <div className="pd-modal-actions">
              <button
                className="btn-secondary"
                type="button"
                onClick={() => setDeleteModalOpen(false)}
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
                {saving ? t("pets.details.deleteModal.deleting") : t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}