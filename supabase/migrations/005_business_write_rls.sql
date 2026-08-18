-- Restrict business-scoped event and post inserts to the business owner.
-- Null business_id keeps ordinary community events/posts supported.

drop policy if exists "Organizers can insert events" on public.events;

create policy "Organizers can insert events"
  on public.events for insert
  with check (
    auth.uid() = organizer_id
    and (
      business_id is null
      or exists (
        select 1
        from public.businesses b
        where b.id = events.business_id
          and b.owner_id = auth.uid()
      )
      or exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.role = 'admin'
      )
    )
  );

drop policy if exists "Authors can insert posts" on public.posts;

create policy "Authors can insert posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and (
      business_id is null
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
  );
