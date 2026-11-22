require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

async function verifyRedirect() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const eventId = 'mkwoh9qlgu6nu8'; // Using a known event ID for testing

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase environment variables');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`🔍 Checking event: ${eventId}`);
    const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('payload')
        .eq('id', eventId)
        .single();

    if (fetchError || !event) {
        console.error('❌ Failed to fetch event:', fetchError?.message);
        return;
    }

    const originalPayload = { ...event.payload };
    const testUrl = 'https://forms.gle/test-redirect-' + Date.now();

    try {
        // 1. Enable Redirect
        console.log('🚀 Enabling fallback redirect...');
        const updatedPayload = {
            ...originalPayload,
            useExternalRegistration: true,
            externalRegistrationUrl: testUrl
        };

        const { error: updateError } = await supabase
            .from('events')
            .update({ payload: updatedPayload })
            .eq('id', eventId);

        if (updateError) throw new Error('Update failed: ' + updateError.message);

        // 2. Test Registration Page Response
        console.log('🌐 Testing registration page redirect...');
        const response = await fetch(`http://localhost:3000/register/${eventId}`, {
            redirect: 'manual'
        });

        console.log(`📊 Response Status: ${response.status}`);
        const location = response.headers.get('location');
        console.log(`📍 Redirect Location: ${location}`);

        if (response.status === 307 || response.status === 308 || response.status === 302) {
            if (location === testUrl) {
                console.log('✅ SUCCESS: Redirect works correctly!');
            } else {
                console.log('❌ FAILURE: Wrong redirect location.');
            }
        } else {
            console.log('❌ FAILURE: Page did not redirect.');
        }

    } catch (err) {
        console.error('❌ Error during verification:', err.message);
    } finally {
        // 3. Revert Changes
        console.log('🔄 Reverting changes...');
        await supabase
            .from('events')
            .update({ payload: originalPayload })
            .eq('id', eventId);
    }
}

verifyRedirect();
