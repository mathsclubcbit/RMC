import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { LogOut, QrCode, Edit3, Users, Trophy, CalendarDays, Layers, ListOrdered, Award, FileQuestion } from "lucide-react";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import { jwtVerify } from "jose";

import { getAllRegistrations } from "@/lib/google";
import DailyStatsDashboard from "./DailyStatsDashboard";

export const dynamic = 'force-dynamic';

const getJwtSecret = () => {
    const rawSecret = process.env.JWT_SECRET;
    if (!rawSecret) return null;
    return new TextEncoder().encode(rawSecret);
};

async function verifyCoordinatorToken() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('coordinator_token')?.value;
        if (!token) return null;

        const secret = getJwtSecret();
        if (!secret) return null;

        const { payload } = await jwtVerify(token, secret);
        if (payload.type === 'coordinator' && payload.eventId) {
            return payload;
        }
        return null;
    } catch {
        return null;
    }
}

async function getCoordinatorEventAndStats() {
    noStore();
    const coordinator = await verifyCoordinatorToken();
    if (!coordinator) {
        return null;
    }

    const eventId = coordinator.eventId;

    const admin = createAdminClient();

    // Fetch Event
    const { data: event, error } = await admin
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !event) return null;

    // Fetch Stats using Supabase (Real-time Source)
    let stats = {
        enabled: true,
        totalRegistrations: 0,
        totalCheckedIn: 0,
        totalRevenue: 0,
        registrationsLast24h: 0,
        checkedInLast24h: 0,
        eventBreakdown: []
    };

    let isPlacementSeries = false;
    let psStats = {
        totalParticipants: 0,
        totalContestSubmissions: 0,
        totalDailySubmissions: 0,
        totalBadges: 0
    };

    try {
        // More efficient: Use Supabase to get counts and sums
        const { data: regs, error: statsError } = await admin
            .from("registrations")
            .select("amount, checked_in_at, created_at")
            .eq("event_id", eventId);

        if (statsError) throw statsError;

        if (regs) {
            const now = new Date();
            const oneDayAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));

            const totalRegistrations = regs.length;
            const totalCheckedIn = regs.filter(r => r.checked_in_at).length;
            const totalRevenue = regs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

            const regs24h = regs.filter(r => new Date(r.created_at) > oneDayAgo).length;
            const checkedIn24h = regs.filter(r => r.checked_in_at && new Date(r.checked_in_at) > oneDayAgo).length;

            stats = {
                enabled: true,
                totalRegistrations,
                totalCheckedIn,
                totalRevenue,
                registrationsLast24h: regs24h,
                checkedInLast24h: checkedIn24h,
                eventBreakdown: [{
                    eventName: event.title,
                    eventId: event.id,
                    registrations: totalRegistrations,
                    checkedIn: totalCheckedIn,
                    revenue: totalRevenue
                }]
            };
        }

        // Detect Placement Series
        const isPSEventType = event?.payload?.eventType === 'Placement Series' || event?.event_type === 'Placement Series';
        const { count: pCount } = await admin.from("ps_participants")
            .select("id", { count: 'exact', head: true })
            .eq("event_id", eventId);
            
        if (pCount !== null && (pCount > 0 || isPSEventType)) {
            isPlacementSeries = true;
            psStats.totalParticipants = pCount || 0;

            const { data: contests } = await admin.from("ps_contests").select("id").eq("event_id", eventId);
            if (contests && contests.length > 0) {
                const { count: cCount } = await admin.from("ps_contest_submissions")
                    .select("id", { count: 'exact', head: true })
                    .in("contest_id", contests.map(c => c.id));
                psStats.totalContestSubmissions = cCount || 0;
            }

            const { data: dailies } = await admin.from("ps_daily_questions").select("id").eq("event_id", eventId);
            if (dailies && dailies.length > 0) {
                const { count: dCount } = await admin.from("ps_daily_submissions")
                    .select("id", { count: 'exact', head: true })
                    .in("daily_question_id", dailies.map(d => d.id));
                psStats.totalDailySubmissions = dCount || 0;
            }

            const { count: bCount } = await admin.from("ps_badges")
                .select("id", { count: 'exact', head: true })
                .eq("event_id", eventId);
            psStats.totalBadges = bCount || 0;
        }
    } catch (e) {
        console.error("Failed to fetch Supabase stats for event:", eventId, e);
        stats.enabled = false;
    }

    return {
        event,
        stats,
        isPlacementSeries,
        psStats
    };
}

