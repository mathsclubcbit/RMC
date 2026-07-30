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
        linkedinText: "I just started my placement prep journey with @RMC CBIT's Placement Series! Every expert was once a beginner. #PlacementPrep #RMCCBIT",
    },
    streak_3: {
        label: '🔥 3-Day Streak',
        icon: '🔥',
        linkedinText: "3 days strong! Completed a 3-day answer streak on RMC CBIT's Placement Series. Consistency is key! 🔥 #PlacementPrep #RMCCBIT #3DayStreak",
    },
    streak_7: {
        label: '🔥🔥 7-Day Streak',
        icon: '🔥🔥',
        linkedinText: "A full week of daily placement prep! 7-day answer streak on RMC CBIT's Placement Series. #PlacementPrep #7DayStreak #RMCCBIT",
    },
    streak_14: {
        label: '⚡ 14-Day Streak',
        icon: '⚡',
        linkedinText: "Two weeks of non-stop placement prep! ⚡ 14-day streak on RMC CBIT's Placement Series. Building habits that last! #RMCCBIT #14DayStreak",
    },
    streak_21: {
        label: '💎 21-Day Streak',
        icon: '💎',
        linkedinText: "21 days — a habit is formed! 💎 Kept a 21-day streak on RMC CBIT's Placement Series. Placement-ready mindset! #RMCCBIT #21DayStreak",
    },
    streak_30: {
        label: '👑 30-Day Streak',
        icon: '👑',
        linkedinText: "30 DAYS! 👑 I conquered the RMC CBIT Placement Series month-long challenge. This is what dedication looks like! #RMCCBIT #30DayStreak #PlacementKing",
    },
    fifty_answers: {
        label: '📚 50 Questions Answered',
        icon: '📚',
        linkedinText: "50 placement questions answered on RMC CBIT's Placement Series! 📚 Building that knowledge base one question at a time. #RMCCBIT #PlacementPrep",
    },
    perfect_contest: {
        label: '⭐ Perfect Score',
        icon: '⭐',
        linkedinText: "PERFECT SCORE! 💯 Aced a weekly contest on RMC CBIT's Placement Series. Hard work pays off! ⭐ #RMCCBIT #PerfectScore #PlacementSeries",
    },
    contest_gold: {
        label: '🥇 Contest Winner',
        icon: '🥇',
        linkedinText: '🥇 Won the {contestTitle} on RMC CBIT\'s Placement Series! Thrilled to be at the top! #RMCCBIT #PlacementSeries #ContestWinner',
    },
    contest_silver: {
        label: '🥈 Contest Runner-up',
        icon: '🥈',
        linkedinText: '🥈 Runner-up in the {contestTitle} on RMC CBIT\'s Placement Series! Great contest — pushing harder next time! #RMCCBIT #PlacementSeries',
    },
    contest_bronze: {
        label: '🥉 Contest 3rd Place',
        icon: '🥉',
        linkedinText: '🥉 3rd place in the {contestTitle} on RMC CBIT\'s Placement Series! Proud of the progress! #RMCCBIT #PlacementSeries',
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
    if (totalAnswers === 1) {
        const badge = await upsertBadge(supabase, {
            participantId,
            eventId,
            badgeType: 'first_answer',
        });
        if (badge) newBadges.push(badge);
    }

    // ── 50 Answers milestone badge ──
    if (totalAnswers === 50) {
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
