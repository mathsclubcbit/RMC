const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function checkCertificatesTab() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `Certificates!1:10`,
  });

  console.log('Certificates tab rows:', res.data.values);
}

checkCertificatesTab().catch(err => console.error(err.message));

