const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const fetch = require('node-fetch');

// Load env from .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
const TEST_EVENT_ID = 'load-test-event-v1';
const TEST_EVENT_NAME = 'Load Test Event';

async function getAuthClient() {
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
        return await auth.getClient();
    }
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_JSON');
}

async function cleanupTestData() {
    console.log('🧹 Starting cleanup of test data...');

    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const drive = google.drive({ version: 'v3', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // 1. Delete rows from Google Sheet
    console.log('--- Cleaning up Google Sheet ---');
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${SHEET_TAB}!A:R`, // Column R is Event ID
    });

    const rows = response.data.values;
    if (rows && rows.length > 0) {
        // Find indices of rows to delete (descending order to avoid index shift)
        const rowIndicesToDelete = [];
        for (let i = rows.length - 1; i >= 0; i--) {
            if (rows[i][17] === TEST_EVENT_ID) { // Column R is index 17
                rowIndicesToDelete.push(i);
            }
        }

        if (rowIndicesToDelete.length > 0) {
            console.log(`Deleting ${rowIndicesToDelete.length} rows...`);

            // Group contiguous rows for efficiency or just delete one by one
            // Batch update is better
            const requests = rowIndicesToDelete.map(index => ({
                deleteDimension: {
                    range: {
                        sheetId: 0, // Assuming Sheet1 is 0, need to fetch actual sheetId if not
                        dimension: 'ROWS',
                        startIndex: index,
                        endIndex: index + 1,
                    },
                },
            }));

            // Get the actual sheetId for SHEET_TAB
            const ss = await sheets.spreadsheets.get({ spreadsheetId });
            const sheet = ss.data.sheets.find(s => s.properties.title === SHEET_TAB);
            const sheetId = sheet.properties.sheetId;

            requests.forEach(req => req.deleteDimension.range.sheetId = sheetId);

            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests },
            });
            console.log('✅ Sheet rows deleted.');
        } else {
            console.log('No test rows found in sheet.');
        }
    }

    // 2. Delete Drive folder
    console.log('--- Cleaning up Google Drive ---');
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const folderSearch = await drive.files.list({
        q: `name='${TEST_EVENT_NAME}' and '${driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id)',
    });

    if (folderSearch.data.files && folderSearch.data.files.length > 0) {
        for (const file of folderSearch.data.files) {
            console.log(`Deleting folder: ${file.id}`);
            await drive.files.delete({ fileId: file.id });
        }
        console.log('✅ Drive folders deleted.');
    } else {
        console.log('No test folders found in Drive.');
    }

    // 3. Delete Supabase event
    console.log('--- Cleaning up Supabase ---');
    const supabaseNote = "Supabase event deletion skipped - manual or re-use for next test.";
    // Actually, let's delete it if we want a "perfect" cleanup
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        await supabase.from('events').delete().eq('id', TEST_EVENT_ID);
        console.log('✅ Supabase test event deleted.');
    }

    // 4. Trigger revalidation
    console.log('--- Triggering Revalidation ---');
    try {
        const revalRes = await fetch('http://127.0.0.1:3000/api/admin/revalidate', { method: 'POST' });
        if (revalRes.ok) {
            console.log('✅ Revalidation triggered.');
        } else {
            console.log('⚠️ Revalidation failed:', revalRes.statusText);
        }
    } catch (err) {
        console.log('⚠️ Could not connect to revalidation endpoint:', err.message);
    }

    console.log('🎉 Cleanup completed!');
}

cleanupTestData().catch(err => {
    console.error('Cleanup failed:', err);
    process.exit(1);
});
