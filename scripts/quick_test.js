/**
 * Quick test - simpler version to verify setup
 */

const { runLoadTest, fetchActiveEvent } = require('./load_test.js');

async function quickTest() {
    console.log('\n🧪 Quick Load Test (5 requests)\n');

    const event = await fetchActiveEvent();
    console.log(`✅ Target Event: ${event.name} (${event.id})\n`);

    await runLoadTest('Quick Test', 5, event.id, event.name);
}

quickTest().catch(console.error);
