/**
 * Placement Series — Badge Award Logic
 *
 * Called server-side after daily submissions and contest submissions.
 * Awards badges, updates streak counters, and generates LinkedIn share text.
 */

import { createAdminClient } from '@/lib/supabase/server';

// ──────────────────────────────────────────────────────────────────────────────
// Badge Definitions
// ──────────────────────────────────────────────────────────────────────────────

/** @type {Record<string, {label: string, icon: string, linkedinText: string}>} */
export const BADGE_DEFINITIONS = {
    first_answer: {
        label: '🌱 First Step',
        icon: '🌱',
        linkedinText: `I've taken the first step in my structured placement preparation journey.

I joined the RMC CBIT Placement Series — a competitive aptitude and reasoning challenge designed to sharpen skills that matter for campus placements.

Starting is often the hardest part. Today, I started.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #Aptitude #CareerGrowth`,
    },
    streak_3: {
        label: '🔥 3-Day Streak',
        icon: '🔥',
        linkedinText: `Three consecutive days of structured placement preparation — and counting.

I've been solving daily aptitude, reasoning, and technical questions on the RMC CBIT Placement Series. Consistency over intensity — that's the approach I'm committing to.

What does your daily prep routine look like?

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #Consistency #3DayStreak`,
    },
    streak_7: {
        label: '🔥🔥 7-Day Streak',
        icon: '🔥🔥',
        linkedinText: `7 days. 7 sessions. 21 questions solved.

I've maintained a full week of daily aptitude and reasoning practice on the RMC CBIT Placement Series. Research consistently shows that daily practice — even for 15 minutes — builds retention and pattern recognition far better than cramming.

Building the habit, one day at a time.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #7DayStreak #LearningEveryDay`,
    },
    streak_14: {
        label: '⚡ 14-Day Streak',
        icon: '⚡',
        linkedinText: `Two weeks of unbroken placement preparation.

Maintaining a 14-day streak on the RMC CBIT Placement Series has reinforced one principle for me: discipline consistently outperforms motivation. Motivation fluctuates. Systems don't.

I'm covering aptitude, logical reasoning, and technical problem-solving daily — the exact domains that matter most in campus recruitment.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #14DayStreak #Discipline`,
    },
    streak_21: {
        label: '💎 21-Day Streak',
        icon: '💎',
        linkedinText: `21 days of deliberate, daily practice.

They say it takes 21 days to form a habit. I've done exactly that on the RMC CBIT Placement Series — solving structured aptitude and reasoning challenges every single day for three weeks.

The habit is formed. The preparation continues.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #21DayStreak #GrowthMindset`,
    },
    streak_30: {
        label: '👑 30-Day Streak',
        icon: '👑',
        linkedinText: `30 days of uninterrupted, structured placement preparation.

I've completed the RMC CBIT Placement Series month-long streak challenge — solving daily aptitude, reasoning, and technical questions without missing a single day.

This milestone represents more than a number. It represents a commitment to showing up, even on difficult days. That same commitment is what I bring to everything I pursue.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #30DayStreak #CommitmentToGrowth`,
    },
    fifty_answers: {
        label: '📚 50 Questions Answered',
        icon: '📚',
        linkedinText: `Milestone reached: 50 placement preparation questions solved.

Through the RMC CBIT Placement Series, I've now answered 50 structured questions spanning quantitative aptitude, logical reasoning, and core technical concepts — the exact areas evaluated in leading campus recruitment drives.

Progress isn't always visible, but it's always accumulating.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #Aptitude #50Questions`,
    },
    perfect_contest: {
        label: '⭐ Perfect Score',
        icon: '⭐',
        linkedinText: `Perfect score achieved in the RMC CBIT Placement Series weekly contest.

I scored 100% on a timed competitive assessment covering aptitude, reasoning, and technical concepts — competing against peers across the series.

Preparation meets opportunity. Today, it did.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #PerfectScore #CompetitiveExam`,
    },
    contest_gold: {
        label: '🥇 Contest Winner',
        icon: '🥇',
        linkedinText: `Ranked 1st in the {contestTitle} — RMC CBIT Placement Series.

Competing in a timed, high-pressure aptitude and reasoning assessment, I secured the top position. This result reflects consistent preparation, problem-solving speed, and accuracy under pressure.

Grateful for the platform RMC CBIT has built for students to compete and grow.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #ContestWinner #1stPlace`,
    },
    contest_silver: {
        label: '🥈 Contest Runner-up',
        icon: '🥈',
        linkedinText: `Ranked 2nd in the {contestTitle} — RMC CBIT Placement Series.

A strong performance in a competitive, timed aptitude assessment. Second place is a reminder of how close the margins are — and how much further preparation can take me.

Every contest is a data point. On to the next one.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #RunnerUp #ContinuousImprovement`,
    },
    contest_bronze: {
        label: '🥉 Contest 3rd Place',
        icon: '🥉',
        linkedinText: `Finished in the Top 3 of the {contestTitle} — RMC CBIT Placement Series.

Competing against motivated peers in a timed aptitude and reasoning challenge, I secured 3rd place. It's a result I'm proud of — and a benchmark to beat next time.

Growth happens in competition.

🔗 RMC CBIT | rmccbit.in

#PlacementPreparation #CampusPlacements #RMCCBIT #Top3 #AptitudeChallenge`,
    },
};

