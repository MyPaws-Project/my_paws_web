import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientById } from '../../services/clients/clients.service';
import { getPetsByClient } from '../../services/pets/pets.service';

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState('');

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError('');
        setLoading(true);

        const data = await getClientById(id);

        if (!alive) return;

        if (!data) {
          setClient(null);
          setError('Cliente no encontrado');
          return;
        }

        setClient(data);
      } catch (e) {
        if (!alive) return;
        setError('No se pudo cargar el cliente');
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    let alive = true;

    const loadPets = async () => {
      try {
        setPetsError('');
        setPetsLoading(true);

        const data = await getPetsByClient(id);

        if (!alive) return;

        setPets(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setPetsError('No se pudieron cargar las mascotas');
      } finally {
        if (alive) setPetsLoading(false);
      }
    };

    if (id) loadPets();

    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Cargando…</div>;

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button onClick={() => navigate('/clients')}>Volver</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 720 }}>
      <button onClick={() => navigate('/clients')}>← Volver</button>

      <h1 style={{ marginTop: 12 }}>{client.fullName || 'Sin nombre'}</h1>

      <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          <b>Email:</b> {client.email || '—'}
        </div>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          <b>Teléfono:</b> {client.phone || '—'}
        </div>

        <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
          <b>Estado:</b> {client.active === false ? 'Inactivo' : 'Activo'}
        </div>

        {client.address ? (
          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <b>Dirección:</b> {client.address}
          </div>
        ) : null}

        {client.notes ? (
          <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
            <b>Notas:</b> {client.notes}
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>Mascotas</h2>

          <button onClick={() => navigate(`/clients/${id}/pets/new`)}>
            + Nueva mascota
          </button>
        </div>

        <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
          {petsLoading ? <div>Cargando mascotas…</div> : null}

          {petsError ? <p style={{ color: 'crimson' }}>{petsError}</p> : null}

          {!petsLoading && !petsError && pets.length === 0 ? (
            <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 10 }}>
              Este cliente todavía no tiene mascotas registradas.
            </div>
          ) : null}

          {!petsLoading &&
            !petsError &&
            pets.length > 0 &&
            pets.map((pet) => (
              <div
                key={pet.id}
                style={{
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 10,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div>
                  <b>{pet.name || 'Sin nombre'}</b>
                  <div style={{ fontSize: 14, opacity: 0.8 }}>
                    {pet.species ? pet.species : '—'}
                    {pet.breed ? ` • ${pet.breed}` : ''}
                  </div>
                </div>

                <button onClick={() => navigate(`/clients/${id}/pets/${pet.id}`)}>
                  Ver
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
