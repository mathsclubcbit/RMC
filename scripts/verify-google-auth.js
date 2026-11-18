const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function verifyGoogleAuth() {
  console.log('\n========================================');
  console.log(' Google Drive & Sheets Auth Diagnostics');
  console.log('========================================\n');

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground';

  console.log('1. Checking Environment Variables:');
  console.log('   - GOOGLE_CLIENT_ID:', clientId ? `${clientId.substring(0, 25)}...` : 'MISSING');
  console.log('   - GOOGLE_CLIENT_SECRET:', clientSecret ? 'Present (Hidden)' : 'MISSING');
  console.log('   - GOOGLE_REFRESH_TOKEN:', refreshToken ? `${refreshToken.substring(0, 15)}...` : 'MISSING');
  console.log('   - GOOGLE_REDIRECT_URI:', redirectUri);

  if (!clientId || !clientSecret) {
    console.error('\n❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
    return;
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  // If a code is passed as argument: node scripts/verify-google-auth.js <code>
  const argCode = process.argv[2];
  if (argCode) {
    console.log(`\n2. Attempting to exchange authorization code: ${argCode.substring(0, 10)}...`);
    try {
      const { tokens } = await oauth2Client.getToken(argCode);
      console.log('\n✅ Successfully exchanged authorization code!');
      console.log('   - New Refresh Token:', tokens.refresh_token);

      if (tokens.refresh_token) {
        // Update .env.local
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(/GOOGLE_REFRESH_TOKEN=.*/, `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
        }
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated GOOGLE_REFRESH_TOKEN in .env.local automatically!\n');
      }
      return;
    } catch (err) {
      console.error('\n❌ Failed to exchange code:', err.message);
      if (err.response?.data) {
        console.error('Details:', err.response.data);
      }
      return;
    }
  }

  // Test existing refresh token
  if (refreshToken) {
    console.log('\n2. Testing existing GOOGLE_REFRESH_TOKEN:');
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    try {
      const res = await oauth2Client.refreshAccessToken();
      console.log('   ✅ OAuth 2.0 Refresh SUCCESSFUL!');
      console.log('   - Access token acquired. Google Drive personal quota is ACTIVE.');

      // Test drive access
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const about = await drive.about.get({ fields: 'user, storageQuota' });
      console.log('   - Authenticated User:', about.data.user?.displayName, `(${about.data.user?.emailAddress})`);
      const quota = about.data.storageQuota;
      if (quota) {
        const totalGB = (parseInt(quota.limit || '0', 10) / (1024 * 1024 * 1024)).toFixed(1);
        const usedGB = (parseInt(quota.usage || '0', 10) / (1024 * 1024 * 1024)).toFixed(1);
        console.log(`   - Storage Quota: ${usedGB} GB used of ${totalGB} GB`);
      }
      return;
    } catch (err) {
      console.error('\n❌ OAuth Refresh Failed:', err.message);
      if (err.response?.data?.error === 'unauthorized_client') {
        console.log('\n🔍 Root Cause of "unauthorized_client":');
        console.log('The refresh token in .env.local was created using a DIFFERENT Client ID.');
        console.log('When generating the token in Google OAuth Playground:');
        console.log('1. Click the Gear icon (⚙️) on the top-right of OAuth Playground.');
        console.log('2. Check "Use your own OAuth credentials".');
        console.log(`3. Paste your Client ID: ${clientId}`);
        console.log(`4. Paste your Client Secret: ${clientSecret}`);
        console.log('5. Authorize APIs with scopes:');
        console.log('   https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets');
        console.log('6. Click "Exchange authorization code for tokens".');
      }
    }
  }

  console.log('\n3. Direct One-Click Auth URL (if needed):');
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
    prompt: 'consent',
  });
  console.log(authUrl);
  console.log('\nTip: You can authorize via this URL, copy the `code` parameter from the redirect, and run:');
  console.log('node scripts/verify-google-auth.js "<authorization_code>"\n');
}

verifyGoogleAuth().catch(console.error);

