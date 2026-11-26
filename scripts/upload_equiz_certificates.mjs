#!/usr/bin/env node
/** Upload generated e-quiz PDFs to a dedicated Google Drive folder. */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';
import { google } from 'googleapis';

dotenv.config({ path: '.env.local' });
dotenv.config();

const DEFAULT_FOLDER_NAME = 'E-Quiz Certificates';

function arg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || fallback : fallback;
}

async function getDriveAuthClient() {
  if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID) {
    try {
      const oauth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
      );
      oauth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
      const { credentials } = await oauth.refreshAccessToken();
      oauth.setCredentials(credentials);
      return oauth;
    } catch (error) {
      console.warn(`[E-Quiz Drive] OAuth failed; trying service account: ${error.message}`);
    }
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    throw new Error('Google Drive credentials are not configured');
  }
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return auth.getClient();
}

async function getOrCreateFolder(drive, folderName, parentId) {
  const escaped = folderName.replaceAll("'", "\\'");
  const query = [
    "mimeType='application/vnd.google-apps.folder'",
    `name='${escaped}'`,
    `'${parentId}' in parents`,
    'trashed=false',
  ].join(' and ');
  const existing = await drive.files.list({
    q: query,
    fields: 'files(id,name)',
    spaces: 'drive',
    pageSize: 10,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  if (existing.data.files?.[0]?.id) return existing.data.files[0].id;

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id,name',
    supportsAllDrives: true,
  });
  if (!created.data.id) throw new Error(`Could not create Drive folder: ${folderName}`);
  return created.data.id;
}

async function main() {
  const input = arg('--input', 'output/pdf/equiz/manifest.json');
  const folderName = arg('--folder-name', DEFAULT_FOLDER_NAME);
  const parentId = arg(
    '--parent-folder-id',
    process.env.GOOGLE_EQUIZ_DRIVE_PARENT_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || ''
  );
  const existingFolderId = process.env.GOOGLE_EQUIZ_DRIVE_FOLDER_ID || '';
  const dryRun = process.argv.includes('--dry-run');

  if (!parentId && !existingFolderId) {
    throw new Error('Set GOOGLE_DRIVE_FOLDER_ID or GOOGLE_EQUIZ_DRIVE_FOLDER_ID');
  }

  const manifestPath = path.resolve(input);
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  if (!Array.isArray(manifest) || manifest.length === 0) throw new Error('Manifest has no certificates');

  if (dryRun) {
    console.log(JSON.stringify({ dryRun: true, count: manifest.length, folderName, parentConfigured: Boolean(parentId || existingFolderId) }, null, 2));
    return;
  }

  const auth = await getDriveAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  const folderId = existingFolderId || await getOrCreateFolder(drive, folderName, parentId);
  let uploaded = 0;
  let skipped = 0;
  const failures = [];

  const pending = manifest.filter((item) => {
    if (item.drive_file_id && item.drive_url) {
      skipped++;
      return false;
    }
    return true;
  });
  const uploadOne = async (item) => {
    const manifestRelativePath = path.isAbsolute(item.filename)
      ? item.filename
      : path.resolve(path.dirname(manifestPath), item.filename);
    const pdfPath = fsSync.existsSync(manifestRelativePath)
      ? manifestRelativePath
      : path.resolve(item.filename);
    if (!fsSync.existsSync(pdfPath)) {
      return { item, error: `PDF not found: ${pdfPath}` };
    }
    try {
      const result = await drive.files.create({
        requestBody: { name: path.basename(pdfPath), parents: [folderId] },
        media: { mimeType: 'application/pdf', body: fsSync.createReadStream(pdfPath) },
        fields: 'id,name,webViewLink,webContentLink',
        supportsAllDrives: true,
        timeout: 60000,
      });
      return { item, id: result.data.id || '', url: result.data.webViewLink || result.data.webContentLink || '' };
    } catch (error) {
      return { item, error: error.message };
    }
  };

  const batchSize = 4;
  for (let start = 0; start < pending.length; start += batchSize) {
    const batch = await Promise.all(pending.slice(start, start + batchSize).map(uploadOne));
    for (const result of batch) {
      if (result.error) {
        failures.push({ certificate_id: result.item.certificate_id, error: result.error });
      } else {
        result.item.drive_file_id = result.id;
        result.item.drive_url = result.url;
        result.item.drive_folder_id = folderId;
        uploaded++;
      }
    }
    await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    console.log(`[E-Quiz Drive] processed ${Math.min(start + batchSize, pending.length)}/${pending.length}`);
  }

  console.log(JSON.stringify({ folderId, folderName, uploaded, skipped, failed: failures.length, failures }, null, 2));
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(`[E-Quiz Drive] ${error.message}`);
  process.exitCode = 1;
});
