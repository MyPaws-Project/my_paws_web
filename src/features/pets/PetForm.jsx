import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPet, getPetById, updatePet } from '../../services/pets/pets.service';

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

  if (loading) return <div style={{ padding: 16 }}>Cargando…</div>;

  if (error && isEdit) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button onClick={() => navigate(`/clients/${clientId}`)} disabled={saving}>
          Volver
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <button
        onClick={() => {
          if (isEdit) navigate(`/clients/${clientId}/pets/${petId}`);
          else navigate(`/clients/${clientId}`);
        }}
        disabled={saving}
      >
        ← Volver
      </button>

      <h1 style={{ marginTop: 12 }}>{isEdit ? 'Editar mascota' : 'Nueva mascota'}</h1>

      {!isEdit && error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
      {isEdit && error ? <p style={{ color: 'crimson' }}>{error}</p> : null}

      <form onSubmit={onSubmit} style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        <div style={{ display: 'grid', gap: 6 }}>
          <label>
            <b>Nombre *</b>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            disabled={saving}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>
            <b>Especie</b>
          </label>
          <input
            name="species"
            value={form.species}
            onChange={onChange}
            disabled={saving}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>
            <b>Raza</b>
          </label>
          <input
            name="breed"
            value={form.breed}
            onChange={onChange}
            disabled={saving}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>
            <b>Sexo</b>
          </label>
          <select
            name="sex"
            value={form.sex}
            onChange={onChange}
            disabled={saving}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
          >
            <option value="">—</option>
            <option value="male">Macho</option>
            <option value="female">Hembra</option>
          </select>
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>
            <b>Fecha de nacimiento</b>
          </label>
          <input
            type="date"
            name="birthDate"
            value={form.birthDate}
            onChange={onChange}
            disabled={saving}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'grid', gap: 6 }}>
          <label>
            <b>Notas</b>
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={onChange}
            disabled={saving}
            rows={4}
            style={{ padding: 10, borderRadius: 10, border: '1px solid #ddd', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear mascota'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (isEdit) navigate(`/clients/${clientId}/pets/${petId}`);
              else navigate(`/clients/${clientId}`);
            }}
            disabled={saving}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
