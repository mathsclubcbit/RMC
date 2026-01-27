/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function bootstrapFaculty() {
    console.log("🚀 Initializing Admin Bootstrap...");

    // 1. Load Env Vars manually (since we are not in Next.js context)
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error("❌ .env.local not found in root!");
        process.exit(1);
    }

    const envConfig = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });

    const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
    const SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

    if (!SUPABASE_URL || !SERVICE_KEY) {
        console.error("❌ Missing Supabase credentials in .env.local");
        console.log("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    // 2. Init Supabase Admin
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 3. Define Faculty Credentials
    const email = 'faculty@rmc.cbit.ac.in';
    const password = 'rmc_faculty_access_2024'; // Strong default
    const fullName = 'Faculty Advisor';

    console.log(`\nCreating User: ${email}...`);

    // 4. Create User
    const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            role: 'faculty',
            team: 'council' // Faculty oversees the council
        }
    });

    if (error) {
        if (error.message.includes('already registered')) {
            console.log("⚠️  User already exists!");
            console.log("\nIf you need to reset, delete the user from Supabase Auth dashboard first.");
        } else {
            console.error("❌ Creation Failed:", error.message);
        }
    } else {
        console.log("✅ Faculty Account Created Successfully!");
        console.log("------------------------------------------------");
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log("------------------------------------------------");
        console.log("👉 Login at: /network/login using the 'Faculty Login' toggle.");
    }
}

bootstrapFaculty();
