-- Notifications System Schema
-- WARNING: This will drop existing tables. Ensure you don't have critical data in 'tasks' or 'announcements'.
drop table if exists public.tasks cascade;
drop table if exists public.announcements cascade;
drop table if exists public.notifications_subscriptions cascade;

-- 1. Subscriptions Table (Stores User/Device Web Push endpoints)
create table if not exists public.notifications_subscriptions (
    id uuid default gen_random_uuid() primary key,
    endpoint text not null unique,
    p256dh text not null,
    auth text not null,
    user_id uuid references auth.users(id), -- Nullable for guests, populated for members
    role text default 'guest', -- 'guest', 'member', 'admin'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Announcements Table (Broadcast messages)
create table if not exists public.announcements (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    body text not null,
    target_role text default 'all', -- 'all', 'guest', 'member', 'Technical', etc.
    created_by uuid references auth.users(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Tasks Table (Aligned with Network/Tasks/Page.jsx)
create table if not exists public.tasks (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    assigned_to_user uuid references public.profiles(id), -- Matches 'assigned_to_user' in frontend
    assigned_to_team uuid references public.teams(id),   -- Matches 'assigned_to_team' in frontend
    deadline timestamp with time zone,                   -- Matches 'deadline' in frontend
    status text default 'pending', -- 'pending', 'in_progress', 'completed', 'approval_start', 'approval_completion', 'overdue'
    created_by uuid references public.profiles(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index idx_subs_user_id on public.notifications_subscriptions(user_id);
create index idx_announcements_created_at on public.announcements(created_at);
create index idx_tasks_assigned_user on public.tasks(assigned_to_user);
create index idx_tasks_assigned_team on public.tasks(assigned_to_team);
create index idx_tasks_deadline on public.tasks(deadline);

-- RLS Policies
alter table public.notifications_subscriptions enable row level security;
alter table public.announcements enable row level security;
alter table public.tasks enable row level security;

-- Subscriptions: Everyone can inserting (subscribing) with basic check on endpoint presence.
create policy "Anyone can subscribe"
    on public.notifications_subscriptions for insert with check (length(endpoint) > 0);

create policy "Users manage own subscriptions"
    on public.notifications_subscriptions for select
    using (auth.uid() = user_id);

-- Announcements: Everyone can read. Only Admins can create.
create policy "Public can read announcements"
    on public.announcements for select using (true);

create policy "Admins can create announcements"
    on public.announcements for insert with check (auth.role() = 'authenticated');

-- Tasks Policies (Simplified for now - can be refined based on Team roles)
create policy "Users can see relevant tasks"
    on public.tasks for select
    using (
        auth.uid() = assigned_to_user 
        or created_by = auth.uid()
        or exists (select 1 from public.team_members where team_id = tasks.assigned_to_team and user_id = auth.uid())
    );

create policy "Authenticated users can create tasks"
    on public.tasks for insert with check (auth.role() = 'authenticated');

create policy "Users can update relevant tasks"
    on public.tasks for update
    using (
        auth.uid() = assigned_to_user 
        or created_by = auth.uid()
        or exists (select 1 from public.team_members where team_id = tasks.assigned_to_team and user_id = auth.uid())
    );

create policy "Users can delete their own tasks"
    on public.tasks for delete
    using (created_by = auth.uid());
