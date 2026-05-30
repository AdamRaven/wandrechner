# WandRechner Pro

Berechne Wandflächen für Isolierungen – schnell, übersichtlich, mobil.

## Deployment auf Coolify

### Voraussetzungen

- Ein Coolify-Server (self-hosted oder cloud)
- Ein Git-Repository (GitHub, GitLab, etc.) mit diesem Projekt

### Schritt 1: PostgreSQL Datenbank anlegen

1. In Coolify: **New Resource → Database → PostgreSQL**
2. Wähle einen Namen (z.B. `wandrechner-db`)
3. Notiere dir die Connection-URL die Coolify generiert, z.B.:
   ```
   postgresql://postgres:PASSWORT@HOST:5432/wandrechner
   ```

### Schritt 2: Applikation erstellen

1. In Coolify: **New Resource → Application**
2. Verbinde dein Git-Repository
3. Build Pack: **Dockerfile**
4. Branch: `main` (oder dein Branch)
5. Port: `3000`

### Schritt 3: Environment Variables setzen

Unter **Environment Variables** in Coolify folgende Variablen setzen:

| Variable | Beschreibung | Beispiel |
|---|---|---|
| `DATABASE_URL` | PostgreSQL Connection String | `postgresql://postgres:PASSWORT@wandrechner-db:5432/wandrechner` |
| `NEXTAUTH_SECRET` | Zufälliger geheimer Schlüssel für Sessions | `openssl rand -base64 32` im Terminal ausführen |
| `NEXTAUTH_URL` | Die öffentliche URL deiner App | `https://wandrechner.deine-domain.de` |

**Wichtig:**
- `DATABASE_URL`: Wenn die Datenbank auf dem gleichen Coolify-Server läuft, nutze den internen Hostnamen (den Container-Namen der DB).
- `NEXTAUTH_SECRET`: Generiere einen sicheren Schlüssel mit `openssl rand -base64 32`. Niemals den Default-Wert verwenden!
- `NEXTAUTH_URL`: Muss die vollständige URL sein, unter der die App erreichbar ist (mit `https://`).

### Schritt 4: Deployen

1. Klicke auf **Deploy**
2. Die Datenbank-Migrationen laufen beim Start automatisch
3. Die App ist unter dem konfigurierten Port/Domain erreichbar

### Schritt 5: Domain zuweisen (optional)

1. Unter **Settings → Domains** eine Domain hinzufügen
2. Coolify generiert automatisch ein SSL-Zertifikat via Let's Encrypt

---

## Lokal entwickeln

```bash
# Dependencies installieren
npm install

# PostgreSQL muss laufen, dann .env anpassen:
# DATABASE_URL="postgresql://USER@localhost:5432/wandrechner"
# NEXTAUTH_SECRET="ein-secret"
# NEXTAUTH_URL="http://localhost:3000"

# Datenbank migrieren
npx prisma migrate dev

# Dev-Server starten
npm run dev
```
