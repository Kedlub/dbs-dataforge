# 1 Úvod

Cílem projektu je vytvoření moderní databázové aplikace pro sportovní centrum "ActiveLife", která zajistí efektivní správu rezervací sportovišť a aktivit. Nový systém nahradí dosavadní, převážně manuální řešení, které již nedostačuje rostoucím požadavkům centra. Sportovní centrum nabízí široké spektrum aktivit a dosavadní IT řešení založené na jednoduché evidenci je neflexibilní a pomalé. Nová aplikace má za cíl zefektivnit provoz, usnadnit správu informací a zlepšit uživatelskou zkušenost.

# 2 Zadání

Aplikace bude nasazena v prostředí sportovního centra "ActiveLife", které potřebuje nahradit stávající manuální systém rezervací moderním databázovým řešením. Požadavky na nový systém zahrnují:

- **Evidence a správa dat:** Záznamy o uživatelích (návštěvnících), sportovištích, aktivitách, rezervacích v časových slotech (včetně storna a úprav) a zaměstnancích (včetně směn).
- **Vstupy:** Uživatelské formuláře pro registraci, přihlášení, vytváření a úpravu rezervací, zadávání aktivit a cen.
- **Výstupy:** Reporty o využití sportovišť, seznam rezervací pro uživatele, statistiky pro plánování a marketing.
- **Uživatelské role:** Běžný uživatel (správa vlastních rezervací), Zaměstnanec (správa rezervací, provozní informace), Správce centra (plná správa systému, cen, reportů).
- **Technické požadavky:** Relační databáze (PostgreSQL), intuitivní a responzivní uživatelské rozhraní (Next.js, React, shadcn/ui, Tailwind CSS), zabezpečení (šifrovaná komunikace, NextAuth.js), verzování (Git), kontejnerizace (Docker).

# 3 Uživatelská dokumentace

## 3.1 Základní popis používané aplikace

Tato aplikace slouží ke komplexní správě rezervací sportovního centra "ActiveLife". Umožňuje uživatelům prohlížet dostupná sportoviště a aktivity, vytvářet a spravovat své rezervace online. Zaměstnancům a správcům centra poskytuje nástroje pro efektivní řízení provozu, správu kapacit, cen a generování reportů. Cílem je zjednodušit rezervační proces a poskytnout přehledné informace všem zúčastněným stranám.

## 3.2 Instalace

Aplikace je navržena pro spuštění pomocí Dockeru a Docker Compose.

1. Naklonujte repozitář projektu.
2. V kořenovém adresáři projektu spusťte příkaz `docker-compose up -d`. Tím se spustí potřebné služby (aplikační server, databáze) v kontejnerech.
3. Databáze se inicializuje automaticky včetně migrací a základních dat (seed).
4. Pro lokální vývoj bez Dockeru je potřeba mít nainstalovaný Node.js (včetně PNPM) a PostgreSQL. Závislosti se instalují pomocí `pnpm install`. Databáze se nastaví pomocí Prisma migrací (`pnpm prisma migrate dev`) a seedování (`pnpm prisma db seed`).
5. Aplikace bude dostupná na adrese `http://localhost:3000` (nebo dle konfigurace).

## 3.3 Přístupová oprávnění

Aplikace využívá systém rolí pro řízení přístupu k funkcím. Existují tři základní role:

- **Běžný uživatel:** Může se registrovat, přihlásit, spravovat svůj profil, prohlížet sportoviště/aktivity a vytvářet/spravovat vlastní rezervace.
- **Zaměstnanec:** Má práva běžného uživatele a navíc může spravovat všechny rezervace, zadávat rezervace manuálně a vidět přehledy směn.
- **Správce centra:** Má nejvyšší oprávnění, včetně všech práv zaměstnance, a navíc může spravovat uživatele, role, sportoviště, aktivity, ceny a generovat systémové reporty.

Pro testování jsou k dispozici následující ukázkové účty:

- Uživatel: `[TODO: username_user]`, Heslo: `[TODO: password_user]`
- Zaměstnanec: `[TODO: username_employee]`, Heslo: `[TODO: password_employee]`
- Správce: `[TODO: username_admin]`, Heslo: `[TODO: password_admin]`

## 3.4 Použití aplikace

