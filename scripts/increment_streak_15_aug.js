/**
 * Script to increment streak by 1 for all participants who submitted
 * at least one daily question on 15-08-2026 (2026-08-15).
 * 
 * Usage:
 *   node scripts/increment_streak_15_aug.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('=== Increment Streak for 15-08-2026 Submissions ===\n');

    // 1. Get daily questions on 2026-08-15
    const { data: questions, error: qErr } = await supabase
        .from('ps_daily_questions')
        .select('id, question_date')
        .eq('question_date', '2026-08-15');

    if (qErr) {
        console.error('Failed to fetch daily questions:', qErr);
        process.exit(1);
    }

    const questionIds = (questions || []).map(q => q.id);

    // 2. Find participant IDs from submissions on those questions
    let participantIdSet = new Set();

    if (questionIds.length > 0) {
        const { data: subs, error: sErr } = await supabase
            .from('ps_daily_submissions')
            .select('participant_id')
            .in('daily_question_id', questionIds);

        if (sErr) {
            console.error('Failed to fetch submissions:', sErr);
        } else if (subs) {
            subs.forEach(s => participantIdSet.add(s.participant_id));
        }
    }

    // 3. Also include participants whose last_daily_date is 2026-08-15
    const { data: dateParticipants, error: dErr } = await supabase
        .from('ps_participants')
        .select('id')
        .eq('last_daily_date', '2026-08-15');

    if (dErr) {
        console.error('Failed to fetch participants by last_daily_date:', dErr);
    } else if (dateParticipants) {
        dateParticipants.forEach(p => participantIdSet.add(p.id));
    }

    const targetParticipantIds = Array.from(participantIdSet);
    console.log(`Found ${targetParticipantIds.length} eligible participants who submitted on 15-08-2026.\n`);

    if (targetParticipantIds.length === 0) {
        console.log('No participants to update.');
        return;
    }

    // 4. Fetch details for these participants
    const { data: participants, error: pErr } = await supabase
        .from('ps_participants')
        .select('id, name, roll_no, streak_current, streak_longest, last_daily_date')
        .in('id', targetParticipantIds);

    if (pErr) {
        console.error('Failed to fetch participant details:', pErr);
        process.exit(1);
    }

    // 5. Update each participant
    let updatedCount = 0;
    for (const p of participants) {
        const oldStreak = p.streak_current || 0;
        const newStreak = oldStreak + 1;
        const newLongest = Math.max(p.streak_longest || 0, newStreak);

        const { error: uErr } = await supabase
            .from('ps_participants')
            .update({
                streak_current: newStreak,
                streak_longest: newLongest
            })
            .eq('id', p.id);

        if (uErr) {
            console.error(`Failed to update ${p.name} (${p.roll_no}):`, uErr.message);
        } else {
            updatedCount++;
            console.log(`✓ [${updatedCount}/${participants.length}] ${p.name} (${p.roll_no || 'N/A'}): streak ${oldStreak} -> ${newStreak} (longest: ${newLongest})`);
        }
    }

    console.log(`\n========================================`);
    console.log(`Successfully incremented streak for ${updatedCount} participants!`);
    console.log(`========================================\n`);
}

run();
