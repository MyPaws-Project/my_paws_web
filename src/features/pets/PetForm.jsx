import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPet, getPetById, updatePet } from '../../services/pets/pets.service';
import './petForm.css';

export default function PetForm() {
  const { id: clientId, petId } = useParams();
  const isEdit = Boolean(petId);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    species: '',
    breed: '',
    sex: '',
    birthDate: '',
    notes: '',
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError('');
        setLoading(true);

        const data = await getPetById(clientId, petId);

        if (!alive) return;

        if (!data) {
          setError('Mascota no encontrada');
          return;
        }

        setForm({
          name: data.name ?? '',
          species: data.species ?? '',
          breed: data.breed ?? '',
          sex: data.sex ?? '',
          birthDate: data.birthDate ?? '',
          notes: data.notes ?? '',
        });
      } catch (e) {
        if (!alive) return;
        setError('No se pudo cargar la mascota');
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (isEdit && clientId && petId) load();

    return () => {
      alive = false;
    };
  }, [isEdit, clientId, petId]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const nameTrimmed = form.name.trim();
    if (!nameTrimmed) {
      setError('El nombre es obligatorio');
      return;
    }

    try {
      setError('');
      setSaving(true);

      if (isEdit) {
        await updatePet(clientId, petId, {
          ...form,
          name: nameTrimmed,
        });

        navigate(`/clients/${clientId}/pets/${petId}`);
      } else {
        const newId = await createPet(clientId, {
          ...form,
          name: nameTrimmed,
        });

        navigate(`/clients/${clientId}/pets/${newId}`);
      }
    } catch (err) {
      setError(isEdit ? 'No se pudo guardar los cambios' : 'No se pudo crear la mascota');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (isEdit) navigate(`/clients/${clientId}/pets/${petId}`);
    else navigate(`/clients/${clientId}`);
  };

  if (loading) return <div className="pf-status">Cargando…</div>;

  if (error && isEdit) {
    return (
      <div className="pf-page">
        <div className="pf-status">
          <p className="pf-error">{error}</p>
          <button className="btn-secondary" onClick={() => navigate(`/clients/${clientId}`)} disabled={saving}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pf-page">
      <button className="pf-back" onClick={goBack} disabled={saving}>
        ← Volver
      </button>

      <h1 className="pf-title">{isEdit ? 'Editar mascota' : 'Nueva mascota'}</h1>

      {error ? <p className="pf-error">{error}</p> : null}

      <form className="pf-form card" onSubmit={onSubmit}>
        <div className="pf-grid">
          <div className="pf-field pf-span-2">
            <label className="pf-label">Nombre *</label>
            <input
              className="pf-input"
              name="name"
              value={form.name}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label">Especie</label>
            <input
              className="pf-input"
              name="species"
              value={form.species}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label">Raza</label>
            <input
              className="pf-input"
              name="breed"
              value={form.breed}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="pf-field">
            <label className="pf-label">Sexo</label>
            <select
              className="pf-input"
              name="sex"
              value={form.sex}
              onChange={onChange}
              disabled={saving}
            >
              <option value="">—</option>
              <option value="male">Macho</option>
              <option value="female">Hembra</option>
            </select>
          </div>

          <div className="pf-field">
            <label className="pf-label">Fecha de nacimiento</label>
            <input
              className="pf-input"
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={onChange}
              disabled={saving}
            />
          </div>

          <div className="pf-field pf-span-2">
            <label className="pf-label">Notas</label>
            <textarea
              className="pf-textarea"
              name="notes"
              value={form.notes}
              onChange={onChange}
              disabled={saving}
              rows={4}
            />
          </div>
        </div>

        <div className="pf-actions">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear mascota'}
          </button>

          <button className="btn-secondary" type="button" onClick={goBack} disabled={saving}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
