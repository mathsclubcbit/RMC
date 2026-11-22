/**
 * Simple Production Load Test with Extended Timeouts
 * Handles serverless cold starts gracefully
 */

const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://rmccbit.in/api/register';
const TIMEOUT = 120000; // 2 minutes for cold starts

// Create a simple test image buffer
function createTestImage() {
    // 1x1 pixel PNG
    return Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        'base64'
    );
}

async function sendRegistration(index, eventId, eventName) {
    const formData = new FormData();

    formData.append('eventId', eventId);
    formData.append('eventName', eventName);
    formData.append('name', `LoadTest User ${index}`);
    formData.append('email', `loadtest${index}@loadtest.example`);
    formData.append('rollNo', `LT${String(index).padStart(6, '0')}`);
    formData.append('department', 'CSE');
    formData.append('utrId', `LOADTEST${Date.now()}${index}`);
    formData.append('amount', '200');
    formData.append('screenshot', createTestImage(), {
        filename: `test${index}.png`,
        contentType: 'image/png'
    });

    const startTime = Date.now();

    try {
        console.log(`  [${index}] Sending request...`);

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

        if (response.ok) {
            const data = await response.json();
            console.log(`  [${index}] ✅ Success in ${duration}ms - ID: ${data.registrationId}`);
            return { success: true, duration, index };
        } else {
            const errorText = await response.text();
            console.log(`  [${index}] ❌ Failed: ${response.status} - ${errorText.substring(0, 100)}`);
            return { success: false, duration, index, error: `HTTP ${response.status}` };
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        console.log(`  [${index}] ❌ Error in ${duration}ms: ${error.message}`);
        return { success: false, duration, index, error: error.message };
    }
}

async function runSimpleTest() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 SIMPLE PRODUCTION LOAD TEST');
    console.log('='.repeat(70));
    console.log(`Target: ${API_URL}`);
    console.log(`Timeout: ${TIMEOUT}ms (2 minutes for cold starts)`);
    console.log('='.repeat(70) + '\n');

    // Fetch event
    console.log('📋 Fetching event...');
    try {
        const eventsResponse = await fetch('https://rmccbit.in/api/events', {
            timeout: 30000
        });
        const events = await eventsResponse.json();
        const event = events.find(e => e.registrationOpen || e.status === 'Registration Open') || events[0];

        if (!event) {
            console.error('❌ No events found!');
            return;
        }

        console.log(`✅ Using event: ${event.title} (${event.id})\n`);

        // Test 1: Single request (warm up)
        console.log('🔥 Test 1: Single Request (Cold Start Test)');
        console.log('-'.repeat(70));
        const result1 = await sendRegistration(1, event.id, event.title);

        console.log(`\n📊 Result: ${result1.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`   Duration: ${result1.duration}ms`);

        if (!result1.success) {
            console.log(`\n⚠️  First request failed. This might indicate:`);
            console.log(`   - Cold start timeout (try increasing TIMEOUT)`);
            console.log(`   - API endpoint error`);
            console.log(`   - Network issues`);
            console.log(`\nSkipping remaining tests.\n`);
            return;
        }

        // Wait a bit
        console.log(`\n⏳ Waiting 5 seconds before next test...\n`);
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 2: 3 concurrent (small burst)
        console.log('💥 Test 2: 3 Concurrent Requests (Warm Instance)');
        console.log('-'.repeat(70));

        const promises = [];
        for (let i = 2; i <= 4; i++) {
            promises.push(sendRegistration(i, event.id, event.title));
        }

        const results2 = await Promise.all(promises);
        const successful = results2.filter(r => r.success).length;
        const avgDuration = Math.round(results2.reduce((sum, r) => sum + r.duration, 0) / results2.length);

        console.log(`\n📊 Results:`);
        console.log(`   Successful: ${successful}/3`);
        console.log(`   Avg Duration: ${avgDuration}ms`);
        console.log(`   Min: ${Math.min(...results2.map(r => r.duration))}ms`);
        console.log(`   Max: ${Math.max(...results2.map(r => r.duration))}ms`);

        if (successful === 3) {
            console.log(`\n✅ System handling concurrent requests well!`);
            console.log(`   Response time: ${avgDuration < 5000 ? 'Excellent' : avgDuration < 10000 ? 'Good' : 'Acceptable'}`);
        } else {
            console.log(`\n⚠️  Some failures detected. Check logs above.`);
        }

        console.log('\n' + '='.repeat(70));
        console.log('TEST COMPLETE');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

runSimpleTest();
