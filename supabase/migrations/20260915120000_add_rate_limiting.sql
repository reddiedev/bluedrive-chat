-- Rate limiting for Bard.
--
-- bd_rate_limit_events : one row per accepted chat message, used to count a
--                        user's messages within a rolling window. Bounded rows
--                        older than the window are pruned by the backend on
--                        each check, so the table stays small.

create table if not exists public.bd_rate_limit_events (
    id bigserial primary key,
    username varchar(255) not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_bd_rate_limit_events_username_created_at
    on public.bd_rate_limit_events (username, created_at);

-- The app has no auth layer and the backend connects as the table owner (which bypasses RLS).
-- Lock the table down so the publishable/anon key cannot reach it through the Data API.
alter table public.bd_rate_limit_events enable row level security;

revoke all on public.bd_rate_limit_events from anon, authenticated;
revoke all on sequence public.bd_rate_limit_events_id_seq from anon, authenticated;
