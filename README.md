# DataForge - Sportovní centrum "ActiveLife"

Databázová aplikace pro správu rezervací sportovního centra vytvořená v rámci předmětu Databázové systémy 2 na UHK.

## Funkce

- 👥 **Správa uživatelů** - Registrace, přihlášení a správa rolí (admin, zaměstnanec, uživatel)
- 🏟️ **Správa sportovišť** - Evidence sportovišť, jejich kapacit a dostupnosti
- 📅 **Rezervační systém** - Intuitivní systém pro rezervace časových slotů
- 👷 **Správa směn** - Plánování směn zaměstnanců
- 📊 **Reporty** - Generování přehledů a statistik

## Technologie

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM
- **Databáze:** PostgreSQL s vlastními funkcemi, procedurami a triggery
- **Autentizace:** NextAuth.js
- **Deployment:** Docker, Docker Compose

## Instalace

1. Naklonujte repozitář:

```bash
git clone https://github.com/Kedlub/dbs-dataforge.git
cd dbs-dataforge
```

2. Nainstalujte závislosti:

```bash
pnpm install
```

3. Vytvořte soubor `.env` podle vzoru:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/activelife"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
```

4. Spusťte databázi a aplikaci pomocí Docker Compose:

```bash
docker-compose up -d
```

Alternativně pro vývoj:

```bash
pnpm prisma migrate dev  # Aplikuje migrace
pnpm prisma db seed     # Naplní databázi testovacími daty
pnpm dev                # Spustí vývojový server
```

## Testovací účty

- **Admin:** admin@activelife.cz (heslo: admin123)
- **Zaměstnanec:** zamestnanec@activelife.cz (heslo: zam123)
- **Uživatel:** petr.svoboda@example.com (heslo: user123)

## Struktura projektu

- `/src` - Zdrojové kódy Next.js aplikace
- `/prisma` - Databázový model, migrace a seed skripty
- `/public` - Statické soubory
- `/.cursor` - Dokumentace a pravidla projektu

## Tým DataForge

- Jakub Doležal
- Jakub Kyzr
- Václav Havelka

## Licence

Tento projekt je vytvořen pro vzdělávací účely v rámci předmětu Databázové systémy 2 na UHK.
