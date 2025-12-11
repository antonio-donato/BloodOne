import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminUserAPI } from '../../api/api';
import { toast } from 'react-toastify';
import './Users.css';

function AdminUsers() {
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState(initialFilter);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    blood_type: '',
    gender: '',
    birth_date: '',
    last_donation_date: '',
    next_appointment_date: '',
    is_active: true,
    is_admin: false,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await adminUserAPI.getUsers();
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Errore nel caricamento degli utenti');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'active') {
        filtered = filtered.filter(u => u.is_active && !u.is_suspended);
      } else if (filterStatus === 'suspended') {
        filtered = filtered.filter(u => u.is_suspended);
      } else if (filterStatus === 'inactive') {
        filtered = filtered.filter(u => !u.is_active);
      }
    }

    setFilteredUsers(filtered);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone_number: user.phone_number || '',
      blood_type: user.blood_type || '',
      gender: user.gender || '',
      birth_date: user.birth_date?.split('T')[0] || '',
      last_donation_date: user.last_donation_date?.split('T')[0] || '',
      next_appointment_date: user.next_appointment_date?.split('T')[0] || '',
      is_active: user.is_active ?? true,
      is_admin: user.is_admin || false,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      blood_type: '',
      gender: '',
      birth_date: '',
      last_donation_date: '',
      next_appointment_date: '',
      is_active: true,
      is_admin: false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.gender) {
      toast.error('Il sesso è obbligatorio');
      return;
    }

    try {
      if (editingUser) {
        await adminUserAPI.updateUser(editingUser.id, formData);
        toast.success('Utente aggiornato con successo');
      } else {
        await adminUserAPI.createUser(formData);
        toast.success('Utente creato con successo');
      }
      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || 'Errore nel salvataggio');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo utente?')) return;

    try {
      await adminUserAPI.deleteUser(userId);
      toast.success('Utente eliminato');
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Errore nell\'eliminazione');
    }
  };

  const handleToggleSuspension = async (user) => {
    try {
      await adminUserAPI.updateUser(user.id, { is_suspended: !user.is_suspended });
      toast.success(user.is_suspended ? 'Utente riattivato' : 'Utente sospeso');
      loadUsers();
    } catch (error) {
      console.error('Error toggling suspension:', error);
      toast.error('Errore nell\'operazione');
    }
  };

  if (loading) {
    return <div className="loading-container">Caricamento...</div>;
  }

  return (
    <div className="container admin-users">
      <div className="page-header">
        <h1>👥 Gestione Donatori</h1>
        <button className="btn btn-primary" onClick={handleCreate}>
          + Nuovo Utente
        </button>
      </div>

      <div className="filters-bar">
        <input
          type="text"
          placeholder="🔍 Cerca per nome o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">Tutti</option>
          <option value="active">Attivi</option>
          <option value="suspended">Sospesi</option>
          <option value="inactive">Inattivi</option>
        </select>
      </div>

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Gruppo</th>
              <th>Telefono</th>
              <th>Stato</th>
              <th>Ultima Donazione</th>
              <th>Prossimo Appuntamento</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id}>
                <td>
                  {user.first_name} {user.last_name}
                  {user.is_admin && <span className="badge badge-admin">Admin</span>}
                </td>
                <td>{user.email}</td>
                <td>{user.blood_type || '-'}</td>
                <td>{user.phone_number || '-'}</td>
                <td>
                  {user.is_suspended ? (
                    <span className="badge badge-suspended">Sospeso</span>
                  ) : user.is_active ? (
                    <span className="badge badge-active">Attivo</span>
                  ) : (
                    <span className="badge badge-inactive">Inattivo</span>
                  )}
                </td>
                <td>{user.last_donation_date ? new Date(user.last_donation_date).toLocaleDateString('it-IT') : 'Mai'}</td>
                <td>
                  {user.next_appointment_date ? (
                    <span style={{color: '#667eea', fontWeight: '600'}}>
                      📅 {new Date(user.next_appointment_date).toLocaleDateString('it-IT')}
                    </span>
                  ) : '-'}
                </td>
                <td className="actions-cell">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEdit(user)}
                    title="Modifica"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-suspend"
                    onClick={() => handleToggleSuspension(user)}
                    title={user.is_suspended ? 'Riattiva' : 'Sospendi'}
                  >
                    {user.is_suspended ? '✅' : '🚫'}
                  </button>
                  {!user.is_admin && (
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(user.id)}
                      title="Elimina"
                    >
                      🗑️
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="empty-state">
            <p>Nessun utente trovato</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? 'Modifica Utente' : 'Nuovo Utente'}</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Cognome *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={editingUser !== null}
                />
              </div>

              <div className="form-row form-row-3">
                <div className="form-group">
                  <label>Telefono</label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Gruppo Sanguigno</label>
                  <select
                    value={formData.blood_type}
                    onChange={(e) => setFormData({...formData, blood_type: e.target.value})}
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
                    value={formData.gender}
                    onChange={(e) => setFormData({...formData, gender: e.target.value})}
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
                    value={formData.birth_date}
                    onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Data Ultima Donazione</label>
                  <input
                    type="date"
                    value={formData.last_donation_date}
                    onChange={(e) => setFormData({...formData, last_donation_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Prossimo Appuntamento</label>
                  <input
                    type="date"
                    value={formData.next_appointment_date}
                    onChange={(e) => setFormData({...formData, next_appointment_date: e.target.value})}
                  />
                  <small>Imposta/modifica la data del prossimo appuntamento confermato</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    />
                    Attivo
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_admin}
                      onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
                    />
                    Amministratore
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Annulla
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Salva Modifiche' : 'Crea Utente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
