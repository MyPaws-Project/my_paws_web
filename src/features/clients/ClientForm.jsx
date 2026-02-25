import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./clientForm.css";

export default function ClientForm({ onSubmit, loading, initialValues, onCancel }) {
  const { t } = useTranslation();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    setFullName(initialValues?.fullName ?? "");
    setPhone(initialValues?.phone ?? "");
    setEmail(initialValues?.email ?? "");
  }, [initialValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  };

  const handleCancel = () => {
    if (loading) return;
    if (onCancel) onCancel();
    else window.history.back();
  };

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <h3 className="cf-title">
        {initialValues ? t("clients.form.editTitle") : t("clients.form.newTitle")}
      </h3>

      <div className="cf-field">
        <label className="cf-label">{t("clients.form.fields.fullName")}</label>
        <input
          className="cf-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          placeholder={t("clients.form.placeholders.fullName")}
          disabled={loading}
        />
      </div>

      <div className="cf-field">
        <label className="cf-label">{t("clients.form.fields.phone")}</label>
        <input
          className="cf-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("clients.form.placeholders.phone")}
          disabled={loading}
        />
      </div>

      <div className="cf-field">
        <label className="cf-label">{t("clients.form.fields.email")}</label>
        <input
          className="cf-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("clients.form.placeholders.email")}
          disabled={loading}
        />
      </div>

      <div className="cf-actions">
        <button className="btn-secondary" type="button" onClick={handleCancel} disabled={loading}>
          {t("common.cancel")}
        </button>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? t("clients.form.actions.saving") : t("clients.form.actions.save")}
        </button>
      </div>
    </form>
  );
}