-- Thông báo cho quản sinh ngay khi học sinh gửi báo cáo.
-- Phân công và chuyển BGH tiếp tục được thông báo trong RPC staff_update_case.
create or replace function public.notify_new_incident()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, category, title, body, link)
    select id,
      'incident',
      case when new.severity = 'urgent' then 'Có báo cáo khẩn cấp cần tiếp nhận' else 'Có báo cáo mới cần tiếp nhận' end,
      case when new.severity = 'urgent'
        then 'Một báo cáo khẩn cấp đang chờ phân loại và phân công.'
        else 'Một báo cáo mới đang chờ phân loại và phân công.'
      end,
      '/supervisor/incidents'
    from public.users
    where role = 'supervisor' and is_active;
  return new;
end; $$;

drop trigger if exists incidents_notify_supervisor on public.incidents;
create trigger incidents_notify_supervisor
  after insert on public.incidents
  for each row execute function public.notify_new_incident();

revoke all on function public.notify_new_incident() from public, anon, authenticated;