import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../api/api';
import { toast } from 'react-toastify';
import './Profile.css';

function DonorProfile() {
  const { user, refreshUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    gender: 'M',
    birth_date: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await userAPI.getCurrentUser();
      setFormData({
        first_name: response.data.first_name || '',
        last_name: response.data.last_name || '',
        email: response.data.email || '',
        phone_number: response.data.phone_number || '',
        gender: response.data.gender || 'M',
        birth_date: response.data.birth_date?.split('T')[0] || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Errore nel caricamento del profilo');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await userAPI.updateProfile(formData);
      toast.success('Profilo aggiornato con successo!');
      setIsEditing(false);
      refreshUser();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Errore nell\'aggiornamento del profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="container profile-page">
      <h1>👤 Il Mio Profilo</h1>

      <div className="card profile-card">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>

            <div className="form-group">
              <label>Cognome</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                disabled={!isEditing}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email (Account Google)</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="readonly-field"
            />
            <small>Questa email è collegata al tuo account Google e non può essere modificata</small>
          </div>

          <div className="form-group">
            <label>Numero di Telefono</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              disabled={!isEditing}
              placeholder="+39 123 456 7890"
            />
          </div>

          <div className="form-group">
            <label>Data di Nascita</label>
            <input
              type="date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              disabled={!isEditing}
            />
          </div>

          <div className="form-group">
            <label>Sesso</label>
            <div className="gender-options">
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="M"
                  checked={formData.gender === 'M'}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <span>Maschio</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="gender"
                  value="F"
                  checked={formData.gender === 'F'}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
                <span>Femmina</span>
              </label>
            </div>
            <small>
              Il sesso determina l'intervallo tra le donazioni: 
              {formData.gender === 'M' ? ' 3 mesi per gli uomini' : ' 6 mesi per le donne'}
            </small>
          </div>

          <div className="form-actions">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn-primary"
              >
                ✏️ Modifica Profilo
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  className="btn-success"
                  disabled={loading}
                >
                  {loading ? 'Salvataggio...' : '💾 Salva Modifiche'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    loadProfile();
                  }}
                  className="btn-outline"
                  disabled={loading}
                >
                  ✖️ Annulla
                </button>
              </>
            )}
          </div>
        </form>
      </div>

      <div className="info-section">
        <h2>ℹ️ Informazioni utili</h2>
        <div className="info-cards">
          <div className="info-card">
            <h3>📅 Intervallo Donazioni</h3>
            <p>
              {formData.gender === 'M' 
                ? 'Come uomo, puoi donare ogni 3 mesi.' 
                : 'Come donna, puoi donare ogni 6 mesi.'}
            </p>
          </div>
          <div className="info-card">
            <h3>📧 Notifiche</h3>
            <p>
              Riceverai una notifica via email quando l'amministratore
              propone nuove date per la donazione.
            </p>
          </div>
          <div className="info-card">
            <h3>🔒 Privacy</h3>
            <p>
              I tuoi dati sono protetti e vengono utilizzati esclusivamente
              per la gestione delle donazioni.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DonorProfile;