Aplikace je rozdělena do několika hlavních modulů dle uživatelských rolí:

- **Veřejná část:** Úvodní obrazovka, katalog sportovišť a aktivit, registrační a přihlašovací formulář.
- **Modul pro běžné uživatele:** Osobní profil, přehled vlastních rezervací, rezervační systém (kalendář, výběr slotů), historie.
- **Modul pro zaměstnance:** Správa denních rezervací, přehled obsazenosti, manuální zadávání rezervací, správa směn.
- **Modul pro správce centra:** Správa uživatelů a rolí, správa sportovišť a aktivit, cenová politika, systémová nastavení, generování reportů, plánování směn.

Základní kroky pro rezervaci:

1. Přihlaste se nebo se zaregistrujte.
2. Přejděte do sekce rezervací nebo katalogu sportovišť/aktivit.
3. Vyberte požadované sportoviště/aktivitu a datum.
4. V kalendáři nebo seznamu vyberte volný časový slot.
5. Potvrďte rezervaci.

[TODO: Doplnit o screenshoty a detailnější popis klíčových funkcí]

# 4 Programová dokumentace

## 4.1 Datová část

Datová část aplikace je postavena na relační databázi PostgreSQL a spravována pomocí Prisma ORM. Model zahrnuje entity pro uživatele, role, zaměstnance, sportoviště, aktivity, časové sloty, rezervace, směny a další.

### 4.1.1 Analýza

Datový model byl navržen na základě analýzy požadavků sportovního centra "ActiveLife". Cílem bylo vytvořit flexibilní a škálovatelnou strukturu pro správu rezervací. Entitně-vztahový diagram (ERD) znázorňuje klíčové entity (User, Facility, Activity, Reservation, TimeSlot, Role, Employee, EmployeeShift atd.) a jejich vztahy (např. User-Reservation 1:N, Facility-TimeSlot 1:N, Facility-Activity M:N). Uživatelské rozhraní je navrženo jako responzivní webová aplikace s moduly pro různé role uživatelů.
[TODO: Vložit/odkázat na Mermaid ERD diagram]

### 4.1.2 Fyzický model dat

Fyzický model dat je definován v souboru `prisma/schema.prisma`. Tento soubor obsahuje definice všech modelů (tabulek), jejich polí (sloupců), datových typů, relací (cizích klíčů) a indexů. Prisma zajišťuje mapování mezi tímto schématem a skutečnou strukturou databáze PostgreSQL.
Klíčové tabulky zahrnují `User`, `Role`, `Facility`, `Activity`, `TimeSlot`, `Reservation`, `EmployeeShift`. Datový slovník s popisem jednotlivých tabulek a sloupců je implicitně obsažen v `schema.prisma`.
[TODO: Případně vložit ukázky z schema.prisma nebo vygenerovaný datový slovník]

### 4.1.3 Číselníky

Projekt využívá následující číselníky:

- **Role:** Tabulka `Role` definuje možné uživatelské role v systému (např. 'ADMIN', 'EMPLOYEE', 'USER'). Zdroj: Definováno v rámci projektu.
- **Status rezervace:** Enum `ReservationStatus` v `schema.prisma` (např. 'PENDING', 'CONFIRMED', 'CANCELLED'). Zdroj: Definováno v rámci projektu.
- **Status sportoviště:** Enum `FacilityStatus` v `schema.prisma` (např. 'OPEN', 'CLOSED', 'MAINTENANCE'). Zdroj: Definováno v rámci projektu.
- [TODO: Ověřit a doplnit případné další číselníky, např. typy směn]

### 4.1.4 Pohledy

V databázi jsou definovány následující pohledy pro zjednodušení dotazů a reportingu (definované v `prisma/migrations/20250420125507_add_initial_views/migration.sql`):

- `view_upcoming_reservations`: Zobrazuje detailní informace o nadcházejících potvrzených rezervacích (uživatel, sportoviště, aktivita, čas).
- `view_facility_utilization`: Agreguje data o využití jednotlivých sportovišť za určité období.
- `view_user_activity_summary`: Poskytuje souhrnné informace o aktivitách a rezervacích jednotlivých uživatelů.

[TODO: Vložit SQL kód pro každý pohled]

### 4.1.5 Funkce

