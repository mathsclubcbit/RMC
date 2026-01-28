-- Create 'rmc_council' table (Renamed from team_members to avoid conflict)
create table if not exists rmc_council (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  position text, 
  category text not null, 
  image_url text,
  linkedin_url text,
  email text,
  caption text,
  priority_order integer default 0, -- NEW: Better approach for manual sorting
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table rmc_council enable row level security;

-- Policies
create policy "Council members are viewable by everyone"
  on rmc_council for select
  using ( true );

create policy "Admins can insert council members"
  on rmc_council for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update council members"
  on rmc_council for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete council members"
  on rmc_council for delete
  using ( auth.role() = 'authenticated' );
