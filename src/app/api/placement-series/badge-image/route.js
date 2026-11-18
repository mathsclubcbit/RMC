import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Badge type → gradient colors
const BADGE_COLORS = {
    first_answer:    { from: '#134e4a', to: '#0f766e', accent: '#2dd4bf', ring: '#14b8a6' },
    streak_3:        { from: '#7c2d12', to: '#c2410c', accent: '#fb923c', ring: '#f97316' },
    streak_7:        { from: '#7c2d12', to: '#b91c1c', accent: '#f87171', ring: '#ef4444' },
    streak_14:       { from: '#1e1b4b', to: '#4338ca', accent: '#818cf8', ring: '#6366f1' },
    streak_21:       { from: '#164e63', to: '#0e7490', accent: '#22d3ee', ring: '#06b6d4' },
    streak_30:       { from: '#3b0764', to: '#7e22ce', accent: '#c084fc', ring: '#a855f7' },
    fifty_answers:   { from: '#14532d', to: '#15803d', accent: '#4ade80', ring: '#22c55e' },
    perfect_contest: { from: '#713f12', to: '#a16207', accent: '#fde047', ring: '#eab308' },
    contest_gold:    { from: '#78350f', to: '#b45309', accent: '#fbbf24', ring: '#f59e0b' },
    contest_silver:  { from: '#1f2937', to: '#374151', accent: '#d1d5db', ring: '#9ca3af' },
    contest_bronze:  { from: '#431407', to: '#92400e', accent: '#fb923c', ring: '#cd7c2f' },
};

const DEFAULT_COLORS = { from: '#134e4a', to: '#0f766e', accent: '#2dd4bf', ring: '#14b8a6' };

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const badgeType  = searchParams.get('badgeType')  || 'first_answer';
    const badgeIcon  = searchParams.get('badgeIcon')  || '🏆';
    const badgeLabel = searchParams.get('badgeLabel') || 'Achievement';
    const userName   = searchParams.get('name')       || 'Participant';
    const earnedAt   = searchParams.get('earnedAt')   || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    const colors = BADGE_COLORS[badgeType] || DEFAULT_COLORS;

    // Determine category label
    const categoryMap = {
        first_answer: 'MILESTONE',
        fifty_answers: 'MILESTONE',
        perfect_contest: 'CONTEST',
        contest_gold: 'CONTEST',
        contest_silver: 'CONTEST',
        contest_bronze: 'CONTEST',
    };
    const category = categoryMap[badgeType] || 'STREAK';

    return new ImageResponse(
        (
            <div
                style={{
                    width: '1200px',
                    height: '630px',
                    display: 'flex',
                    fontFamily: 'sans-serif',
                    background: '#050505',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background gradient blobs */}
                <div style={{
                    position: 'absolute', top: '-150px', left: '-150px',
                    width: '500px', height: '500px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${colors.from}99 0%, transparent 70%)`,
                }} />
                <div style={{
                    position: 'absolute', bottom: '-100px', right: '-100px',
                    width: '400px', height: '400px', borderRadius: '50%',
                    background: `radial-gradient(circle, ${colors.to}88 0%, transparent 70%)`,
                }} />

                {/* Subtle grid pattern overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }} />

                {/* Top border accent */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                    background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
                }} />

                {/* Main content */}
                <div style={{
                    display: 'flex', flexDirection: 'row', alignItems: 'center',
                    width: '100%', height: '100%', padding: '60px 80px', gap: '80px',
                    position: 'relative', zIndex: 10,
                }}>

                    {/* Left — Badge medallion */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                        {/* Outer glow ring */}
                        <div style={{
                            width: '220px', height: '220px', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: `radial-gradient(circle, ${colors.from}cc 0%, ${colors.to}44 60%, transparent 100%)`,
                            boxShadow: `0 0 60px ${colors.accent}55, 0 0 120px ${colors.accent}22`,
                            border: `2px solid ${colors.ring}55`,
                        }}>
                            {/* Inner circle */}
                            <div style={{
                                width: '160px', height: '160px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                                border: `2px solid ${colors.accent}66`,
                                fontSize: '80px',
                            }}>
                                {badgeIcon}
                            </div>
                        </div>

                        {/* Category pill */}
                        <div style={{
                            padding: '6px 20px', borderRadius: '999px',
                            background: `${colors.accent}18`,
                            border: `1px solid ${colors.accent}44`,
                            color: colors.accent,
                            fontSize: '13px', fontWeight: 800,
                            letterSpacing: '3px',
                        }}>
                            {category}
                        </div>
                    </div>

                    {/* Right — Text content */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0px' }}>

                        {/* Badge label */}
                        <div style={{
                            fontSize: '56px', fontWeight: 900, color: '#ffffff',
                            lineHeight: 1.1, marginBottom: '16px',
                            textShadow: `0 0 40px ${colors.accent}66`,
                        }}>
                            {badgeLabel.replace(/^[^\s]+\s/, '')}
                        </div>

                        {/* Separator */}
                        <div style={{
                            width: '80px', height: '3px', borderRadius: '2px',
                            background: `linear-gradient(90deg, ${colors.accent}, transparent)`,
                            marginBottom: '24px',
                        }} />

                        {/* Earned by */}
                        <div style={{ fontSize: '22px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px', fontWeight: 400 }}>
                            Earned by
                        </div>
                        <div style={{ fontSize: '34px', color: '#ffffff', fontWeight: 700, marginBottom: '28px' }}>
                            {userName}
                        </div>

                        {/* Earned date */}
                        <div style={{
                            fontSize: '16px', color: 'rgba(255,255,255,0.35)',
                            marginBottom: '40px', fontWeight: 400,
                        }}>
                            {earnedAt}
                        </div>

                        {/* RMC branding bar */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '14px 20px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '8px',
                                background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.ring} 100%)`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '18px', fontWeight: 900, color: '#000',
                            }}>
                                R
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: 700 }}>RMC CBIT Placement Series</div>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>rmccbit.in</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
