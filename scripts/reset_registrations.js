require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function resetRegistrations() {
    console.log('Resetting registrations...');

    try {
        // Delete all rows from 'registrations'
        // .neq('id', 0) is a trick to match all rows since UUIDs are never 0
        const { error, count } = await supabase
            .from('registrations')
            .delete({ count: 'exact' })
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Valid UUID format check, though .neq('id', 0) might fail type check if strict

        if (error) {
            throw error;
        }

        console.log(`Successfully deleted ${count ?? 'all'} registration records.`);
    } catch (err) {
        console.error('Error resetting registrations:', err.message);
        process.exit(1);
    }
}

resetRegistrations();
