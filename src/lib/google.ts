import { google } from 'googleapis';
import { Readable } from 'stream';
import { OAuth2Client } from 'google-auth-library';
import { JSONClient } from 'google-auth-library/build/src/auth/googleauth';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
const sheetRange = (a1: string) => `${SHEET_TAB}!${a1}`;

const isHeaderCell = (value: unknown, expected: string) =>
    String(value ?? '').trim().toLowerCase() === expected.trim().toLowerCase();

const normalizeCell = (value: unknown) => String(value ?? '').trim();

/**
 * Compare two registration IDs, handling the case where Google Sheets
 * strips leading zeros from numeric cells.
 * e.g., "040526" should match "40526"
 */
const matchesRegistrationId = (storedId: string, wantedId: string): boolean => {
    const stored = normalizeCell(storedId);
    const wanted = normalizeCell(wantedId);
    // Exact match first
    if (stored === wanted) return true;
    // Fallback: compare as integers to handle stripped leading zeros
    const storedNum = parseInt(stored, 10);
    const wantedNum = parseInt(wanted, 10);
    return !isNaN(storedNum) && !isNaN(wantedNum) && storedNum === wantedNum;
};

/**
 * Authenticate using Service Account from Environment Variable
 */
const getAuthClient = async (): Promise<any> => {
    // 1. Try OAuth 2.0 (User Account - Free 15GB Quota)
    if (process.env.GOOGLE_REFRESH_TOKEN && process.env.GOOGLE_CLIENT_ID) {
        try {
            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
            );

            oauth2Client.setCredentials({
                refresh_token: process.env.GOOGLE_REFRESH_TOKEN
            });

            // Test the credentials by getting a new access token
            const { credentials } = await oauth2Client.refreshAccessToken();
            oauth2Client.setCredentials(credentials);

            return oauth2Client;
        } catch (error: any) {
            console.error('[Google Auth] OAuth refresh token error:', error.message);
            // If OAuth fails, try service account fallback
            if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
                console.warn('[Google Auth] OAuth failed, falling back to service account');
            } else {
                throw new Error(`Google OAuth token is invalid or expired. Please regenerate the refresh token. Error: ${error.message}`);
            }
        }
    }

    // 2. Fallback to Service Account (0GB Quota unless billed)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });
            const client = await auth.getClient();
            return client;
        } catch (error: any) {
            throw new Error(`Google Service Account authentication failed: ${error.message}`);
        }
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
    const drive = google.drive({ version: 'v3', auth: authClient });

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
    const drive = google.drive({ version: 'v3', auth: authClient });

    const safeFolderName = folderName.replace(/'/g, "\\'");
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
        throw error;
    }
};

/**
 * Get a Resumable Upload URL for direct client-side upload.
 * This bypasses the server for the file body transfer, speeding up large uploads.
 */
export const getResumableUploadUrl = async (
    fileName: string,
    mimeType: string,
    parentFolderId: string
): Promise<string> => {
    const authClient = await getAuthClient();

    // Metadata for the file to be created
    const metadata = {
        name: fileName,
        mimeType: mimeType,
        parents: [parentFolderId]
    };

    try {
        const response = await authClient.request({
            url: 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink,webContentLink',
            method: 'POST',
            headers: {
                'X-Upload-Content-Type': mimeType,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });

        const uploadUrl = response.headers.location;
        if (!uploadUrl) {
            throw new Error('No upload URL returned from Google');
        }

        return uploadUrl;
    } catch (error) {
        console.error('Error getting resumable upload URL:', error);
        throw error;
    }
};

/**
 * Check if the UTR already exists in the Google Sheet.
 * New Layout: UTR ID is in Column J (Index 9)
 */
export const checkDuplicateUTR = async (
    spreadsheetId: string,
    utr: string
): Promise<boolean> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    const range = sheetRange('J:J');

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
        return false;
    }

    const normalizedUTR = utr.trim().toUpperCase();
    const existingUTRs = rows.flat().map((val) => String(val).trim().toUpperCase());

    return existingUTRs.includes(normalizedUTR);
};

