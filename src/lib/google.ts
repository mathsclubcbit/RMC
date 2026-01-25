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
}

/**
 * Fetch all registrations from Google Sheet for analytics
 */
export const getAllRegistrations = async (spreadsheetId: string): Promise<RegistrationData[]> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A:P', // Include column P for teamMembers
    });

    const rows = response.data.values;
    if (!rows || rows.length <= 1) return []; // Skip header row or empty

    // Map rows to objects (skip header)
    return rows.slice(1).map(row => ({
        timestamp: row[0] || '',
        registrationId: row[1] || '',
        eventId: row[2] || '',
        eventName: row[3] || '',
        name: row[4] || '',
        email: row[5] || '',
        rollNo: row[6] || '',
        department: row[7] || '',
        utrId: row[8] || '',
        amount: parseFloat(row[9]) || 0,
        driveFileId: row[10] || '',
        driveViewUrl: row[11] || '',
        driveDownloadUrl: row[12] || '',
        status: row[13] || 'PENDING',
        checkedInAt: row[14] || '',
        teamMembers: row[15] || '' // Column P - Team Members JSON
    }));
};

/**
 * Update registration status in Google Sheet
 * Status column is N (index 13, 1-based column 14)
 */
export const updateRegistrationStatus = async (
    spreadsheetId: string,
    registrationId: string,
    newStatus: string
): Promise<{ success: boolean; rowNumber?: number; error?: string }> => {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        // First, find the row with this registration ID (Column B)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!B:B', // Registration ID column
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return { success: false, error: 'No registrations found' };
        }

        // Find the row index (1-indexed for sheets, +1 for header)
        const rowIndex = rows.findIndex((row, idx) =>
            idx > 0 && row[0] === registrationId
        );

        if (rowIndex === -1) {
            return { success: false, error: 'Registration not found' };
        }

        // Row number in sheet (1-indexed, +1 for header compensation)
        const sheetRowNumber = rowIndex + 1;

        // Update the status column (N)
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!N${sheetRowNumber}`,
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
 * Get a single registration by ID
 */
export const getRegistrationById = async (
    spreadsheetId: string,
    registrationId: string
): Promise<RegistrationData | null> => {
    const registrations = await getAllRegistrations(spreadsheetId);
    return registrations.find(r => r.registrationId === registrationId) || null;
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
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId,
        });

        const sheet = response.data.sheets?.find(s => s.properties?.title === title);
        if (!sheet) {
            // Create the sheet
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

            // Add Headers
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
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

    try {
        // Ensure sheet exists before reading
        await ensureSheetExists(spreadsheetId, 'Announcements');

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Announcements!A:F',
        });

        const rows = response.data.values;
        if (!rows || rows.length <= 1) return []; // Skip header

        return rows.slice(1).map((row) => ({
            id: row[0] || '',
            title: row[1] || '',
            content: row[2] || '',
            category: row[3] || '',
            date: row[4] || '',
            postedBy: row[5] || 'Admin',
        })).reverse(); // Newest first
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
    const sheets = google.sheets({ version: 'v4', auth: authClient as any });

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
