-- Create a table for gallery images
create table gallery_images (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  caption text,
  category text, -- 'Olympiads', 'Workshops', 'Fests', 'Fun Events', etc.
  width integer,
  height integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table gallery_images enable row level security;

-- Create policies for gallery_images
-- 1. Allow public read access
create policy "Public images are viewable by everyone"
  on gallery_images for select
  using ( true );

-- 2. Allow authenticated users (admins) to insert/update/delete
-- Assuming admin authentication uses standard Supabase Auth or roles. 
-- Adjust this policy based on your specific auth setup. 
-- For now, allowing authenticated users is a common pattern for admin panels.
create policy "Admins can insert images"
  on gallery_images for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update images"
  on gallery_images for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete images"
  on gallery_images for delete
  using ( auth.role() = 'authenticated' );


-- Storage Bucket Setup
-- 1. Create a new public bucket named 'gallery'
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true);

-- 2. Storage Policies
-- Allow public access to view files
create policy "Gallery images are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'gallery' );

-- Allow authenticated uploads
create policy "Authenticated users can upload gallery images"
  on storage.objects for insert
  with check ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

-- Allow authenticated updates
create policy "Authenticated users can update gallery images"
  on storage.objects for update
  using ( bucket_id = 'gallery' and auth.role() = 'authenticated' );

-- Allow authenticated deletions
create policy "Authenticated users can delete gallery images"
  on storage.objects for delete
  using ( bucket_id = 'gallery' and auth.role() = 'authenticated' );