/**
 * Check if a registration ID (ticket code) already exists in the Google Sheet (Column B).
 */
export const checkDuplicateRegistrationId = async (spreadsheetId: string, registrationId: string): Promise<boolean> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetRange('B:B'),
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return false;

    // Check if header exists to skip it
    const hasHeader = isHeaderCell(rows[0]?.[0], 'ticket code') || isHeaderCell(rows[0]?.[0], 'registration id');
    const startIdx = hasHeader ? 1 : 0;

    for (let i = startIdx; i < rows.length; i++) {
        if (matchesRegistrationId(rows[i]?.[0] ?? '', registrationId)) return true;
    }
    return false;
};

/**
 * Ensure the Registration Sheet exists and has the correct headers (A-T).
 */
export const ensureRegistrationSheet = async (spreadsheetId: string) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = response.data.sheets?.some(s => s.properties?.title === SHEET_TAB);

        if (!sheetExists) {
            // Create sheet
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: SHEET_TAB,
                                gridProperties: { rowCount: 1000, columnCount: 20 }
                            }
                        }
                    }]
                }
            });
        }

        // Always enforce headers on the first row to ensure they match our schema
        // Cols A-T (20 columns)
        const headers = [
            'Timestamp', 'Ticket Code', 'Event Name', 'Participant Name', 'Email', 'Phone', 'Roll No', 'Department',
            'Team Members', 'UTR ID', 'Amount', 'Status', 'Payment Screenshot', 'Abstract', 'PPT Link',
            'Check-In Time', 'Member Attendance', 'Event ID', 'File ID', 'Download Link'
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: sheetRange('A1:T1'),
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [headers] }
        });

    } catch (error) {
        console.error('Error ensuring registration sheet:', error);
        // Don't throw, we might still be able to append if sheet exists manually
    }
};

/**
 * Append a row to the Google Sheet
 */
export const appendRowToSheet = async (
    spreadsheetId: string,
    rowData: string[]
) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: sheetRange('A1'),
            insertDataOption: 'INSERT_ROWS',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });

        const updates: any = (res as any)?.data?.updates;
        console.info('Sheets append ok', { updatedRows: updates?.updatedRows });
    } catch (error: any) {
        console.error('Sheets append failed', error.message);
        throw error;
    }
};

export interface RegistrationData {
    timestamp: string;
    registrationId: string;
    eventId: string;
    eventName: string;
    name: string;
    email: string;
    rollNo: string;
    department: string;
    utrId: string;
    amount: number;
    driveFileId: string;
    driveViewUrl: string;
    driveDownloadUrl: string;
    status: string;
    checkedInAt?: string;
    teamMembers?: string;
    memberAttendance?: string;
    phone?: string;
    abstract?: string;
    pptLink?: string;
}

/**
 * Fetch all registrations from Google Sheet (Cols A-T)
 */
export const getAllRegistrations = async (spreadsheetId: string): Promise<RegistrationData[]> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetRange('A:T'),
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // Header check
    const firstRow = rows[0] || [];
    const hasHeader = isHeaderCell(firstRow[1], 'ticket code') || isHeaderCell(firstRow[1], 'registration id');
    const dataRows = hasHeader ? rows.slice(1) : rows;

    return dataRows.map(row => ({
        timestamp: normalizeCell(row[0]),
        registrationId: normalizeCell(row[1]),     // B
        eventName: normalizeCell(row[2]),          // C
        name: normalizeCell(row[3]),               // D
        email: normalizeCell(row[4]),              // E
        phone: normalizeCell(row[5]),              // F
        rollNo: normalizeCell(row[6]),             // G
        department: normalizeCell(row[7]),         // H
        teamMembers: normalizeCell(row[8]),        // I
        utrId: normalizeCell(row[9]),              // J
        amount: parseFloat(normalizeCell(row[10])) || 0, // K
        status: normalizeCell(row[11]) || 'PENDING', // L
        driveViewUrl: normalizeCell(row[12]),      // M (Screenshot)
        abstract: normalizeCell(row[13]),          // N
        pptLink: normalizeCell(row[14]),           // O
        checkedInAt: normalizeCell(row[15]),       // P
        memberAttendance: normalizeCell(row[16]),  // Q
        eventId: normalizeCell(row[17]),           // R
        driveFileId: normalizeCell(row[18]),       // S
        driveDownloadUrl: normalizeCell(row[19])   // T
    }));
};

