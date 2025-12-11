import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminUserAPI, adminAppointmentAPI, adminRegistrationAPI } from '../../api/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const [expiringDonors, setExpiringDonors] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    pendingAppointments: 0,
    pendingRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);

  // State per il modal di proposta date
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [proposedDates, setProposedDates] = useState(['', '', '']);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [showPendingPanel, setShowPendingPanel] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [expiringResponse, usersResponse, appointmentsResponse, registrationsResponse] = await Promise.all([
        adminUserAPI.getExpiring().catch(() => ({ data: [] })),
        adminUserAPI.getUsers().catch(() => ({ data: [] })),
        adminAppointmentAPI.getAppointments({ status: 'pending' }).catch(() => ({ data: [] })),
        adminRegistrationAPI.getPendingCount().catch(() => ({ data: { count: 0 } })),
      ]);

      setExpiringDonors(expiringResponse.data || []);
      const users = usersResponse.data || [];
      const appointments = appointmentsResponse.data || [];
      const pendingRegistrations = registrationsResponse.data?.count || 0;

      // Arricchisci gli appuntamenti con i dati degli utenti
      const enrichedAppointments = appointments.map(apt => {
        const donor = users.find(u => u.id === apt.donor_id);
        return { ...apt, donor };
      });
      setPendingAppointments(enrichedAppointments);

      setStats({
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active && !u.is_suspended).length,
        suspendedUsers: users.filter(u => u.is_suspended).length,
        pendingAppointments: appointments.length,
        pendingRegistrations: pendingRegistrations,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleProposeAppointment = async (donor) => {
    setSelectedDonor(donor);

    // Calcola 3 date suggerite a partire dalla data di scadenza teorica
    const baseDate = donor.next_due_date ? new Date(donor.next_due_date) : new Date();
    const today = new Date();

    // Se la data teorica è nel passato, parti da oggi
    const startDate = baseDate < today ? today : baseDate;

    // Suggerisci 3 date: la prima disponibile, +3 giorni, +7 giorni
    const date1 = new Date(startDate);
    const date2 = new Date(startDate);
    date2.setDate(date2.getDate() + 3);
    const date3 = new Date(startDate);
    date3.setDate(date3.getDate() + 7);

    setProposedDates([
      date1.toISOString().split('T')[0],
      date2.toISOString().split('T')[0],
      date3.toISOString().split('T')[0]
    ]);

    setShowProposalModal(true);
  };

  const handleDateChange = (index, value) => {
    const newDates = [...proposedDates];
    newDates[index] = value;
    setProposedDates(newDates);
  };

  const handleSubmitProposal = async () => {
    // Verifica che tutte le date siano selezionate
    if (proposedDates.some(d => !d)) {
      toast.error('Seleziona tutte e 3 le date');
      return;
    }

    // Verifica che le date siano diverse
    const uniqueDates = new Set(proposedDates);
    if (uniqueDates.size !== 3) {
      toast.error('Le 3 date devono essere diverse');
      return;
    }

    // Chiedi conferma prima di inviare
    const confirmMessage = `Confermi di voler proporre le seguenti date a ${selectedDonor.first_name} ${selectedDonor.last_name}?\n\n` +
      `📅 ${new Date(proposedDates[0]).toLocaleDateString('it-IT')}\n` +
      `📅 ${new Date(proposedDates[1]).toLocaleDateString('it-IT')}\n` +
      `📅 ${new Date(proposedDates[2]).toLocaleDateString('it-IT')}`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await adminAppointmentAPI.proposeAppointment(selectedDonor.id, {
        proposed_date_1: proposedDates[0],
        proposed_date_2: proposedDates[1],
        proposed_date_3: proposedDates[2]
      });
      toast.success('Date proposte con successo! Il donatore riceverà una notifica.');
      setShowProposalModal(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error proposing appointment:', error);
      toast.error('Errore nella proposta delle date');
    }
  };

  const handleCancelPendingAppointment = async (appointmentId) => {
    if (!window.confirm('Sei sicuro di voler annullare questa proposta di appuntamento?')) {
      return;
    }

    try {
      await adminAppointmentAPI.cancelAppointment(appointmentId);
      toast.success('Proposta annullata con successo');
      loadDashboardData();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      toast.error('Errore nell\'annullamento della proposta');
    }
  };

  const getDaysUntilDue = (nextDueDate) => {
    if (!nextDueDate) return null;
    const today = new Date();
    const due = new Date(nextDueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyClass = (days) => {
    if (days < 0) return 'overdue';
    if (days <= 3) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  if (loading) {
    return <div className="loading-container">Caricamento...</div>;
  }

  return (
    <div className="container admin-dashboard">
      <div className="dashboard-header">
        <h1>🎛️ Dashboard Amministratore</h1>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/admin/users')}>
          <div className="stat-icon users">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Donatori Totali</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/users?filter=active')}>
          <div className="stat-icon active">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.activeUsers}</div>
            <div className="stat-label">Donatori Attivi</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/users?filter=suspended')}>
          <div className="stat-icon suspended">⏸️</div>
          <div className="stat-content">
            <div className="stat-number">{stats.suspendedUsers}</div>
            <div className="stat-label">Donatori Sospesi</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/admin/appointments')}>
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <div className="stat-number">{stats.pendingAppointments}</div>
            <div className="stat-label">In Attesa Conferma</div>
          </div>
        </div>

        <div className={`stat-card ${stats.pendingRegistrations > 0 ? 'has-notifications' : ''}`} onClick={() => navigate('/admin/registration-requests')}>
          <div className="stat-icon new-users">🆕</div>
          <div className="stat-content">
            <div className="stat-number">{stats.pendingRegistrations}</div>
            <div className="stat-label">Nuovi Utenti in Attesa</div>
          </div>
          {stats.pendingRegistrations > 0 && (
            <div className="notification-badge">{stats.pendingRegistrations}</div>
          )}
        </div>
      </div>

      {/* Expiring Donors Panel */}
      <div className="card expiring-panel">
        <div className="panel-header">
          <h2>📅 Donatori in Scadenza</h2>
          <span className="panel-count">{expiringDonors.length} donatori</span>
        </div>

        {expiringDonors.length === 0 ? (
          <div className="empty-state">
            <p>✅ Nessun donatore in scadenza nelle prossime 2 settimane</p>
          </div>
        ) : (
          <div className="donors-list">
            {expiringDonors.map((donor) => {
              const daysUntilDue = getDaysUntilDue(donor.next_due_date);
              const urgencyClass = getUrgencyClass(daysUntilDue);

              return (
                <div key={donor.id} className={`donor-card ${urgencyClass}`}>
                  <div className="donor-info">
                    <div className="donor-name">
                      <strong>{donor.first_name} {donor.last_name}</strong>
                      <span className="donor-gender-badge">
                        {donor.gender === 'M' ? '♂️ M' : '♀️ F'}
                      </span>
                    </div>
                    <div className="donor-details">
                      <span>📧 {donor.email}</span>
                      {donor.phone_number && <span>📱 {donor.phone_number}</span>}
                    </div>
                    <div className="donor-donation-info">
                      <div className="info-item">
                        <span className="info-label">Ultima donazione:</span>
                        <span className="info-value">
                          {donor.last_donation_date
                            ? new Date(donor.last_donation_date).toLocaleDateString('it-IT')
                            : 'Mai'}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Totale donazioni:</span>
                        <span className="info-value">{donor.total_donations}</span>
                      </div>
                    </div>
                  </div>

                  <div className="donor-actions">
                    <div className="due-date-badge">
                      {daysUntilDue < 0 ? (
                        <span className="overdue-text">
                          ⚠️ Scaduto da {Math.abs(daysUntilDue)} giorni
                        </span>
                      ) : daysUntilDue === 0 ? (
                        <span className="today-text">📅 Scade oggi</span>
                      ) : (
                        <span>
                          📅 Scade tra {daysUntilDue} giorni
                          <small>{new Date(donor.next_due_date).toLocaleDateString('it-IT')}</small>
                        </span>
                      )}
                    </div>

                    <button
                      className="btn-propose"
                      onClick={() => handleProposeAppointment(donor)}
                    >
                      📆 Proponi Date
                    </button>

                    <button
                      className="btn-view-details"
                      onClick={() => navigate(`/admin/users?selected=${donor.id}`)}
                    >
                      👁️ Dettagli
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Appointments Panel */}
      <div className="pending-panel">
        <h2>⏳ In Attesa di Conferma ({pendingAppointments.length})</h2>
        {pendingAppointments.length === 0 ? (
          <p className="no-pending">Nessun donatore in attesa di conferma</p>
        ) : (
          <div className="pending-list">
            {pendingAppointments.map((appointment) => (
              <div key={appointment.id} className="pending-card">
                <div className="pending-info">
                  <div className="pending-name">
                    <strong>
                      {appointment.user?.first_name} {appointment.user?.last_name}
                    </strong>
                    <span className="blood-type-mini">
                      {appointment.user?.blood_type || '?'}
                    </span>
                  </div>
                  <div className="pending-dates">
                    <span className="pending-label">Date proposte:</span>
                    <div className="proposed-dates-list">
                      {appointment.proposed_date_1 && (
                        <span className="proposed-date">
                          📅 {new Date(appointment.proposed_date_1).toLocaleDateString('it-IT')}
                        </span>
                      )}
                      {appointment.proposed_date_2 && (
                        <span className="proposed-date">
                          📅 {new Date(appointment.proposed_date_2).toLocaleDateString('it-IT')}
                        </span>
                      )}
                      {appointment.proposed_date_3 && (
                        <span className="proposed-date">
                          📅 {new Date(appointment.proposed_date_3).toLocaleDateString('it-IT')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pending-since">
                    Inviato il: {new Date(appointment.created_at).toLocaleDateString('it-IT')}
                  </div>
                </div>
                <div className="pending-actions">
                  <button
                    className="btn-view-details"
                    onClick={() => navigate(`/admin/users?selected=${appointment.user_id}`)}
                  >
                    👁️ Dettagli
                  </button>
                  <button
                    className="btn-cancel-pending"
                    onClick={() => handleCancelPendingAppointment(appointment.id)}
                  >
                    ❌ Annulla
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Azioni Rapide</h2>
        <div className="actions-grid">
          <button className="action-card" onClick={() => navigate('/admin/users')}>
            <div className="action-icon">➕</div>
            <div className="action-label">Aggiungi Donatore</div>
          </button>

          <button className="action-card" onClick={() => navigate('/admin/appointments')}>
            <div className="action-icon">📋</div>
            <div className="action-label">Gestisci Appuntamenti</div>
          </button>

          <button className="action-card" onClick={() => navigate('/admin/schedule')}>
            <div className="action-icon">⚙️</div>
            <div className="action-label">Configura Schedule</div>
          </button>

          <button className="action-card" onClick={() => loadDashboardData()}>
            <div className="action-icon">🔄</div>
            <div className="action-label">Aggiorna Dati</div>
          </button>
        </div>
      </div>

      {/* Modal Proposta Date */}
      {showProposalModal && selectedDonor && (
        <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
          <div className="modal-content proposal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📆 Proponi Date Donazione</h2>
              <button className="btn-close" onClick={() => setShowProposalModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="donor-summary">
                <h3>{selectedDonor.first_name} {selectedDonor.last_name}</h3>
                <p>
                  <span className="donor-gender-badge">
                    {selectedDonor.gender === 'M' ? '♂️ Maschio (3 mesi)' : '♀️ Femmina (6 mesi)'}
                  </span>
                </p>
                <p className="theoretical-date">
                  <strong>Data scadenza teorica:</strong>{' '}
                  {selectedDonor.next_due_date
                    ? new Date(selectedDonor.next_due_date).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Non disponibile'}
                </p>
              </div>

              <div className="dates-selection">
                <p className="dates-instructions">
                  Seleziona 3 date da proporre al donatore. Le date suggerite partono dalla scadenza teorica.
                </p>

                <div className="date-inputs">
                  <div className="date-input-group">
                    <label>📅 Prima opzione</label>
                    <input
                      type="date"
                      value={proposedDates[0]}
                      onChange={(e) => handleDateChange(0, e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="date-input-group">
                    <label>📅 Seconda opzione</label>
                    <input
                      type="date"
                      value={proposedDates[1]}
                      onChange={(e) => handleDateChange(1, e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="date-input-group">
                    <label>📅 Terza opzione</label>
                    <input
                      type="date"
                      value={proposedDates[2]}
                      onChange={(e) => handleDateChange(2, e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowProposalModal(false)}>
                Annulla
              </button>
              <button className="btn-submit" onClick={handleSubmitProposal}>
                ✉️ Invia Proposta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
