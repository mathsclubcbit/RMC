/**
 * Load Test Script for Registration API
 * 
 * Usage: node scripts/load-test.js [concurrent] [total]
 * Example: node scripts/load-test.js 10 100
 *   - 10 concurrent registrations at a time
 *   - 100 total registrations
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const CONCURRENT = parseInt(process.argv[2]) || 5;
const TOTAL = parseInt(process.argv[3]) || 20;
const EVENT_ID = process.env.TEST_EVENT_ID || 'test-event';
const EVENT_NAME = process.env.TEST_EVENT_NAME || 'Load Test Event';

// Stats
const stats = {
    success: 0,
    failed: 0,
    errors: [],
    responseTimes: [],
    startTime: null,
    endTime: null,
};

// Generate a small test image (1x1 PNG)
function createTestImage() {
    // Minimal 1x1 transparent PNG (67 bytes)
    const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);
    return new Blob([pngBuffer], { type: 'image/png' });
}

// Generate unique registration data
function generateRegistrationData(index) {
    const timestamp = Date.now();
    const uniqueId = `${timestamp}${index}`;

    return {
        eventId: EVENT_ID,
        eventName: EVENT_NAME,
        name: `Test User ${index}`,
        email: `testuser${uniqueId}@loadtest.com`,
        phone: `98${String(index).padStart(8, '0')}`,
        rollNo: `16012345${String(index).padStart(4, '0')}`,
        department: ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'][index % 5],
        utrId: `UTR${uniqueId}`,
        amount: '100',
    };
}

// Send a single registration
async function sendRegistration(index) {
    const data = generateRegistrationData(index);
    const formData = new FormData();

    // Add all fields
    Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
    });

    // Add test screenshot
    formData.append('screenshot', createTestImage(), 'test-screenshot.png');

    const startTime = performance.now();

    try {
        const response = await fetch(`${BASE_URL}/api/register`, {
            method: 'POST',
            body: formData,
        });

        const endTime = performance.now();
        const responseTime = endTime - startTime;
        stats.responseTimes.push(responseTime);

        if (response.ok) {
            stats.success++;
            return { success: true, index, responseTime };
        } else {
            const errorData = await response.json().catch(() => ({}));
            stats.failed++;
            stats.errors.push({ index, status: response.status, error: errorData.error || 'Unknown' });
            return { success: false, index, responseTime, error: errorData.error };
        }
    } catch (error) {
        const endTime = performance.now();
        stats.failed++;
        stats.errors.push({ index, error: error.message });
        return { success: false, index, responseTime: endTime - startTime, error: error.message };
    }
}

// Process registrations in batches
async function runLoadTest() {
    console.log('\n🚀 Starting Load Test');
    console.log('━'.repeat(50));
    console.log(`📍 Target: ${BASE_URL}/api/register`);
    console.log(`👥 Concurrent: ${CONCURRENT}`);
    console.log(`📊 Total: ${TOTAL}`);
    console.log(`🎯 Event: ${EVENT_NAME} (${EVENT_ID})`);
    console.log('━'.repeat(50));

    stats.startTime = Date.now();

    let completed = 0;
    const queue = Array.from({ length: TOTAL }, (_, i) => i + 1);

    // Process in batches
    while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENT);
        const promises = batch.map(i => sendRegistration(i));

        const results = await Promise.all(promises);
        completed += results.length;

        // Progress
        const progress = Math.round((completed / TOTAL) * 100);
        const successRate = stats.success > 0 ? Math.round((stats.success / completed) * 100) : 0;
        process.stdout.write(`\r⏳ Progress: ${completed}/${TOTAL} (${progress}%) | ✅ ${stats.success} | ❌ ${stats.failed} | Success Rate: ${successRate}%`);
    }

    stats.endTime = Date.now();

    // Print results
    printResults();
}

function printResults() {
    const totalTime = (stats.endTime - stats.startTime) / 1000;
    const avgResponseTime = stats.responseTimes.length > 0
        ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
        : 0;
    const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
    const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
    const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
    const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
    const minTime = Math.min(...stats.responseTimes) || 0;
    const maxTime = Math.max(...stats.responseTimes) || 0;

    console.log('\n\n📊 LOAD TEST RESULTS');
    console.log('═'.repeat(50));
    console.log(`⏱️  Total Duration: ${totalTime.toFixed(2)}s`);
    console.log(`📈 Throughput: ${(TOTAL / totalTime).toFixed(2)} req/sec`);
    console.log('─'.repeat(50));
    console.log(`✅ Successful: ${stats.success}`);
    console.log(`❌ Failed: ${stats.failed}`);
    console.log(`📊 Success Rate: ${((stats.success / TOTAL) * 100).toFixed(1)}%`);
    console.log('─'.repeat(50));
    console.log('⏱️  Response Times:');
    console.log(`   Min:  ${minTime.toFixed(0)}ms`);
    console.log(`   Avg:  ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   p50:  ${p50.toFixed(0)}ms`);
    console.log(`   p95:  ${p95.toFixed(0)}ms`);
    console.log(`   p99:  ${p99.toFixed(0)}ms`);
    console.log(`   Max:  ${maxTime.toFixed(0)}ms`);
    console.log('═'.repeat(50));

    if (stats.errors.length > 0) {
        console.log('\n⚠️  Errors (first 5):');
        stats.errors.slice(0, 5).forEach(err => {
            console.log(`   #${err.index}: ${err.error} ${err.status ? `(HTTP ${err.status})` : ''}`);
        });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    if (p95 > 10000) {
        console.log('   ⚠️  p95 > 10s: Consider optimizing Google Sheets writes (batch them)');
    }
    if (stats.failed > TOTAL * 0.1) {
        console.log('   ⚠️  >10% failures: Check Google API quotas and rate limits');
    }
    if (avgResponseTime < 3000 && stats.failed === 0) {
        console.log('   ✅ System is performing well!');
    }
    console.log('');
}

// Run
runLoadTest().catch(console.error);
