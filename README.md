# BloodOne 🩸

Sistema completo di gestione appuntamenti per donazioni di sangue.

## 🌟 Caratteristiche

- **Frontend React** - UI responsive per mobile e desktop
- **Backend Go** - API REST performante
- **Autenticazione Google OAuth** - Login sicuro con account Google
- **Dashboard Amministratore** - Gestione completa donatori e appuntamenti
- **Dashboard Donatore** - Visualizzazione storico e conferma appuntamenti
- **Gestione Scadenze** - Calcolo automatico date donazione in base al sesso
- **Sistema di Sospensioni** - Gestione sospensioni temporanee donatori

## 📋 Requisiti

### Backend
- Go 1.21 o superiore
- Account Google Cloud Platform (per OAuth)

### Frontend
- Node.js 18 o superiore
- npm o yarn

---

## 🚀 Installazione Locale (Sviluppo)

### 1. Configurazione Google OAuth

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto (es. "BloodOne")
3. Vai su **API e servizi** → **Schermata consenso OAuth**
   - Seleziona "Esterno" e compila i campi obbligatori
4. Vai su **Credenziali** → **Crea credenziali** → **ID client OAuth 2.0**
   - Tipo applicazione: **Applicazione web**
   - Nome: "BloodOne"
   - Origini JavaScript autorizzate:
     - `http://localhost:3000`
   - URI di reindirizzamento autorizzati:
     - `http://localhost:8080/api/auth/callback`
5. Copia **Client ID** e **Client Secret**

### 2. Setup Backend

```bash
cd backend

# Installa dipendenze
go mod download

# Crea il file .env con le tue credenziali
# (copia da .env.example e modifica i valori)
cp .env.example .env
```

Modifica `backend/.env`:
```env
GOOGLE_CLIENT_ID=il-tuo-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=il-tuo-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/api/auth/callback
JWT_SECRET=una-chiave-segreta-casuale
```

Avvia il server:
```bash
go run main.go
```

Il backend sarà disponibile su `http://localhost:8080`

### 3. Setup Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Avvia l'applicazione
npm start
```

L'applicazione sarà disponibile su `http://localhost:3000`

---

## 🌐 Deploy in Produzione (GitHub Pages + Railway)

Questa guida ti mostra come deployare:
- **Frontend** → GitHub Pages (gratuito)
- **Backend** → Railway (gratuito con limiti)

### Panoramica Architettura

```
┌─────────────────────┐     HTTPS      ┌──────────────────────┐
│   GitHub Pages      │ ◄────────────► │      Railway         │
│   (Frontend React)  │                │    (Backend Go)      │
│                     │                │                      │
│ antonio-donato.     │                │ bloodone-backend.    │
│ github.io/BloodOne  │                │ railway.app          │
└─────────────────────┘                └──────────────────────┘
                                                │
                                                ▼
                                       ┌──────────────────┐
                                       │  Google OAuth    │
                                       └──────────────────┘
```

---

### STEP 1: Deploy Backend su Railway

#### 1.1 Crea account Railway
1. Vai su [railway.app](https://railway.app/)
2. Clicca **Login** → **Login with GitHub**
3. Autorizza Railway

#### 1.2 Crea nuovo progetto
1. Clicca **New Project**
2. Seleziona **Deploy from GitHub repo**
3. Cerca e seleziona il tuo repository `BloodOne`
4. Railway rileverà automaticamente il progetto

#### 1.3 Configura il build (già fatto!)
Il file `railway.toml` nella root del progetto dice a Railway di:
- Buildare dalla cartella `backend`
- Eseguire il binario Go

Non devi configurare nulla manualmente!

#### 1.4 Configura le variabili d'ambiente
1. Vai su **Variables**
2. Aggiungi le seguenti variabili:

| Variable | Value |
|----------|-------|
| `GOOGLE_CLIENT_ID` | `il-tuo-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `il-tuo-client-secret` |
| `GOOGLE_REDIRECT_URL` | `https://TUO-BACKEND.railway.app/api/auth/callback` |
| `JWT_SECRET` | `una-chiave-segreta-molto-lunga-e-casuale` |
| `PORT` | `8080` |
| `GIN_MODE` | `release` |

#### 1.5 Ottieni l'URL del backend
1. Vai su **Settings** → **Networking**
2. Clicca **Generate Domain**
3. Copia l'URL generato (es. `bloodone-backend-production.up.railway.app`)

#### 1.6 Aggiorna Google Cloud Console
Torna su Google Cloud Console e aggiungi:
- **URI di reindirizzamento autorizzati**:
  - `https://TUO-BACKEND.railway.app/api/auth/callback`

---

### STEP 2: Configura CORS nel Backend

Modifica `backend/main.go` per accettare richieste dal tuo dominio GitHub Pages:

```go
// CORS
config := cors.DefaultConfig()
config.AllowOrigins = []string{
    "http://localhost:3000",                        // Sviluppo
    "https://antonio-donato.github.io",             // Produzione
}
config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
router.Use(cors.New(config))
```

Committa e pusha le modifiche - Railway ri-deployerà automaticamente.

---

### STEP 3: Deploy Frontend su GitHub Pages

#### 3.1 Verifica package.json
Il file `frontend/package.json` deve avere:
```json
{
  "homepage": "https://antonio-donato.github.io/BloodOne",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

#### 3.2 Configura GitHub Secrets
1. Vai sul tuo repository GitHub
2. **Settings** → **Secrets and variables** → **Actions**
3. Clicca **New repository secret**
4. Aggiungi:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://TUO-BACKEND.railway.app/api` |

#### 3.3 Pusha su GitHub
```bash
git add .
git commit -m "Configure production deployment"
git push origin main
```

GitHub Actions builderà e deployerà automaticamente su GitHub Pages.

#### 3.4 Abilita GitHub Pages (prima volta)
1. Vai su **Settings** → **Pages**
2. In **Source** seleziona: **Deploy from a branch**
3. Seleziona branch: `gh-pages` e cartella `/ (root)`
4. Clicca **Save**

---

### STEP 4: Verifica il Deploy

1. **Frontend**: `https://antonio-donato.github.io/BloodOne`
2. **Backend Health Check**: `https://TUO-BACKEND.railway.app/api/admin/schedule`
3. Prova il login con Google

---

### 🔧 Troubleshooting

#### Il login Google non funziona
- Verifica che l'URI di redirect in Google Console corrisponda esattamente
- Controlla che le variabili d'ambiente su Railway siano corrette

#### CORS errors
- Verifica che il dominio GitHub Pages sia nella lista AllowOrigins
- Controlla la console del browser per dettagli

#### 404 su GitHub Pages (refresh)
Le SPA React hanno bisogno di un workaround per il routing:
```bash
# Nel frontend/public/ crea un file 404.html
cp frontend/build/index.html frontend/public/404.html
```

#### Railway deploy fallisce
- Controlla i log in Railway Dashboard
- Verifica che `backend/go.mod` esista e sia corretto

---

### 💰 Costi

| Servizio | Piano | Costo |
|----------|-------|-------|
| GitHub Pages | Free | $0 |
| Railway | Starter | $5/mese di crediti gratuiti |
| Google OAuth | Free | $0 |

Railway offre $5 di crediti gratuiti al mese, sufficienti per un'app a basso traffico.

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
- **Go 1.21** - Linguaggio principale
- **Gin** - Web framework
- **JSON File Database** - Persistenza dati senza dipendenze esterne
- **JWT** - Autenticazione token
- **OAuth2** - Google authentication
- **godotenv** - Gestione variabili d'ambiente

### Frontend
- **React 18** - UI library
- **React Router v6** - Routing
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
