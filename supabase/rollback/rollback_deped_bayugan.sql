-- Removes everything the DepEd Bayugan website added to the shared project.
-- Run storage file cleanup from the dashboard first if the bucket has files.
drop policy if exists "deped_bayugan: staff upload" on storage.objects;
drop policy if exists "deped_bayugan: staff list" on storage.objects;
drop policy if exists "deped_bayugan: owners or admins update" on storage.objects;
drop policy if exists "deped_bayugan: owners or admins delete" on storage.objects;
delete from storage.buckets where id = 'deped_bayugan_public';
drop schema if exists deped_bayugan cascade;
