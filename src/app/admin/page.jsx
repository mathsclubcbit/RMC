import Link from "next/link";
import { Image as ImageIcon, ArrowUpRight, Users } from "lucide-react";
import { adminLogoutAction } from "./actions";
import AdminDashboardClient from "./AdminDashboardClient";
import CoordinatorCredentialsManager from "./CoordinatorCredentialsManager";
import { getAllRegistrations } from "@/lib/google";

// Revalidate dashboard every 60 seconds for better performance
export const revalidate = 60;

async function getDashboardStats() {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) return { enabled: false };

    try {
        const regs = await getAllRegistrations(spreadsheetId);
        const now = Date.now();
        const last24hMs = 24 * 60 * 60 * 1000;

        const toTime = (value) => {
            const t = Date.parse(String(value || ""));
            return Number.isFinite(t) ? t : null;
        };

        const safeAmount = (value) => {
            const n = Number(value);
            return Number.isFinite(n) ? n : 0;
        };

        const isCheckedIn = (r) =>
            String(r?.checkedInAt || "").trim().length > 0 || String(r?.status || "").toUpperCase() === "ATTENDED";

        const totalRegistrations = regs.length;
        const totalCheckedIn = regs.filter(isCheckedIn).length;
        const totalRevenue = regs.reduce((sum, r) => sum + safeAmount(r?.amount), 0);

        const registrationsLast24h = regs.filter((r) => {
            const t = toTime(r.timestamp);
            return t != null && now - t <= last24hMs;
        }).length;

        const checkedInLast24h = regs.filter((r) => {
            const t = toTime(r.checkedInAt);
            return t != null && now - t <= last24hMs;
        }).length;

        const byEvent = new Map();
        for (const r of regs) {
            const eventId = String(r?.eventId || "").trim();
            const eventName = String(r?.eventName || "").trim();
            const key = (eventId || "_") + "::" + (eventName || "Unknown Event");

            if (!byEvent.has(key)) {
                byEvent.set(key, {
                    eventId: eventId || "",
                    eventName: eventName || "Unknown Event",
                    registrations: 0,
                    checkedIn: 0,
                    revenue: 0,
                });
            }

            const agg = byEvent.get(key);
            agg.registrations += 1;
            if (isCheckedIn(r)) agg.checkedIn += 1;
            agg.revenue += safeAmount(r?.amount);
        }

        const eventBreakdown = Array.from(byEvent.values())
            .sort((a, b) => {
                if (b.registrations !== a.registrations) return b.registrations - a.registrations;
                return b.revenue - a.revenue;
            });

        return {
            enabled: true,
            totalRegistrations,
            totalCheckedIn,
            registrationsLast24h,
            checkedInLast24h,
            totalRevenue,
            eventBreakdown,
        };
    } catch {
        return { enabled: false };
    }
}