export default async function CoordinatorDashboard() {
    const data = await getCoordinatorEventAndStats();

    if (!data) {
        redirect("/coordinator/login");
    }

    const { event, stats, isPlacementSeries, psStats } = data;

    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Tech background - Coordinator Style (Teal) */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.15),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.15),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.15),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-teal-400/5 blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-12">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <header className="mb-10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                                    Coordinator Console
                                </div>
                                <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                                    {event.title}
                                    <span className="text-teal-400">.</span>
                                </h1>
                                <p className="mt-2 text-white/50 max-w-xl font-mono text-xs md:text-sm">
                                    ID: <span className="text-white/80">{event.id}</span>
                                </p>
                            </div>
                            <Link
                                href="/api/coordinator/logout"
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 transition-all text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Sign Out</span>
                            </Link>
                        </div>
                    </header>

                    {/* Offline Warning */}
                    {!stats.enabled && (
                        <div className="mb-8 min-h-[80px] rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold border border-amber-500/20">!</div>
                            <div>
                                <h3 className="text-sm font-semibold text-amber-200">Live Statistics Offline</h3>
                                <p className="text-xs text-amber-200/60 mt-0.5">
                                    System could not connect to the database. Contact Admin.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Conditional rendering based on event type */}
                    {isPlacementSeries ? (
                        <>
                            {/* PS KPI Stats Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-10">
                                <StatCard label="Participants" value={psStats.totalParticipants} accent="teal" />
                                <StatCard label="Contest Subms" value={psStats.totalContestSubmissions} accent="violet" />
                                <StatCard label="Daily Subms" value={psStats.totalDailySubmissions} accent="amber" />
                                <StatCard label="Badges Earned" value={psStats.totalBadges} accent="emerald" />
                            </div>

                            {/* Live Daily Stats Dashboard */}
                            <DailyStatsDashboard 
                                eventId={event.id}
                                initialTotalParticipants={psStats.totalParticipants}
                            />

                            {/* PS Action Modules */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {/* Leaderboard */}
                                <Link href="/coordinator/leaderboard" className="group relative h-[180px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-yellow-400/30 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <Trophy className="w-6 h-6" />
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-yellow-300/80 uppercase tracking-widest mb-1">Global Rankings</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-yellow-50 transition-colors">Leaderboard</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">View overall rankings and badges.</p>
                                    </div>
                                </Link>

                                {/* Contests */}
                                <Link href="/coordinator/contests" className="group relative h-[180px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-purple-400/30 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-purple-400/10 text-purple-300 border border-purple-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <Layers className="w-6 h-6" />
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-purple-300/80 uppercase tracking-widest mb-1">Assessments</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-purple-50 transition-colors">Manage Contests</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">Create and monitor weekly tests.</p>
                                    </div>
                                </Link>

                                {/* Daily Challenges */}
                                <Link href="/coordinator/daily" className="group relative h-[180px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-amber-400/30 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-amber-400/10 text-amber-300 border border-amber-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <CalendarDays className="w-6 h-6" />
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-amber-300/80 uppercase tracking-widest mb-1">Engagement</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-amber-50 transition-colors">Daily Questions</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">Assign and track daily problems.</p>
                                    </div>
                                </Link>

                                {/* Question Bank */}
                                <Link href="/coordinator/questions" className="group relative h-[180px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-blue-400/30 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-blue-400/10 text-blue-300 border border-blue-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <FileQuestion className="w-6 h-6" />
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-blue-300/80 uppercase tracking-widest mb-1">Repository</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-50 transition-colors">Question Bank</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">Add and edit global questions.</p>
                                    </div>
                                </Link>
                                
                                {/* Edit Event */}
                                <Link href="/coordinator/edit" className="group relative h-[180px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-teal-400/30 transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-teal-400/10 text-teal-300 border border-teal-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <Edit3 className="w-6 h-6" />
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-teal-300/80 uppercase tracking-widest mb-1">Configuration</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-teal-50 transition-colors">Edit Event</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">Update description and details.</p>
                                    </div>
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* KPI Stats Row (Single Event Context) */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-10">
                                <StatCard label="Registrations" value={stats.totalRegistrations} accent="teal" />
                                <StatCard label="Checked In" value={stats.totalCheckedIn} accent="emerald" />
                                <StatCard label="Est. Revenue" value={stats.totalRevenue} isCurrency accent="amber" />
                            </div>

                            {/* Action Modules */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Primary Action: Scan */}
                                <Link
                                    href="/coordinator/participants"
                                    className="group relative h-[200px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-blue-400/30 transition-all duration-500"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-blue-400/10 text-blue-300 border border-blue-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <Users className="w-6 h-6" />
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-blue-300/80 uppercase tracking-widest mb-1">Data Management</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-blue-50 transition-colors">Participants</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">View, search and manage all enrollees.</p>
                                    </div>
                                </Link>

                                <Link
                                    href="/coordinator/scan"
                                    className="group relative h-[200px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-teal-400/30 transition-all duration-500"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-teal-400/10 text-teal-300 border border-teal-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <QrCode className="w-6 h-6" />
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-teal-300/80 uppercase tracking-widest mb-1">Primary Task</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-teal-50 transition-colors">Scan Tickets</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">Launch camera to verify attendees.</p>
                                    </div>
                                </Link>

                                {/* Secondary Action: Edit */}
                                <Link
                                    href="/coordinator/edit"
                                    className="group relative h-[200px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-violet-400/30 transition-all duration-500"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-6 right-6 p-3 rounded-2xl bg-violet-400/10 text-violet-300 border border-violet-400/20 group-hover:scale-110 transition-transform duration-500">
                                        <Edit3 className="w-6 h-6" />
                                    </div>

                                    <div className="absolute bottom-6 left-6 right-6">
                                        <div className="text-[11px] font-mono text-violet-300/80 uppercase tracking-widest mb-1">Configuration</div>
                                        <h3 className="text-2xl font-bold text-white group-hover:text-violet-50 transition-colors">Edit Event</h3>
                                        <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">Update description, posters, and details.</p>
                                    </div>
                                </Link>

                                {/* Conditional Action: Secure Walk-In (Quiz Only) */}
                                {event?.payload?.eventType === 'Quiz' && (
                                    <Link
                                        href={`/coordinator/quiz/${event.id}/access`}
                                        className="group relative h-[200px] rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden hover:border-emerald-400/30 transition-all duration-500"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-6 right-6 p-3 rounded-2xl bg-emerald-400/10 text-emerald-300 border border-emerald-400/20 group-hover:scale-110 transition-transform duration-500">
                                            <QrCode className="w-6 h-6" />
                                        </div>

                                        <div className="absolute bottom-6 left-6 right-6">
                                            <div className="text-[11px] font-mono text-emerald-300/80 uppercase tracking-widest mb-1">Access Control</div>
                                            <h3 className="text-2xl font-bold text-white group-hover:text-emerald-50 transition-colors">Live QR Screen</h3>
                                            <p className="mt-1 text-sm text-white/50 group-hover:text-white/70">Display rotating QR code for secure entry.</p>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function StatCard({ label, value, accent, isCurrency }) {
    const colors = {
        teal: "text-teal-400 border-teal-500/20 bg-teal-500/5",
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
        violet: "text-violet-400 border-violet-500/20 bg-violet-500/5",
    };

    const glows = {
        teal: "bg-teal-500/10",
        emerald: "bg-emerald-500/10",
        amber: "bg-amber-500/10",
        violet: "bg-violet-500/10",
    };


    const glowColor = glows[accent] || glows.teal;

    const formatted = isCurrency
        ? `₹${Number(value || 0).toLocaleString()}`
        : Number(value || 0).toLocaleString();

    return (
        <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 md:p-6 relative overflow-hidden group hover:border-white/20 transition-all duration-300`}>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl md:text-4xl font-black tracking-tight text-white/90 group-hover:text-white transition-colors">{formatted}</div>

            {/* Glow effect */}
            <div className={`absolute -top-4 -right-4 w-20 h-20 ${glowColor} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        </div>
    );
}
