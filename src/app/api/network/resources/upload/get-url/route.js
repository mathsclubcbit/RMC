import { NextResponse } from 'next/server';
import { getResumableUploadUrl, getOrCreateFolder } from '@/lib/google';

export async function POST(request) {
    try {
        const { fileName, fileType } = await request.json();

        if (!fileName || !fileType) {
            return NextResponse.json(
                { error: 'FileName and FileType are required' },
                { status: 400 }
            );
        }

        // define the root folder name for all resources
        const ROOT_FOLDER_NAME = "RMC Network Resources";

        // Use a configured parent folder ID from env if available (specific Resources folder)
        let parentFolderId = process.env.GOOGLE_DRIVE_RESOURCES_FOLDER_ID;

        // Fallback: If no specific resource folder is set, try the general root ID
        if (!parentFolderId) {
            parentFolderId = process.env.GOOGLE_DRIVE_ROOT_ID;
        }

        // Final Fallback: If still no ID, find/create the default in root
        if (!parentFolderId) {
            parentFolderId = await getOrCreateFolder(ROOT_FOLDER_NAME, 'root');
        }

        // Get the Resumable Upload URL
        const uploadUrl = await getResumableUploadUrl(fileName, fileType, parentFolderId);

        return NextResponse.json({
            success: true,
            uploadUrl
        });

    } catch (error) {
        console.error('Error getting upload URL:', error);
        return NextResponse.json(
            { error: 'Failed to initiate upload', details: error.message },
            { status: 500 }
        );
    }
}
