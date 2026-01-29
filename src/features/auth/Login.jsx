import { useState } from 'react';
import { login, register } from '../../services/firebase/auth.service';
import { useNavigate } from 'react-router-dom';

import logo from '../../assets/mypaws-logo.png';
import './login.css';

const friendlyAuthError = (err) => {
  const code = err?.code || '';
  if (code === 'auth/email-already-in-use') return 'Ese email ya está registrado.';
  if (code === 'auth/invalid-email') return 'Email inválido.';
  if (code === 'auth/weak-password') return 'La contraseña debe tener al menos 6 caracteres.';
  if (code === 'auth/invalid-credential') return 'Email o contraseña incorrectos.';
  if (code === 'auth/user-not-found') return 'No existe una cuenta con ese email.';
  if (code === 'auth/wrong-password') return 'Contraseña incorrecta.';
  return err?.message || 'Ocurrió un error.';
};

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('login');
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }

        const nameTrimmed = clinicName.trim();
        if (!nameTrimmed) {
          throw new Error('El nombre de la veterinaria es obligatorio');
        }

        const addressTrimmed = clinicAddress.trim();
        if (!addressTrimmed) {
          throw new Error('La dirección de la veterinaria es obligatoria');
        }

        await register(email.trim(), password, {
          clinicName: nameTrimmed,
          clinicAddress: addressTrimmed,
        });
      } else {
        await login(email.trim(), password);
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
        <h2>MyPaws</h2>
        <p>Gestión simple y moderna para veterinarias. Clientes, mascotas y mucho más.</p>
      </div>

      <div className="auth-card">
        <div className="auth-form-wrapper">
          <header className="auth-header">
            <img className="auth-logo" src={logo} alt="MyPaws logo" />
            <h1 className="auth-title">{isRegister ? 'Registro' : 'Login'}</h1>
            <p className="auth-subtitle">
              {isRegister
                ? 'Creá tu cuenta de veterinaria para empezar.'
                : 'Ingresá con tu cuenta de veterinaria.'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <>
                <label className="auth-field">
                  <span>Nombre de la veterinaria</span>
                  <input
                    type="text"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    required
                    placeholder="Ej: MyPaws Centro"
                  />
                </label>

                <label className="auth-field">
                  <span>Dirección de la veterinaria</span>
                  <input
                    type="text"
                    value={clinicAddress}
                    onChange={(e) => setClinicAddress(e.target.value)}
                    required
                    autoComplete="street-address"
                    placeholder="Ej: Av. Italia 1234"
                  />
                </label>
              </>
            )}

            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tuemail@ejemplo.com"
              />
            </label>

            <label className="auth-field">
              <span>Contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                placeholder="••••••••"
              />
            </label>

            {isRegister && (
              <label className="auth-field">
                <span>Confirmar contraseña</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </label>
            )}

            {error ? <p className="auth-error">{error}</p> : null}

            <button type="submit" disabled={loading} className="auth-primary">
              {loading
                ? isRegister
                  ? 'Creando…'
                  : 'Entrando…'
                : isRegister
                ? 'Crear cuenta'
                : 'Iniciar sesión'}
            </button>

            <button
              type="button"
              onClick={toggleMode}
              disabled={loading}
              className="auth-link"
            >
              {isRegister ? 'Ya tengo cuenta → Iniciar sesión' : 'No tengo cuenta → Registrarme'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