export default async function AdminDashboardPage() {
    const stats = await getDashboardStats();

    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Tech background - Consistent with other Admin pages */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.15),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.15),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.15),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.2] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-indigo-500/5 blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                            Admin Console
                        </div>
                        <h1 className="mt-4 text-4xl md:text-5xl font-black tracking-tight">
                            Dashboard
                            <span className="text-indigo-500">.</span>
                        </h1>
                        <p className="mt-2 text-white/50 max-w-xl">
                            Real-time overview of club operations and event performance.
                        </p>
                    </header>

                    {/* Offline Warning */}
                    {!stats.enabled && (
                        <div className="mb-8 min-h-[80px] rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold border border-amber-500/20">!</div>
                            <div>
                                <h3 className="text-sm font-semibold text-amber-200">Live Statistics Offline</h3>
                                <p className="text-xs text-amber-200/60 mt-0.5">
                                    System could not connect to the database. Check <code>GOOGLE_SHEET_ID</code> or credentials.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* KPI Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                        <StatCard label="Total Registrations" value={stats.totalRegistrations} subValue={`+${stats.registrationsLast24h || 0} today`} accent="indigo" />
                        <StatCard label="Total Checked In" value={stats.totalCheckedIn} subValue={`+${stats.checkedInLast24h || 0} today`} accent="emerald" />
                        <StatCard label="Total Revenue" value={stats.totalRevenue} isCurrency accent="amber" />
                        <StatCard label="Active Events" value={stats.eventBreakdown?.length || 0} accent="violet" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Event Manager */}
                            <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <h3 className="font-semibold">Events Manager</h3>
                                    <Link href="/admin/events/new" className="text-xs font-mono text-indigo-400 hover:text-indigo-300 transition">
                                        + CREATE NEW
                                    </Link>
                                </div>
                                <div className="p-2">
                                    <AdminDashboardClient />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-8">
                            {/* Breakdown */}
                            <EventBreakdown stats={stats} />

                            {/* Gallery Shortcut */}
                            <Link href="/admin/gallery" className="block p-5 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all group backdrop-blur-xl">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-sm font-semibold text-white/90">Gallery Manager</div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                                </div>
                                <p className="text-xs text-white/50 pl-1">
                                    Manage event photos, create albums, and organize the public gallery.
                                </p>
                            </Link>

                            {/* Team Shortcut */}
                            <Link href="/admin/team" className="block p-5 rounded-3xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all group backdrop-blur-xl mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div className="text-sm font-semibold text-white/90">Team Manager</div>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                                </div>
                                <p className="text-xs text-white/50 pl-1">
                                    Manage core committee, faculty advisors, and team structure.
                                </p>
                            </Link>

                            {/* Tools */}
                            <CoordinatorCredentialsManager />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function StatCard({ label, value, subValue, accent, isCurrency }) {
    const colors = {
        indigo: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
        emerald: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
        amber: "text-amber-400 border-amber-500/20 bg-amber-500/5",
        violet: "text-violet-400 border-violet-500/20 bg-violet-500/5",
        teal: "text-teal-400 border-teal-500/20 bg-teal-500/5",
    };

    const glows = {
        indigo: "bg-indigo-500/20",
        emerald: "bg-emerald-500/20",
        amber: "bg-amber-500/20",
        violet: "bg-violet-500/20",
        teal: "bg-teal-500/20",
    };

    const theme = colors[accent] || colors.indigo;
    const glowColor = glows[accent] || glows.indigo;

    const formatted = isCurrency
        ? `₹${Number(value || 0).toLocaleString()}`
        : Number(value || 0).toLocaleString();

    return (
        <div className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 md:p-5 relative overflow-hidden group hover:border-white/20 transition-all duration-300`}>
            <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl md:text-3xl font-black tracking-tight text-white/90 group-hover:text-white transition-colors">{formatted}</div>
            {subValue && <div className={`text-xs mt-1 font-medium ${accent === 'indigo' ? 'text-indigo-300/70' : 'text-emerald-300/70'}`}>{subValue}</div>}

            {/* Glow effect */}
            <div className={`absolute -top-4 -right-4 w-16 h-16 ${glowColor} blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
        </div>
    );
}

function EventBreakdown({ stats }) {
    if (!stats?.eventBreakdown) return null;

    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-sm font-semibold text-white/90">Performance Breakdown</h3>
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                    <div className="col-span-6">Event</div>
                    <div className="col-span-3 text-right">Reg</div>
                    <div className="col-span-3 text-right">Rev</div>
                </div>
                {stats.eventBreakdown.map((e) => (
                    <div key={(e.eventId || "_") + e.eventName} className="grid grid-cols-12 gap-2 px-3 py-3 rounded-xl hover:bg-white/5 transition border border-transparent hover:border-white/5 items-center group">
                        <div className="col-span-6">
                            <div className="text-xs font-semibold text-white/80 group-hover:text-white truncate">{e.eventName}</div>
                        </div>
                        <div className="col-span-3 text-right text-xs text-white/60 font-mono">{e.registrations}</div>
                        <div className="col-span-3 text-right text-xs text-emerald-400/80 font-mono">₹{Number(e.revenue).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

