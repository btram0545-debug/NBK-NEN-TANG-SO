-- School Digital Platform
-- Apply with Supabase CLI in a controlled environment.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student','supervisor','counselor','admin');
create type public.incident_severity as enum ('normal','serious','urgent');
create type public.incident_status as enum ('submitted','triaging','assigned','in_progress','need_info','resolved','archived');
create type public.incident_type as enum ('physical_violence','emotional_violence','cyberbullying','harassment','safety','other');
create type public.counseling_status as enum ('pending','assigned','in_progress','need_info','resolved','archived');
create type public.suggestion_visibility as enum ('private','public');
create type public.suggestion_status as enum ('pending','published','hidden','resolved');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text,
  student_code text,
  class_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.users(id) on delete set null,
  anonymous_token uuid not null default gen_random_uuid(),
  incident_type public.incident_type not null,
  severity public.incident_severity not null default 'normal',
  title text,
  description text not null,
  incident_time timestamptz,
  location text,
  status public.incident_status not null default 'submitted',
  assigned_to uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.incident_evidence (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents(id) on delete cascade,
  storage_path text not null,
  file_type text,
  file_size bigint,
  checksum text,
  encrypted boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.counseling_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.users(id) on delete set null,
  anonymous_token uuid not null default gen_random_uuid(),
  category text not null,
  title text,
  description text not null,
  urgency public.incident_severity not null default 'normal',
  status public.counseling_status not null default 'pending',
  counselor_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.counseling_appointments (
  id uuid primary key default gen_random_uuid(),
  counseling_request_id uuid not null references public.counseling_requests(id) on delete cascade,
  counselor_id uuid not null references public.users(id),
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 30,
  meeting_type text not null default 'in_person',
  meeting_url text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

create table public.private_case_notes (
  id uuid primary key default gen_random_uuid(),
  counseling_request_id uuid not null references public.counseling_requests(id) on delete cascade,
  counselor_id uuid not null references public.users(id),
  note_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suggestions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.users(id) on delete set null,
  is_anonymous boolean not null default false,
  title text not null,
  content text not null,
  category text not null,
  visibility public.suggestion_visibility not null default 'private',
  status public.suggestion_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.suggestion_votes (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(suggestion_id, user_id)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.users enable row level security;
alter table public.incidents enable row level security;
alter table public.incident_evidence enable row level security;
alter table public.counseling_requests enable row level security;
alter table public.counseling_appointments enable row level security;
alter table public.private_case_notes enable row level security;
alter table public.suggestions enable row level security;
alter table public.suggestion_votes enable row level security;
alter table public.audit_logs enable row level security;

-- Helper functions
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_role() in ('supervisor','counselor','admin');
$$;

-- Users
create policy "users_read_self"
on public.users for select
to authenticated
using (id = auth.uid());

create policy "admin_manage_users"
on public.users for all
to authenticated
using (public.current_user_role() = 'admin')
with check (public.current_user_role() = 'admin');

-- Incidents
create policy "students_create_incidents"
on public.incidents for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "students_read_own_incidents"
on public.incidents for select
to authenticated
using (reporter_id = auth.uid());

create policy "staff_read_incidents"
on public.incidents for select
to authenticated
using (public.is_staff());

create policy "staff_update_incidents"
on public.incidents for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Evidence
create policy "incident_evidence_staff_or_owner"
on public.incident_evidence for select
to authenticated
using (
  exists (
    select 1 from public.incidents i
    where i.id = incident_id
      and (i.reporter_id = auth.uid() or public.is_staff())
  )
);

-- Counseling
create policy "student_create_counseling"
on public.counseling_requests for insert
to authenticated
with check (student_id = auth.uid());

create policy "student_read_own_counseling"
on public.counseling_requests for select
to authenticated
using (student_id = auth.uid());

create policy "staff_read_counseling"
on public.counseling_requests for select
to authenticated
using (public.is_staff());

create policy "staff_update_counseling"
on public.counseling_requests for update
to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Private notes: counselor assigned or admin
create policy "counselor_read_private_notes"
on public.private_case_notes for select
to authenticated
using (
  counselor_id = auth.uid()
  or public.current_user_role() = 'admin'
);

create policy "counselor_write_private_notes"
on public.private_case_notes for all
to authenticated
using (
  counselor_id = auth.uid()
  or public.current_user_role() = 'admin'
)
with check (
  counselor_id = auth.uid()
  or public.current_user_role() = 'admin'
);

-- Suggestions
create policy "students_create_suggestions"
on public.suggestions for insert
to authenticated
with check (author_id = auth.uid() or is_anonymous = true);

create policy "public_suggestions_read"
on public.suggestions for select
to authenticated
using (visibility = 'public' or author_id = auth.uid() or public.is_staff());

create policy "suggestion_vote"
on public.suggestion_votes for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Audit logs: read restricted to admin
create policy "admin_read_audit_logs"
on public.audit_logs for select
to authenticated
using (public.current_user_role() = 'admin');

-- Do not allow client-side arbitrary audit insertion.
-- Write audit events through trusted server/Edge Functions.
