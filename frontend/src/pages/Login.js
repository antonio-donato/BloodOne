import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import { toast } from 'react-toastify';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(user.is_admin ? '/admin' : '/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    // Gestisce il callback da Google con token nell'URL
    const token = searchParams.get('token');
    if (token) {
      handleTokenLogin(token);
    }
  }, [searchParams]);

  const handleTokenLogin = async (token) => {
    console.log('handleTokenLogin called with token:', token.substring(0, 50) + '...');
    setLoading(true);
    try {
      // Decodifica il token per ottenere le info utente
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Token payload:', payload);

        // Salva il token e carica i dati utente completi
        localStorage.setItem('token', token);
        console.log('Token saved to localStorage');

        // Carica i dati utente dal backend
        console.log('Calling getCurrentUser API...');
        const response = await authAPI.getCurrentUser();
        console.log('User data received:', response.data);

        login(token, response.data);
        console.log('Login function called');

        toast.success('Login effettuato con successo!');
        const targetPath = payload.is_admin ? '/admin' : '/dashboard';
        console.log('Navigating to:', targetPath);
        navigate(targetPath);
      }
    } catch (error) {
      console.error('Token login error:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Errore durante il login. Contatta l\'amministratore.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getGoogleLoginURL();
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error getting Google login URL:', error);
      toast.error('Errore durante l\'autenticazione Google');
      setLoading(false);
    }
  };

  // Mostra loading se c'è un token nell'URL
  if (searchParams.get('token') || loading) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="loading">Autenticazione in corso...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🩸 BloodOne</h1>
          <p>Sistema di gestione donazioni sangue</p>
        </div>

        <div className="login-content">
          <h2>Accedi con il tuo account</h2>
          <p className="login-description">
            Utilizza il tuo account Google per accedere al sistema.
            Se non sei registrato, contatta l'amministratore.
          </p>

          <button onClick={handleGoogleLogin} className="btn-google" disabled={loading}>
            {loading ? (
              'Caricamento...'
            ) : (
              <>
                <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
                Accedi con Google
              </>
            )}
          </button>

          <div className="login-footer">
            <p>
              <strong>Nota:</strong> Solo gli utenti registrati dall'amministratore
              possono accedere al sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
