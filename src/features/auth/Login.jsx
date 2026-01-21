import { useState } from 'react';
import { login, register } from '../../services/firebase/auth.service';
import { useNavigate } from 'react-router-dom';


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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        await register(email.trim(), password);
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
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
  };

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>
        {mode === 'login' ? 'Login' : 'Registro'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </label>

        {mode === 'register' && (
          <label style={{ display: 'grid', gap: 6 }}>
            Confirmar Contraseña
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </label>
        )}

        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading
            ? mode === 'login'
              ? 'Entrando…'
              : 'Creando…'
            : mode === 'login'
            ? 'Iniciar sesión'
            : 'Crear cuenta'}
        </button>

        <button
          type="button"
          onClick={toggleMode}
          disabled={loading}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          {mode === 'login'
            ? 'Registrarme'
            : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
