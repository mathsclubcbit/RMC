const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

const API_URL = 'http://127.0.0.1:3000/api/register';
const RESULTS_DIR = path.join(__dirname, '../tests/load-test-results');

if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

function generateTestData(index, eventId, eventName) {
    const timestamp = Date.now();
    const uniqueId = `${timestamp}_${index}`;

    return {
        eventId,
        eventName,
        name: `LoadTest User ${index}`,
        email: `loadtest${uniqueId}@test.com`,
        phone: `98${String(index).padStart(8, '0')}`,
        rollNo: String(202600000000 + index).padStart(12, '0'),
        department: 'TEST',
        utrId: `LT${uniqueId}`,
        amount: '100',
        teamSize: '1',
        screenshot: Buffer.from('mock screenshot data'),
    };
}

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

async function runLoadTest(testName, concurrency, eventId, eventName) {
    console.log(`\n🚀 Starting ${testName} (${concurrency} requests)`);
    const startTime = Date.now();

    const promises = Array.from({ length: concurrency }, (_, i) =>
        executeRegistration(i + 1, eventId, eventName)
    );

    const results = await Promise.all(promises);

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📊 Results: ${successful} Success, ${failed} Failed in ${(totalDuration / 1000).toFixed(2)}s`);

    const reportPath = path.join(RESULTS_DIR, `local_${testName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({ testName, concurrency, eventId, eventName, results }, null, 2));

    return results;
}

async function main() {
    const eventId = 'load-test-event-v1';
    const eventName = 'Load Test Event';

    console.log(`Targeting: ${API_URL}`);
    console.log(`Event: ${eventName} (${eventId})`);

    await runLoadTest('Main Load Test', 50, eventId, eventName);
}

main().catch(console.error);
