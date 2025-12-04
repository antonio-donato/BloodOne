import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, appointmentAPI } from '../../api/api';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Dashboard.css';

function DonorDashboard() {
  const { user, refreshUser } = useAuth();
  const [userData, setUserData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userResponse, appointmentsResponse] = await Promise.all([
        userAPI.getCurrentUser().catch(() => ({ data: null })),
        userAPI.getMyAppointments().catch(() => ({ data: [] })),
      ]);
      setUserData(userResponse.data);
      setAppointments(appointmentsResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDate = async (appointmentId, selectedDate) => {
    try {
      await appointmentAPI.confirmAppointment(appointmentId, selectedDate);
      toast.success('Data confermata con successo!');
      loadData();
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Error confirming appointment:', error);
      toast.error('Errore nella conferma della data');
    }
  };

  const pendingAppointment = appointments && appointments.length > 0 ? appointments.find(a => a.status === 'pending') : null;
  const confirmedAppointment = appointments && appointments.length > 0 ? appointments.find(a => a.status === 'confirmed') : null;

  if (loading) {
    return <div className="loading-container">Caricamento...</div>;
  }

  return (
    <div className="container donor-dashboard">
      <div className="dashboard-header">
        <h1>Benvenuto, {userData?.first_name}! 👋</h1>
        <div className="donation-badge">
          <span className="badge-number">{userData?.total_donations || 0}</span>
          <span className="badge-label">Donazioni Effettuate</span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Card Ultima Donazione */}
        <div className="card dashboard-card">
          <h2>📅 Ultima Donazione</h2>
          {userData?.last_donation_date ? (
            <>
              <p className="date-display">
                {new Date(userData.last_donation_date).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="days-since">
                {userData.days_since_last_donation} giorni fa
              </p>
            </>
          ) : (
            <p className="no-data">Nessuna donazione registrata</p>
          )}
        </div>

        {/* Card Prossima Scadenza Donazione Teorica */}
        <div className="card dashboard-card">
          <h2>🎯 Prossima Scadenza Donazione Teorica</h2>
          {userData?.next_due_date ? (
            <>
              <p className="date-display">
                {new Date(userData.next_due_date).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              {confirmedAppointment ? (
                <span className="status-badge confirmed">✓ Confermata</span>
              ) : pendingAppointment ? (
                <span className="status-badge pending">⏳ In attesa</span>
              ) : (
                <span className="status-badge">📆 Da programmare</span>
              )}
            </>
          ) : (
            <p className="no-data">Nessuna donazione programmata</p>
          )}
        </div>
      </div>

      {/* Appuntamento Pending - Selezione Date */}
      {pendingAppointment && (
        <div className="card appointment-selector">
          <h2>📆 Seleziona la tua data preferita</h2>
          <p className="info-text">
            L'amministratore ha proposto le seguenti date per la tua prossima donazione.
            Seleziona la data che preferisci:
          </p>

          <div className="date-options">
            {[
              pendingAppointment.proposed_date_1,
              pendingAppointment.proposed_date_2,
              pendingAppointment.proposed_date_3,
            ].map((date, index) => (
              <button
                key={index}
                className="date-option-btn"
                onClick={() => {
                  if (window.confirm(`Confermi la data del ${new Date(date).toLocaleDateString('it-IT')}?`)) {
                    handleConfirmDate(pendingAppointment.id, date);
                  }
                }}
              >
                <span className="date-day">
                  {new Date(date).toLocaleDateString('it-IT', { weekday: 'long' })}
                </span>
                <span className="date-number">
                  {new Date(date).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Appuntamento Confermato */}
      {confirmedAppointment && (
        <div className="card appointment-confirmed">
          <h2>✅ Appuntamento Confermato</h2>
          <div className="confirmed-date">
            <div className="date-icon">📅</div>
            <div className="date-info">
              <p className="date-day">
                {new Date(confirmedAppointment.confirmed_date).toLocaleDateString('it-IT', {
                  weekday: 'long'
                })}
              </p>
              <p className="date-full">
                {new Date(confirmedAppointment.confirmed_date).toLocaleDateString('it-IT', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>
          {confirmedAppointment.admin_modified && (
            <p className="admin-note">
              ⚠️ Questa data è stata modificata dall'amministratore
            </p>
          )}
          {confirmedAppointment.notes && (
            <p className="appointment-notes">
              <strong>Note:</strong> {confirmedAppointment.notes}
            </p>
          )}
        </div>
      )}

      {/* Stato Sospensione */}
      {userData?.is_suspended && (
        <div className="card suspended-alert">
          <h2>⚠️ Account Sospeso</h2>
          <p>
            Il tuo account è temporaneamente sospeso. Contatta l'amministratore per maggiori informazioni.
          </p>
        </div>
      )}
    </div>
  );
}

export default DonorDashboard;
