const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestEvent() {
    const testEventId = 'load-test-event-v1';
    const testEvent = {
        id: testEventId,
        title: 'Load Test Event',
        date: '2026-12-31',
        payload: {
            registrationFee: 100,
            minTeamSize: 1,
            maxTeamSize: 1,
            variablePricingEnabled: false,
            date: 'Dec 31, 2026',
            time: '10:00 AM',
            location: 'Virtual Environment'
        }
    };

    console.log(`Checking if event ${testEventId} exists...`);

    const { data: existing } = await supabase
        .from('events')
        .select('id')
        .eq('id', testEventId)
        .single();

    if (existing) {
        console.log('Test event already exists. Updating...');
        const { error } = await supabase
            .from('events')
            .update(testEvent)
            .eq('id', testEventId);
        if (error) throw error;
    } else {
        console.log('Creating test event...');
        const { error } = await supabase
            .from('events')
            .insert(testEvent);
        if (error) throw error;
    }

    console.log('✅ Test event created/updated successfully.');
}

createTestEvent().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
