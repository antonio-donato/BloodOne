import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          🩸 BloodOne
        </Link>

        <button 
          className="navbar-toggle" 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>

        <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
          {user?.is_admin ? (
            // Menu Admin
            <>
              <Link to="/admin" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/admin/users" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Donatori
              </Link>
              <Link to="/admin/appointments" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Appuntamenti
              </Link>
              <Link to="/admin/schedule" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Configurazione
              </Link>
            </>
          ) : (
            // Menu Donatore
            <>
              <Link to="/dashboard" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/profile" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Profilo
              </Link>
              <Link to="/history" className="navbar-item" onClick={() => setMenuOpen(false)}>
                Storico
              </Link>
            </>
          )}

          <div className="navbar-user">
            <span className="navbar-username">
              {user?.first_name} {user?.last_name}
            </span>
            <button onClick={handleLogout} className="navbar-logout">
              Esci
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
