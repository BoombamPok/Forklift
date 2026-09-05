-- Phase 3 needs part-image *removal*, which the Phase 1 storage
-- foundation never granted (only SELECT + INSERT existed - "no upload
-- UI exists yet" at the time). See docs/decisions/0011 for why this
-- deliberately deviates from ADR 0007's "no DELETE policy, soft-delete
-- only" rule: part_images has no deleted_at column and isn't audit
-- history the way stock_movements is, so a real delete is correct here.

create policy "Staff can delete part_images"
  on public.part_images for delete to authenticated
  using (public.current_user_role() in ('admin', 'manager', 'staff'));

create policy "Staff can delete part-images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'part-images'
    and public.current_user_role() in ('admin', 'manager', 'staff')
  );
