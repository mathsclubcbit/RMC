import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];

/**
 * Authenticate using Service Account from Environment Variable
 */
const getAuthClient = async () => {
    // 1. Try OAuth 2.0 (User Account - Free 15GB Quota)
    if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID) {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
        );

        oauth2Client.setCredentials({
            refresh_token: process.env.GOOGLE_REFRESH_TOKEN
        });

        return oauth2Client;
    }

    // 2. Fallback to Service Account (0GB Quota unless billed)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
        return await auth.getClient();
    }

    throw new Error('Missing Google Credentials: Set GOOGLE_REFRESH_TOKEN (User) or GOOGLE_SERVICE_ACCOUNT_JSON (Service Account)');
};

/**
 * Upload a file to Google Drive
 */
export const uploadToDrive = async (
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    parentFolderId: string
) => {
    const authClient = await getAuthClient();
    const drive = google.drive({ version: 'v3', auth: authClient as any });

    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);

    const fileMetadata = {
        name: fileName,
        parents: [parentFolderId],
    };

    const media = {
        mimeType: mimeType,
        body: bufferStream,
    };

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
    });

    return response.data;
};

/**
 * Get or Create a folder by name inside a parent folder
 */
export const getOrCreateFolder = async (folderName: string, parentFolderId: string): Promise<string> => {
    const authClient = await getAuthClient();
    const drive = google.drive({ version: 'v3', auth: authClient as any });

    // Sanitize folder name slightly to avoid query issues
    const safeFolderName = folderName.replace(/'/g, "\\'");

    // Check if folder exists
    const query = `mimeType='application/vnd.google-apps.folder' and name='${safeFolderName}' and '${parentFolderId}' in parents and trashed=false`;

    try {
        const response = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (response.data.files && response.data.files.length > 0) {
            return response.data.files[0].id!;
        }

        // Create folder if not exists
        const fileMetadata = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        };

        const folder = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return folder.data.id!;
    } catch (error) {
        console.error('Error getting/creating folder:', error);
        throw error; // Propagate error
    }
};

/**
 * Check if the UTR already exists in the Google Sheet (Column K - index 10)
 */
export const checkDuplicateUTR = async (
    spreadsheetId: string,
    utr: string
): Promise<boolean> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    const range = 'Sheet1!K:K'; // Assuming UTR is in Column K

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
        return false;
    }

    const normalizedUTR = utr.trim().toUpperCase();
    const existingUTRs = rows.flat().map((val: any) => String(val).trim().toUpperCase());

    return existingUTRs.includes(normalizedUTR);
};

/**
 * Append a row to the Google Sheet
 */
export const appendRowToSheet = async (
    spreadsheetId: string,
    rowData: string[]
) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Sheet1!A:P',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [rowData],
        },
    });
};
