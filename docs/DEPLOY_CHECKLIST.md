# Deploy checklist Fantacalcetto

Checklist pratica per preparare e verificare il deploy di Fantacalcetto.

## Obiettivo deploy

- Pubblicare una build Next.js stabile e verificata.
- Collegare correttamente Prisma a Supabase Postgres.
- Abilitare Supabase Auth per admin e utenti normali.
- Rendere disponibili le pagine pubbliche, utente e admin senza esporre segreti o dati non pubblicati.
- Preparare l'import server-side dei giocatori da API-Football.

## Prerequisiti

- Repository aggiornato localmente.
- Node.js compatibile con il progetto.
- Dipendenze installate.
- Accesso a:
  - progetto Supabase
  - database Supabase Postgres
  - pannello hosting
  - API-Football
- Admin applicativo già definito o piano chiaro per collegare il primo admin.

## Variabili ambiente richieste

Configurare almeno queste variabili nel provider di hosting e in locale per i test:

- `DATABASE_URL`
- `DIRECT_URL` se usata dalla configurazione Prisma o dalle migration
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` se ancora mantenuta come fallback
- `API_FOOTBALL_KEY`
- `API_FOOTBALL_SERIE_A_LEAGUE_ID`
- `API_FOOTBALL_SEASON`
- `API_FOOTBALL_REQUEST_DELAY_MS`
- `API_FOOTBALL_MAX_TEAMS_PER_RUN`
- `API_FOOTBALL_START_TEAM_INDEX`

### Risultato atteso

- Tutte le variabili sono presenti nel pannello deploy.
- Nessun segreto usa prefisso `NEXT_PUBLIC` se non deve finire nel frontend.
- `.env` locale non è committato.

## Supabase database

### Cosa verificare

- Istanza Postgres disponibile.
- `DATABASE_URL` punta al database corretto.
- `DIRECT_URL`, se usata, punta a una connessione compatibile con migration/schema operations.
- Credenziali corrette nel provider di deploy.

### Risultato atteso

- Prisma riesce a collegarsi al database.
- Le query runtime funzionano.
- Le migration possono essere applicate con `migrate deploy`.

### Edge case

- `DATABASE_URL` con pooler e `DIRECT_URL` mancante: alcune operazioni Prisma potrebbero fallire.
- Credenziali differenti tra ambiente locale e produzione.

## Supabase Auth redirect URL

### Cosa verificare

- URL applicazione di produzione registrato in Supabase Auth.
- Eventuali URL preview/staging registrati se usati.
- Redirect di login, signup, confirm e reset password coerenti.

### Risultato atteso

- Login, signup, logout e reset password funzionano in produzione.
- I redirect non portano a host sbagliati o URL locali.

### Verifiche pratiche

- Controllare i redirect per:
  - `/login`
  - `/signup`
  - `/auth/confirm`
  - `/forgot-password`
  - `/reset-password`

## API-Football

### Cosa verificare

- `API_FOOTBALL_KEY` configurata solo lato server.
- Stagione (`API_FOOTBALL_SEASON`) impostata.
- Rate limit mitigato con `API_FOOTBALL_REQUEST_DELAY_MS`.
- Finestra di import configurabile con:
  - `API_FOOTBALL_MAX_TEAMS_PER_RUN`
  - `API_FOOTBALL_START_TEAM_INDEX`

### Risultato atteso

- Gli script API-Football funzionano senza esporre la chiave.
- L'import è idempotente e gestibile a blocchi.

## Build e controlli locali

### Comandi

```bash
npm run check:all
npm run build
npm run prisma:generate
```

### Risultato atteso

- `check:all` passa.
- `build` passa.
- Il client Prisma viene generato correttamente.

### Edge case

- Se il DB remoto non è raggiungibile, la parte DB-backed di alcuni check può essere skippata. La build comunque deve passare.

## Migration Prisma

### Comandi

```bash
npx prisma migrate deploy
npm run prisma:generate
```

### Cosa verificare

- Tutte le migration sono già committate.
- Nessuna migration locale non revisionata.
- `migrate deploy` viene eseguito nell'ambiente target prima del traffico reale.

### Risultato atteso

- Schema DB allineato al codice deployato.
- Nessun uso di `migrate dev` in produzione.

## Creazione/admin iniziale

### Cosa verificare

- Esiste almeno un utente Supabase Auth usabile.
- L'utente admin applicativo è collegato via `authUserId`.
- Se necessario, usare lo script:

```bash
npm run auth:link-admin
```

### Risultato atteso

- Il primo admin riesce ad accedere a `/admin`.
- Un utente normale non ottiene privilegi admin.

## Hosting consigliato

### Consiglio operativo

- Frontend/app: Vercel o hosting compatibile Next.js App Router.
- Database/Auth: Supabase.
- Deploy script/import terminali: ambiente Node controllato o CLI locale.

### Cosa verificare

- Supporto alle env vars.
- Supporto alle route dinamiche Next.js.
- Build command corretto.
- Node version coerente.

## Configurazione dominio

### Cosa verificare

- Dominio di produzione collegato correttamente.
- HTTPS attivo.
- Redirect URL Supabase aggiornati con il dominio finale.
- Eventuale sottodominio admin non richiesto: l'area admin resta sotto `/admin`.

### Risultato atteso

- Homepage, login, pagine pubbliche e callback auth usano il dominio finale corretto.

## Prima di andare online

- `.env` non committato.
- Repository pulita o con modifiche consapevoli e revisionate.
- Migration applicate.
- Redirect Supabase corretti.
- Admin testato.
- Signup/login testati.
- Pagine pubbliche testate.
- `npm run check:all` eseguito sull'ultima revisione da deployare.
- `npm run build` eseguito con successo.
- Eventuale `npm run db:seed` deciso consapevolmente: sì solo se si vuole dati demo.
- Eventuale `npm run players:import-api-football` pianificato per popolare i giocatori.

## Smoke test post-deploy

### Browser

- homepage `/`
- signup `/signup`
- login `/login`
- `/leagues`
- `/me`
- `/admin` con account admin
- creazione lega da admin
- join lega da utente
- gestione rosa
- calendario lega
- pagina giornata pubblica

### Risultato atteso

- Le route rispondono correttamente.
- Nessun errore 500 o redirect errato.
- Le sezioni pubbliche non mostrano dati non pubblicati.

## Sicurezza

### Cosa verificare

- Nessun segreto esposto nel client bundle.
- Nessuna variabile sensibile con prefisso `NEXT_PUBLIC` salvo quelle previste da Supabase client-side.
- Area `/admin` protetta.
- Server actions admin bloccate per utenti non admin.
- Server actions utente limitate a team propri, salvo admin.
- Nessun `.env` nel repository.

### Risultato atteso

- Admin e permessi funzionano come in locale.
- Nessuna escalation di privilegi da UI pubblica.

## Rollback base

### Strategia minima

1. Tenere disponibile il precedente deploy stabile.
2. Se il problema è solo applicativo, fare rollback al deploy precedente.
3. Se il problema è dati/configurazione:
   - verificare env vars
   - verificare migration applicate
   - verificare redirect Supabase
4. Evitare rollback manuali distruttivi sul database senza piano.

### Nota pratica

- Le migration Prisma in produzione vanno considerate forward-only salvo piano esplicito.
- Non fare reset del database come scorciatoia.

## Problemi comuni

### Login o signup non funzionano

- Verificare `NEXT_PUBLIC_SUPABASE_URL`
- Verificare `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- Verificare redirect URL in Supabase

### Admin non accede a `/admin`

- Verificare `User.authUserId`
- Verificare `User.role = ADMIN`
- Verificare eventuale uso di `npm run auth:link-admin`

### Prisma non si connette

- Verificare `DATABASE_URL`
- Verificare `DIRECT_URL` se usata
- Verificare rete/firewall/pooler Supabase

### Migration non applicate

- Eseguire:

```bash
npx prisma migrate deploy
npm run prisma:generate
```

### Import API-Football fallisce

- Verificare `API_FOOTBALL_KEY`
- Verificare `API_FOOTBALL_SEASON`
- Aumentare `API_FOOTBALL_REQUEST_DELAY_MS`
- Ridurre `API_FOOTBALL_MAX_TEAMS_PER_RUN`
- Riprendere con `API_FOOTBALL_START_TEAM_INDEX`

### Dati demo non desiderati in produzione

- Non eseguire `npm run db:seed` su produzione a meno che sia voluto.
- Usare `db:seed` solo in ambienti demo/staging o in setup controllati.

## Comandi di riferimento

```bash
npm run check:all
npm run build
npm run prisma:generate
npx prisma migrate deploy
npm run players:import-api-football
npm run db:seed
```
