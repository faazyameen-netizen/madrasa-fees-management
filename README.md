# Madrasa Fees Management — Students Module

A Vite + React frontend with **no custom backend** — it talks straight to a
PostgreSQL database hosted on **Supabase**, using Supabase's auto-generated
API. Fully working: Add, Edit, View, Delete, Search, Filter, Pagination.

> Why Supabase and not "raw Postgres"? A browser app cannot open a direct
> TCP connection to PostgreSQL — there's no Postgres driver that runs in a
> browser, and shipping DB credentials in your frontend bundle would be
> unsafe anyway. Supabase gives you real Postgres + a safe, public REST/JS
> API in front of it, so "frontend + Postgres, no backend" is achievable
> exactly the way you asked for.

---

## 1. Create a Supabase project

1. Go to https://supabase.com and sign up / log in (free tier is enough).
2. Click **New Project**. Pick any name, set a database password (save it
   somewhere), choose a region close to you, and create the project.
3. Wait ~1-2 minutes for it to finish provisioning.

## 2. Create the `students` table

1. In your Supabase project, open the left sidebar → **SQL Editor**.
2. Click **New query**.
3. Open `supabase_setup.sql` (included in this zip), copy its entire
   contents, paste into the SQL editor, and click **Run**.
4. This creates the `students` table, enables row-level security with a
   permissive policy (so the frontend can read/write using the public
   anon key), and inserts 5 sample rows matching the screenshots you sent.

You can verify it worked: sidebar → **Table Editor** → you should see a
`students` table with 5 rows.

## 3. Get your API keys

1. In Supabase: sidebar → **Project Settings** → **API**.
2. Copy the **Project URL** and the **anon public key**.

## 4. Configure the frontend

1. In this project folder, copy `.env.example` to a new file named `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and paste in your values:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

## 5. Install & run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173). You should see
the Students list page, pre-populated with the 5 sample students.

To build for production:
```bash
npm run build
npm run preview   # preview the production build locally
```

---

## What's included

- **Students list page** (`/`) — search by name/roll no/phone, filter by
  course/category/status, paginated table, view (modal), edit, delete
  (with confirmation).
- **Add Student page** (`/students/add`) and **Edit Student page**
  (`/students/edit/:id`) — same form, matching your screenshot, validates
  required fields (Full Name, Roll No) and phone format before saving.
- All data operations (Create, Read, Update, Delete) go straight from
  React to Supabase via `@supabase/supabase-js` — see
  `src/supabaseClient.js` and the two page files in `src/pages/`.

The other sidebar items (Dashboard, Courses, Fees Desk, Invoices,
Payments, Reports, Scholarship, Settings) are shown for visual context
only and are not wired up — only **Students** is functional in this build.

## Security note

The anon key is meant to be public (it's designed to be embedded in
frontend code), but the SQL script's RLS policy allows **anyone** with
your project URL + anon key to read/write the `students` table — there's
no login. That's appropriate for a private internal tool, but if you ever
deploy this somewhere public, add Supabase Auth and tighten the policy to
require an authenticated session.
