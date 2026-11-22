const http = require('http');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
require('dotenv').config({ path: '.env.local' });

const PORT = 8080;
const REDIRECT_URI = `http://localhost:${PORT}`;

async function runLocalLogin() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
    ],
    prompt: 'consent',
  });

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h1>Authentication Failed</h1><p>${error}</p>`);
        console.error('❌ User cancelled or Google returned error:', error);
        server.close();
        process.exit(1);
      }

      if (code) {
        console.log('\nReceived authorization code. Exchanging for tokens...');
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
              <h2 style="color: #b45309;">⚠️ No Refresh Token Returned</h2>
              <p>Google didn't return a new refresh token because this app was already authorized.</p>
              <p>Please re-run with <code>prompt: consent</code> or revoke access and try again.</p>
            </div>
          `);
          console.warn('⚠️ No refresh token returned. Access token received.');
          server.close();
          process.exit(0);
        }

        // Update .env.local
        const envPath = path.join(process.cwd(), '.env.local');
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_REFRESH_TOKEN=')) {
          envContent = envContent.replace(
            /GOOGLE_REFRESH_TOKEN=.*/,
            `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
          );
        } else {
          envContent += `\nGOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`;
        }
        fs.writeFileSync(envPath, envContent);

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <div style="font-family: sans-serif; text-align: center; padding: 60px; background: #0f172a; color: white;">
            <h1 style="color: #14b8a6;">🎉 Google Drive Connected Successfully!</h1>
            <p style="font-size: 16px; color: #cbd5e1;">Your <code>GOOGLE_REFRESH_TOKEN</code> has been automatically updated in <code>.env.local</code>.</p>
            <p style="color: #94a3b8;">You can now close this browser tab and return to the RMC Admin Console.</p>
          </div>
        `);

        console.log('\n======================================================');
        console.log('🎉 SUCCESS! GOOGLE_REFRESH_TOKEN updated in .env.local');
        console.log('======================================================\n');
        console.log('Refresh token:', tokens.refresh_token.substring(0, 20) + '...');
        console.log('\nNext steps:');
        console.log('Restart your Next.js dev server to load the new token:');
        console.log('  npm run dev\n');

        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1500);
      }
    } catch (err) {
      console.error('❌ Error handling callback:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h1>Error</h1><p>${err.message}</p>`);
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`\n======================================================`);
    console.log(` RMC Google Drive 1-Click Authenticator`);
    console.log(`======================================================`);
    console.log(`\nListening on ${REDIRECT_URI}...`);
    console.log(`\nOpening your browser for one-click authorization:`);
    console.log(authUrl);

    // Automatically open browser on Windows
    exec(`start "" "${authUrl.replace(/&/g, '^&')}"`);
  });
}

runLocalLogin().catch(console.error);

