# BloodOne 🩸

Sistema completo di gestione appuntamenti per donazioni di sangue.

## 🌟 Caratteristiche

- **Frontend React** - UI responsive per mobile e desktop
- **Backend Go** - API REST performante
- **Autenticazione Google OAuth** - Login sicuro con account Google
- **Dashboard Amministratore** - Gestione completa donatori e appuntamenti
- **Dashboard Donatore** - Visualizzazione storico e conferma appuntamenti
- **Sistema di Notifiche** - Notifiche push per nuovi appuntamenti
- **Gestione Scadenze** - Calcolo automatico date donazione in base al sesso
- **Sistema di Sospensioni** - Gestione sospensioni temporanee donatori

## 📋 Requisiti

### Backend
- Go 1.21 o superiore
- Account Google Cloud Platform (per OAuth)

### Frontend
- Node.js 18 o superiore
- npm o yarn

## 🚀 Installazione

### 1. Configurazione Google OAuth

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto
3. Abilita l'API "Google+ API"
4. Crea credenziali OAuth 2.0:
   - Tipo applicazione: Web application
   - URI di reindirizzamento autorizzati:
     - `http://localhost:3000/auth/callback` (sviluppo)
     - `https://yourusername.github.io/BloodOne/auth/callback` (produzione)
5. Salva Client ID e Client Secret

### 2. Setup Backend

```bash
cd backend

# Installa dipendenze
go mod download

# Configura le credenziali OAuth
# Modifica backend/handlers/auth.go e inserisci:
# - YOUR_GOOGLE_CLIENT_ID
# - YOUR_GOOGLE_CLIENT_SECRET

# Avvia il server
go run main.go
```

Il backend sarà disponibile su `http://localhost:8080`

### 3. Setup Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Crea file .env
echo "REACT_APP_API_URL=http://localhost:8080/api" > .env
echo "REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID" >> .env

# Modifica frontend/src/index.js e inserisci il tuo Google Client ID

# Avvia l'applicazione
npm start
```

L'applicazione sarà disponibile su `http://localhost:3000`

## 📦 Deployment su GitHub Pages

### 1. Configura il repository

```bash
# Modifica frontend/package.json
# Cambia "homepage" con: "https://yourusername.github.io/BloodOne"

# Modifica .github/workflows/deploy.yml se necessario
```

### 2. Configura i Secrets su GitHub

Nel tuo repository GitHub, vai su Settings > Secrets and variables > Actions:

- `REACT_APP_API_URL`: URL del tuo backend in produzione

### 3. Deploy

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

GitHub Actions builderà e deployerà automaticamente l'applicazione.

### 4. Backend in Produzione

Per il backend in produzione, considera l'utilizzo di:
- **Railway** - Deploy gratuito per Go apps
- **Heroku** - Platform-as-a-Service
- **Google Cloud Run** - Serverless container
- **VPS** (DigitalOcean, Linode) - Controllo completo

Esempio deploy su Railway:
```bash
# Installa Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway up
```

Ricorda di aggiornare le CORS nel backend (`main.go`) con il dominio di produzione.

## 📖 Utilizzo

### Per Amministratori

1. **Accedi** con il tuo account Google (deve essere configurato come admin nel database)
2. **Dashboard**: visualizza donatori in scadenza
3. **Gestione Donatori**: aggiungi/modifica/sospendi donatori
4. **Proponi Date**: seleziona un donatore e proponi 3 date disponibili
5. **Gestisci Appuntamenti**: visualizza e modifica appuntamenti
6. **Configurazione**: imposta giorni disponibili e capacità

### Per Donatori

1. **Accedi** con il tuo account Google
2. **Dashboard**: visualizza le tue statistiche e prossimi appuntamenti
3. **Conferma Date**: quando l'admin propone date, seleziona la tua preferenza
4. **Profilo**: aggiorna i tuoi dati personali
5. **Storico**: visualizza tutte le tue donazioni passate

## 🔧 Configurazione

### Intervalli Donazione
- **Uomini (M)**: 3 mesi tra donazioni
- **Donne (F)**: 6 mesi tra donazioni

### Giorni Disponibili
Configurabili dall'amministratore nella sezione "Configurazione Schedule"

### Notifiche
Le notifiche vengono inviate automaticamente quando:
- L'admin propone nuove date per un donatore
- Un donatore conferma una data

## 🛠️ Tecnologie Utilizzate

### Backend
- **Go** - Linguaggio principale
- **Gin** - Web framework
- **GORM** - ORM per database
- **SQLite** - Database (facilmente sostituibile con PostgreSQL/MySQL)
- **JWT** - Autenticazione token
- **OAuth2** - Google authentication

### Frontend
- **React 18** - UI library
- **React Router** - Routing
- **Axios** - HTTP client
- **React Toastify** - Notifiche
- **React Calendar** - Componente calendario

## 📱 Responsive Design

L'applicazione è completamente responsive e ottimizzata per:
- 📱 Mobile (320px+)
- 📱 Tablet (768px+)
- 💻 Desktop (1024px+)

## 🔐 Sicurezza

- ✅ Autenticazione Google OAuth 2.0
- ✅ Token JWT per sessioni
- ✅ Middleware di autorizzazione
- ✅ Separazione ruoli Admin/Donatore
- ✅ Validazione input lato server
- ✅ CORS configurabile

## 🤝 Contribuire

Le pull request sono benvenute! Per modifiche importanti:

1. Fai fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 TODO / Roadmap

- [ ] Completare pagine admin (Users, Schedule, Appointments con UI completa)
- [ ] Implementare notifiche push reali (Firebase Cloud Messaging)
- [ ] Aggiungere esportazione PDF dello storico
- [ ] Dashboard con grafici statistiche
- [ ] Sistema di promemoria via email
- [ ] App mobile nativa (React Native)
- [ ] Supporto multi-lingua (i18n)
- [ ] Dark mode

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT.

## 👨‍💻 Autore

Creato per la gestione delle donazioni di sangue.

## 🙏 Ringraziamenti

Grazie a tutti i donatori di sangue che salvano vite ogni giorno! 🩸❤️

---

**Nota**: Ricorda di cambiare le chiavi segrete e le credenziali prima di andare in produzione!
