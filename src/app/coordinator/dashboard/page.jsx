import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { LogOut } from "lucide-react";

import { getAllRegistrations } from "@/lib/google";

export const dynamic = 'force-dynamic';

async function getCoordinatorEventAndStats() {
    const cookieStore = await cookies();
    const eventId = cookieStore.get("coordinator_session")?.value;

    if (!eventId) return null;

    const supabase = createAdminClient();

    // Fetch Event
    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !event) return null;

    // Fetch Stats using Google Sheets (Source of Truth)
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    let stats = {
        enabled: false,
        totalRegistrations: 0,
        totalCheckedIn: 0,
        totalRevenue: 0,
        eventBreakdown: []
    };

    if (spreadsheetId) {
        try {
            const allRegs = await getAllRegistrations(spreadsheetId);
            const eventRegs = allRegs.filter(r => String(r.eventId || "").trim() === String(eventId).trim());

            const totalRegistrations = eventRegs.length;
            const isCheckedIn = (r) => String(r.checkedInAt || "").trim().length > 0 || String(r.status || "").toUpperCase() === "ATTENDED";
            const totalCheckedIn = eventRegs.filter(isCheckedIn).length;

            const safeAmount = (r) => { const n = Number(r.amount); return Number.isFinite(n) ? n : 0; };
            const totalRevenue = eventRegs.reduce((sum, r) => sum + safeAmount(r), 0);

            stats = {
                enabled: true,
                totalRegistrations,
                totalCheckedIn,
                totalRevenue,
                registrationsLast24h: 0,
                checkedInLast24h: 0,
                eventBreakdown: [{
                    eventName: event.title,
                    eventId: event.id,
                    registrations: totalRegistrations,
                    checkedIn: totalCheckedIn,
                    revenue: totalRevenue
                }]
            };
        } catch (e) {
            console.error("Failed to fetch sheet stats", e);
        }
    }

    return {
        event,
        stats
    };
}

export default async function CoordinatorDashboard() {
    const data = await getCoordinatorEventAndStats();

    if (!data) {
        redirect("/coordinator/login");
    }

    const { event, stats } = data;

    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Tech background - Cloned from Admin */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.20),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.16),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.25] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-teal-400/10 blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-10">
                <div className="max-w-6xl mx-auto">
                    <header className="flex items-start justify-between gap-4 mb-8">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                                Coordinator Console
                            </div>
                            <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                                {event.title}
                                <span className="text-teal-300">.</span>
                            </h1>
                            <p className="mt-2 text-sm md:text-base text-white/60 max-w-xl">
                                Event ID: {event.id} • {new Date(event.date).toLocaleDateString()}
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
                            >
                                Site
                            </Link>
                            <form action={async () => {
                                "use server";
                                const cookieStore = await cookies();
                                cookieStore.delete("coordinator_session");
                                redirect("/coordinator/login");
                            }}>
                                <button className="px-4 py-2 rounded-2xl bg-red-500/15 border border-red-500/20 hover:bg-red-500/25 transition text-sm text-red-100">
                                    Logout
                                </button>
                            </form>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <ActionCard
                                    title="Scan QR"
                                    description="Camera scanner → verification"
                                    href="/coordinator/scan"
                                    accent="teal"
                                    meta="Live"
                                />
                                <ActionCard
                                    title="Edit Event"
                                    description="Update details & posters"
                                    href="/coordinator/edit"
                                    accent="violet"
                                    meta="Config"
                                />
                            </div>

                            <StatsPanel stats={stats} />

                        </div>

                        <div className="space-y-5">
                            <StatusCard user="Coordinator" />
                            <MiniLinks />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Shared Components Cloned from Admin ---

