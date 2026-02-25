import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { getClientById } from "../../services/clients/clients.service";
import { getPetsByClient } from "../../services/pets/pets.service";

import "./clientDetails.css";

export default function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pets, setPets] = useState([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState("");

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        setError("");
        setLoading(true);

        const data = await getClientById(id);

        if (!alive) return;

        if (!data) {
          setClient(null);
          setError(t("clients.details.notFound"));
          return;
        }

        setClient(data);
      } catch (e) {
        if (!alive) return;
        setError(t("clients.details.loadError"));
      } finally {
        if (alive) setLoading(false);
      }
    };

    if (id) load();

    return () => {
      alive = false;
    };
  }, [id, t]);

  useEffect(() => {
    let alive = true;

    const loadPets = async () => {
      try {
        setPetsError("");
        setPetsLoading(true);

        const data = await getPetsByClient(id);

        if (!alive) return;

        setPets(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setPetsError(t("clients.details.pets.loadError"));
      } finally {
        if (alive) setPetsLoading(false);
      }
    };

    if (id) loadPets();

    return () => {
      alive = false;
    };
  }, [id, t]);

  if (loading) {
    return (
      <div className="cd-page">
        <div className="cd-status">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cd-page">
        <div className="cd-status">
          <p className="cd-error">{error}</p>
          <button className="btn-secondary" onClick={() => navigate("/clients")}>
            {t("clients.details.back")}
          </button>
        </div>
      </div>
    );
  }

  const isInactive = client?.active === false;

  return (
    <div className="cd-page">
      <button className="cd-back" onClick={() => navigate("/clients")}>
        ← {t("common.back")}
      </button>

      <header className="cd-header">
        <div className="cd-titlewrap">
          <h1 className="cd-title">{client?.fullName || t("common.unnamed")}</h1>

          <div className="cd-subline">
            <span className={`pill ${isInactive ? "pill-off" : "pill-on"}`}>
              {isInactive ? t("common.inactive") : t("common.active")}
            </span>
          </div>
        </div>
      </header>

      <section className="card cd-card">
        <div className="cd-grid">
          <div className="cd-item">
            <div className="cd-label">{t("common.email")}</div>
            <div className="cd-value">{client?.email || "—"}</div>
          </div>

          <div className="cd-item">
            <div className="cd-label">{t("common.phone")}</div>
            <div className="cd-value">{client?.phone || "—"}</div>
          </div>

          {client?.address ? (
            <div className="cd-item cd-span-2">
              <div className="cd-label">{t("common.address")}</div>
              <div className="cd-value">{client.address}</div>
            </div>
          ) : null}

          {client?.notes ? (
            <div className="cd-item cd-span-2">
              <div className="cd-label">{t("common.notes")}</div>
              <div className="cd-value">{client.notes}</div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="card cd-card">
        <div className="card-header">
          <h3 className="card-title">{t("clients.details.sections.pets")}</h3>

          <button className="btn-primary" onClick={() => navigate(`/clients/${id}/pets/new`)}>
            {t("clients.details.actions.newPet")}
          </button>
        </div>

        {petsLoading ? <div className="cd-muted">{t("clients.details.pets.loading")}</div> : null}
        {petsError ? <p className="cd-error">{petsError}</p> : null}

        {!petsLoading && !petsError && pets.length === 0 ? (
          <div className="cd-empty">{t("clients.details.pets.empty")}</div>
        ) : null}

        {!petsLoading && !petsError && pets.length > 0 ? (
          <div className="cd-pets">
            {pets.map((pet) => (
              <div key={pet.id} className="cd-petrow">
                <div className="cd-petmain">
                  <div className="cd-petname">{pet.name || t("common.unnamed")}</div>
                  <div className="cd-petmeta">
                    {pet.species ? pet.species : "—"}
                    {pet.breed ? ` • ${pet.breed}` : ""}
                  </div>
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => navigate(`/clients/${id}/pets/${pet.id}`)}
                >
                  {t("common.view")}
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}