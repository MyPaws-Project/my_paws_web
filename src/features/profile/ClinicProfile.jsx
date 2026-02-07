import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import { auth, db } from '../../services/firebase/firebase';
import { updateClinicProfile } from '../../services/firebase/auth.service';
import './clinicProfile.css';

export default function ClinicProfile() {
  const { t } = useTranslation();

  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [email, setEmail] = useState('');

  const [originalClinicName, setOriginalClinicName] = useState('');
  const [originalClinicAddress, setOriginalClinicAddress] = useState('');
  const [originalEmail, setOriginalEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const user = auth.currentUser;

  const canSave = useMemo(() => {
    return (
      clinicName.trim().length > 0 &&
      clinicAddress.trim().length > 0 &&
      email.trim().length > 0
    );
  }, [clinicName, clinicAddress, email]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        setMessage('');

        if (!user) throw new Error('NOT_AUTH');

        const snap = await getDoc(doc(db, 'users', user.uid));
        const authEmail = user.email || '';

        if (snap.exists()) {
          const data = snap.data();
          const name = data.clinicName || '';
          const address = data.clinicAddress || '';

          setClinicName(name);
          setClinicAddress(address);

          setOriginalClinicName(name);
          setOriginalClinicAddress(address);
        } else {
          setClinicName('');
          setClinicAddress('');
          setOriginalClinicName('');
          setOriginalClinicAddress('');
        }

        setEmail(authEmail);
        setOriginalEmail(authEmail);
      } catch (err) {
        setError(
          err?.message === 'NOT_AUTH'
            ? t('clinicProfile.errors.notAuth')
            : t('clinicProfile.errors.load')
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, t]);

  const handleCancel = () => {
    setClinicName(originalClinicName);
    setClinicAddress(originalClinicAddress);
    setEmail(originalEmail);
    setError('');
    setMessage('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError('');
    setMessage('');

    const nameTrimmed = clinicName.trim();
    const addressTrimmed = clinicAddress.trim();
    const emailTrimmed = email.trim();

    if (!nameTrimmed) return setError(t('clinicProfile.errors.nameRequired'));
    if (!addressTrimmed) return setError(t('clinicProfile.errors.addressRequired'));
    if (!emailTrimmed) return setError(t('clinicProfile.errors.emailRequired'));

    try {
      setSaving(true);

      await updateClinicProfile({
        clinicName: nameTrimmed,
        clinicAddress: addressTrimmed,
        email: emailTrimmed
      });

      setOriginalClinicName(nameTrimmed);
      setOriginalClinicAddress(addressTrimmed);
      setOriginalEmail(emailTrimmed);

      setMessage(t('clinicProfile.saved'));
      setIsEditing(false);
    } catch (err) {
      setError(t('clinicProfile.errors.save'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cp-status">{t('clinicProfile.loading')}</div>;

  return (
    <div className="cp-page">
      <h1 className="cp-title">{t('clinicProfile.title')}</h1>

      {error ? <p className="cp-error">{error}</p> : null}
      {message ? <p className="cp-success">{message}</p> : null}

      <div className="card cp-card">
        {!isEditing ? (
          <div className="cp-readonly">
            <div className="cp-row">
              <div className="cp-label">{t('clinicProfile.fields.name')}</div>
              <div className="cp-value">{clinicName || t('clinicProfile.empty')}</div>
            </div>

            <div className="cp-row">
              <div className="cp-label">{t('clinicProfile.fields.address')}</div>
              <div className="cp-value">{clinicAddress || t('clinicProfile.empty')}</div>
            </div>

            <div className="cp-row">
              <div className="cp-label">{t('clinicProfile.fields.email')}</div>
              <div className="cp-value">{email || t('clinicProfile.empty')}</div>
            </div>

            <div className="cp-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                {t('common.edit')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="cp-grid">
              <label className="cp-field cp-span-2">
                <span className="cp-label">{t('clinicProfile.labels.clinicName')}</span>
                <input
                  className="cp-input"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  disabled={saving}
                  autoComplete="organization"
                />
              </label>

              <label className="cp-field cp-span-2">
                <span className="cp-label">{t('clinicProfile.labels.clinicAddress')}</span>
                <input
                  className="cp-input"
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  disabled={saving}
                  autoComplete="street-address"
                />
              </label>

              <label className="cp-field cp-span-2">
                <span className="cp-label">{t('clinicProfile.labels.email')}</span>
                <input
                  className="cp-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  autoComplete="email"
                />
                <span className="cp-hint">{t('clinicProfile.hints.emailAuth')}</span>
              </label>
            </div>

            <div className="cp-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving || !canSave}
              >
                {saving ? t('clinicProfile.saving') : t('clinicProfile.save')}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