function ActionCard({ title, description, href, accent, meta }) {
    const accentStyles =
        accent === "teal"
            ? "from-teal-400/25 to-transparent"
            : accent === "violet"
                ? "from-violet-400/25 to-transparent"
                : "from-blue-400/25 to-transparent";

    return (
        <Link
            href={href}
            className="group rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden relative"
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${accentStyles} opacity-70`} />
            <div className="relative p-5 md:p-6">
                <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono text-white/60 uppercase tracking-widest">{meta}</div>
                    <div className="w-8 h-8 rounded-2xl border border-white/10 bg-black/30 flex items-center justify-center text-white/70 group-hover:text-white transition">
                        →
                    </div>
                </div>
                <div className="mt-4">
                    <h3 className="text-lg md:text-xl font-bold tracking-tight">{title}</h3>
                    <p className="mt-1 text-sm text-white/60">{description}</p>
                </div>
            </div>
        </Link>
    );
}

function StatusCard({ user }) {
    const now = new Date();

    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">System</div>
                    <div className="mt-2 text-lg font-semibold">Online</div>
                </div>
                <div className="w-12 h-12 rounded-3xl bg-teal-400/15 border border-teal-400/20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_18px_rgba(45,212,191,0.9)]" />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="text-[11px] font-mono text-white/50">Mode</div>
                    <div className="mt-1 text-sm text-white/80">{user}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="text-[11px] font-mono text-white/50">Clock</div>
                    <div className="mt-1 text-sm text-white/80">{now.toLocaleTimeString()}</div>
                </div>
            </div>
        </div>
    );
}

function MiniLinks() {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 md:p-6">
            <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Shortcuts</div>
            <div className="mt-4 grid grid-cols-1 gap-3">
                <Link
                    href="/coordinator/scan"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm hover:bg-black/40 transition"
                >
                    Ticket Scanner
                </Link>
                <Link
                    href="/coordinator/edit"
                    className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm hover:bg-black/40 transition"
                >
                    Edit Event
                </Link>
            </div>
        </div>
    );
}

function StatsPanel({ stats }) {
    if (!stats?.enabled) return null;

    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Stats</div>
                    <div className="mt-2 text-base md:text-lg font-semibold">Registrations & Check-ins</div>
                    <div className="mt-1 text-sm text-white/60">Live database stats.</div>
                </div>
                <div className="text-[11px] font-mono text-white/50">DB</div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatBox label="Reg (total)" value={stats.totalRegistrations} accent="violet" />
                <StatBox label="Check-in" value={stats.totalCheckedIn} accent="violet" />
                <StatBox label="Revenue" value={stats.totalRevenue} accent="amber" format="currency" />
            </div>

            <div className="mt-5">
                <div className="flex items-center justify-between">
                    <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Breakdown</div>
                    <div className="text-[11px] font-mono text-white/40">reg • in • rev</div>
                </div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[11px] font-mono text-white/50 uppercase tracking-widest border-b border-white/10">
                        <div className="col-span-6">Event</div>
                        <div className="col-span-2 text-right">Reg</div>
                        <div className="col-span-2 text-right">In</div>
                        <div className="col-span-2 text-right">Rev</div>
                    </div>
                    <div className="max-h-[280px] overflow-auto custom-scrollbar">
                        {(stats.eventBreakdown || []).map((e) => (
                            <div key={(e.eventId || "_") + "::" + e.eventName} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-white/5 items-center">
                                <div className="col-span-6">
                                    <div className="text-sm font-semibold text-white/90 truncate">{e.eventName}</div>
                                </div>
                                <div className="col-span-2 text-right text-sm text-white/80">{Number(e.registrations || 0).toLocaleString()}</div>
                                <div className="col-span-2 text-right text-sm text-white/80">{Number(e.checkedIn || 0).toLocaleString()}</div>
                                <div className="col-span-2 text-right text-sm text-white/80">₹{Number(e.revenue || 0).toLocaleString()}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, accent, format }) {
    const ring =
        accent === "teal"
            ? "border-teal-400/20"
            : accent === "amber"
                ? "border-amber-300/20"
                : "border-violet-400/20";

    const glow =
        accent === "teal"
            ? "shadow-[0_0_20px_rgba(45,212,191,0.12)]"
            : accent === "amber"
                ? "shadow-[0_0_20px_rgba(252,211,77,0.10)]"
                : "shadow-[0_0_20px_rgba(168,85,247,0.12)]";

    const formatted =
        format === "currency" ? `₹${Number(value || 0).toLocaleString()}` : Number(value || 0).toLocaleString();

    return (
        <div className={`rounded-2xl border border-white/10 bg-black/30 p-3 ${ring} ${glow}`}>
            <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">{label}</div>
            <div className="mt-1 text-xl md:text-2xl font-black tracking-tight">{formatted}</div>
        </div>
    );
}
