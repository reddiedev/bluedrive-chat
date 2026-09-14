-- Chat schema for Bard.
--
-- db_sessions     : one row per chat thread (username-scoped), created by the FastAPI backend.
-- bd_chat_history : message log, schema matches langchain-postgres PostgresChatMessageHistory
--                   (id serial / session_id uuid / message jsonb / created_at timestamptz).

create table if not exists public.db_sessions (
    id uuid primary key,
    username varchar(255) not null,
    title varchar(255) not null,
    created_at timestamptz not null default now()
);

create table if not exists public.bd_chat_history (
    id serial primary key,
    session_id uuid not null references public.db_sessions (id) on delete cascade,
    message jsonb not null,
    created_at timestamptz not null default now()
);

create index if not exists idx_bd_chat_history_session_id
    on public.bd_chat_history (session_id);

-- The app has no auth layer and the backend connects as the table owner (which bypasses RLS).
-- Lock the tables down so the publishable/anon key cannot reach them through the Data API.
alter table public.db_sessions enable row level security;
alter table public.bd_chat_history enable row level security;

revoke all on public.db_sessions from anon, authenticated;
revoke all on public.bd_chat_history from anon, authenticated;
revoke all on sequence public.bd_chat_history_id_seq from anon, authenticated;
