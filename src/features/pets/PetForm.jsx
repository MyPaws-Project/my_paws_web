import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createPet, getPetById, updatePet } from "../../services/pets/pets.service";
import "./petForm.css";

const toArray = (s) =>
  (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function PetForm() {
  const { id: clientId, petId } = useParams();
  const isEdit = Boolean(petId);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const [form, setForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "",
    birthDate: "",
    weight: "",
    allergies: "",
    illnesses: "",
    medication: "",
    notes: ""
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setErrorKey("");
        setLoading(true);

        const data = await getPetById(clientId, petId);
        if (!alive) return;

        if (!data) {
          setErrorKey("pets.form.errors.notFound");
          return;
        }

        setForm({
          name: data.name ?? "",
          species: data.species ?? "",
          breed: data.breed ?? "",
          gender: data.gender ?? "",
          birthDate: data.birthDate ?? "",
          weight: data.weight == null ? "" : String(data.weight),
          allergies: Array.isArray(data.allergies) ? data.allergies.join(", ") : "",
          illnesses: Array.isArray(data.illnesses) ? data.illnesses.join(", ") : "",
          medication: Array.isArray(data.medication) ? data.medication.join(", ") : "",
          notes: data.notes ?? ""
        });
      } catch {
        if (!alive) return;
        setErrorKey("pets.form.errors.load");
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (isEdit && clientId && petId) load();

    return () => {
      alive = false;
    };
  }, [isEdit, clientId, petId]);

  const goBack = () => {
    if (isEdit) navigate(`/clients/${clientId}/pets/${petId}`);
    else navigate(`/clients/${clientId}`);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      setErrorKey("pets.form.errors.nameRequired");
      return;
    }

    const weight =
      form.weight === "" || form.weight == null
        ? null
        : Number(form.weight);

    const payload = {
      name: nameTrimmed,
      species: form.species ?? "",
      breed: form.breed ?? "",
      gender: form.gender ?? "",
      birthDate: form.birthDate ?? "",
      weight: Number.isFinite(weight) ? weight : null,
      allergies: toArray(form.allergies),
      illnesses: toArray(form.illnesses),
      medication: toArray(form.medication),
      notes: form.notes ?? ""
    };

    try {
      setErrorKey("");
      setSaving(true);

      if (isEdit) {
        await updatePet(clientId, petId, payload);
        navigate(`/clients/${clientId}/pets/${petId}`);
      } else {
        const newId = await createPet(clientId, payload);
        navigate(`/clients/${clientId}/pets/${newId}`);
      }
    } catch {
      setErrorKey(isEdit ? "pets.form.errors.update" : "pets.form.errors.create");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="pf-status">{t("common.loading")}</div>;

  if (errorKey === "pets.form.errors.notFound" && isEdit) {
    return (
      <div className="pf-page">
        <div className="pf-status">
          <p className="pf-error">{t(errorKey)}</p>
          <button className="btn-secondary" onClick={() => navigate(`/clients/${clientId}`)} disabled={saving}>
            {t("common.back")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-page">
      <div className="pf-header">
        <button className="pf-back" onClick={goBack} disabled={saving}>
          ← {t("common.back")}
        </button>

        <h1 className="pf-title">{isEdit ? t("pets.form.titleEdit") : t("pets.form.titleNew")}</h1>

        <div className="pf-topspacer" />
      </div>

      <form className="pf-form card" onSubmit={onSubmit}>
        <div className="pf-grid">
          <div className="pf-field pf-span-2">
            <label className="pf-label">{t("pets.form.fields.name")} *</label>
            <input className="pf-input" name="name" value={form.name} onChange={onChange} disabled={saving} />
          </div>

          <div className="pf-field">
            <label className="pf-label">{t("pets.form.fields.species")}</label>
            <input
              className="pf-input"
              name="species"
              value={form.species}
              onChange={onChange}
              disabled={saving}
              placeholder={t("pets.form.placeholders.species")}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label">{t("pets.form.fields.breed")}</label>
            <input className="pf-input" name="breed" value={form.breed} onChange={onChange} disabled={saving} />
          </div>

          <div className="pf-field">
            <label className="pf-label">{t("pets.form.fields.gender")}</label>
            <select className="pf-input" name="gender" value={form.gender} onChange={onChange} disabled={saving}>
              <option value="">{t("pets.form.values.na")}</option>
              <option value="male">{t("pets.details.values.gender.male")}</option>
              <option value="female">{t("pets.details.values.gender.female")}</option>
            </select>
          </div>

          <div className="pf-field">
            <label className="pf-label">{t("pets.form.fields.birthDate")}</label>
            <input
              className="pf-input"
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label">{t("pets.form.fields.weight")}</label>
            <input
              className="pf-input"
              type="number"
              step="0.1"
              name="weight"
              value={form.weight}
              onChange={onChange}
              disabled={saving}
              placeholder={t("pets.form.placeholders.weight")}
            />
          </div>

          <div className="pf-field pf-span-2">
            <label className="pf-label">{t("pets.form.fields.allergies")}</label>
            <input
              className="pf-input"
              name="allergies"
              value={form.allergies}
              onChange={onChange}
              disabled={saving}
              placeholder={t("pets.form.placeholders.allergies")}
            />
          </div>

          <div className="pf-field pf-span-2">
            <label className="pf-label">{t("pets.form.fields.illnesses")}</label>
            <input
              className="pf-input"
              name="illnesses"
              value={form.illnesses}
              onChange={onChange}
              disabled={saving}
              placeholder={t("pets.form.placeholders.illnesses")}
            />
          </div>

          <div className="pf-field pf-span-2">
            <label className="pf-label">{t("pets.form.fields.medication")}</label>
            <input
              className="pf-input"
              name="medication"
              value={form.medication}
              onChange={onChange}
              disabled={saving}
              placeholder={t("pets.form.placeholders.medication")}
            />
          </div>

          <div className="pf-field pf-span-2">
            <label className="pf-label">{t("common.notes")}</label>
            <textarea
              className="pf-textarea"
              name="notes"
              value={form.notes}
              onChange={onChange}
              disabled={saving}
              rows={4}
            />
          </div>
        </div>

        {errorKey ? <p className="pf-error">{t(errorKey)}</p> : null}

        <div className="pf-actions">
          <div className="pf-actions-left">
            <button className="btn-secondary" type="button" onClick={goBack} disabled={saving}>
              {t("common.cancel")}
            </button>
          </div>

          <div className="pf-actions-right">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving
                ? t("pets.form.actions.saving")
                : isEdit
                  ? t("pets.form.actions.saveChanges")
                  : t("pets.form.actions.create")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}