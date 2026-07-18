# School Portal

Multi-tenant school management system. Next.js (App Router) + Supabase.

## Local setup

```bash
npm install
cp .env.local.example .env.local   # fill in Supabase project URL + keys
npm run dev
```

## Database

Schema lives in `supabase/migrations/`. Apply with:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

## Structure

- `src/app` — routes, grouped by panel (registrar, teacher, parent, student, admin)
- `src/lib/supabase` — client/server/middleware Supabase helpers
- `supabase/migrations` — schema + RLS, applied in order
