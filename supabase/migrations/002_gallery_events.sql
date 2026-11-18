-- 1. Create 'gallery_events' table (The Albums)
create table gallery_events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  cover_image text, -- URL of the cover image
  category text, -- 'Olympiads', 'Fests', etc.
  event_date date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Add 'event_id' to existing 'gallery_images' table
-- (If table doesn't exist, this will error, but we assume it exists from previous step OR you can create it fully)
alter table gallery_images 
add column if not exists event_id uuid references gallery_events(id) on delete cascade;

-- 3. Enable RLS on gallery_events
alter table gallery_events enable row level security;

-- 4. RLS Policies for gallery_events
-- Public read
create policy "Events are viewable by everyone"
  on gallery_events for select
  using ( true );

-- Admin insert/update/delete
create policy "Admins can insert events"
  on gallery_events for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update events"
  on gallery_events for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete events"
  on gallery_events for delete
  using ( auth.role() = 'authenticated' );

-- NOTE: Ensure 'gallery_images' policies allow public read and admin write (already done in previous script)
