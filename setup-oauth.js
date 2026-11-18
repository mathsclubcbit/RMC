
/* eslint-disable @typescript-eslint/no-require-imports */
const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Basic env parser
const env = {};
try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let key = match[1].trim();
                let value = match[2].trim();
                if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
    }
} catch (e) { console.error('Error reading .env.local', e); }

const CLIENT_ID = env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for Refresh Token
    scope: SCOPES,
});

console.log('\n--- OAuth 2.0 Setup ---');
console.log('1. Visit this URL in your browser:');
console.log(`\n${authUrl}\n`);
console.log('2. Login with the Google Account that OWNS the Sheet/Folder.');
console.log('3. IMPORTANT: If sending to "OAuth Playground", click "Exchange authorization code for tokens".');
console.log('4. Copy the "Authorization Code" (or Refresh Token if using Playground manually) and paste it here.');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('\nEnter the code (or paste Token directly if you have it): ', async (code) => {
    try {
        // If the user pasted a long token starting with "1//", assume it's already a refresh token
        if (code.trim().startsWith('1//')) {
            console.log('\nLooks like you pasted a Refresh Token directly.');
            console.log(`GOOGLE_REFRESH_TOKEN=${code.trim()}`);
            console.log('\nAdd this to your .env.local file manually.');
            rl.close();
            return;
        }

        const { tokens } = await oauth2Client.getToken(code.trim());
        console.log('\n--- SUCCESS! ---');
        console.log('Add this line to your .env.local file:\n');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('\n(Note: If it says "undefined", you might have already used this code. Generate a NEW code from the URL.)');
    } catch (err) {
        console.error('\nError retrieving access token:', err.message);
    }
    rl.close();
});
