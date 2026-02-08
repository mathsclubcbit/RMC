
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

async function listEvents() {
    const { data: events, error } = await supabase
        .from('events')
        .select('id, title, date, payload');

    if (error) {
        console.error('Error fetching events:', error);
        return;
    }

    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, 'events_list.json'), JSON.stringify(events, null, 2));
    console.log('Events written to events_list.json');
}

listEvents();
