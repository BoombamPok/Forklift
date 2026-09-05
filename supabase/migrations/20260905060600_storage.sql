-- Part-image storage foundation (CLAUDE.md #15) - bucket + access policy
-- only. No upload UI exists yet (that's Phase 3); this just establishes
-- where images will live and who can read/write them.

insert into storage.buckets (id, name, public)
values ('part-images', 'part-images', false)
on conflict (id) do nothing;

create policy "Authenticated users can view part-images"
  on storage.objects for select to authenticated
  using (bucket_id = 'part-images');

create policy "Staff can upload part-images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'part-images'
    and public.current_user_role() in ('admin', 'manager', 'staff')
  );
