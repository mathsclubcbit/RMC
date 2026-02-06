/**
 * Load Test Script for Registration API
 * 
 * Tests concurrent registration requests to identify bottlenecks
 * and verify production readiness.
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = 'https://rmccbit.in/api/register';
const RESULTS_DIR = path.join(__dirname, '../tests/load-test-results');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

/**
 * Generate unique test data for a registration
 */
function generateTestData(index, eventId, eventName) {
    const timestamp = Date.now();
    const uniqueId = `${timestamp}_${index}`;

    return {
        eventId,
        eventName,
        name: `LoadTest User ${index}`,
        email: `loadtest${uniqueId}@test.com`,
        phone: `98${String(index).padStart(8, '0')}`,
        rollNo: String(160120740000 + index).padStart(12, '0'),
        department: 'CSE',
        utrId: `LOADTEST${uniqueId}`,
        amount: '100',
        teamSize: '1',
        // Mock screenshot as Buffer
        screenshot: Buffer.from('mock screenshot data'),
    };
}

/**
 * Create FormData from test data
 */
function createFormData(data) {
    const formData = new FormData();

    Object.keys(data).forEach(key => {
        if (key === 'screenshot') {
            formData.append(key, data[key], {
                filename: 'test-screenshot.png',
                contentType: 'image/png',
            });
        } else {
            formData.append(key, data[key]);
        }
    });

    return formData;
}

/**
 * Execute a single registration request
 */
async function executeRegistration(index, eventId, eventName) {
    const startTime = Date.now();
    const testData = generateTestData(index, eventId, eventName);
    const formData = createFormData(testData);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        const result = {
            index,
            success: response.ok,
            status: response.status,
            duration,
            timestamp: new Date().toISOString(),
        };

        if (response.ok) {
            const data = await response.json();
            result.registrationId = data.registrationId;
        } else {
            const errorData = await response.json().catch(() => ({}));
            result.error = errorData.error || response.statusText;
        }

        return result;
    } catch (error) {
        const endTime = Date.now();
        return {
            index,
            success: false,
            status: 0,
            duration: endTime - startTime,
            timestamp: new Date().toISOString(),
            error: error.message,
        };
    }
}

/**
 * Run load test with specified concurrency
 */
async function runLoadTest(testName, concurrency, eventId, eventName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Starting ${testName}`);
    console.log(`   Concurrency: ${concurrency}`);
    console.log(`   Event: ${eventName} (${eventId})`);
    console.log(`${'='.repeat(60)}\n`);

    const startTime = Date.now();

    // Execute all requests concurrently
    const promises = Array.from({ length: concurrency }, (_, i) =>
        executeRegistration(i + 1, eventId, eventName)
    );

    const results = await Promise.all(promises);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    // Calculate metrics
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const successRate = (successful / concurrency * 100).toFixed(2);
    const avgDuration = (results.reduce((sum, r) => sum + r.duration, 0) / concurrency).toFixed(0);
    const minDuration = Math.min(...results.map(r => r.duration));
    const maxDuration = Math.max(...results.map(r => r.duration));

    // Group errors
    const errorGroups = {};
    results.filter(r => !r.success).forEach(r => {
        const errorKey = r.error || 'Unknown Error';
        errorGroups[errorKey] = (errorGroups[errorKey] || 0) + 1;
    });

    // Print summary
    console.log(`\n📊 Results:`);
    console.log(`   Total Time: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`   Success: ${successful}/${concurrency} (${successRate}%)`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Avg Response: ${avgDuration}ms`);
    console.log(`   Min Response: ${minDuration}ms`);
    console.log(`   Max Response: ${maxDuration}ms`);

    if (Object.keys(errorGroups).length > 0) {
        console.log(`\n❌ Errors:`);
        Object.entries(errorGroups).forEach(([error, count]) => {
            console.log(`   ${error}: ${count}`);
        });
    }

    // Save detailed results
    const reportName = `${testName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`;
    const reportPath = path.join(RESULTS_DIR, reportName);

    const report = {
        testName,
        concurrency,
        eventId,
        eventName,
        timestamp: new Date().toISOString(),
        totalDuration,
        metrics: {
            successful,
            failed,
            successRate: parseFloat(successRate),
            avgDuration: parseInt(avgDuration),
            minDuration,
            maxDuration,
        },
        errorGroups,
        details: results,
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved: ${reportPath}\n`);

    return report;
}

/**
 * Fetch an active event for testing
 */
async function fetchActiveEvent() {
    try {
        console.log('🔍 Fetching events from API...');
        const response = await fetch('https://rmccbit.in/api/events');

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const events = await response.json();

        if (!events || events.length === 0) {
            throw new Error('No events found in database');
        }

        // Find an active event with registrations open
        const activeEvent = events.find(e =>
            (e.registrationOpen === true || e.status === 'active') &&
            e.id && e.title
        );

        if (activeEvent) {
            console.log(`✅ Found active event: ${activeEvent.title}`);
            return {
                id: activeEvent.id,
                name: activeEvent.title,
            };
        }

        // Fallback: use first event
        console.log(`⚠️  No active event found, using first available: ${events[0].title}`);
        return {
            id: events[0].id,
            name: events[0].title,
        };

    } catch (error) {
        console.error('❌ Error fetching events:', error.message);
        console.log('💡 Using fallback test event...');
        return {
            id: 'test-event-2024',
            name: 'Load Test Event',
        };
    }
}

/**
 * Main execution
 */
async function main() {
    console.log('\n🔥 Registration API Load Test\n');

    // Fetch event
    const event = await fetchActiveEvent();
    console.log(`✅ Target Event: ${event.name} (${event.id})\n`);

    // Run tests
    const burstTest = await runLoadTest('Burst Test', 20, event.id, event.name);

    // Wait 5 seconds between tests
    console.log('⏳ Waiting 5 seconds before stress test...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const stressTest = await runLoadTest('Stress Test', 50, event.id, event.name);

    // Summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📈 Test Summary');
    console.log(`${'='.repeat(60)}`);
    console.log(`Burst Test (20): ${burstTest.metrics.successRate}% success, ${burstTest.metrics.avgDuration}ms avg`);
    console.log(`Stress Test (50): ${stressTest.metrics.successRate}% success, ${stressTest.metrics.avgDuration}ms avg`);
    console.log(`${'='.repeat(60)}\n`);
}

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { runLoadTest, fetchActiveEvent };