Projekt využívá následující databázové funkce (definované v `prisma/migrations/20250420131104_add_db_functions/migration.sql`):

- `calculate_facility_revenue(p_facility_id UUID, p_start_date DATE, p_end_date DATE) RETURNS DECIMAL`: Kalkuluje celkové příjmy pro dané sportoviště v zadaném období z potvrzených rezervací.
- `check_user_active_reservations(p_user_id UUID) RETURNS INTEGER`: Vrací počet aktivních (budoucích potvrzených nebo čekajících) rezervací pro daného uživatele.
- `get_facility_availability_summary(p_facility_id UUID, p_check_date DATE) RETURNS TEXT`: Poskytuje textový souhrn dostupných vs. celkových časových slotů pro dané sportoviště a den.
  Tyto funkce jsou volány z aplikace pomocí `prisma.$queryRaw`.
  [TODO: Vložit SQL kód pro každou funkci]

### 4.1.6 Uložené procedury

Projekt využívá následující uložené procedury (definované v `prisma/migrations/20250420132146_add_stored_procedures/migration.sql`):

- `cancel_reservation(p_reservation_id UUID, p_cancellation_reason TEXT)`: Aktualizuje status rezervace na 'CANCELLED' a zaznamená důvod zrušení.
- `deactivate_user(p_user_id UUID)`: Nastaví příznak `is_active` uživatele na `false`. (Použito triggerem `trg_user_deactivation`).
- `assign_employee_shift(p_employee_id UUID, p_start_time TIMESTAMP WITH TIME ZONE, p_end_time TIMESTAMP WITH TIME ZONE, p_shift_type TEXT)`: Vloží novou pracovní směnu pro zaměstnance.
  Tyto procedury jsou volány z aplikace pomocí `prisma.$executeRaw` nebo `prisma.$executeRawUnsafe`.
  [TODO: Vložit SQL kód pro každou proceduru]

### 4.1.7 Spouště

V databázi jsou implementovány následující spouště (triggery):

- `trg_facility_status_change`: Spustí se po `UPDATE` operaci na tabulce `Facility`. Pokud dojde ke změně sloupce `status`, zavolá funkci `log_facility_status_change()`, která zaznamená změnu do auditní tabulky `AuditLog`. (Definováno v `prisma/migrations/20250420132723_add_audit_log_and_trigger/migration.sql`).
- `trg_user_deactivation`: Spustí se po `UPDATE` operaci na tabulce `User`. Pokud se sloupec `is_active` změní z `true` na `false`, zavolá funkci `cancel_user_future_reservations()`, která zruší všechny budoucí aktivní rezervace daného uživatele. (Definováno v `prisma/migrations/20250420132921_add_user_deactivation_trigger/migration.sql`).
  [TODO: Vložit SQL kód pro triggery a jejich funkce]

### 4.1.8 Indexy

Kromě indexů automaticky vytvářených pro primární a cizí klíče, projekt využívá explicitně definované indexy na neklíčových sloupcích pro optimalizaci výkonu dotazů (definované v `prisma/migrations/20250420143929_add_indexes/migration.sql` a `prisma/schema.prisma`):

- Index na `User(email)` pro rychlé vyhledávání uživatele podle emailu (unikátní).
- Index na `Reservation(user_id, start_time)` pro rychlé načtení rezervací konkrétního uživatele v čase.
- Index na `TimeSlot(facility_id, start_time)` pro efektivní zjišťování dostupnosti slotů pro sportoviště.
- Index na `AuditLog(timestamp)` pro rychlé řazení a filtrování auditních záznamů.
- [TODO: Ověřit a doplnit další relevantní indexy dle `schema.prisma` a migrací].
  Používají se standardní B-tree indexy.

### 4.1.9 Sekvence

Projekt primárně využívá UUID jako primární klíče, které jsou generovány na úrovni aplikace nebo databáze (např. pomocí `gen_random_uuid()`). Explicitně definované sekvence pro generování číselných ID se v současné verzi projektu nepoužívají. [TODO: Ověřit, zda opravdu žádné sekvence nejsou potřeba/použity].

## 4.2 Aplikace

Aplikační část je postavena na frameworku Next.js s využitím App Routeru. Frontend využívá React, TypeScript a komponentovou knihovnu shadcn/ui s Tailwind CSS pro stylování. Backendová logika je řešena pomocí API routes v Next.js a interaguje s databází přes Prisma ORM.

