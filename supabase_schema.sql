-- Run this in your Supabase SQL Editor (supabase.com > SQL Editor)

create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,           -- e.g. "crush-star"
  host_name text not null,
  host_description text,               -- a few words the host wrote about themselves
  host_email text not null,            -- where we send the notification
  created_at timestamp default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  messages jsonb default '[]'::jsonb,  -- full chat history
  score integer,                       -- 0-100, set at the end
  outcome text,                        -- 'green', 'friend', 'pending'
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Enable realtime so the host gets live notification
alter publication supabase_realtime add table conversations;
