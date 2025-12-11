import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminRegistrationAPI, adminUserAPI } from '../../api/api';
import { toast } from 'react-toastify';
import './RegistrationRequests.css';

function RegistrationRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showAssociateModal, setShowAssociateModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Form states
  const [approveForm, setApproveForm] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    gender: '',
    blood_type: '',
    birth_date: '',
    last_donation_date: '',
    next_appointment_date: '',
    is_active: true,
    is_admin: false,
  });
  const [associateUserId, setAssociateUserId] = useState('');
  const [rejectNote, setRejectNote] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [requestsRes, usersRes] = await Promise.all([
        adminRegistrationAPI.getRequests(filter === 'all' ? '' : filter),
        adminUserAPI.getUsers(),
      ]);
      setRequests(requestsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    // Pre-popola il form con i dati già inseriti dall'utente
    setApproveForm({
      first_name: request.first_name || '',
      last_name: request.last_name || '',
      phone_number: request.phone_number || '',
      gender: request.gender || '',
      blood_type: '',
      birth_date: request.birth_date ? request.birth_date.split('T')[0] : '',
      last_donation_date: '',
      next_appointment_date: '',
      is_active: true,
      is_admin: false,
    });
    setShowApproveModal(true);
  };

  const handleAssociate = (request) => {
    setSelectedRequest(request);
    setAssociateUserId('');
    setSearchTerm('');
    setShowAssociateModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setRejectNote('');
    setShowRejectModal(true);
  };

  const submitApprove = async () => {
    if (!approveForm.gender) {
      toast.error('Il sesso è obbligatorio');
      return;
    }

    try {
      await adminRegistrationAPI.approveRequest(selectedRequest.id, approveForm);
      toast.success('Utente creato con successo!');
      setShowApproveModal(false);
      loadData();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Errore nella creazione dell\'utente');
    }
  };

  const submitAssociate = async () => {
    if (!associateUserId) {
      toast.error('Seleziona un utente');
      return;
    }

    try {
      await adminRegistrationAPI.associateRequest(selectedRequest.id, parseInt(associateUserId));
      toast.success('Account Google associato con successo!');
      setShowAssociateModal(false);
      loadData();
    } catch (error) {
      console.error('Error associating request:', error);
      toast.error('Errore nell\'associazione');
    }
  };

  const submitReject = async () => {
    try {
      await adminRegistrationAPI.rejectRequest(selectedRequest.id, rejectNote);
      toast.success('Richiesta rifiutata');
      setShowRejectModal(false);
      loadData();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Errore nel rifiuto della richiesta');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa richiesta?')) return;

    try {
      await adminRegistrationAPI.deleteRequest(id);
      toast.success('Richiesta eliminata');
      loadData();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const filteredUsers = users.filter(u =>
    !u.google_id && (
      u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending">⏳ In Attesa</span>;
      case 'approved':
        return <span className="status-badge approved">✅ Approvata</span>;
      case 'rejected':
        return <span className="status-badge rejected">❌ Rifiutata</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
    return <div className="loading-container">Caricamento...</div>;
  }

  return (
    <div className="container registration-requests">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/admin')}>
          ← Dashboard
        </button>
        <h1>🆕 Richieste di Registrazione</h1>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          ⏳ In Attesa ({requests.filter(r => r.status === 'pending').length || 0})
        </button>
        <button
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          ✅ Approvate
        </button>
        <button
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          ❌ Rifiutate
        </button>
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          📋 Tutte
        </button>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Nessuna richiesta {filter !== 'all' ? filter : ''}</h3>
          <p>Non ci sono richieste di registrazione in questa categoria</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.id} className={`request-card ${request.status}`}>
              <div className="request-info">
                <div className="request-header">
                  <h3>{request.first_name} {request.last_name}</h3>
                  {getStatusBadge(request.status)}
                </div>
                <div className="request-details">
                  <p><strong>👤 Nome:</strong> {request.first_name} {request.last_name}</p>
                  <p><strong>📧 Email:</strong> {request.email}</p>
                  {request.phone_number && (
                    <p><strong>📱 Telefono:</strong> {request.phone_number}</p>
                  )}
                  {request.gender && (
                    <p><strong>⚧ Sesso:</strong> {request.gender === 'M' ? 'Maschio' : 'Femmina'}</p>
                  )}
                  {request.birth_date && (
                    <p><strong>🎂 Data Nascita:</strong> {new Date(request.birth_date).toLocaleDateString('it-IT')}</p>
                  )}
                  <p><strong>📅 Richiesta:</strong> {new Date(request.created_at).toLocaleString('it-IT')}</p>
                  {request.processed_at && (
                    <p><strong>✅ Processata:</strong> {new Date(request.processed_at).toLocaleString('it-IT')}</p>
                  )}
                  {request.rejection_note && (
                    <p><strong>📝 Nota:</strong> {request.rejection_note}</p>
                  )}
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button className="btn-approve" onClick={() => handleApprove(request)}>
                    ✅ Crea Nuovo Utente
                  </button>
                  <button className="btn-associate" onClick={() => handleAssociate(request)}>
                    🔗 Associa a Esistente
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(request)}>
                    ❌ Rifiuta
                  </button>
                </div>
              )}

              {request.status !== 'pending' && (
                <div className="request-actions">
                  <button className="btn-delete" onClick={() => handleDelete(request.id)}>
                    🗑️ Elimina
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Crea Nuovo Utente</h2>
              <button className="btn-close" onClick={() => setShowApproveModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <p><strong>Email:</strong> {selectedRequest.email}</p>
                <p className="info-note">I dati sotto sono stati inseriti dall'utente. Puoi modificarli se necessario.</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    required
                    value={approveForm.first_name}
                    onChange={(e) => setApproveForm({ ...approveForm, first_name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Cognome *</label>
                  <input
                    type="text"
                    required
                    value={approveForm.last_name}
                    onChange={(e) => setApproveForm({ ...approveForm, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row form-row-3">
                <div className="form-group">
                  <label>Telefono</label>
                  <input
                    type="tel"
                    value={approveForm.phone_number}
                    onChange={(e) => setApproveForm({ ...approveForm, phone_number: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Gruppo Sanguigno</label>
                  <select
                    value={approveForm.blood_type}
                    onChange={(e) => setApproveForm({ ...approveForm, blood_type: e.target.value })}
                  >
                    <option value="">Seleziona</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="0+">0+</option>
                    <option value="0-">0-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Sesso *</label>
                  <select
                    value={approveForm.gender}
                    onChange={(e) => setApproveForm({ ...approveForm, gender: e.target.value })}
                    required
                  >
                    <option value="">Seleziona</option>
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Data di Nascita</label>
                  <input
                    type="date"
                    value={approveForm.birth_date}
                    onChange={(e) => setApproveForm({ ...approveForm, birth_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Data Ultima Donazione</label>
                  <input
                    type="date"
                    value={approveForm.last_donation_date}
                    onChange={(e) => setApproveForm({ ...approveForm, last_donation_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prossimo Appuntamento</label>
                  <input
                    type="date"
                    value={approveForm.next_appointment_date}
                    onChange={(e) => setApproveForm({ ...approveForm, next_appointment_date: e.target.value })}
                  />
                  <small>Imposta/modifica la data del prossimo appuntamento confermato</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={approveForm.is_active}
                      onChange={(e) => setApproveForm({ ...approveForm, is_active: e.target.checked })}
                    />
                    Attivo
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={approveForm.is_admin}
                      onChange={(e) => setApproveForm({ ...approveForm, is_admin: e.target.checked })}
                    />
                    Amministratore
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowApproveModal(false)}>Annulla</button>
              <button className="btn-submit" onClick={submitApprove}>Crea Utente</button>
            </div>
          </div>
        </div>
      )}

      {/* Associate Modal */}
      {showAssociateModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowAssociateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔗 Associa a Utente Esistente</h2>
              <button className="btn-close" onClick={() => setShowAssociateModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box">
                <p><strong>Account Google:</strong> {selectedRequest.email}</p>
                <p>Seleziona l'utente esistente a cui associare questo account Google</p>
              </div>

              <div className="form-group">
                <label>Cerca Utente</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cerca per nome, cognome o email..."
                />
              </div>

              <div className="users-list">
                {filteredUsers.length === 0 ? (
                  <p className="no-users">Nessun utente senza account Google trovato</p>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`user-option ${associateUserId === String(user.id) ? 'selected' : ''}`}
                      onClick={() => setAssociateUserId(String(user.id))}
                    >
                      <div className="user-info">
                        <strong>{user.first_name} {user.last_name}</strong>
                        <span className="user-email">{user.email}</span>
                      </div>
                      <div className="user-meta">
                        <span className="blood-type">{user.blood_type}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAssociateModal(false)}>Annulla</button>
              <button className="btn-submit" onClick={submitAssociate} disabled={!associateUserId}>
                Associa Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>❌ Rifiuta Richiesta</h2>
              <button className="btn-close" onClick={() => setShowRejectModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="info-box warning">
                <p>Stai per rifiutare la richiesta di:</p>
                <p><strong>{selectedRequest.first_name} {selectedRequest.last_name}</strong></p>
                <p>{selectedRequest.email}</p>
              </div>

              <div className="form-group">
                <label>Nota (opzionale)</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="Motivo del rifiuto..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowRejectModal(false)}>Annulla</button>
              <button className="btn-reject-confirm" onClick={submitReject}>Rifiuta Richiesta</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RegistrationRequests;
