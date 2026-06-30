import { google } from 'googleapis';
import { Readable } from 'stream';
import { unstable_cache, revalidateTag } from 'next/cache';

const SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
];

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || 'Sheet1';
const sheetRange = (a1: string) => `${SHEET_TAB}!${a1}`;

const isHeaderCell = (value: unknown, expected: string) =>
    String(value ?? '').trim().toLowerCase() === expected.trim().toLowerCase();

const normalizeCell = (value: unknown) => String(value ?? '').trim();

// ========== PERFORMANCE OPTIMIZATION: CACHING ==========

/**  * In-memory cache to reduce redundant Google API calls during high concurrency.
 * Cache persists for the lifetime of the serverless function instance (typically 5-15 min).
 * Significantly improves throughput during burst traffic (e.g., 50+ concurrent registrations).
 */

// Folder ID cache: eventName -> folderId
const folderCache = new Map<string, { id: string; timestamp: number }>();
const FOLDER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Sheet validation cache: spreadsheetId -> timestamp
const sheetCheckedCache = new Map<string, number>();
const SHEET_CHECK_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached folder ID or return null if expired/missing
 */
function getCachedFolderId(key: string): string | null {
    const cached = folderCache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > FOLDER_CACHE_TTL) {
        folderCache.delete(key);
        return null;
    }
    return cached.id;
}

/**
 * Cache a folder ID
 */
function cacheFolderId(key: string, id: string): void {
    folderCache.set(key, { id, timestamp: Date.now() });
}

/**
 * Check if sheet was recently validated
 */
function isSheetRecentlyChecked(spreadsheetId: string): boolean {
    const timestamp = sheetCheckedCache.get(spreadsheetId);
    if (!timestamp) return false;
    if (Date.now() - timestamp > SHEET_CHECK_TTL) {
        sheetCheckedCache.delete(spreadsheetId);
        return false;
    }
    return true;
}

/**
 * Mark sheet as validated
 */
function markSheetAsChecked(spreadsheetId: string): void {
    sheetCheckedCache.set(spreadsheetId, Date.now());
}

// ======================================================

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
const getAuthClient = async (): Promise<any> => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // 1. Prefer Service Account (Serverside / API)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: SCOPES,
            });
            const client = await auth.getClient();
            return client;
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            // If Service Account fails, we might want to fall back or just throw
            console.warn(`[Google Auth] Service Account failed: ${error.message}. Trying OAuth as fallback...`);
        }
    }

    // 2. Try OAuth 2.0 (User Account - Free 15GB Quota)
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
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            // Only log error if Service Account was NOT attempted/available
            if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
                console.error('[Google Auth] OAuth refresh token error:', error.message);
                throw new Error(`Google OAuth token is invalid or expired. Error: ${error.message}`);
            }
        }
    }

    throw new Error('Missing Google Credentials: Set GOOGLE_SERVICE_ACCOUNT_JSON (Service Account) or GOOGLE_REFRESH_TOKEN (User)');
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
 * OPTIMIZED: Uses in-memory cache to avoid redundant Drive API calls
 */
export const getOrCreateFolder = async (folderName: string, parentFolderId: string): Promise<string> => {
    // Check cache first
    const cacheKey = `${folderName}::${parentFolderId}`;
    const cachedId = getCachedFolderId(cacheKey);
    if (cachedId) {
        return cachedId;
    }

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
            const folderId = response.data.files[0].id!;
            cacheFolderId(cacheKey, folderId);
            return folderId;
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

        const folderId = folder.data.id!;
        cacheFolderId(cacheKey, folderId);
        return folderId;
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
    const sheets = google.sheets({ version: 'v4', auth: authClient as any }); // eslint-disable-line @typescript-eslint/no-explicit-any
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
    const sheets = google.sheets({ version: 'v4', auth: authClient as any }); // eslint-disable-line @typescript-eslint/no-explicit-any

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
 * OPTIMIZED: Uses cache to skip redundant checks during burst traffic
 */
export const ensureRegistrationSheet = async (spreadsheetId: string) => {
    // Skip if recently validated (within TTL)
    if (isSheetRecentlyChecked(spreadsheetId)) {
        return;
    }

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

        // Mark as checked
        markSheetAsChecked(spreadsheetId);

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

        const updates = (res as any)?.data?.updates; // eslint-disable-line @typescript-eslint/no-explicit-any
        console.info('Sheets append ok', { updatedRows: updates?.updatedRows });
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.error('Sheets append failed', error.message);
        throw error;
    }
};

