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
 * Authenticate using Service Account from Environment Variable
 */
const getAuthClient = async (): Promise<any> => {
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
        const client = await auth.getClient();
        return client;
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
 * Current sheet layout stores UTR in Column I.
 */
export const checkDuplicateUTR = async (
    spreadsheetId: string,
    utr: string
): Promise<boolean> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });
    // UTR ID is stored in Column I in the current sheet layout
    const range = sheetRange('I:I');

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
 * Handles sheets with/without a header row.
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

    const hasHeader = isHeaderCell(rows[0]?.[0], 'registration id');
    const startIdx = hasHeader ? 1 : 0;
    const wanted = normalizeCell(registrationId);

    for (let i = startIdx; i < rows.length; i++) {
        if (normalizeCell(rows[i]?.[0]) === wanted) return true;
    }
    return false;
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
            // Anchor at A1 to avoid Sheets treating the “table” as starting elsewhere.
            // This ensures rowData writes from column A onwards.
            range: sheetRange('A1'),
            insertDataOption: 'INSERT_ROWS',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });

        const updates: any = (res as any)?.data?.updates;
        console.info('Sheets append ok', {
            spreadsheetId,
            tab: SHEET_TAB,
            updatedRange: updates?.updatedRange,
            updatedRows: updates?.updatedRows,
            updatedColumns: updates?.updatedColumns,
            updatedCells: updates?.updatedCells,
        });
    } catch (error: any) {
        const status = error?.code || error?.response?.status;
        const details = error?.response?.data || error?.errors || error?.message;
        console.error('Sheets append failed', {
            spreadsheetId,
            range: sheetRange('A1'),
            status,
            details,
        });
        throw error;
    }
};

/**
 * Registration data type for analytics
 */
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
    teamMembers?: string; // JSON string of team members from Column P
    memberAttendance?: string; // Attendance record string from Column Q
}

/**
 * Fetch all registrations from Google Sheet for analytics
 */
export const getAllRegistrations = async (spreadsheetId: string): Promise<RegistrationData[]> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetRange('A:Q'), // Include column Q for memberAttendance
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // If the sheet is new, it may not have a header row.
    // Detect headers by common cells.
    const firstRow = rows[0] || [];
    const hasHeader =
        isHeaderCell(firstRow[0], 'timestamp') ||
        isHeaderCell(firstRow[1], 'registration id') ||
        isHeaderCell(firstRow[3], 'event name');

    const dataRows = hasHeader ? rows.slice(1) : rows;
    if (dataRows.length === 0) return [];

    return dataRows.map(row => ({
        timestamp: normalizeCell(row[0]),
        registrationId: normalizeCell(row[1]),
        eventId: normalizeCell(row[2]),
        eventName: normalizeCell(row[3]),
        name: normalizeCell(row[4]),
        email: normalizeCell(row[5]),
        rollNo: normalizeCell(row[6]),
        department: normalizeCell(row[7]),
        utrId: normalizeCell(row[8]),
        amount: parseFloat(normalizeCell(row[9])) || 0,
        driveFileId: normalizeCell(row[10]),
        driveViewUrl: normalizeCell(row[11]),
        driveDownloadUrl: normalizeCell(row[12]),
        status: normalizeCell(row[13]) || 'PENDING',
        checkedInAt: normalizeCell(row[14]) || '',
        teamMembers: normalizeCell(row[15]) || '',
        memberAttendance: normalizeCell(row[16]) || ''
    }));
};

/**
 * Mark attendance by updating Status (N), Checked-in timestamp (O), and Member Attendance (Q).
 */
export const markRegistrationAttendance = async (
    spreadsheetId: string,
    registrationId: string,
    updates: { status?: string; checkedInAt?: string; memberAttendance?: string }
): Promise<{ success: boolean; rowNumber?: number; error?: string }> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetRange('B:B'),
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No registrations found' };
        }

        const hasHeader = isHeaderCell(rows[0]?.[0], 'registration id');
        const startIdx = hasHeader ? 1 : 0;
        const wantedId = normalizeCell(registrationId);

        const rowIndex = rows.findIndex((row, idx) => idx >= startIdx && normalizeCell(row?.[0]) === wantedId);
        if (rowIndex === -1) {
            return { success: false, error: 'Registration not found' };
        }

        const sheetRowNumber = rowIndex + 1;

        // Update Status (N)
        if (updates.status != null) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: sheetRange(`N${sheetRowNumber}`),
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[updates.status]] },
            });
        }

        // Update Checked-in timestamp (O)
        if (updates.checkedInAt != null) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: sheetRange(`O${sheetRowNumber}`),
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [[updates.checkedInAt]] },
            });
        }

        // Update Member Attendance (Q)
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
        console.error('Error marking registration attendance:', error);
        return { success: false, error: 'Failed to update attendance' };
    }
};

/**
 * Update registration status in Google Sheet
 */
