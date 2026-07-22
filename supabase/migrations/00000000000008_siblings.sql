-- Siblings claimed during registration: stored on the submission as
-- entered, verified against the students table (active/graduated only),
-- and recorded as a lasting relational link once the application is
-- approved (useful for future record-keeping and cross-referencing).

alter table registration_submissions add column siblings jsonb not null default '[]';

create table student_siblings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  sibling_student_id uuid not null references students (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (student_id, sibling_student_id)
);

alter table student_siblings enable row level security;

create policy "school members can view student_siblings"
  on student_siblings for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "registrar manages student_siblings"
  on student_siblings for all
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  )
  with check (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

create policy "platform admins manage student_siblings"
  on student_siblings for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
