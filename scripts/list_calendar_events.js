
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listCalendarEvents() {
    const { data: events, error } = await supabase
        .from('calendar_events')
        .select('*');

    if (error) {
        // It's possible the table doesn't exist or RLS blocks it, but we are using service role
        console.error('Error fetching calendar_events:', error);
        return;
    }

    if (events && events.length > 0) {
        const fs = require('fs');
        fs.writeFileSync(path.join(__dirname, 'calendar_events_list.json'), JSON.stringify(events, null, 2));
        console.log('Calendar events written to calendar_events_list.json');
    } else {
        console.log('No calendar events found.');
    }
}

listCalendarEvents();
