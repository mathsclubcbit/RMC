import { createAdminClient } from './server';

/**
 * Upload a file to Supabase Storage.
 * Uses the 'documents' bucket for PDFs, PPTs, and other non-image files.
 * Returns the public URL of the uploaded file.
 */
export async function uploadToSupabaseStorage(
    file: File,
    folder: string = 'abstracts'
): Promise<string> {
    const supabase = createAdminClient();

    // Generate a unique filename
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${folder}/${timestamp}_${safeName}`;

    // Convert File to ArrayBuffer then to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
        .from('documents')
        .upload(filePath, buffer, {
            contentType: file.type || 'application/octet-stream',
            upsert: false,
        });

    if (error) {
        console.error('Supabase Storage upload error:', error);
        throw new Error(`File upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(data.path);

    return urlData.publicUrl;
}
