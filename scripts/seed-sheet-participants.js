const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function seedParticipants() {
  console.log('\n======================================================');
  console.log(' RMC Certificate Spreadsheet Auto-Seeder');
  console.log('======================================================\n');

  const sheetId =
    process.env.GOOGLE_CERTIFICATES_SHEET_ID ||
    process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    console.error('❌ No GOOGLE_CERTIFICATES_SHEET_ID found in .env.local');
    process.exit(1);
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    console.error('❌ Missing GOOGLE_SERVICE_ACCOUNT_JSON in .env.local');
    process.exit(1);
  }

  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log(`Target Spreadsheet ID: ${sheetId}`);

  // 1. Get available tabs
  const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  const tabs = meta.data.sheets.map((s) => s.properties.title);
  console.log('Available tabs:', tabs);

  // Check if Sheet1 exists, if not create it
  const targetTab = tabs.includes('Sheet1') ? 'Sheet1' : tabs[0];

  // 2. Check current row count
  const current = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${targetTab}!A1:Z5`,
  });

  const rowCount = current.data.values?.length || 0;
  console.log(`Current rows in '${targetTab}': ${rowCount}`);

  if (rowCount > 0 && !process.argv.includes('--force')) {
    console.log(`\nℹ️ Tab '${targetTab}' already has data rows. To overwrite, run with --force:`);
    console.log('  node scripts/seed-sheet-participants.js --force\n');
    return;
  }

  // 3. Write participant template and sample data
  const sampleData = [
    ['Name', 'Roll No', 'College', 'Email', 'Event Name', 'Event Dates'],
    ['Adithya Vardhan Vemula', '160122733001', 'CBIT (A)', 'adithya@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
    ['B. Sai Teja', '160122733015', 'CBIT (A)', 'saiteja@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
    ['K. Sneha Reddy', '160122733042', 'CBIT (A)', 'sneha@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
    ['M. Rahul Sharma', '160122733088', 'CBIT (A)', 'rahul@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
    ['P. Ananya Rao', '160122733104', 'CBIT (A)', 'ananya@example.com', 'Maths Premier League (MPL)', '25 September to 27 September 2026'],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${targetTab}!A1:F${sampleData.length}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: sampleData,
    },
  });

  console.log(`\n✅ Successfully seeded ${sampleData.length - 1} participant rows into tab '${targetTab}'!`);
  console.log('Columns created: Name, Roll No, College, Email, Event Name, Event Dates\n');
}

seedParticipants().catch(console.error);

