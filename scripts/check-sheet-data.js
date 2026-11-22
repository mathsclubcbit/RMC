const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function checkSheet() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  console.log('Checking Spreadsheet:', spreadsheetId);

  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  console.log('Available Tabs:');
  meta.data.sheets.forEach(s => console.log(' -', s.properties.title));

  const tab = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tab}!1:5`,
  });

  console.log(`\nFirst rows of tab "${tab}":`);
  res.data.values.forEach((row, i) => {
    console.log(`Row ${i + 1}:`, row.slice(0, 8));
  });
}

checkSheet().catch(err => console.error('Sheet check error:', err.message));

