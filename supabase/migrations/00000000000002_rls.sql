-- Row Level Security: tenant isolation + role helpers.
-- Helper functions are SECURITY DEFINER + STABLE so they can be used inside
-- policies without triggering recursive RLS lookups on profiles/user_roles.

create function public.current_school_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select school_id from profiles where id = auth.uid();
$$;

create function public.is_platform_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from platform_admins where user_id = auth.uid()
  );
$$;

create function public.has_role(_role app_role)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid() and role = _role
  );
$$;

create function public.is_grade_supervisor_for(_grade_level_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role = 'grade_supervisor'
      and grade_level_id = _grade_level_id
  );
$$;

-- ---------------------------------------------------------------------------
-- schools
-- ---------------------------------------------------------------------------

alter table schools enable row level security;

create policy "members can view their own school"
  on schools for select
  using (id = public.current_school_id() or public.is_platform_admin());

create policy "platform admins manage schools"
  on schools for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- platform_admins (only platform admins can see this table at all)
-- ---------------------------------------------------------------------------

alter table platform_admins enable row level security;

create policy "platform admins manage platform_admins"
  on platform_admins for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

alter table profiles enable row level security;

create policy "members can view profiles in their school"
  on profiles for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "users can update their own profile"
  on profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "registrar and school_admin can manage profiles"
  on profiles for all
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  )
  with check (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

create policy "platform admins manage all profiles"
  on profiles for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- generic tenant-scoped SELECT for the rest of the academic structure
-- (write access gets tightened per-table as each panel is built)
-- ---------------------------------------------------------------------------

alter table academic_years enable row level security;
alter table terms enable row level security;
alter table grade_levels enable row level security;
alter table classes enable row level security;
alter table subjects enable row level security;
alter table class_subject_teachers enable row level security;
alter table user_roles enable row level security;
alter table students enable row level security;
alter table staff enable row level security;
alter table student_guardians enable row level security;
alter table enrollments enable row level security;

create policy "school members can view academic_years"
  on academic_years for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view terms"
  on terms for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view grade_levels"
  on grade_levels for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view classes"
  on classes for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view subjects"
  on subjects for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view class_subject_teachers"
  on class_subject_teachers for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "users can view their own role rows"
  on user_roles for select
  using (user_id = auth.uid() or school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view students"
  on students for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view staff"
  on staff for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view student_guardians"
  on student_guardians for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

create policy "school members can view enrollments"
  on enrollments for select
  using (school_id = public.current_school_id() or public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- registrar / school_admin write access to identity + enrollment tables
-- ---------------------------------------------------------------------------

create policy "registrar manages students"
  on students for all
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  )
  with check (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

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

create policy "registrar manages enrollments"
  on enrollments for all
  using (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  )
  with check (
    school_id = public.current_school_id()
    and (public.has_role('registrar') or public.has_role('school_admin'))
  );

create policy "school_admin manages academic structure"
  on classes for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "school_admin manages grade_levels"
  on grade_levels for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "school_admin manages academic_years"
  on academic_years for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "school_admin manages terms"
  on terms for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "school_admin manages subjects"
  on subjects for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "school_admin manages class_subject_teachers"
  on class_subject_teachers for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "school_admin manages user_roles"
  on user_roles for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "school_admin manages staff"
  on staff for all
  using (
    school_id = public.current_school_id() and public.has_role('school_admin')
  )
  with check (
    school_id = public.current_school_id() and public.has_role('school_admin')
  );

create policy "platform admins manage staff"
  on staff for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
