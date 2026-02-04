import { useEffect, useState } from 'react';
import './clientForm.css';

export default function ClientForm({ onSubmit, loading, initialValues }) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setFullName(initialValues?.fullName ?? '');
    setPhone(initialValues?.phone ?? '');
    setEmail(initialValues?.email ?? '');
  }, [initialValues]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
    });
  };

  return (
    <form className="client-form" onSubmit={handleSubmit}>
      <div className="cf-field">
        <label className="cf-label">Nombre completo</label>
        <input
          className="cf-input"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>

      <div className="cf-field">
        <label className="cf-label">Teléfono</label>
        <input
          className="cf-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="cf-field">
        <label className="cf-label">Email</label>
        <input
          className="cf-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="cf-actions">
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Guardando…' : 'Guardar cliente'}
        </button>
      </div>
    </form>
  );
}