// Streak thresholds that trigger badge awards
const STREAK_THRESHOLDS = [3, 7, 14, 21, 30];

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Build LinkedIn share text, interpolating contest title if needed.
 */
function buildLinkedinText(badgeType, contestTitle = '') {
    const def = BADGE_DEFINITIONS[badgeType];
    if (!def) return '';
    return def.linkedinText.replace('{contestTitle}', contestTitle);
}

/**
 * Upsert a badge — safe to call multiple times (won't duplicate due to UNIQUE constraint).
 * Returns the badge row if newly created, null if it already existed.
 */
async function upsertBadge(supabase, { participantId, eventId, badgeType, contestId = null, contestTitle = '' }) {
    const def = BADGE_DEFINITIONS[badgeType];
    if (!def) return null;

    const { data, error } = await supabase
        .from('ps_badges')
        .upsert(
            {
                participant_id: participantId,
                event_id: eventId,
                badge_type: badgeType,
                badge_label: def.label,
                badge_icon: def.icon,
                contest_id: contestId,
                linkedin_text: buildLinkedinText(badgeType, contestTitle),
            },
            {
                onConflict: 'participant_id,badge_type,contest_id',
                ignoreDuplicates: true,
            }
        )
        .select()
        .single();

    if (error && error.code !== '23505') {
        // 23505 = unique_violation — expected when badge already exists
        console.error('[ps-badges] upsertBadge error:', error);
        return null;
    }

    return data || null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Called after a daily submission is recorded.
 * Updates streak counters and awards any earned streak/milestone badges.
 *
 * @param {{participantId: string, eventId: string}} opts
 * @returns {Promise<{newBadges: object[], streakCurrent: number}>}
 */
export async function processDailyBadges({ participantId, eventId }) {
    const supabase = createAdminClient();
    const newBadges = [];

    // Fetch current participant state
    const { data: participant, error: pErr } = await supabase
        .from('ps_participants')
        .select('streak_current, streak_longest, last_daily_date, is_verified, event_id')
        .eq('id', participantId)
        .single();

    if (pErr || !participant) {
        console.error('[ps-badges] Failed to fetch participant:', pErr);
        return { newBadges: [], streakCurrent: 0 };
    }

    // Count total daily answers for milestone badges
    const { count: totalAnswers } = await supabase
        .from('ps_daily_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('participant_id', participantId);

    // ── First Answer badge ──
    if (totalAnswers <= 1) {
        const badge = await upsertBadge(supabase, {
            participantId,
            eventId,
            badgeType: 'first_answer',
        });
        if (badge) newBadges.push(badge);
    }

    // ── 50 Answers milestone badge ──
    // BUG-11 FIX: Use >= 50 instead of === 50 so the badge is never skipped
    // if the count jumps from 49 to 51+ in a single batch.
    // upsertBadge uses ignoreDuplicates: true so it's safe to call multiple times.
    if (totalAnswers >= 50) {
        const badge = await upsertBadge(supabase, {
            participantId,
            eventId,
            badgeType: 'fifty_answers',
        });
        if (badge) newBadges.push(badge);
    }

    // ── Streak badges ──
    const streak = participant.streak_current;
    for (const threshold of STREAK_THRESHOLDS) {
        if (streak >= threshold) {
            const badgeType = `streak_${threshold}`;
            const badge = await upsertBadge(supabase, {
                participantId,
                eventId,
                badgeType,
            });
            if (badge) newBadges.push(badge);
        }
    }

    return { newBadges, streakCurrent: streak };
}

/**
 * Called when coordinator publishes contest results.
 * Awards gold / silver / bronze badges to top 3 finishers.
 *
 * @param {{contestId: string, eventId: string, contestTitle: string}} opts
 * @returns {Promise<void>}
 */
export async function publishContestBadges({ contestId, eventId, contestTitle }) {
    const supabase = createAdminClient();

    // Get top 3 by score, then by time taken (ascending = faster wins tiebreak)
    const { data: top3, error } = await supabase
        .from('ps_contest_submissions')
        .select('participant_id, score, time_taken_seconds')
        .eq('contest_id', contestId)
        .not('submitted_at', 'is', null)
        .order('score', { ascending: false })
        .order('time_taken_seconds', { ascending: true })
        .limit(3);

    if (error || !top3?.length) {
        console.error('[ps-badges] Failed to fetch top 3:', error);
        return;
    }

    const podiumTypes = ['contest_gold', 'contest_silver', 'contest_bronze'];

    for (let i = 0; i < top3.length; i++) {
        const { participant_id } = top3[i];
        const badgeType = podiumTypes[i];
        if (!badgeType) break;

        await upsertBadge(supabase, {
            participantId: participant_id,
            eventId,
            badgeType,
            contestId,
            contestTitle,
        });

        // Award podium bonus points: 1st=+100, 2nd=+70, 3rd=+50
        await awardPoints(participant_id, PODIUM_BONUSES[i]);
    }
}

/**
 * Award a perfect-score badge if contestant scored 100%.
 *
 * @param {{participantId: string, eventId: string, contestId: string, score: number, totalPoints: number}} opts
 * @returns {Promise<object|null>}
 */
export async function checkPerfectScore({ participantId, eventId, contestId, score, totalPoints }) {
    if (totalPoints <= 0 || score < totalPoints) return null;
    const supabase = createAdminClient();
    return upsertBadge(supabase, {
        participantId,
        eventId,
        badgeType: 'perfect_contest',
        contestId,
    });
}

// ──────────────────────────────────────────────────────────────────────────────
// Points Awarding
// ──────────────────────────────────────────────────────────────────────────────

/** Podium bonus points awarded when contest results are published */
export const PODIUM_BONUSES = [100, 70, 50]; // 1st, 2nd, 3rd

/**
 * Add points to a participant's total_points balance.
 * Safe to call multiple times — uses atomic SQL increment.
 *
 * @param {string} participantId
 * @param {number} points - must be a positive integer
 * @returns {Promise<void>}
 */
export async function awardPoints(participantId, points) {
    if (!points || points <= 0) return;
    const supabase = createAdminClient();
    const { error } = await supabase.rpc('increment_participant_points', {
        p_participant_id: participantId,
        p_points: points,
    });
    if (error) {
        // BUG-5 FIX: Removed the non-atomic read-modify-write fallback.
        // That fallback was a race condition — two concurrent calls would both
        // read the same total_points value and write the same incremented result,
        // effectively awarding points only once while appearing to award twice.
        // If the RPC fails, we log a hard error. Fix the RPC — don't silently degrade.
        console.error(
            '[ps-badges] CRITICAL: increment_participant_points RPC failed. Points NOT awarded.',
            { participantId, points, error: error.message }
        );
    }
}
