import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listHistoryEntries, deleteHistoryEntry } from '../../../services/pets/medicalHistory.service';
import './medicalHistoryList.css';

export default function MedicalHistoryList() {
  const { id: clientId, petId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorKey, setErrorKey] = useState('');

  const load = async () => {
    try {
      setErrorKey('');
      setLoading(true);
      const data = await listHistoryEntries(clientId, petId);
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErrorKey('medicalHistory.list.errors.load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId && petId) load();
  }, [clientId, petId]);

  const handleDelete = async (entryId) => {
    const ok = window.confirm(t('medicalHistory.list.confirm.delete'));
    if (!ok) return;

    try {
      setSaving(true);
      await deleteHistoryEntry(clientId, petId, entryId);
      await load();
    } catch (e) {
      setErrorKey('medicalHistory.list.errors.delete');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="mh-status">{t('medicalHistory.list.status.loading')}</div>;

  if (errorKey) {
    return (
      <div className="mh-page">
        <div className="mh-status">
          <p className="mh-error">{t(errorKey)}</p>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
            disabled={saving}
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mh-page">
      <header className="mh-header">
        <div className="mh-headings">
          <h1 className="mh-title">{t('medicalHistory.list.title')}</h1>
        </div>

        <div className="mh-actions">
          <button
            className="btn-primary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history/new`)}
            disabled={saving}
          >
            {t('medicalHistory.list.actions.add')}
          </button>

          <button
            className="btn-secondary"
            onClick={() => navigate(`/clients/${clientId}/pets/${petId}`)}
            disabled={saving}
          >
            {t('common.back')}
          </button>
        </div>
      </header>

      {items.length === 0 ? (
        <div className="card mh-empty">{t('medicalHistory.list.empty')}</div>
      ) : (
        <div className="mh-list">
          {items.map((x) => {
            const photoCount = Array.isArray(x.photos) ? x.photos.length : 0;

            return (
              <div key={x.id} className="card mh-item">
                <div className="mh-item-top">
                  <div className="mh-main">
                    <div className="mh-date">{x.date || t('medicalHistory.list.values.noDate')}</div>

                    <div className="mh-reason">
                      {x.reason || t('medicalHistory.list.values.noReason')}
                      {photoCount > 0 ? <span className="mh-badge">📷 {photoCount}</span> : null}
                    </div>
                  </div>

                  <div className="mh-item-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history/${x.id}`)}
                      disabled={saving}
                    >
                      {t('common.view')}
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => navigate(`/clients/${clientId}/pets/${petId}/history/${x.id}/edit`)}
                      disabled={saving}
                    >
                      {t('common.edit')}
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(x.id)}
                      disabled={saving}
                    >
                      {t('medicalHistory.list.actions.delete')}
                    </button>
                  </div>
                </div>

                <div className="mh-details">
                  {x.diagnosis ? (
                    <p className="mh-line">
                      <b>{t('medicalHistory.list.labels.diagnosis')}:</b> {x.diagnosis}
                    </p>
                  ) : null}

                  {x.treatment ? (
                    <p className="mh-line">
                      <b>{t('medicalHistory.list.labels.treatment')}:</b> {x.treatment}
                    </p>
                  ) : null}

                  {x.notes ? (
                    <p className="mh-line mh-notes">
                      <b>{t('medicalHistory.list.labels.notes')}:</b> {x.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
