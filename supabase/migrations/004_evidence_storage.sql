-- Bucket riêng tư cho bằng chứng (ảnh / video / audio). Không bao giờ public.
-- Đường dẫn: incidents/<incident_id>/<uuid>-<tên file>
-- Không chứa uid người gửi để nhân sự không suy ra danh tính khi báo cáo ẩn danh.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidence', 'evidence', false, 26214400, array['image/*', 'video/*', 'audio/*'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "evidence_upload_by_reporter" on storage.objects for insert to authenticated
with check (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = 'incidents'
  and (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
  and exists (select 1 from public.incidents i
              where i.id::text = (storage.foldername(name))[2] and i.reporter_id = auth.uid())
);

create policy "evidence_read_by_case_access" on storage.objects for select to authenticated
using (
  bucket_id = 'evidence'
  and (storage.foldername(name))[1] = 'incidents'
  and case when (storage.foldername(name))[2] ~ '^[0-9a-f-]{36}$'
           then public.can_access_case('incident', ((storage.foldername(name))[2])::uuid)
           else false end
);
-- Không có policy update/delete: học sinh không sửa hoặc xoá bằng chứng đã gửi.
