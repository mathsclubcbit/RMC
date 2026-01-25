-- RMC Internal Network Schema

-- 1. Create PROFILES table (Linked to Auth)
-- This extends the default auth.users table with our hierarchy roles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('faculty', 'president', 'vice_president', 'general_secretary', 'joint_secretary', 'head', 'member')) default 'member',
  team text check (team in ('council', 'event', 'content', 'visual_media', 'pr', 'tech')) default 'council',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create TASKS table
create table public.tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text check (status in ('pending', 'in_progress', 'review', 'done')) default 'pending',
  priority text check (priority in ('low', 'medium', 'high', 'critical')) default 'medium',
  
  assigned_to uuid references public.profiles(id), -- Who is doing it
  assigned_by uuid references public.profiles(id), -- Who commanded it
  
  team_scope text, -- For filtering by team (e.g. 'design' tasks)
  
  due_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Optimization Indexes
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);
create index if not exists idx_tasks_team_scope on public.tasks(team_scope);
create index if not exists idx_profiles_team on public.profiles(team);

-- 3. Enable RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;

-- 4. POLICIES (The "Military" Rules)

-- PROFILES POLICIES
-- Everyone can read profiles (to see who is in the team)
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

-- Only Faculty can update anyone's role
create policy "Faculty can update all profiles"
  on profiles for update
  using ( auth.uid() in ( select id from profiles where role = 'faculty' ) );

-- President can update members (but not Faculty)
create policy "President can update members"
  on profiles for update
  using ( 
    auth.uid() in ( select id from profiles where role = 'president' )
    and id not in ( select id from profiles where role = 'faculty' )
  );

-- Users can update their own metadata (name/email) but NOT role
create policy "Users can update own basic info"
  on profiles for update
  using ( auth.uid() = id )
  with check ( role = (select role from profiles where id = auth.uid()) ); -- Prevent self-promotion

-- TASKS POLICIES
-- Everyone can view tasks assigned to them or their team
create policy "View tasks for self or team"
  on tasks for select
  using ( true ); -- Simplified for now: Transparency is key in this org

-- Faculty & President can CRUD all tasks
create policy "Commanders manage all tasks"
  on tasks for all
  using ( 
    auth.uid() in ( select id from profiles where role in ('faculty', 'president') )
  );

-- Heads can create/update tasks for their team
create policy "Heads manage team tasks"
  on tasks for all
  using ( 
    auth.uid() in ( select id from profiles where role = 'head' )
  );

-- Members can only update status of tasks assigned to them
create policy "Members update their own tasks"
  on tasks for update
  using ( assigned_to = auth.uid() );


-- 5. TRIGGER: Auto-create profile on User Signup
-- This ensures every new login gets a row in 'profiles'
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role, team)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'member'), 
    COALESCE(new.raw_user_meta_data->>'team', 'council')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
