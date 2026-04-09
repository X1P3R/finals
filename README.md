# Notes App

Aplikace pro správu poznámek s autentizací a synchronizací.

## Technologie

- Next.js (Pages Router)
- React
- TypeScript
# Notes App

Jednoduchá aplikace pro registraci, přihlášení a správu vlastních poznámek.

Použitá technologie:
- Next.js (Pages Router)
- Prisma ORM + PostgreSQL
- NextAuth (Credentials)
- Chakra UI

## Odkaz na repozitář

GitHub repo: https://github.com/X1P3R/finals.git

## Požadavky

- Node.js 20+
- Docker Desktop nebo běžící PostgreSQL
- Git

## Funkčnosti

- Registrace nových uživatelů
- Přihlášení pomocí Credentials
- Vytváření, úpravy a mazání poznámek
- Bezpečné ukládání hesel (bcrypt)

## Instalace

1. Nainstalovat závislosti

npm install

2. Vytvořit lokální env soubor podle vzoru

PowerShell:
Copy-Item .env.example .env

3. Vyplnit hodnoty v souboru .env

Vzor je v souboru .env.example.

Minimálně:
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET

Vygenerování secret:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

## Migrace, seed a lokální spuštění

1. Prisma migrace

npm run prisma:migrate

2. Prisma client

npm run prisma:generate

3. Seed demo dat

npm run seed

4. Spuštění aplikace

npm run dev

Aplikace běží na:
http://localhost:3000

## Demo účet ze seed skriptu

- jméno: admin
- heslo: ABCabc123

## Export a import poznámek

Použití přes web:
- Stránka se seznamem: /notes

## API Endpoints

- `POST /api/register` - Registrace uživatele
- `POST /api/auth/[...nextauth]` - NextAuth autentizace
- `GET/POST /api/notes` - Zisk seznam / vytvoreni poznamky
- `GET/PUT/DELETE /api/notes/[id]` - Sprava jedne poznamky
- `POST /api/notes/export` - Export poznamek
- `POST /api/notes/import` - Import poznamek

## Nastavení proměnných prostředí

Pro lokální vývoj vytvořit `.env` soubor s následujícími proměnnými:

```
DATABASE_URL=postgresql://user:password@localhost:5432/notes_app
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<vygenerované z: node -e "...">
```
- Export všech poznámek: tlačítko Export všeho

## Vývoj

Projekt používá:
- TypeScript pro typovou bezpečnost
- ESLint pro kontrolu kódu
- Prisma migrací pro databázi

### Struktura projektu

```
/lib/        - Utility funkce (auth, hash, notes, prisma)
/pages/      - Next.js stránky a API endpointy
/prisma/     - Databáze schéma a migrací
/types/      - TypeScript typové definice
/styles/     - CSS styly
/public/     - Statické soubory
```

### Spuštění vývojového serveru

```bash
npm run dev
```

Server běží na `http://localhost:3000` s hot-reload podporou.

## Troubleshooting

- **Chyba při připojení k DB**: Zkontrolovat, zda běží PostgreSQL
- **Port 3000 je obsazený**: Změnit port přes next dev -p XXXX
- **Migrací selhaly**: Spustit `npm run prisma:migrate`
- Export jedné poznámky: detail poznámky, tlačítko Export JSON
- Import poznámek: formulář Import JSON na /notes

Použití přes API:
- GET /api/notes/export
- GET /api/notes/export?id=123
- POST /api/notes/import

## Odevzdané studijní poznámky

Soubor submission-notes.json obsahuje tato témata:
1. API routy v Next.js
2. Middleware v Next.js
3. Prisma (schema + CRUD)
4. useForm (register, onSubmit)
5. NextAuth
6. Nasazení na Vercel

## Nasazení na Vercel

1. Pushnout projekt na GitHub.
2. Importovat repo do Vercel.
3. Ve Vercel nastavit Environment Variables:
   - DATABASE_URL
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
4. Spustit deploy.

Poznámka:
Pro produkci musí být databáze dostupná z internetu. Lokální localhost databáze na Vercelu fungovat nebude.
