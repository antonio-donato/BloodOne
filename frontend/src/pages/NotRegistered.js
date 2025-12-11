import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import api from '../api/api';
import './NotRegistered.css';

function NotRegistered() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') || '';
  const googleName = searchParams.get('name') || '';
  const googleFirstName = searchParams.get('first_name') || '';
  const googleLastName = searchParams.get('last_name') || '';
  const googleId = searchParams.get('google_id') || '';
  const hasPendingRequest = searchParams.get('pending') === 'true';
  const requestDate = searchParams.get('request_date') || '';

  // Se non abbiamo first_name/last_name separati, proviamo a splittare name
  let initialFirstName = googleFirstName;
  let initialLastName = googleLastName;

  if (!initialFirstName && !initialLastName && googleName) {
    const parts = googleName.split(' ');
    initialFirstName = parts[0] || '';
    initialLastName = parts.slice(1).join(' ') || '';
  }

  // Se ha già una richiesta pendente, mostra direttamente lo stato 'pending'
  const [step, setStep] = useState(hasPendingRequest ? 'pending' : 'info'); // 'info' | 'form' | 'sent' | 'pending'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: initialFirstName,
    last_name: initialLastName,
    phone_number: '',
    gender: '',
    birth_date: '',
  });

  // Formatta la data della richiesta
  const formatRequestDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.gender) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/registration-request', {
        email,
        google_id: googleId,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        gender: formData.gender,
        birth_date: formData.birth_date,
      });
      setStep('sent');
      toast.success('Richiesta inviata con successo!');
    } catch (error) {
      console.error('Error submitting request:', error);
      if (error.response?.status === 409) {
        toast.info('Hai già inviato una richiesta. Attendi la risposta dell\'amministratore.');
        setStep('pending');
      } else {
        toast.error('Errore nell\'invio della richiesta');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step: Richiesta già pendente
  if (step === 'pending') {
    return (
      <div className="not-registered-container">
        <ToastContainer position="top-center" />
        <div className="not-registered-card">
          <div className="not-registered-icon">⏳</div>
          <h1>Richiesta in Attesa</h1>

          <div className="pending-box">
            <p>
              La tua richiesta di registrazione per l'account <strong>{email}</strong> è già stata inviata ed è attualmente <strong>in fase di valutazione</strong>.
            </p>
            {requestDate && (
              <p className="request-date">
                📅 Inviata il: <strong>{formatRequestDate(requestDate)}</strong>
              </p>
            )}
          </div>

          <div className="pending-info">
            <h3>🔔 Cosa succede ora?</h3>
            <ul>
              <li>Un amministratore esaminerà la tua richiesta</li>
              <li>Riceverai una notifica quando sarai approvato</li>
              <li>Dopo l'approvazione potrai accedere al sistema</li>
            </ul>
          </div>

          <a href="/login" className="btn-back-login">
            ← Torna al Login
          </a>
        </div>
      </div>
    );
  }

  // Step: Info iniziale
  if (step === 'info') {
    return (
      <div className="not-registered-container">
        <ToastContainer position="top-center" />
        <div className="not-registered-card">
          <div className="not-registered-icon">👋</div>
          <h1>Benvenuto!</h1>

          <div className="not-registered-message">
            <p>
              L'account <strong>{email}</strong> non è ancora registrato nel sistema.
            </p>
            <p>
              Per diventare un donatore, completa il modulo di richiesta e attendi l'approvazione dell'amministratore.
            </p>
          </div>

          <button className="btn-request" onClick={() => setStep('form')}>
            📝 Richiedi Registrazione
          </button>

          <a href="/login" className="btn-back-login">
            ← Torna al Login
          </a>
        </div>
      </div>
    );
  }

  // Step: Form di richiesta
  if (step === 'form') {
    return (
      <div className="not-registered-container">
        <ToastContainer position="top-center" />
        <div className="not-registered-card wide">
          <div className="not-registered-icon">📝</div>
          <h1>Richiesta di Registrazione</h1>

          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-info-box">
              <p>📧 <strong>Email:</strong> {email}</p>
              <small>L'email non può essere modificata</small>
            </div>

            <div className="form-note highlight">
              <p>⚠️ Inserisci il tuo <strong>nome e cognome reale</strong>, non quello dell'account Google.</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Il tuo nome"
                  required
                />
              </div>

              <div className="form-group">
                <label>Cognome *</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Il tuo cognome"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Telefono</label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder="Es. 333 1234567"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sesso *</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  required
                >
                  <option value="">Seleziona...</option>
                  <option value="M">Maschio</option>
                  <option value="F">Femmina</option>
                </select>
              </div>

              <div className="form-group">
                <label>Data di Nascita</label>
                <input
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                />
              </div>
            </div>

            <div className="form-note">
              <p>* Campi obbligatori</p>
              <p>L'intervallo tra le donazioni dipende dal sesso: 3 mesi per i maschi, 6 mesi per le femmine.</p>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-back" onClick={() => setStep('info')}>
                ← Indietro
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? '⏳ Invio in corso...' : '📤 Invia Richiesta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step: Richiesta inviata
  return (
    <div className="not-registered-container">
      <ToastContainer position="top-center" />
      <div className="not-registered-card">
        <div className="not-registered-icon">✅</div>
        <h1>Richiesta Inviata!</h1>

        <div className="not-registered-message success">
          <p>
            La tua richiesta di registrazione è stata inviata con successo.
          </p>
          <p>
            <strong>Cosa succede ora?</strong>
          </p>
          <ol>
            <li>L'amministratore riceverà la tua richiesta</li>
            <li>Verificherà i tuoi dati</li>
            <li>Dopo l'approvazione, potrai accedere all'app</li>
          </ol>
        </div>

        <div className="waiting-box">
          <div className="waiting-icon">⏳</div>
          <p>In attesa di approvazione</p>
        </div>

        <a href="/login" className="btn-back-login">
          ← Torna al Login
        </a>
      </div>
    </div>
  );
}

export default NotRegistered;
