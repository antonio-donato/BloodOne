import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminScheduleAPI } from '../../api/api';
import { toast } from 'react-toastify';
import './Schedule.css';

function AdminSchedule() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Schedule state
  const [schedule, setSchedule] = useState({
    monday: false,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false,
    monday_capacity: 10,
    tuesday_capacity: 10,
    wednesday_capacity: 10,
    thursday_capacity: 10,
    friday_capacity: 10,
    saturday_capacity: 10,
    sunday_capacity: 10,
  });

  // Excluded dates state
  const [excludedDates, setExcludedDates] = useState([]);
  const [newExcludedDate, setNewExcludedDate] = useState({ date: '', reason: '' });
  const [showAddExcluded, setShowAddExcluded] = useState(false);

  const days = [
    { key: 'monday', label: 'Lunedì', capacityKey: 'monday_capacity' },
    { key: 'tuesday', label: 'Martedì', capacityKey: 'tuesday_capacity' },
    { key: 'wednesday', label: 'Mercoledì', capacityKey: 'wednesday_capacity' },
    { key: 'thursday', label: 'Giovedì', capacityKey: 'thursday_capacity' },
    { key: 'friday', label: 'Venerdì', capacityKey: 'friday_capacity' },
    { key: 'saturday', label: 'Sabato', capacityKey: 'saturday_capacity' },
    { key: 'sunday', label: 'Domenica', capacityKey: 'sunday_capacity' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, excludedRes] = await Promise.all([
        adminScheduleAPI.getSchedule(),
        adminScheduleAPI.getExcludedDates(),
      ]);

      if (scheduleRes.data) {
        setSchedule(scheduleRes.data);
      }
      setExcludedDates(excludedRes.data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Errore nel caricamento della configurazione');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayKey) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: !prev[dayKey]
    }));
  };

  const handleCapacityChange = (capacityKey, value) => {
    const numValue = parseInt(value) || 0;
    setSchedule(prev => ({
      ...prev,
      [capacityKey]: numValue
    }));
  };

  const handleSaveSchedule = async () => {
    try {
      setSaving(true);
      await adminScheduleAPI.updateSchedule(schedule);
      toast.success('Configurazione salvata con successo!');
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast.error('Errore nel salvataggio');
    } finally {
      setSaving(false);
    }
  };

  const handleAddExcludedDate = async () => {
    if (!newExcludedDate.date) {
      toast.error('Seleziona una data');
      return;
    }

    try {
      await adminScheduleAPI.addExcludedDate(newExcludedDate);
      toast.success('Data esclusa aggiunta');
      setNewExcludedDate({ date: '', reason: '' });
      setShowAddExcluded(false);
      loadData();
    } catch (error) {
      console.error('Error adding excluded date:', error);
      if (error.response?.status === 409) {
        toast.error('Questa data è già stata esclusa');
      } else {
        toast.error('Errore nell\'aggiunta della data');
      }
    }
  };

  const handleDeleteExcludedDate = async (id) => {
    if (!window.confirm('Sei sicuro di voler rimuovere questa data esclusa?')) return;

    try {
      await adminScheduleAPI.deleteExcludedDate(id);
      toast.success('Data esclusa rimossa');
      loadData();
    } catch (error) {
      console.error('Error deleting excluded date:', error);
      toast.error('Errore nella rimozione');
    }
  };

  if (loading) {
    return <div className="loading-container">Caricamento...</div>;
  }

  return (
    <div className="container admin-schedule">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/admin')}>
          ← Dashboard
        </button>
        <h1>⚙️ Configurazione</h1>
      </div>

      {/* Giorni disponibili */}
      <div className="config-section">
        <div className="section-header">
          <h2>📅 Giorni Disponibili per Donazioni</h2>
          <p>Seleziona i giorni della settimana in cui è possibile effettuare donazioni</p>
        </div>

        <div className="days-grid">
          {days.map(day => (
            <div
              key={day.key}
              className={`day-card ${schedule[day.key] ? 'active' : 'inactive'}`}
            >
              <div className="day-header">
                <label className="day-toggle">
                  <input
                    type="checkbox"
                    checked={schedule[day.key]}
                    onChange={() => handleDayToggle(day.key)}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className="day-name">{day.label}</span>
              </div>

              {schedule[day.key] && (
                <div className="day-capacity">
                  <label>Capacità massima:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={schedule[day.capacityKey]}
                    onChange={(e) => handleCapacityChange(day.capacityKey, e.target.value)}
                  />
                  <span className="capacity-label">donatori</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="section-actions">
          <button
            className="btn-save"
            onClick={handleSaveSchedule}
            disabled={saving}
          >
            {saving ? '⏳ Salvataggio...' : '💾 Salva Configurazione'}
          </button>
        </div>
      </div>

      {/* Date escluse */}
      <div className="config-section">
        <div className="section-header">
          <h2>🚫 Date Escluse</h2>
          <p>Festività o giorni in cui non sono possibili donazioni</p>
          <button
            className="btn-add"
            onClick={() => setShowAddExcluded(true)}
          >
            + Aggiungi Data
          </button>
        </div>

        {showAddExcluded && (
          <div className="add-excluded-form">
            <div className="form-row">
              <div className="form-group">
                <label>Data</label>
                <input
                  type="date"
                  value={newExcludedDate.date}
                  onChange={(e) => setNewExcludedDate(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Motivo (opzionale)</label>
                <input
                  type="text"
                  value={newExcludedDate.reason}
                  onChange={(e) => setNewExcludedDate(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Es. Natale, Ferragosto..."
                />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-cancel" onClick={() => setShowAddExcluded(false)}>
                Annulla
              </button>
              <button className="btn-confirm" onClick={handleAddExcludedDate}>
                Aggiungi
              </button>
            </div>
          </div>
        )}

        {excludedDates.length === 0 ? (
          <div className="empty-state">
            <p>Nessuna data esclusa configurata</p>
          </div>
        ) : (
          <div className="excluded-dates-list">
            {excludedDates
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map(ed => (
                <div key={ed.id} className="excluded-date-item">
                  <div className="date-info">
                    <span className="date-value">
                      📅 {new Date(ed.date).toLocaleDateString('it-IT', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                    {ed.reason && <span className="date-reason">{ed.reason}</span>}
                  </div>
                  <button
                    className="btn-delete-date"
                    onClick={() => handleDeleteExcludedDate(ed.id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="info-box">
        <h3>ℹ️ Come funziona</h3>
        <ul>
          <li><strong>Giorni disponibili:</strong> Solo nei giorni attivi verranno proposte date ai donatori</li>
          <li><strong>Capacità:</strong> Numero massimo di donatori accettati per ogni giorno</li>
          <li><strong>Date escluse:</strong> Festività o chiusure straordinarie in cui non si accettano prenotazioni</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminSchedule;
