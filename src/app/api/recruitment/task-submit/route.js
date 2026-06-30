import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const applicationId = formData.get('applicationId');

        if (!file || !applicationId) {
            return NextResponse.json({ error: 'Missing file or application ID' }, { status: 400 });
        }

        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
        }

        const supabase = createAdminClient();

        // Check if application exists
        const { data: appData, error: appError } = await supabase
            .from('recruitment_applications')
            .select('id, name')
            .eq('id', applicationId)
            .single();

        if (appError || !appData) {
            return NextResponse.json({ error: 'Invalid application ID' }, { status: 404 });
        }

        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${applicationId}_${Date.now()}.${fileExt}`;
        
        // Convert File object to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('recruitment_tasks')
            .upload(fileName, buffer, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('recruitment_tasks')
            .getPublicUrl(fileName);

        // Update database
        const { error: dbError } = await supabase
            .from('recruitment_applications')
            .update({ 
                task_status: 'SUBMITTED',
                task_file_url: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', applicationId);

        if (dbError) {
            console.error('DB update error after upload:', dbError);
            return NextResponse.json({ error: 'File uploaded but failed to link to application' }, { status: 500 });
        }

        // We can optionally send an email confirmation here as well
        // await sendTaskReceivedConfirmation(appData.email, appData.name);

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error) {
        console.error('Task submission error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
