# BloodOne Backend

Backend server per l'applicazione di gestione donazioni sangue.

## Requisiti

- Go 1.21+

## Setup

1. Installa le dipendenze:
```bash
go mod download
```

2. Configura Google OAuth:
   - Vai su [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un nuovo progetto o seleziona uno esistente
   - Abilita Google+ API
   - Crea credenziali OAuth 2.0
   - Aggiungi `http://localhost:3000/auth/callback` agli URI di reindirizzamento autorizzati
   - Copia Client ID e Client Secret nel file `handlers/auth.go`

3. Avvia il server:
```bash
go run main.go
```

Il server sarà disponibile su `http://localhost:8080`

## API Endpoints

### Autenticazione
- `GET /api/auth/google` - URL per login Google
- `GET /api/auth/callback` - Callback OAuth

### Utente
- `GET /api/me` - Informazioni utente corrente
- `PUT /api/me` - Aggiorna profilo utente
- `GET /api/me/donations` - Storico donazioni utente
- `GET /api/me/appointments` - Appuntamenti utente

### Admin - Utenti
- `GET /api/admin/users` - Lista utenti
- `POST /api/admin/users` - Crea utente
- `GET /api/admin/users/:id` - Dettagli utente
- `PUT /api/admin/users/:id` - Aggiorna utente
- `DELETE /api/admin/users/:id` - Elimina utente
- `GET /api/admin/users/expiring` - Donatori in scadenza

### Admin - Donazioni
- `GET /api/admin/donations` - Lista donazioni
- `POST /api/admin/donations` - Crea donazione
- `GET /api/admin/donors/:id/donations` - Storico donatore

### Admin - Appuntamenti
- `GET /api/admin/appointments` - Lista appuntamenti
- `POST /api/admin/appointments/propose` - Proponi date per donatore
- `POST /api/appointments/:id/confirm` - Conferma appuntamento (donatore)
- `PUT /api/admin/appointments/:id` - Modifica appuntamento

### Admin - Schedule
- `GET /api/admin/schedule` - Configurazione giorni donazione
- `PUT /api/admin/schedule` - Aggiorna configurazione
- `GET /api/admin/excluded-dates` - Date escluse
- `POST /api/admin/excluded-dates` - Aggiungi data esclusa
- `GET /api/admin/special-capacities` - Capacità speciali
- `POST /api/admin/special-capacities` - Imposta capacità speciale

### Admin - Sospensioni
- `GET /api/admin/suspensions` - Lista sospensioni
- `POST /api/admin/suspensions` - Crea sospensione
- `PUT /api/admin/suspensions/:id/end` - Termina sospensione

## Database

Il backend usa SQLite. Il file del database (`bloodone.db`) viene creato automaticamente all'avvio.
