-- Supports registrar student intake: a short school code (used to build
-- synthetic student login emails), a per-school sequential student number
-- counter, and a 'pending' status for accounts created but not yet
-- activated.

alter table schools add column code text;
update schools set code = lower(slug) where code is null;
alter table schools alter column code set not null;
alter table schools add constraint schools_code_unique unique (code);

alter table schools add column next_student_number integer not null default 1;

alter table students add column previous_school text;

alter table students drop constraint students_status_check;
alter table students add constraint students_status_check
  check (status in ('pending', 'active', 'withdrawn', 'graduated', 'transferred'));

-- Atomically allocates the next student number for a school and advances
-- the counter, so two simultaneous registrations can never collide.
-- SECURITY DEFINER is required because registrar/school_admin do not have
-- UPDATE access to the schools table directly.
create function public.allocate_student_number(_school_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _next int;
begin
  if _school_id <> public.current_school_id() and not public.is_platform_admin() then
    raise exception 'not authorized';
  end if;

  update schools
  set next_student_number = next_student_number + 1
  where id = _school_id
  returning next_student_number - 1 into _next;

  if _next is null then
    raise exception 'school not found';
  end if;

  return _next::text;
end;
$$;

grant execute on function public.allocate_student_number(uuid) to authenticated;
