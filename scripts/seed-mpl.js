require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seedMpl() {
    console.log('Seeding MPL event...');
    
    // Check if exists
    const { data: existing } = await supabase.from('events').select('id').eq('id', 'mpl-2026').single();
    
    if (existing) {
        console.log('MPL event already exists. Updating...');
        const { error } = await supabase.from('events').update({
            title: 'Mathematics Premier League 2026',
            date: 'TBA',
            payload: {
                category: 'Competition',
                eventType: 'Contest',
                isRegistrationOpen: true,
                regEndDate: '2026-12-31T23:59:59.000Z',
                minTeamSize: 1,
                maxTeamSize: 10,
                registrationFee: 0
            }
        }).eq('id', 'mpl-2026');
        
        if (error) console.error('Error updating:', error);
        else console.log('Updated successfully.');
    } else {
        console.log('Inserting new MPL event...');
        const { error } = await supabase.from('events').insert({
            id: 'mpl-2026',
            title: 'Mathematics Premier League 2026',
            date: 'TBA',
            payload: {
                category: 'Competition',
                eventType: 'Contest',
                isRegistrationOpen: true,
                regEndDate: '2026-12-31T23:59:59.000Z',
                minTeamSize: 1,
                maxTeamSize: 10,
                registrationFee: 0
            }
        });
        
        if (error) console.error('Error inserting:', error);
        else console.log('Inserted successfully.');
    }
}

seedMpl();
