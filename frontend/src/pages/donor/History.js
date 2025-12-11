import React, { useState, useEffect } from 'react';
import { userAPI } from '../../api/api';
import { toast } from 'react-toastify';
import './History.css';

function DonorHistory() {
  const [donations, setDonations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('donations'); // 'donations' or 'appointments'

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const [donationsResponse, appointmentsResponse] = await Promise.all([
        userAPI.getMyDonations().catch(() => ({ data: [] })),
        userAPI.getMyAppointments().catch(() => ({ data: [] })),
      ]);
      setDonations(donationsResponse.data || []);
      setAppointments(appointmentsResponse.data || []);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Errore nel caricamento dello storico');
      setDonations([]);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { label: 'Completata', class: 'completed' },
      confirmed: { label: 'Confermata', class: 'confirmed' },
      pending: { label: 'In attesa', class: 'pending' },
      cancelled: { label: 'Annullata', class: 'cancelled' },
    };
    const config = statusConfig[status] || { label: status, class: '' };
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  if (loading) {
    return <div className="loading-container">Caricamento...</div>;
  }

  return (
    <div className="container history-page">
      <h1>📊 Storico Donazioni</h1>

      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-icon">🩸</div>
          <div className="stat-info">
            <div className="stat-number">{donations.filter(d => d.status === 'completed').length}</div>
            <div className="stat-label">Donazioni Completate</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-number">{appointments.filter(a => a.status === 'confirmed').length}</div>
            <div className="stat-label">Appuntamenti Confermati</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-number">{appointments.filter(a => a.status === 'pending').length}</div>
            <div className="stat-label">In Attesa di Conferma</div>
          </div>
        </div>
      </div>

      <div className="history-tabs">
        <button
          className={`tab-button ${activeTab === 'donations' ? 'active' : ''}`}
          onClick={() => setActiveTab('donations')}
        >
          🩸 Donazioni ({donations.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'appointments' ? 'active' : ''}`}
          onClick={() => setActiveTab('appointments')}
        >
          📅 Appuntamenti ({appointments.length})
        </button>
      </div>

      <div className="card history-content">
        {activeTab === 'donations' ? (
          <div className="donations-list">
            {donations.length === 0 ? (
              <div className="empty-state">
                <p>📭 Nessuna donazione registrata</p>
              </div>
            ) : (
              donations.map((donation) => (
                <div key={donation.id} className="history-item">
                  <div className="item-icon">🩸</div>
                  <div className="item-content">
                    <div className="item-header">
                      <h3>Donazione</h3>
                      {getStatusBadge(donation.status)}
                    </div>
                    <div className="item-date">
                      {new Date(donation.donation_date).toLocaleDateString('it-IT', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        weekday: 'long'
                      })}
                    </div>
                    {donation.notes && (
                      <div className="item-notes">
                        <strong>Note:</strong> {donation.notes}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="appointments-list">
            {appointments.length === 0 ? (
              <div className="empty-state">
                <p>📭 Nessun appuntamento trovato</p>
              </div>
            ) : (
              appointments.map((appointment) => (
                <div key={appointment.id} className="history-item">
                  <div className="item-icon">📅</div>
                  <div className="item-content">
                    <div className="item-header">
                      <h3>Appuntamento</h3>
                      {getStatusBadge(appointment.status)}
                    </div>

                    {appointment.status === 'pending' && (
                      <div className="proposed-dates">
                        <p><strong>Date proposte:</strong></p>
                        <ul>
                          <li>{new Date(appointment.proposed_date_1).toLocaleDateString('it-IT')}</li>
                          <li>{new Date(appointment.proposed_date_2).toLocaleDateString('it-IT')}</li>
                          <li>{new Date(appointment.proposed_date_3).toLocaleDateString('it-IT')}</li>
                        </ul>
                      </div>
                    )}

                    {appointment.confirmed_date && (
                      <div className="item-date">
                        <strong>Data confermata:</strong>{' '}
                        {new Date(appointment.confirmed_date).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          weekday: 'long'
                        })}
                      </div>
                    )}

                    {appointment.admin_modified && (
                      <div className="admin-modified-badge">
                        ⚠️ Modificato dall'amministratore
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="item-notes">
                        <strong>Note:</strong> {appointment.notes}
                      </div>
                    )}

                    <div className="item-created">
                      Creato il {new Date(appointment.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DonorHistory;
