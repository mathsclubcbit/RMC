-- Migration: Network Resources System (Folders + Drive Metadata)

-- 1. Create Folders Table
create table if not exists public.folders (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  parent_id uuid references public.folders(id) on delete cascade, -- Recursive deletion safely
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Resources Table (Metadata Only)
-- If it exists from previous run, we drop it to ensure schema matches (development only, careful in prod!)
drop table if exists public.resources; 

create table public.resources (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  type text check (type in ('link', 'file', 'template')) default 'link',
  url text not null, -- Stores the Google Web View Link
  drive_file_id text, -- Stores the Google Drive File ID
  folder_id uuid references public.folders(id) on delete cascade, -- Link to folder
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Indexes
create index idx_resources_created_at on public.resources(created_at);
create index idx_resources_folder_id on public.resources(folder_id);
create index idx_folders_parent_id on public.folders(parent_id);

-- 4. Enable RLS
alter table public.folders enable row level security;
alter table public.resources enable row level security;

-- 5. Policies for Folders
create policy "Folders are viewable by everyone"
  on public.folders for select using ( true );

create policy "Authenticated users can create folders"
  on public.folders for insert with check ( auth.uid() = created_by );

create policy "Users can delete their own folders"
  on public.folders for delete using ( auth.uid() = created_by or exists (select 1 from public.profiles where id = auth.uid() and role in ('president', 'faculty')) );

-- 6. Policies for Resources
create policy "Resources are viewable by everyone"
  on public.resources for select using ( true );

create policy "Authenticated users can upload resources"
  on public.resources for insert with check ( auth.uid() = created_by );

create policy "Users can delete their own resources"
  on public.resources for delete
  using ( 
    auth.uid() = created_by 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and role in ('president', 'faculty')
    )
  );
