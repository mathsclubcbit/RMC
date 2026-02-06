/**
 * Production Load Test Runner
 * Executes progressive load tests and generates analysis report
 */

const { runLoadTest, fetchActiveEvent } = require('./load_test.js');
const fs = require('fs');
const path = require('path');

async function runProductionTests() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 PRODUCTION LOAD TEST - COMPLETE ANALYSIS');
    console.log('='.repeat(70) + '\n');

    const startTime = Date.now();

    // Fetch event
    console.log('📋 Phase 0: Setup\n');
    const event = await fetchActiveEvent();

    if (!event || !event.id) {
        console.error('❌ Failed to get event. Aborting tests.');
        return;
    }

    console.log(`   Target: https://rmccbit.in/api/register`);
    console.log(`   Event: ${event.name} (ID: ${event.id})\n`);

    const results = {
        timestamp: new Date().toISOString(),
        deployment: 'https://rmccbit.in',
        event,
        tests: []
    };

    try {
        // Test 1: Warm-up
        console.log('🔥 Phase 1: Warm-up Test (5 concurrent)\n');
        const warmup = await runLoadTest('Warm-up', 5, event.id, event.name);
        results.tests.push(warmup);

        // Wait 3 seconds
        console.log('⏳ Waiting 3 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Test 2: Burst
        console.log('💥 Phase 2: Burst Test (20 concurrent)\n');
        const burst = await runLoadTest('Burst Test', 20, event.id, event.name);
        results.tests.push(burst);

        // Wait 5 seconds
        console.log('⏳ Waiting 5 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // Test 3: Stress
        console.log('🔨 Phase 3: Stress Test (50 concurrent)\n');
        const stress = await runLoadTest('Stress Test', 50, event.id, event.name);
        results.tests.push(stress);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        results.error = error.message;
    }

    const totalTime = Date.now() - startTime;
    results.totalDuration = totalTime;

    // Generate analysis report
    generateAnalysisReport(results);
}

function generateAnalysisReport(results) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 COMPLETE ANALYSIS REPORT');
    console.log('='.repeat(70) + '\n');

    const report = [];
    report.push(`# Load Test Analysis Report`);
    report.push(`**Timestamp**: ${results.timestamp}`);
    report.push(`**Deployment**: ${results.deployment}`);
    report.push(`**Event**: ${results.event.name} (${results.event.id})`);
    report.push(`**Total Duration**: ${(results.totalDuration / 1000).toFixed(2)}s\n`);

    report.push(`---\n`);

    // Summary table
    report.push(`## Summary\n`);
    report.push(`| Test | Concurrency | Success | Failed | Success Rate | Avg Time | Min | Max |`);
    report.push(`|------|-------------|---------|--------|--------------|----------|-----|-----|`);

    results.tests.forEach(test => {
        const m = test.metrics;
        report.push(
            `| ${test.testName} | ${test.concurrency} | ${m.successful} | ${m.failed} | ` +
            `${m.successRate}% | ${m.avgDuration}ms | ${m.minDuration}ms | ${m.maxDuration}ms |`
        );
    });

    report.push(`\n---\n`);

    // Detailed analysis
    results.tests.forEach((test, idx) => {
        report.push(`## ${idx + 1}. ${test.testName} (${test.concurrency} concurrent)\n`);

        const m = test.metrics;
        const totalTime = (test.totalDuration / 1000).toFixed(2);

        report.push(`**Result**: ${m.successful}/${test.concurrency} successful (${m.successRate}%)`);
        report.push(`**Total Time**: ${totalTime}s`);
        report.push(`**Response Times**: Min ${m.minDuration}ms, Avg ${m.avgDuration}ms, Max ${m.maxDuration}ms\n`);

        if (Object.keys(test.errorGroups).length > 0) {
            report.push(`**Errors**:`);
            Object.entries(test.errorGroups).forEach(([error, count]) => {
                report.push(`- ${error}: ${count}`);
            });
            report.push('');
        }

        // Performance analysis
        if (m.successRate === 100) {
            report.push(`✅ **Status**: PASS - All requests successful`);
        } else if (m.successRate >= 80) {
            report.push(`⚠️  **Status**: PARTIAL - ${m.failed} failures detected`);
        } else {
            report.push(`❌ **Status**: FAIL - High failure rate`);
        }

        report.push(`\n---\n`);
    });

    // Overall assessment
    report.push(`## Overall Assessment\n`);

    const allTests = results.tests;
    const totalRequests = allTests.reduce((sum, t) => sum + t.concurrency, 0);
    const totalSuccess = allTests.reduce((sum, t) => sum + t.metrics.successful, 0);
    const overallSuccessRate = ((totalSuccess / totalRequests) * 100).toFixed(2);

    report.push(`**Total Requests**: ${totalRequests}`);
    report.push(`**Total Successful**: ${totalSuccess} (${overallSuccessRate}%)`);
    report.push(`**Total Failed**: ${totalRequests - totalSuccess}\n`);

    if (overallSuccessRate >= 95) {
        report.push(`### ✅ PRODUCTION READY`);
        report.push(`The system handled all test scenarios successfully.`);
    } else if (overallSuccessRate >= 80) {
        report.push(`### ⚠️  NEEDS ATTENTION`);
        report.push(`Some failures detected. Review errors before full production load.`);
    } else {
        report.push(`### ❌ NOT READY`);
        report.push(`High failure rate. Critical issues must be resolved.`);
    }

    // Save report
    const reportPath = path.join(__dirname, '../tests/load-test-results', `analysis_${Date.now()}.md`);
    fs.writeFileSync(reportPath, report.join('\n'));

    // Print to console
    console.log(report.join('\n'));
    console.log(`\n💾 Full report saved: ${reportPath}\n`);
}

// Run tests
runProductionTests().catch(console.error);