/**
 * Mark attendance: Status (L), Checked-in (P), Member Attendance (Q)
 */
export const markRegistrationAttendance = async (
    spreadsheetId: string,
    registrationId: string,
    updates: { status?: string; checkedInAt?: string; memberAttendance?: string }
) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: sheetRange('B:B') });
        const rows = response.data.values;
        if (!rows || rows.length === 0) return { success: false, error: 'No registrations' };

        const hasHeader = isHeaderCell(rows[0]?.[0], 'ticket code');
        const startIdx = hasHeader ? 1 : 0;
        const rowIndex = rows.findIndex((row, idx) => idx >= startIdx && matchesRegistrationId(row?.[0] ?? '', registrationId));

        if (rowIndex === -1) return { success: false, error: 'Registration not found' };
        const sheetRowNumber = rowIndex + 1;

        if (updates.status != null) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: sheetRange(`L${sheetRowNumber}`),
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[updates.status]] },
            });
        }
        if (updates.checkedInAt != null) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: sheetRange(`P${sheetRowNumber}`),
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[updates.checkedInAt]] },
            });
        }
        if (updates.memberAttendance != null) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: sheetRange(`Q${sheetRowNumber}`),
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[updates.memberAttendance]] },
            });
        }

        return { success: true, rowNumber: sheetRowNumber };
    } catch (error) {
        console.error('Error marking attendance:', error);
        return { success: false, error: 'Failed' };
    }
};

/**
 * Update Status (Column L)
 */
export const updateRegistrationStatus = async (spreadsheetId: string, registrationId: string, newStatus: string) => {
    return markRegistrationAttendance(spreadsheetId, registrationId, { status: newStatus });
};

/**
 * Mark Checked-In (Column P)
 */
export const markRegistrationCheckedIn = async (spreadsheetId: string, registrationId: string, checkedInAt: string = new Date().toISOString()) => {
    return markRegistrationAttendance(spreadsheetId, registrationId, { checkedInAt });
};

export const getRegistrationById = async (spreadsheetId: string, registrationId: string) => {
    const wantedId = normalizeCell(registrationId);
    if (!/^\d{6}$/.test(wantedId)) return null;
    const registrations = await getAllRegistrations(spreadsheetId);
    return registrations.find(r => matchesRegistrationId(r.registrationId, wantedId)) || null;
};

// ... Announcements code remains same ...
export interface AnnouncementData {
    id: string;
    title: string;
    content: string;
    category: string;
    date: string;
    postedBy: string;
}

const ensureSheetExists = async (spreadsheetId: string, title: string) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const sheet = response.data.sheets?.find(s => s.properties?.title === title);
        if (!sheet) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title,
                                gridProperties: { rowCount: 1000, columnCount: 10 }
                            }
                        }
                    }]
                }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${title}!A1:F1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['ID', 'Title', 'Content', 'Category', 'Date', 'PostedBy']] }
            });
        }
    } catch (error) { console.error(`Error ensuring sheet '${title}'`, error); }
};

export const getAnnouncements = async (spreadsheetId: string): Promise<AnnouncementData[]> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    try {
        await ensureSheetExists(spreadsheetId, 'Announcements');
        const response = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Announcements!A:F' });
        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];
        return rows.slice(1).map((row) => ({
            id: row[0] || '', title: row[1] || '', content: row[2] || '', category: row[3] || '', date: row[4] || '', postedBy: row[5] || 'Admin',
        })).reverse();
    } catch (error) { return []; }
};

export const createAnnouncement = async (spreadsheetId: string, announcement: AnnouncementData) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    await ensureSheetExists(spreadsheetId, 'Announcements');
    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Announcements!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[announcement.id, announcement.title, announcement.content, announcement.category, announcement.date, announcement.postedBy]] },
    });
};
