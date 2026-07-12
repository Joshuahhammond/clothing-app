-- Public bucket for background-removed product cutouts

insert into storage.buckets (id, name, public)
values ('cutouts', 'cutouts', true)
on conflict (id) do nothing;

create policy "cutouts: authenticated write"
on storage.objects for insert to authenticated
with check (bucket_id = 'cutouts');
