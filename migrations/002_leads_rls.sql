-- Still Yours — lead tables are the server's alone
-- The app connects as the database owner, which row level security does
-- not stop. Switched on, it shuts out everybody else: on Supabase, the
-- public Data API can read nothing here even if it is turned on later.

alter table owner_leads enable row level security;
alter table inspector_applications enable row level security;
