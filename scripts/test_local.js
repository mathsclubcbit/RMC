/**
 * Local Registration Test
 * Tests the registration endpoint on localhost dev server
 */

const fetch = require('node-fetch');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000/api/register';
const TIMEOUT = 60000; // 60 seconds

function createTestImage() {
    return Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );
}

async function testLocalRegistration() {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 LOCAL REGISTRATION TEST');
    console.log('='.repeat(70));
    console.log(`Target: ${API_URL}`);
    console.log(`Timeout: ${TIMEOUT}ms\n`);

    try {
        // Fetch event
        console.log('📋 Fetching events from localhost...');
        const eventsResponse = await fetch('http://localhost:3000/api/events');
        const events = await eventsResponse.json();

        if (!events || events.length === 0) {
            console.error('❌ No events found!');
            return;
        }

        const event = events.find(e => e.registrationOpen || e.status === 'Registration Open') || events[0];
        console.log(`✅ Using event: ${event.title} (${event.id})\n`);

        // Create form data
        console.log('📝 Creating test registration...');
        const formData = new FormData();

        formData.append('eventId', event.id);
        formData.append('eventName', event.title);
        formData.append('name', 'Local Test User');
        formData.append('email', 'localtest@test.example');
        formData.append('rollNo', '160124733001'); // 12 digits
        formData.append('department', 'CSE');
        formData.append('phone', '9876543210');
        formData.append('utrId', `LOCALTEST${Date.now()}`);
        formData.append('amount', event.pricingTiers?.[0]?.price || event.registrationFee || '200');
        formData.append('screenshot', createTestImage(), {
            filename: 'test.png',
            contentType: 'image/png'
        });

        console.log('🚀 Sending registration request...\n');
        const startTime = Date.now();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        console.log('='.repeat(70));
        console.log('📊 RESULTS');
        console.log('='.repeat(70));
        console.log(`Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
        console.log(`Status: ${response.status} ${response.statusText}`);

        if (response.ok) {
            const data = await response.json();
            console.log(`\n✅ SUCCESS!`);
            console.log(`   Registration ID: ${data.registrationId}`);
            console.log(`   Message: ${data.message}`);

            console.log(`\n📈 Performance:`);
            console.log(`   - Response time: ${duration < 3000 ? '✅ Excellent' : duration < 5000 ? '✅ Good' : duration < 10000 ? '⚠️  Acceptable' : '❌ Slow'} (${duration}ms)`);
            console.log(`   - Expected production (warm): ${Math.round(duration * 0.8)}ms with caching`);

        } else {
            const errorText = await response.text();
            console.log(`\n❌ FAILED`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${errorText}`);
        }

        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.log('\n❌ ERROR');
        console.log('='.repeat(70));
        console.log(`Error: ${error.message}`);

        if (error.name === 'AbortError') {
            console.log(`\n⏱️  Request timed out after ${TIMEOUT}ms`);
            console.log(`   This suggests:`);
            console.log(`   - Server might be initializing`);
            console.log(`   - Google API authentication issue`);
            console.log(`   - File upload problem`);
        }

        console.log('='.repeat(70) + '\n');
    }
}

testLocalRegistration();
