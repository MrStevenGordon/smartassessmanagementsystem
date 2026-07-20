-- Platform admins were only granted full bypass on schools, profiles, and
-- staff. Every other tenant-scoped table needs the same bypass so
-- super-admin onboarding (and future support work) can write across any
-- school, not just read.

create policy "platform admins manage academic_years"
  on academic_years for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage terms"
  on terms for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage grade_levels"
  on grade_levels for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage classes"
  on classes for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage subjects"
  on subjects for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage class_subject_teachers"
  on class_subject_teachers for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage user_roles"
  on user_roles for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage students"
  on students for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage student_guardians"
  on student_guardians for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "platform admins manage enrollments"
  on enrollments for all
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