export const updateRegistrationStatus = async (
    spreadsheetId: string,
    registrationId: string,
    newStatus: string
): Promise<{ success: boolean; rowNumber?: number; error?: string }> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetRange('B:B'), // Registration ID column
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No registrations found' };
        }

        const hasHeader = isHeaderCell(rows[0]?.[0], 'registration id');
        const startIdx = hasHeader ? 1 : 0;
        const wantedId = normalizeCell(registrationId);

        // Find the row index (1-indexed for sheets, +1 for header)
        const rowIndex = rows.findIndex((row, idx) => idx >= startIdx && normalizeCell(row?.[0]) === wantedId);

        if (rowIndex === -1) {
            return { success: false, error: 'Registration not found' };
        }

        const sheetRowNumber = rowIndex + 1;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: sheetRange(`N${sheetRowNumber}`),
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[newStatus]]
            }
        });

        return { success: true, rowNumber: sheetRowNumber };
    } catch (error) {
        console.error('Error updating registration status:', error);
        return { success: false, error: 'Failed to update status' };
    }
};

/**
 * Mark a registration as checked-in by setting checkedInAt column (O).
 * Column mapping based on Sheet1!A:Q:
 * - Registration ID: column B
 * - Checked-in timestamp: column O (index 15, 1-based)
 */
export const markRegistrationCheckedIn = async (
    spreadsheetId: string,
    registrationId: string,
    checkedInAt: string = new Date().toISOString()
): Promise<{ success: boolean; rowNumber?: number; error?: string }> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        // Find row index by scanning Registration ID column (B)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: sheetRange('B:B'),
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No registrations found' };
        }

        const hasHeader = isHeaderCell(rows[0]?.[0], 'registration id');
        const startIdx = hasHeader ? 1 : 0;
        const wantedId = normalizeCell(registrationId);

        const rowIndex = rows.findIndex((row, idx) => idx >= startIdx && normalizeCell(row?.[0]) === wantedId);
        if (rowIndex === -1) {
            return { success: false, error: 'Registration not found' };
        }

        const sheetRowNumber = rowIndex + 1;

        // Update checkedInAt column (O)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: sheetRange(`O${sheetRowNumber}`),
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[checkedInAt]],
            },
        });

        return { success: true, rowNumber: sheetRowNumber };
    } catch (error) {
        console.error('Error marking registration checked-in:', error);
        return { success: false, error: 'Failed to mark checked-in' };
    }
};

/**
 * Get a single registration by ID
 */
export const getRegistrationById = async (
    spreadsheetId: string,
    registrationId: string
): Promise<RegistrationData | null> => {
    const wantedId = normalizeCell(registrationId);
    if (!/^\d{6}$/.test(wantedId)) return null;

    const registrations = await getAllRegistrations(spreadsheetId);
    return registrations.find(r => normalizeCell(r.registrationId) === wantedId) || null;
};

/**
 * Announcement Data Type
 */
export interface AnnouncementData {
    id: string;
    title: string;
    content: string;
    category: string;
    date: string;
    postedBy: string;
}

/**
 * Helper: Check if a sheet (tab) exists, and create it if not.
 */
const ensureSheetExists = async (spreadsheetId: string, title: string) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        const sheet = response.data.sheets?.find(s => s.properties?.title === title);
        if (!sheet) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title,
                                    gridProperties: {
                                        rowCount: 1000,
                                        columnCount: 10
                                    }
                                }
                            }
                        }
                    ]
                }
            });

            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${title}!A1:F1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [['ID', 'Title', 'Content', 'Category', 'Date', 'PostedBy']]
                }
            });
        }
    } catch (error) {
        console.error(`Error ensuring sheet '${title}' exists:`, error);
        throw error;
    }
};

/**
 * Fetch all announcements from Google Sheet (Announcements Tab)
 */
export const getAnnouncements = async (spreadsheetId: string): Promise<AnnouncementData[]> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    try {
        await ensureSheetExists(spreadsheetId, 'Announcements');

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Announcements!A:F',
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) return [];

        return rows.slice(1).map((row) => ({
            id: row[0] || '',
            title: row[1] || '',
            content: row[2] || '',
            category: row[3] || '',
            date: row[4] || '',
            postedBy: row[5] || 'Admin',
        })).reverse();
    } catch (error) {
        console.warn("Could not fetch announcements:", error);
        return [];
    }
};

/**
 * Create a new announcement
 */
export const createAnnouncement = async (
    spreadsheetId: string,
    announcement: AnnouncementData
) => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    await ensureSheetExists(spreadsheetId, 'Announcements');

    const rowData = [
        announcement.id,
        announcement.title,
        announcement.content,
        announcement.category,
        announcement.date,
        announcement.postedBy
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Announcements!A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData],
            },
        });
    } catch (error: any) {
        console.error("Error creating announcement:", error);
        throw error;
    }
};
