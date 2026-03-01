import { useEffect, useMemo, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { auth, db } from "../../services/firebase/firebase";
import { uploadAndSaveClinicLogo } from "../../services/clinic/clinicPhotos.service";
import {
  updateClinicProfile,
  reauthenticateUser,
} from "../../services/firebase/auth.service";
import "./clinicProfile.css";

export default function ClinicProfile() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [email, setEmail] = useState("");

  const [originalClinicName, setOriginalClinicName] = useState("");
  const [originalClinicAddress, setOriginalClinicAddress] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [logoURL, setLogoURL] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [errorKey, setErrorKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [messageKey, setMessageKey] = useState("");

  const [showReauth, setShowReauth] = useState(false);
  const [reauthPassword, setReauthPassword] = useState("");
  const [reauthLoading, setReauthLoading] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const canSave = useMemo(() => {
    return (
      clinicName.trim().length > 0 &&
      clinicAddress.trim().length > 0 &&
      email.trim().length > 0
    );
  }, [clinicName, clinicAddress, email]);

  const isDirty = useMemo(() => {
    return (
      clinicName !== originalClinicName ||
      clinicAddress !== originalClinicAddress ||
      email !== originalEmail
    );
  }, [
    clinicName,
    clinicAddress,
    email,
    originalClinicName,
    originalClinicAddress,
    originalEmail,
  ]);

  useEffect(() => {
    let alive = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setErrorKey("");
        setMessageKey("");

        const u = auth.currentUser;
        if (!u) {
          setErrorKey("clinicProfile.errors.notAuth");
          return;
        }

        const snap = await getDoc(doc(db, "users", u.uid));
        const pubSnap = await getDoc(doc(db, "publicUsers", u.uid));
        const authEmail = u.email || "";

        if (!alive) return;

        const publicLogo = pubSnap.exists() ? pubSnap.data()?.logoURL || "" : "";
        setLogoURL(publicLogo);

        if (snap.exists()) {
          const data = snap.data();
          const name = data.clinicName || "";
          const address = data.clinicAddress || "";

          setClinicName(name);
          setClinicAddress(address);

          setOriginalClinicName(name);
          setOriginalClinicAddress(address);
        } else {
          setClinicName("");
          setClinicAddress("");

          setOriginalClinicName("");
          setOriginalClinicAddress("");
        }

        setEmail(authEmail);
        setOriginalEmail(authEmail);
      } catch (err) {
        if (!alive) return;
        setErrorKey("clinicProfile.errors.load");
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      alive = false;
    };
  }, []);

  const handleCancel = () => {
    setClinicName(originalClinicName);
    setClinicAddress(originalClinicAddress);
    setEmail(originalEmail);
    setErrorKey("");
    setMessageKey("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setErrorKey("");
    setMessageKey("");

    const payload = {
      clinicName: clinicName.trim(),
      clinicAddress: clinicAddress.trim(),
      email: email.trim(),
    };

    if (!payload.clinicName) return setErrorKey("clinicProfile.errors.nameRequired");
    if (!payload.clinicAddress) return setErrorKey("clinicProfile.errors.addressRequired");
    if (!payload.email) return setErrorKey("clinicProfile.errors.emailRequired");

    try {
      setSaving(true);

      const res = await updateClinicProfile(payload);

      setOriginalClinicName(payload.clinicName);
      setOriginalClinicAddress(payload.clinicAddress);

      if (res?.emailVerificationSent) {
        const currentAuthEmail = auth.currentUser?.email || "";
        setOriginalEmail(currentAuthEmail);
        setEmail(currentAuthEmail);
        setMessageKey("clinicProfile.messages.verifyEmailSent");
        setIsEditing(false);
        return;
      }

      const finalEmail = auth.currentUser?.email || payload.email;
      setOriginalEmail(finalEmail);
      setEmail(finalEmail);

      setMessageKey("clinicProfile.saved");
      setIsEditing(false);
    } catch (err) {
      console.log("UPDATE PROFILE ERROR:", err?.code, err?.message, err);

      if (err?.code === "auth/requires-recent-login") {
        setPendingPayload(payload);
        setReauthPassword("");
        setShowReauth(true);
        return;
      }

      if (err?.code === "auth/operation-not-allowed") {
        setErrorKey("clinicProfile.errors.verifyNewEmailRequired");
        return;
      }

      if (err?.code === "auth/email-already-in-use") {
        setErrorKey("clinicProfile.errors.emailAlreadyInUse");
      } else if (err?.code === "auth/invalid-email") {
        setErrorKey("clinicProfile.errors.invalidEmail");
      } else {
        setErrorKey("clinicProfile.errors.save");
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmReauth = async () => {
    if (!pendingPayload) {
      setShowReauth(false);
      return;
    }

    try {
      setErrorKey("");
      setReauthLoading(true);

      await reauthenticateUser(reauthPassword);

      setShowReauth(false);
      setReauthPassword("");

      setSaving(true);
      const res = await updateClinicProfile(pendingPayload);

      setOriginalClinicName(pendingPayload.clinicName);
      setOriginalClinicAddress(pendingPayload.clinicAddress);

      if (res?.emailVerificationSent) {
        const currentAuthEmail = auth.currentUser?.email || "";
        setOriginalEmail(currentAuthEmail);

        setClinicName(pendingPayload.clinicName);
        setClinicAddress(pendingPayload.clinicAddress);
        setEmail(currentAuthEmail);

        setPendingPayload(null);

        setMessageKey("clinicProfile.messages.verifyEmailSent");
        setIsEditing(false);
        return;
      }

      const finalEmail = auth.currentUser?.email || pendingPayload.email;

      setOriginalEmail(finalEmail);

      setClinicName(pendingPayload.clinicName);
      setClinicAddress(pendingPayload.clinicAddress);
      setEmail(finalEmail);

      setPendingPayload(null);

      setMessageKey("clinicProfile.saved");
      setIsEditing(false);
    } catch (e) {
      console.log("REAUTH ERROR:", e?.code, e?.message, e);

      if (e?.code === "auth/wrong-password") {
        setErrorKey("clinicProfile.reauth.errors.wrongPassword");
      } else if (e?.code === "auth/requires-recent-login") {
        setErrorKey("clinicProfile.reauth.errors.requiresRecentLogin");
      } else {
        setErrorKey("clinicProfile.reauth.errors.generic");
      }
    } finally {
      setSaving(false);
      setReauthLoading(false);
    }
  };

  const handlePickLogo = () => {
    if (logoUploading || saving || reauthLoading) return;
    fileRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorKey("");
      setMessageKey("");
      setLogoUploading(true);

      const u = auth.currentUser;
      if (!u) {
        setErrorKey("clinicProfile.errors.notAuth");
        return;
      }

      const res = await uploadAndSaveClinicLogo(file, u.uid);
      setLogoURL(res.url);
      setMessageKey("clinicProfile.logo.messages.updated");
    } catch (err) {
      console.error(err);
      setErrorKey("clinicProfile.logo.errors.upload");
    } finally {
      setLogoUploading(false);
      e.target.value = "";
    }
  };

  if (loading)
    return <div className="cp-status">{t("clinicProfile.loading")}</div>;

  return (
    <div className="cp-page">
      <div className="cp-topbar">
        <button
          className="cp-back"
          onClick={() => navigate(-1)}
          disabled={saving || reauthLoading}
        >
          ← {t("common.back")}
        </button>

        <div className="cp-center">
          <h1 className="cp-title">{t("clinicProfile.title")}</h1>
        </div>

        <div className="cp-top-actions">
          {!isEditing ? (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setMessageKey("");
                setErrorKey("");
                setIsEditing(true);
              }}
              disabled={saving || reauthLoading}
            >
              {t("common.edit")}
            </button>
          ) : (
            <button
              type="button"
              className="btn-primary"
              onClick={handleSave}
              disabled={saving || reauthLoading || !canSave || !isDirty}
            >
              {saving ? t("clinicProfile.saving") : t("clinicProfile.save")}
            </button>
          )}
        </div>
      </div>

      {errorKey ? <p className="cp-error">{t(errorKey)}</p> : null}
      {messageKey ? <p className="cp-success">{t(messageKey)}</p> : null}

      {showReauth ? (
        <div className="cp-modalOverlay" role="dialog" aria-modal="true">
          <div className="cp-modal card">
            <h2 className="cp-modalTitle">{t("clinicProfile.reauth.title")}</h2>
            <p className="cp-modalDesc">
              {t("clinicProfile.reauth.description")}
            </p>

            <label className="cp-field">
              <span className="cp-label">
                {t("clinicProfile.labels.password")}
              </span>
              <input
                className="cp-input"
                type="password"
                value={reauthPassword}
                onChange={(e) => setReauthPassword(e.target.value)}
                placeholder={t("clinicProfile.reauth.passwordPlaceholder")}
                disabled={reauthLoading}
                autoFocus
              />
            </label>

            <div className="cp-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={confirmReauth}
                disabled={reauthLoading || !reauthPassword.trim()}
              >
                {reauthLoading
                  ? t("clinicProfile.reauth.actions.confirming")
                  : t("clinicProfile.reauth.actions.confirm")}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowReauth(false);
                  setPendingPayload(null);
                  setReauthPassword("");
                }}
                disabled={reauthLoading}
              >
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card cp-card">
        <div className="cp-logoRow">
          <button
            type="button"
            className="cp-logoBtn"
            onClick={handlePickLogo}
            disabled={logoUploading || saving || reauthLoading}
            title={t("clinicProfile.logo.actions.change")}
          >
            <div className="cp-logo">
              {logoURL ? (
                <img
                  className="cp-logoImg"
                  src={logoURL}
                  alt={t("clinicProfile.logo.alt")}
                />
              ) : (
                <div className="cp-logoFallback">
                  {(clinicName || "C").trim().slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>

            <div className="cp-logoHint">
              {logoUploading
                ? t("clinicProfile.logo.status.uploading")
                : t("clinicProfile.logo.actions.tapToChange")}
            </div>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleLogoChange}
          />
        </div>

        {!isEditing ? (
          <div className="cp-readonly">
            <div className="cp-row">
              <div className="cp-label">{t("clinicProfile.fields.name")}</div>
              <div className="cp-value">
                {clinicName || t("clinicProfile.empty")}
              </div>
            </div>

            <div className="cp-row">
              <div className="cp-label">{t("clinicProfile.fields.address")}</div>
              <div className="cp-value">
                {clinicAddress || t("clinicProfile.empty")}
              </div>
            </div>

            <div className="cp-row">
              <div className="cp-label">{t("clinicProfile.fields.email")}</div>
              <div className="cp-value">
                {email || t("clinicProfile.empty")}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="cp-grid">
              <label className="cp-field cp-span-2">
                <span className="cp-label">
                  {t("clinicProfile.labels.clinicName")}
                </span>
                <input
                  className="cp-input"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  disabled={saving || reauthLoading || logoUploading}
                  autoComplete="organization"
                />
              </label>

              <label className="cp-field cp-span-2">
                <span className="cp-label">
                  {t("clinicProfile.labels.clinicAddress")}
                </span>
                <input
                  className="cp-input"
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  disabled={saving || reauthLoading}
                  autoComplete="street-address"
                />
              </label>

              <label className="cp-field cp-span-2">
                <span className="cp-label">
                  {t("clinicProfile.labels.email")}
                </span>
                <input
                  className="cp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving || reauthLoading}
                  autoComplete="email"
                />
              </label>
            </div>

            <div className="cp-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving || reauthLoading}
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}