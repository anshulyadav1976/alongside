create extension if not exists pgcrypto;
create extension if not exists vector;

create type memory_status as enum ('proposed','confirmed','rejected','superseded','expired','revoked');
create type reuse_permission as enum ('allowed','ask_first','never_proactive');
create type processing_state as enum (
  'created','active','call_completed','webhook_received','transcribing',
  'extracting','awaiting_user_review','ready','failed'
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Europe/London',
  onboarding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_conversation_id text unique,
  requested_support_mode text,
  selected_support_mode text,
  processing_state processing_state not null default 'created',
  memory_enabled boolean not null default true,
  safety_level text not null default 'normal',
  started_at timestamptz,
  ended_at timestamptz,
  processing_error jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.transcript_turns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null references public.sessions(id) on delete cascade,
  turn_index integer not null,
  speaker text not null check (speaker in ('user','agent')),
  text text not null,
  start_ms integer,
  end_ms integer,
  source text not null check (source in ('openai','elevenlabs_fallback')),
  model text,
  created_at timestamptz not null default now(),
  unique(session_id, turn_index)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid not null unique references public.sessions(id) on delete cascade,
  title text not null,
  summary text not null,
  content jsonb not null default '{}'::jsonb,
  user_edited boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_type text not null,
  statement text,
  content jsonb not null default '{}'::jsonb,
  embedding vector(1536),
  status memory_status not null default 'proposed',
  explicitness text not null check (explicitness in ('explicit','inferred')),
  confidence double precision not null check (confidence between 0 and 1),
  sensitivity text not null check (sensitivity in ('low','medium','high')),
  source_session_id uuid references public.sessions(id) on delete set null,
  source_turn_id uuid references public.transcript_turns(id) on delete set null,
  source_quote text,
  valid_from timestamptz,
  valid_to timestamptz,
  learned_at timestamptz not null default now(),
  invalidated_at timestamptz,
  expires_at timestamptz,
  superseded_by uuid references public.memories(id),
  reuse_permission reuse_permission not null default 'ask_first',
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create table public.entities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  label text not null,
  attributes jsonb not null default '{}'::jsonb,
  source_memory_id uuid references public.memories(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.relations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.entities(id) on delete cascade,
  predicate text not null,
  object_id uuid not null references public.entities(id) on delete cascade,
  valid_from timestamptz,
  valid_to timestamptz,
  learned_at timestamptz not null default now(),
  invalidated_at timestamptz,
  confidence double precision not null default 1 check (confidence between 0 and 1),
  explicitness text not null default 'explicit' check (explicitness in ('explicit','inferred')),
  source_memory_id uuid references public.memories(id) on delete set null,
  revoked_at timestamptz
);

create table public.state_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  valence smallint,
  arousal smallint,
  distress smallint,
  energy smallint,
  stress smallint,
  sleep_quality smallint,
  social_capacity smallint,
  agency smallint,
  receptivity smallint,
  source text not null,
  confidence double precision not null default 1 check (confidence between 0 and 1),
  expires_at timestamptz
);

create table public.interventions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete cascade,
  support_mode text not null,
  intervention text not null,
  rationale text not null,
  context jsonb not null default '{}'::jsonb,
  offered_at timestamptz not null default now(),
  accepted boolean,
  completed boolean,
  helpfulness smallint check (helpfulness between 0 and 4),
  burden smallint check (burden between 0 and 4),
  later_effect text,
  reuse_permission boolean
);

create table public.upcoming_moments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  occurs_at timestamptz not null,
  expected_difficulty smallint,
  followup_permission boolean not null default false,
  status text not null default 'upcoming',
  source_memory_id uuid references public.memories(id) on delete set null
);

create table public.checkin_policies (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  quiet_hours jsonb not null default '{}'::jsonb,
  max_per_week integer not null default 0,
  cooldown_hours integer not null default 24,
  preferred_windows jsonb not null default '[]'::jsonb,
  paused_until timestamptz,
  updated_at timestamptz not null default now()
);

create table public.checkin_decisions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  upcoming_moment_id uuid references public.upcoming_moments(id) on delete set null,
  decision text not null check (decision in ('CHECK_IN','NO_ACTION')),
  reason_code text not null,
  reason text not null,
  evidence_ids jsonb not null default '[]'::jsonb,
  candidate_time timestamptz,
  earliest_allowed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  idempotency_key text not null unique,
  event_type text not null,
  provider_conversation_id text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text not null default 'received',
  error jsonb
);

create index sessions_user_created_idx on public.sessions(user_id, created_at desc);
create index memories_user_status_idx on public.memories(user_id, status);
create index memories_current_idx on public.memories(user_id, memory_type) where status = 'confirmed' and revoked_at is null;
create index relations_subject_idx on public.relations(user_id, subject_id, predicate);
create index relations_object_idx on public.relations(user_id, object_id, predicate);

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.transcript_turns enable row level security;
alter table public.journal_entries enable row level security;
alter table public.memories enable row level security;
alter table public.entities enable row level security;
alter table public.relations enable row level security;
alter table public.state_snapshots enable row level security;
alter table public.interventions enable row level security;
alter table public.upcoming_moments enable row level security;
alter table public.checkin_policies enable row level security;
alter table public.checkin_decisions enable row level security;

-- Codex: generate explicit SELECT/INSERT/UPDATE/DELETE policies for each table
-- using auth.uid() = user_id. Keep webhook_receipts server-only and outside
-- direct browser grants.
