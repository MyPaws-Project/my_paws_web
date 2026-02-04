import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/firebase';
import { updateClinicProfile } from '../../services/firebase/auth.service';
import './clinicProfile.css';

export default function ClinicProfile() {
  const [clinicName, setClinicName] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [originalClinicName, setOriginalClinicName] = useState('');
  const [originalClinicAddress, setOriginalClinicAddress] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError('');
        setMessage('');

        const user = auth.currentUser;
        if (!user) throw new Error('Usuario no autenticado');

        const snap = await getDoc(doc(db, 'users', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          const name = data.clinicName || '';
          const address = data.clinicAddress || '';

          setClinicName(name);
          setClinicAddress(address);
          setOriginalClinicName(name);
          setOriginalClinicAddress(address);
        }
      } catch (err) {
        setError('Error cargando datos de la clínica');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleCancel = () => {
    setClinicName(originalClinicName);
    setClinicAddress(originalClinicAddress);
    setError('');
    setMessage('');
    setIsEditing(false);
  };

  const handleSave = async () => {
    setError('');
    setMessage('');

    const nameTrimmed = clinicName.trim();
    const addressTrimmed = clinicAddress.trim();

    if (!nameTrimmed) {
      setError('El nombre de la veterinaria es obligatorio');
      return;
    }

    if (!addressTrimmed) {
      setError('La dirección de la veterinaria es obligatoria');
      return;
    }

    try {
      setSaving(true);

      await updateClinicProfile({
        clinicName: nameTrimmed,
        clinicAddress: addressTrimmed,
      });

      setOriginalClinicName(nameTrimmed);
      setOriginalClinicAddress(addressTrimmed);

      setMessage('Guardado');
      setIsEditing(false);
    } catch (err) {
      setError('Error guardando cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="cp-status">Cargando perfil…</div>;

  return (
    <div className="cp-page">
      <h1 className="cp-title">Perfil de la clínica</h1>

      {error ? <p className="cp-error">{error}</p> : null}
      {message ? <p className="cp-success">{message}</p> : null}

      <div className="card cp-card">
        {!isEditing ? (
          <div className="cp-readonly">
            <div className="cp-row">
              <div className="cp-label">Nombre</div>
              <div className="cp-value">{clinicName || '—'}</div>
            </div>

            <div className="cp-row">
              <div className="cp-label">Dirección</div>
              <div className="cp-value">{clinicAddress || '—'}</div>
            </div>

            <div className="cp-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Editar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="cp-grid">
              <label className="cp-field cp-span-2">
                <span className="cp-label">Nombre de la veterinaria</span>
                <input
                  className="cp-input"
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  disabled={saving}
                />
              </label>

              <label className="cp-field cp-span-2">
                <span className="cp-label">Dirección</span>
                <input
                  className="cp-input"
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  disabled={saving}
                />
              </label>
            </div>

            <div className="cp-actions">
              <button
                type="button"
                className="btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
