import { NextResponse } from 'next/server';
import { uploadToDrive, getOrCreateFolder } from '@/lib/google';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // define the root folder name for all resources
        const ROOT_FOLDER_NAME = "RMC Network Resources";

        // Use a configured parent folder ID from env if available (specific Resources folder)
        // This allows the user to point to a specific Shared Drive folder or curated folder
        let parentFolderId = process.env.GOOGLE_DRIVE_RESOURCES_FOLDER_ID;

        // Fallback: If no specific resource folder is set, try the general root ID
        if (!parentFolderId) {
            parentFolderId = process.env.GOOGLE_DRIVE_ROOT_ID;
        }

        // Final Fallback: If still no ID, find/create the default in root
        if (!parentFolderId) {
            // Using 'root' as the parent to search in
            parentFolderId = await getOrCreateFolder(ROOT_FOLDER_NAME, 'root');
        }

        // Upload to Drive
        const driveFile = await uploadToDrive(
            buffer,
            file.type,
            file.name,
            parentFolderId
        );

        return NextResponse.json({
            success: true,
            fileId: driveFile.id,
            webViewLink: driveFile.webViewLink,
            webContentLink: driveFile.webContentLink
        });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file', details: error.message },
            { status: 500 }
        );
    }
}
