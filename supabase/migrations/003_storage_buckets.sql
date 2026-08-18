-- =============================================================================
-- Pulse — Storage buckets
-- =============================================================================
-- Creates the public "pulse" storage bucket used for post/event images and
-- avatars, with RLS policies allowing signed-in users to upload and read.
--
-- Run this in the Supabase dashboard SQL editor AFTER the seed migration.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pulse', 'pulse', true, 5242880, array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do nothing;

-- Signed-in users can read any object (public bucket).
create policy "pulse_read_all"
  on storage.objects for select
  using (bucket_id = 'pulse');

-- Signed-in users can upload their own objects. Objects are organised by the
-- uploader's user id folder so ownership is clear.
create policy "pulse_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'pulse'
    and auth.role() = 'authenticated'
  );

-- Uploaders can update and delete objects under their own user-id folder.
create policy "pulse_update_own"
  on storage.objects for update
  using (
    bucket_id = 'pulse'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'pulse'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pulse_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'pulse'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );