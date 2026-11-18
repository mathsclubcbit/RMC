/**
 * Password Migration Script
 * 
 * This script migrates existing plaintext coordinator passwords to bcrypt hashes.
 * Run this once to hash all existing event passwords in the database.
 * 
 * Usage: node scripts/migrate-passwords.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: '.env.local' });

const SALT_ROUNDS = 12;

async function migratePasswords() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching all events...');
    const { data: events, error } = await supabase
        .from('events')
        .select('id, title, payload');

    if (error) {
        console.error('Failed to fetch events:', error);
        process.exit(1);
    }

    console.log(`Found ${events.length} events\n`);

    let migrated = 0;
    let skipped = 0;
    let noPassword = 0;

    for (const event of events) {
        const payload = event.payload || {};
        const storedPassword = payload.password;

        // Skip if no password set
        if (!storedPassword) {
            console.log(`[SKIP] ${event.title} - No password set`);
            noPassword++;
            continue;
        }

        // Skip if already hashed
        if (payload.passwordHashed === true) {
            console.log(`[SKIP] ${event.title} - Already hashed`);
            skipped++;
            continue;
        }

        // Hash the password
        console.log(`[MIGRATING] ${event.title}...`);
        const hashedPassword = await bcrypt.hash(storedPassword, SALT_ROUNDS);

        // Update in database
        const { error: updateError } = await supabase
            .from('events')
            .update({
                payload: {
                    ...payload,
                    password: hashedPassword,
                    passwordHashed: true
                }
            })
            .eq('id', event.id);

        if (updateError) {
            console.error(`  ERROR: Failed to update ${event.title}:`, updateError);
        } else {
            console.log(`  ✓ Migrated successfully`);
            migrated++;
        }
    }

    console.log('\n--- Migration Complete ---');
    console.log(`Migrated: ${migrated}`);
    console.log(`Already hashed: ${skipped}`);
    console.log(`No password: ${noPassword}`);
}

migratePasswords().catch(console.error);
