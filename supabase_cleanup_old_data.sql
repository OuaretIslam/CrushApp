-- Manual cleanup for CrushCode.
-- Run in Supabase SQL Editor.
-- Because conversations.session_id has ON DELETE CASCADE, deleting sessions also deletes their conversations.

-- Recommended: delete only sessions whose 3-day link period is over.
delete from sessions
where expires_at < now();

-- Optional stricter cleanup: delete any session older than 3 days, even if expires_at is missing.
-- Uncomment only if you want to force-clean old rows from before the expiry feature existed.
--
-- delete from sessions
-- where created_at < now() - interval '3 days';

-- Optional: delete orphan conversations, just in case old data was created before cascade rules.
delete from conversations
where session_id is null
   or not exists (
     select 1
     from sessions
     where sessions.id = conversations.session_id
   );
