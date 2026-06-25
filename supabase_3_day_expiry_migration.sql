-- Run this once in Supabase SQL Editor for an existing CrushCode database.

alter table sessions
add column if not exists expires_at timestamp;

update sessions
set expires_at = created_at + interval '3 days'
where expires_at is null;

alter table sessions
alter column expires_at set default now() + interval '3 days';

delete from sessions
where expires_at < now();