### 4.2.1 Použité prostředí

- **Framework:** Next.js (v14+ s App Router)
- **Jazyk:** TypeScript
- **Frontend:** React (v18+), shadcn/ui, Tailwind CSS, Zustand (pro state management), React Hook Form (pro formuláře), Sonner (pro notifikace)
- **Backend (API Routes):** Node.js (runtime Next.js)
- **Databáze:** PostgreSQL (v15+)
- **ORM:** Prisma (v5+)
- **Autentizace/Autorizace:** NextAuth.js (v5+)
- **Package Manager:** PNPM
- **Kontejnerizace:** Docker, Docker Compose
- **Verzování:** Git
- **Linting/Formátování:** ESLint, Prettier

### 4.2.2 Řízení uživatelských účtů

Správa uživatelských účtů a autentizace je řešena pomocí knihovny NextAuth.js. Při registraci se ukládají údaje uživatele do tabulky `User`, včetně hashe hesla (používá se bcrypt). Každý uživatel má přiřazenou roli (odkaz na tabulku `Role`), která určuje jeho oprávnění (Role-Based Access Control - RBAC). Middleware v Next.js (`src/middleware.ts`) a kontroly na úrovni API routes a serverových komponent ověřují autentizaci a autorizaci uživatele pro přístup k chráněným zdrojům a funkcím na základě jeho role.

### 4.2.3 Moduly

Aplikace je strukturována do modulů, které odpovídají hlavním funkčním oblastem a uživatelským rolím:

- **Autentizace (`src/app/(auth)`):** Registrace, přihlášení, odhlášení, obnova hesla [TODO: ověřit implementaci obnovy].
- **Správa účtu (`src/app/app/account`):** Úprava profilu, změna hesla.
- **Správa sportovišť (`src/app/app/facilities`):** Zobrazení seznamu, detailu, dostupnosti, vytváření, editace (Admin).
- **Rezervace (`src/app/app/reservations`, `src/app/app/facilities/reserve`):** Vytváření rezervací, přehled vlastních/všech rezervací.
- **Správa uživatelů (`src/app/app/users`):** Zobrazení seznamu, detailu, editace (Admin).
- **API Routes (`src/app/api`):** Backend logika pro CRUD operace a specifické akce (např. `/api/facilities`, `/api/reservations`, `/api/user/profile`).
- **Komponenty (`src/components`):** Znovu použitelné UI komponenty (specifické pro aplikaci i obecné UI prvky postavené na shadcn/ui).
- **Knihovny a utility (`src/lib`):** Databázový klient (Prisma), typy (TypeScript), utility funkce, konfigurační soubory (NextAuth).

### 4.2.4 Formuláře

Aplikace využívá minimálně dva plnohodnotné formuláře s validací vstupních polí pomocí knihovny React Hook Form a Zod pro definici schémat. Klíčové formuláře zahrnují:

- **Registrační formulář (`src/app/(auth)/auth/register/page.tsx`):** Sbírá údaje nového uživatele (jméno, příjmení, email, telefon, heslo) a provádí validaci (např. formát emailu, síla hesla, povinná pole).
- **Formulář pro vytvoření/editaci sportoviště (`src/app/app/facilities/create/page.tsx`, `src/app/app/facilities/edit/[id]/page.tsx`):** Umožňuje správcům zadávat a upravovat informace o sportovištích (název, popis, kapacita, provozní doba, status, obrázek). Zahrnuje validaci vstupů (např. číselné hodnoty pro kapacitu, validní časy).
- **Přihlašovací formulář (`src/app/(auth)/auth/login/page.tsx`)**
- **Formulář pro rezervaci (`src/app/app/facilities/reserve/[id]/page.tsx`)**
- **Formulář pro úpravu profilu (`src/app/app/account/page.tsx`)**
- [TODO: Doplnit případné další významné formuláře]
  Validace probíhá jak na straně klienta (pro okamžitou zpětnou vazbu), tak na straně serveru (v API routes) pro zajištění integrity dat.

### 4.2.5 Orientace ve zdrojovém kódu

Zdrojový kód projektu je organizován ve složce `src` a následuje konvence Next.js App Routeru:

