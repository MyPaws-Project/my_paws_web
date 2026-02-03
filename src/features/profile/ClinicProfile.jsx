import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase/firebase';
import { updateClinicProfile } from '../../services/firebase/auth.service';

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

  if (loading) return <p>Cargando perfil…</p>;

  return (
    <div>
      <h2>Perfil de la clínica</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {!isEditing ? (
        <div>
          <p>
            <strong>Nombre:</strong> {clinicName}
          </p>
          <p>
            <strong>Dirección:</strong> {clinicAddress}
          </p>

          <button type="button" onClick={() => setIsEditing(true)}>
            Editar
          </button>
        </div>
      ) : (
        <form>
          <div>
            <label>Nombre de la veterinaria</label>
            <input
              type="text"
              value={clinicName}
              onChange={(e) => setClinicName(e.target.value)}
            />
          </div>

          <div>
            <label>Dirección</label>
            <input
              type="text"
              value={clinicAddress}
              onChange={(e) => setClinicAddress(e.target.value)}
            />
          </div>

          <button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </button>

          <button type="button" onClick={handleCancel} disabled={saving}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
