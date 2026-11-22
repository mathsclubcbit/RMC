
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

// IDs to delete from calendar_events
// These match "Math Hiest", "SUDHEE DAY 1", "VALENTINES DAY" from previous list
const idsToDelete = [
    '8e9ad489-4ebd-4100-9694-7f7825dcc8fe', // Math Hiest
    '18a7ee1b-e3e5-4ec3-ac87-d0e1ef70503d', // SUDHEE DAY 1
    'a57c21d1-3ff7-464a-bc96-a69e7aea7ce8'  // VALENTINES DAY
];

async function deleteCalendarEvents() {
    console.log(`Attempting to delete ${idsToDelete.length} calendar events...`);

    const { error } = await supabase
        .from('calendar_events')
        .delete()
        .in('id', idsToDelete);

    if (error) {
        console.error('Error deleting calendar events:', error);
    } else {
        console.log('Successfully deleted calendar events.');
    }
}

deleteCalendarEvents();
