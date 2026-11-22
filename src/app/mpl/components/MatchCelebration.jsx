'use client';

import { CelebrationOverlay } from '../../../components/CelebrationOverlay';

export default function MatchCelebration({ event, onComplete }) {
    if (!event) return null;

    let overlayType = null;

    if (event.type === 'match_winner') {
        overlayType = 'win';
    } else if (event.type === 'power_shot') {
        overlayType = 'six';
    } else if (event.type === 'wicket') {
        overlayType = 'wicket';
    } else if (event.type === 'toss_won') {
        overlayType = 'toss';
    } else if (event.type === 'runs' && Number(event.runs_awarded || 0) >= 6) {
        overlayType = 'six';
    } else if (event.type === 'dot') {
        overlayType = 'four'; // Or 'dot' if supported, but 'four' is fallback
    } else if (event.type === 'streak_bonus') {
        overlayType = 'six';
    } else {
        // Normal scoring events use the four-style team celebration.
        overlayType = 'four';
    }

    return (
        <CelebrationOverlay
            type={overlayType}
            visible={!!event}
            onDone={onComplete}
            customTitle={event.title}
            customSubtitle={event.subtitle}
        />
    );
}
