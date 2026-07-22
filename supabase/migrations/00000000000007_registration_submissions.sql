-- Parents submit applications themselves; registrars review, edit if
-- needed, then approve (assigning grade level + class, which is when the
-- actual student record gets created) or decline (with an optional reason
-- the parent can see and act on by resubmitting).

create table registration_submissions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  submitted_by uuid not null references profiles (id) on delete cascade,
  status text not null default 'submitted'
    check (status in ('submitted', 'approved', 'declined')),
  decline_reason text,
  reviewed_by uuid references profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  first_name text not null,
  middle_name text,
  last_name text not null,
  date_of_birth date not null,
  sex text,
  place_of_birth text,
  address text,
  city_or_town text,
  parish text check (parish in (
    'Kingston', 'St. Andrew', 'St. Catherine', 'Clarendon', 'Manchester',
    'St. Elizabeth', 'Westmoreland', 'Hanover', 'St. James', 'Trelawny',
    'St. Ann', 'St. Mary', 'Portland', 'St. Thomas'
  )),
  address_while_attending text,
  distance_from_school text,
  entry_type text
    check (entry_type in ('pep', 'transfer', 'special_entry', 'ministry_placed', 'sixth_form')),
  previous_school text,
  on_path_programme boolean not null default false,
  path_family_number text,
  national_student_registration_number text,
  family_doctor_name text,
  medical_conditions text[] not null default '{}',
  medical_conditions_other text,

  guardians jsonb not null default '[]',
  primary_contact text,
  authorized_contacts jsonb not null default '[]',

  approved_student_id uuid references students (id) on delete set null
);

create index registration_submissions_school_id_idx on registration_submissions (school_id);
create index registration_submissions_submitted_by_idx on registration_submissions (submitted_by);

alter table registration_submissions enable row level security;

create policy "parents view their own submissions"
  on registration_submissions for select
  using (submitted_by = auth.uid());

create policy "parents create their own submissions"
  on registration_submissions for insert
  with check (
    submitted_by = auth.uid() and school_id = public.current_school_id()
  );

create policy "parents update their own unapproved submissions"
  on registration_submissions for update
  using (submitted_by = auth.uid() and status in ('submitted', 'declined'))
  with check (submitted_by = auth.uid() and status in ('submitted', 'declined'));

create policy "registrar views school submissions"
  on registration_submissions for select
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

create policy "registrar manages school submissions"
  on registration_submissions for update
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  )
  with check (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

create policy "platform admins manage submissions"
  on registration_submissions for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
