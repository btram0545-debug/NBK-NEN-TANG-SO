-- Giả lập môi trường Supabase tối thiểu (role anon/authenticated, auth.uid(), storage) để chạy migration trên Postgres thường.
-- CHỈ dùng cho kiểm thử trên database trống. Đừng chạy trên Supabase thật (đã có sẵn các thành phần này).
do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
create schema auth; create schema storage;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}'::jsonb);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $$;
create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
grant usage on schema public, auth, storage to anon, authenticated;
grant select, insert on storage.objects to authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on functions to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;

-- Bổ sung cho tệp seed.sql: pgcrypto và các cột/bảng GoTrue mà seed ghi vào.
create extension if not exists pgcrypto;
alter table auth.users
  add column instance_id uuid, add column aud text, add column role text, add column encrypted_password text,
  add column email_confirmed_at timestamptz, add column raw_app_meta_data jsonb, add column created_at timestamptz,
  add column updated_at timestamptz, add column confirmation_token text, add column recovery_token text,
  add column email_change_token_new text, add column email_change text;
create table auth.identities (
  id uuid primary key, user_id uuid references auth.users(id) on delete cascade, provider_id text not null,
  identity_data jsonb, provider text not null, last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz,
  unique (provider_id, provider)
);
