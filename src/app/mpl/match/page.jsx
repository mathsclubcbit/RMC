import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import PlayerLiveMatch from './PlayerLiveMatch';

export const metadata = { title: 'MPL Live Match | RMC' };

export default async function PlayerLiveMatchPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/mpl/register');
    return <PlayerLiveMatch />;
}
