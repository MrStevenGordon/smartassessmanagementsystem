-- Expands student registration to match real intake requirements:
-- structured name fields, entry type, PATH/national ID numbers, medical
-- information, and a restructured guardian model where contact info no
-- longer requires a login account (not every parent/guardian has email).
-- Also adds authorized contacts (non-guardian pickup/discussion contacts).

alter table students add column first_name text;
alter table students add column middle_name text;
alter table students add column last_name text;
alter table students add column place_of_birth text;
alter table students add column address_while_attending text;
alter table students add column distance_from_school text;
alter table students add column entry_type text
  check (entry_type in ('pep', 'transfer', 'special_entry', 'ministry_placed', 'sixth_form'));
alter table students add column on_path_programme boolean not null default false;
alter table students add column path_family_number text;
alter table students add column national_student_registration_number text;
alter table students add column family_doctor_name text;
alter table students add column medical_conditions text[] not null default '{}';
alter table students add column medical_conditions_other text;

-- Guardian contact info is now stored directly (name, phone, address, etc.)
-- rather than requiring a profiles row. guardian_profile_id is filled in
-- only when a login account has actually been created for that person.
-- No existing production data depends on the old shape, so this is a clean
-- rebuild rather than a column-by-column migration.
drop table if exists student_guardians cascade;

create table student_guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  relationship_type text not null check (relationship_type in ('mother', 'father', 'guardian')),
  full_name text not null,
  address text,
  occupation text,
  phone1 text,
  phone2 text,
  email text,
  is_primary_contact boolean not null default false,
  guardian_profile_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (student_id, relationship_type)
);

alter table student_guardians enable row level security;

create policy "school members can view student_guardians"
  on student_guardians for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "registrar manages student_guardians"
  on student_guardians for all
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  )
  with check (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

create policy "platform admins manage student_guardians"
  on student_guardians for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Up to a few named people (not necessarily guardians) authorized to
-- discuss or collect the student in the guardian's absence.
create table authorized_contacts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  name text not null,
  relationship text,
  address text,
  phone text,
  created_at timestamptz not null default now()
);

alter table authorized_contacts enable row level security;

create policy "school members can view authorized_contacts"
  on authorized_contacts for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "registrar manages authorized_contacts"
  on authorized_contacts for all
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  )
  with check (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

create policy "platform admins manage authorized_contacts"
  on authorized_contacts for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
