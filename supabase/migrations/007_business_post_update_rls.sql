-- Keep post updates restricted to the original author or the owner of the
-- business the post belongs to. The API still limits editable columns.
drop policy if exists "Authors can update own posts" on public.posts;

create policy "Authors and business owners can update posts"
  on public.posts for update
  using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.businesses b
      where b.id = posts.business_id
        and b.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  )
  with check (
    auth.uid() = author_id
    or exists (
      select 1
      from public.businesses b
      where b.id = posts.business_id
        and b.owner_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    )
  );
