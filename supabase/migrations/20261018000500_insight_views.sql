create table if not exists public.insight_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  insight_key text not null,
  viewed_at timestamptz not null default now(),
  primary key (user_id, insight_key)
);

alter table public.insight_views enable row level security;

create policy "users can read their insight views"
  on public.insight_views for select
  using (user_id = auth.uid());

create policy "users can mark their insights as viewed"
  on public.insight_views for insert
  with check (user_id = auth.uid());

create policy "users can update their insight views"
  on public.insight_views for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
