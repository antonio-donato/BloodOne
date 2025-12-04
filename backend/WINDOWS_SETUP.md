# Backend Setup per Windows

## Problema: SQLite richiede CGO e GCC su Windows

### Soluzione 1: Installare MinGW-w64 (Raccomandato)

1. Scarica MinGW-w64: https://www.mingw-w64.org/downloads/
2. Oppure usa Chocolatey:
   ```powershell
   choco install mingw
   ```
3. Aggiungi MinGW al PATH:
   ```
   C:\mingw64\bin
   ```
4. Verifica:
   ```bash
   gcc --version
   ```
5. Avvia il server:
   ```bash
   cd backend
   $env:CGO_ENABLED=1
   go run main.go
   ```

### Soluzione 2: Usare Docker (Più Semplice)

Crea `backend/Dockerfile`:
```dockerfile
FROM golang:1.21-alpine
RUN apk add --no-cache gcc musl-dev sqlite-dev
WORKDIR /app
COPY . .
RUN go mod download
CMD ["go", "run", "main.go"]
```

Avvia con Docker:
```bash
docker build -t bloodone-backend .
docker run -p 8080:8080 bloodone-backend
```

### Soluzione 3: Sviluppo su Linux/WSL

Se hai WSL2 installato:
```bash
wsl
cd /mnt/c/Git/BloodOne/backend
go run main.go
```

## Per Produzione

Usa PostgreSQL invece di SQLite - non richiede CGO:

1. Cambia `go.mod`:
```go
gorm.io/driver/postgres v1.5.4
```

2. Cambia `database/database.go`:
```go
import "gorm.io/driver/postgres"

dsn := "host=localhost user=bloodone password=yourpassword dbname=bloodone port=5432"
DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
```
