import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { login, register } from '../../services/firebase/auth.service';

import logo from '../../assets/mypaws-logo.png';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [mode, setMode] = useState('login');
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const friendlyAuthError = useMemo(() => {
    return (err) => {
      const code = err?.code || '';

      if (code === 'auth/email-already-in-use') return t('auth.errors.emailAlreadyInUse');
      if (code === 'auth/invalid-email') return t('auth.errors.invalidEmail');
      if (code === 'auth/weak-password') return t('auth.errors.weakPassword');
      if (code === 'auth/invalid-credential') return t('auth.errors.invalidCredential');
      if (code === 'auth/user-not-found') return t('auth.errors.userNotFound');
      if (code === 'auth/wrong-password') return t('auth.errors.wrongPassword');

      return err?.message || t('auth.errors.generic');
    };
  }, [t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const emailTrimmed = email.trim();

      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error(t('auth.errors.passwordMismatch'));
        }

        const nameTrimmed = clinicName.trim();
        if (!nameTrimmed) {
          throw new Error(t('auth.errors.clinicNameRequired'));
        }

        const addressTrimmed = clinicAddress.trim();
        if (!addressTrimmed) {
          throw new Error(t('auth.errors.clinicAddressRequired'));
        }

        await register(emailTrimmed, password, {
          clinicName: nameTrimmed,
          clinicAddress: addressTrimmed,
        });
      } else {
        await login(emailTrimmed, password);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setPassword('');
    setConfirmPassword('');
    setClinicName('');
    setClinicAddress('');
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h2>{t('auth.brand.title')}</h2>
        <p>{t('auth.brand.subtitle')}</p>
      </div>

      <div className="auth-card">
        <div className="auth-form-wrapper">
          <header className="auth-header">
            <img className="auth-logo" src={logo} alt={t('auth.logoAlt')} />
            <h1 className="auth-title">
              {isRegister ? t('auth.register.title') : t('auth.login.title')}
            </h1>
            <p className="auth-subtitle">
              {isRegister ? t('auth.register.subtitle') : t('auth.login.subtitle')}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <>
                <label className="auth-field">
                  <span>{t('auth.register.fields.clinicName')}</span>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    placeholder={t('auth.register.placeholders.clinicName')}
                  />
                </label>

                <label className="auth-field">
                  <span>{t('auth.register.fields.clinicAddress')}</span>
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    required
                    autoComplete="street-address"
                    placeholder={t('auth.register.placeholders.clinicAddress')}
                  />
                </label>
              </>
            )}

            <label className="auth-field">
              <span>{t('auth.fields.email')}</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('auth.placeholders.email')}
              />
            </label>

            <label className="auth-field">
              <span>{t('auth.fields.password')}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder={t('auth.placeholders.password')}
              />
            </label>

            {isRegister && (
              <label className="auth-field">
                <span>{t('auth.register.fields.confirmPassword')}</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder={t('auth.register.placeholders.confirmPassword')}
                />
              </label>
            )}

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" disabled={loading} className="auth-primary">
              {loading
                ? isRegister
                  ? t('auth.register.actions.creating')
                  : t('auth.login.actions.signingIn')
                : isRegister
                ? t('auth.register.actions.createAccount')
                : t('auth.login.actions.signIn')}
            </button>

            <button type="button" onClick={toggleMode} disabled={loading} className="auth-link">
              {isRegister ? t('auth.register.actions.goToLogin') : t('auth.login.actions.goToRegister')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
