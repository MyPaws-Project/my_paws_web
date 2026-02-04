import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getClientById } from '../../services/clients/clients.service';
import { getPetsByClient } from '../../services/pets/pets.service';
import './clientDetails.css';

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

  if (loading) return <div className="cd-status">Cargando…</div>;

  if (error) {
    return (
      <div className="cd-page">
        <div className="cd-status">
          <p className="cd-error">{error}</p>
          <button className="btn-secondary" onClick={() => navigate('/clients')}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <button className="cd-back" onClick={() => navigate('/clients')}>
        ← Volver
      </button>

      <header className="cd-header">
        <div className="cd-titlewrap">
          <h1 className="cd-title">{client?.fullName || 'Sin nombre'}</h1>
          <div className="cd-subline">
            <span className={`pill ${client?.active === false ? 'pill-off' : 'pill-on'}`}>
              {client?.active === false ? 'Inactivo' : 'Activo'}
            </span>
          </div>
        </div>
      </header>

      <section className="card cd-card">
        <div className="cd-grid">
          <div className="cd-item">
            <div className="cd-label">Email</div>
            <div className="cd-value">{client?.email || '—'}</div>
          </div>

          <div className="cd-item">
            <div className="cd-label">Teléfono</div>
            <div className="cd-value">{client?.phone || '—'}</div>
          </div>

          {client?.address ? (
            <div className="cd-item cd-span-2">
              <div className="cd-label">Dirección</div>
              <div className="cd-value">{client.address}</div>
            </div>
          ) : null}

          {client?.notes ? (
            <div className="cd-item cd-span-2">
              <div className="cd-label">Notas</div>
              <div className="cd-value">{client.notes}</div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card cd-card">
        <div className="card-header">
          <h3 className="card-title">Mascotas</h3>
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${id}/pets/new`)}
          >
            + Nueva mascota
          </button>
        </div>

        {petsLoading ? <div className="cd-muted">Cargando mascotas…</div> : null}
        {petsError ? <p className="cd-error">{petsError}</p> : null}

        {!petsLoading && !petsError && pets.length === 0 ? (
          <div className="cd-empty">
            Este cliente todavía no tiene mascotas registradas.
          </div>
        ) : null}

        {!petsLoading && !petsError && pets.length > 0 ? (
          <div className="cd-pets">
            {pets.map((pet) => (
              <div key={pet.id} className="cd-petrow">
                <div className="cd-petmain">
                  <div className="cd-petname">{pet.name || 'Sin nombre'}</div>
                  <div className="cd-petmeta">
                    {pet.species ? pet.species : '—'}
                    {pet.breed ? ` • ${pet.breed}` : ''}
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/clients/${id}/pets/${pet.id}`)}
                >
                  Ver
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