/**
 * Ensure the Recruitment Sheet exists and has the correct headers.
 */
export const ensureRecruitmentSheet = async (spreadsheetId: string, sheetName: string = 'Recruitment') => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        const response = await sheets.spreadsheets.get({ spreadsheetId });
        const sheetExists = response.data.sheets?.some(s => s.properties?.title === sheetName);

        if (!sheetExists) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName,
                                gridProperties: { rowCount: 1000, columnCount: 15 }
                            }
                        }
                    }]
                }
            });
        }

        const headers = [
            'Timestamp', 'Application ID', 'Name', 'Email', 'Phone', 'Roll No', 'Branch',
            'Year', 'Team', 'Status', 'Academic Year', 'Extra Fields JSON'
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1:L1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [headers] }
        });
    } catch (error) {
        console.error('Error ensuring recruitment sheet:', error);
    }
};

/**
 * Append a recruitment application row to the Google Sheet
 */
export const appendRecruitmentRowToSheet = async (
    spreadsheetId: string,
    rowData: string[],
    sheetName: string = 'Recruitment'
) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        await ensureRecruitmentSheet(spreadsheetId, sheetName);
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${sheetName}!A1`,
            insertDataOption: 'INSERT_ROWS',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });
    } catch (error: any) {
        console.error('Recruitment sheets append failed', error.message);
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
    timeSlot?: string;
}

/**
 * Fetch all registrations from Google Sheet (Cols A-T)
 * OPTIMIZED: Uses unstable_cache to reduce Google API calls (TTL: 120s)
 */
export const getAllRegistrations = unstable_cache(
    async (spreadsheetId: string): Promise<RegistrationData[]> => {
        const authClient = await getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth: authClient as any }); // eslint-disable-line @typescript-eslint/no-explicit-any

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetRange('A:V'),
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
            driveDownloadUrl: normalizeCell(row[19]),  // T
            timeSlot: normalizeCell(row[20])           // U
        }));
    },
    ['all-registrations-list'],
    {
        revalidate: 60, // 1 minute
        tags: ['registrations']
    }
);

/**
 * Mark attendance: Status (L), Checked-in (P), Member Attendance (Q)
 */
export const markRegistrationAttendance = async (
    spreadsheetId: string,
    registrationId: string,
    updates: { status?: string; checkedInAt?: string; memberAttendance?: string }
) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any }); // eslint-disable-line @typescript-eslint/no-explicit-any

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

        // Invalidate cache since we modified the sheet
        try {
            // @ts-expect-error - revalidateTag typing issue in this env
            revalidateTag('registrations');
        } catch (e) {
            console.warn('RevalidateTag failed in markRegistrationAttendance:', e);
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

export const getAnnouncements = unstable_cache(
    async (spreadsheetId: string): Promise<AnnouncementData[]> => {
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
        } catch { return []; }
    },
    ['announcements-list'],
    {
        revalidate: 3600, // 1 hour revalidation
        tags: ['announcements']
    }
);

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
    // @ts-expect-error - revalidateTag typing issue in this env
    revalidateTag('announcements');
};

export const deleteAnnouncement = async (spreadsheetId: string, announcementId: string) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 1. Find the row index
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Announcements!A:A',
    });

    const rows = response.data.values;
    if (!rows) return;

    const rowIndex = rows.findIndex(row => row[0] === announcementId);
    if (rowIndex === -1) return;

    // 2. Delete the row
    // Note: deleteDimension is 0-indexed, but it affects the actual sheet rows.
    // If rowIndex is 1 (second row in the array/sheet), it deletes row 2.
    const res = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetId = res.data.sheets?.find(s => s.properties?.title === 'Announcements')?.properties?.sheetId;

    if (sheetId === undefined) return;

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    deleteDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1,
                        },
                    },
                },
            ],
        },
    });

    // @ts-expect-error - revalidateTag typing issue in this env
    revalidateTag('announcements');
};
