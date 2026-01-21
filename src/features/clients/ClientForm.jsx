import { useEffect, useState } from 'react';

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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
      <label style={{ display: 'grid', gap: 6 }}>
        Nombre completo
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        Teléfono
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </label>

      <label style={{ display: 'grid', gap: 6 }}>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar cliente'}
      </button>
    </form>
  );
}
