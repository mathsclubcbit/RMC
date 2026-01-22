
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            // Very basic parser: matches KEY=VALUE
            // Doesn't handle multi-line values gracefully unless they are single line in file
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let key = match[1].trim();
                let value = match[2].trim();
                // Remove surrounding quotes if simple
                if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                    value = value.slice(1, -1);
                }
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.error('Error reading .env.local:', e);
}

async function testDrive() {
    console.log('--- Starting Drive Access Test ---');

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        console.error('ERROR: GOOGLE_SERVICE_ACCOUNT_JSON is missing.');
        return;
    }

    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
        console.error('ERROR: GOOGLE_DRIVE_FOLDER_ID is missing.');
        return;
    }

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log(`Target Folder ID: ${folderId}`);

    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        const drive = google.drive({ version: 'v3', auth });

        // Step 1: Try to get the folder metadata (Tests Read/Share Permission)
        console.log('\nStep 1: Checking Folder Access...');
        try {
            const folder = await drive.files.get({
                fileId: folderId,
                fields: 'id, name, permissions',
            });
            console.log(`SUCCESS: Found folder "${folder.data.name}" (${folder.data.id})`);
        } catch (err) {
            console.error('FAILED to access folder.');
            console.error('POSSIBLE CAUSE: Folder not shared with Service Account or ID is wrong.');
            console.error('Error Code:', err.code);
            console.error('Error Message:', err.message);
            return;
        }

        // Step 2: Try to create a dummy file (Tests Write/Quota Permission)
        console.log('\nStep 2: Attempting to create a test file...');
        try {
            const res = await drive.files.create({
                requestBody: {
                    name: 'test-write-permission.txt',
                    parents: [folderId],
                },
                media: {
                    mimeType: 'text/plain',
                    body: 'Hello World',
                },
                fields: 'id, name',
            });
            console.log(`SUCCESS: Created file "${res.data.name}" (${res.data.id})`);

            // Cleanup
            await drive.files.delete({ fileId: res.data.id });
            console.log('Cleanup: Deleted test file.');

        } catch (err) {
            console.error('FAILED to create file.');
            console.error('Error Message:', err.message);

            if (err.message.includes('storage quota')) {
                console.log('\n--- DIAGNOSIS: QUOTA ERROR ---');
                console.log('This confirms the Service Account has 0 storage quota.');
                console.log('It cannot create files even in a shared folder because it becomes the owner.');
            }
        }

    } catch (error) {
        console.error('Unexpected setup error:', error);
    }
}

testDrive();