- **`src/app/`:** Hlavní složka aplikace.
  - `(auth)/`: Route group pro autentizační stránky (login, register).
  - `api/`: Backend API routes. Každá podsložka obvykle odpovídá entitě nebo funkční oblasti (např. `api/facilities`, `api/reservations`). Obsahuje `route.ts` soubory s handlery pro HTTP metody (GET, POST, PUT, DELETE).
  - `app/`: Route group pro chráněné části aplikace dostupné po přihlášení.
    - `layout.tsx`: Hlavní layout pro přihlášené uživatele.
    - `page.tsx`: Výchozí stránka po přihlášení (dashboard).
    - Podsložky odpovídají hlavním sekcím aplikace (`facilities`, `reservations`, `account`, `users`). Stránky jsou definovány v `page.tsx`, specifické layouty v `layout.tsx`. Dynamické segmenty (např. `[id]`) slouží pro detailní stránky.
- **`src/components/`:** Znovu použitelné React komponenty.
  - `ui/`: Komponenty z shadcn/ui (generované CLI).
  - `auth/`, `facilities/`, `profile/`, etc.: Aplikačně specifické komponenty.
- **`src/lib/`:** Sdílené knihovny, utility a typy.
  - `db.ts`: Inicializace a export Prisma klienta.
  - `types.ts`: Definice TypeScript typů a rozhraní.
  - `utils.ts`: Pomocné funkce.
  - `auth.ts`: Konfigurace NextAuth.js.
- **`src/hooks/`:** Vlastní React hooky.
- **`src/providers/`:** React context providers (např. pro session, theme).
- **`prisma/`:** Soubory související s Prisma ORM.
  - `schema.prisma`: Definice datového modelu.
  - `migrations/`: Složka s SQL migračními soubory.
  - `seed.ts`: Skript pro naplnění databáze počátečními daty.
- **`public/`:** Statické soubory (obrázky, fonty).
- **Kořenový adresář:** Konfigurační soubory (`next.config.ts`, `tsconfig.json`, `package.json`, `compose.yml`, `.env`, etc.).
  Kód je formátován pomocí Prettier a kvalita je kontrolována pomocí ESLint podle konfigurace v `eslint.config.mjs`.

# 5 Závěr

Realizovaná databázová aplikace pro správu rezervací sportovního centra "ActiveLife" úspěšně nahrazuje původní systém a přináší moderní, efektivní a uživatelsky přívětivé řešení. Systém pokrývá klíčové požadavky na evidenci dat, správu rezervací, řízení uživatelských rolí a generování základních přehledů. Použití moderních technologií jako Next.js, Prisma, PostgreSQL a Docker zajišťuje dobrou výkonnost, škálovatelnost a udržovatelnost.
Aplikace zefektivňuje provoz centra, zlepšuje kontrolu nad využitím sportovišť a poskytuje lepší zákaznickou zkušenost díky snadné online správě rezervací.
Mezi možné budoucí rozšíření patří implementace online platební brány, pokročilejší reporting a analytické nástroje, mobilní aplikace nebo integrace s věrnostním programem. Kriticky lze hodnotit [TODO: Např. chybějící některé pokročilé funkce, nutnost doladění UX v některých částech - doplnit dle reality]. Celkově však aplikace představuje významný krok vpřed pro správu sportovního centra.

# Přílohy

## Backup databáze

Základní struktura a data jsou inicializována pomocí Prisma Migrate (`pnpm prisma migrate dev`) a Prisma Seed (`pnpm prisma db seed`) při startu aplikace nebo manuálně. Skripty pro seedování jsou v `prisma/seed.ts`. Plnohodnotný backup databáze lze vytvořit standardními nástroji PostgreSQL (např. `pg_dump`). [TODO: Přiložit ukázkový dump nebo seed soubor, pokud je relevantní].

## Zdrojové kódy aplikace, grafika, apod.

Kompletní zdrojové kódy aplikace jsou verzovány pomocí Gitu a jsou dostupné v [TODO: Odkaz na Git repozitář - např. GitHub, GitLab]. Grafické podklady (pokud existují mimo kód) jsou uloženy [TODO: Umístění grafiky].

## Případně ostatní

[TODO: Doplnit odkazy na ERD diagram, relevantní dokumentaci třetích stran, apod.]
