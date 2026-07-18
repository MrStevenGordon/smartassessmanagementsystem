-- Core multi-tenant schema.
-- Every tenant-scoped table carries school_id and is locked down by RLS
-- against public.current_school_id(). Platform admins (super-admin) bypass
-- via public.is_platform_admin().

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Platform level (not tenant-scoped)
-- ---------------------------------------------------------------------------

create table schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  timezone text not null default 'America/Jamaica',
  address text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  school_id uuid not null references schools (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_school_id_idx on profiles (school_id);

create type app_role as enum (
  'registrar',
  'teacher',
  'parent',
  'student',
  'school_admin',
  'principal',
  'grade_supervisor'
);

-- ---------------------------------------------------------------------------
-- Academic structure
-- ---------------------------------------------------------------------------

create table academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  academic_year_id uuid not null references academic_years (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  sort_order int not null default 1
);

create table grade_levels (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  name text not null,        -- e.g. "First Form", "Lower Sixth"
  short_code text not null,  -- e.g. "7", "12"
  sort_order int not null,
  unique (school_id, short_code)
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  grade_level_id uuid not null references grade_levels (id) on delete cascade,
  academic_year_id uuid not null references academic_years (id) on delete cascade,
  name text not null, -- e.g. "1-1", "3-8", "6B2"
  homeroom_teacher_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (school_id, academic_year_id, name)
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  name text not null,
  code text not null,
  unique (school_id, code)
);

create table class_subject_teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  class_id uuid not null references classes (id) on delete cascade,
  subject_id uuid not null references subjects (id) on delete cascade,
  teacher_id uuid not null references profiles (id) on delete cascade,
  academic_year_id uuid not null references academic_years (id) on delete cascade,
  unique (class_id, subject_id, academic_year_id)
);

-- ---------------------------------------------------------------------------
-- Roles (a person can hold more than one; grade_supervisor is scoped to a
-- specific grade level)
-- ---------------------------------------------------------------------------

create table user_roles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role app_role not null,
  grade_level_id uuid references grade_levels (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role, grade_level_id)
);

create index user_roles_user_id_idx on user_roles (user_id);

-- ---------------------------------------------------------------------------
-- Students, guardians, staff (identity extension tables — kept structurally
-- close to what Smart Assess Ja expects, for a future API-based sync)
-- ---------------------------------------------------------------------------

create table students (
  id uuid primary key references profiles (id) on delete cascade,
  school_id uuid not null references schools (id) on delete cascade,
  student_number text not null,
  date_of_birth date,
  sex text,
  address text,
  admission_date date not null default current_date,
  status text not null default 'active'
    check (status in ('active', 'withdrawn', 'graduated', 'transferred')),
  qr_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  unique (school_id, student_number),
  unique (qr_token)
);

create table staff (
  id uuid primary key references profiles (id) on delete cascade,
  school_id uuid not null references schools (id) on delete cascade,
  staff_number text not null,
  position text,
  hire_date date,
  status text not null default 'active'
    check (status in ('active', 'on_leave', 'terminated')),
  unique (school_id, staff_number)
);

create table student_guardians (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  guardian_id uuid not null references profiles (id) on delete cascade,
  relationship text not null,
  is_primary_contact boolean not null default false,
  unique (student_id, guardian_id)
);

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools (id) on delete cascade,
  student_id uuid not null references students (id) on delete cascade,
  class_id uuid not null references classes (id) on delete cascade,
  academic_year_id uuid not null references academic_years (id) on delete cascade,
  enrolled_on date not null default current_date,
  status text not null default 'active'
    check (status in ('active', 'transferred', 'withdrawn')),
  created_at timestamptz not null default now(),
  unique (student_id, academic_year_id)
);

create index enrollments_class_id_idx on enrollments (class_id);
create index enrollments_student_id_idx on enrollments (student_id);
