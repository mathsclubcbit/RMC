require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createDocumentsBucket() {
    console.log('Creating "documents" storage bucket...');

    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const existing = buckets?.find(b => b.name === 'documents');

    if (existing) {
        console.log('✅ Bucket "documents" already exists.');
        return;
    }

    const { data, error } = await supabase.storage.createBucket('documents', {
        public: true,   // Files are publicly accessible via URL
        fileSizeLimit: 10 * 1024 * 1024, // 10MB max
        allowedMimeTypes: [
            'application/pdf',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]
    });

    if (error) {
        console.error('❌ Error creating bucket:', error.message);
        process.exit(1);
    }

    console.log('✅ Bucket "documents" created successfully!');
}

createDocumentsBucket();
