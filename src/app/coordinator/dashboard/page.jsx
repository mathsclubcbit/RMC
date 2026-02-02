import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { LogOut, QrCode, Edit3 } from "lucide-react";

import { getAllRegistrations } from "@/lib/google";

export const dynamic = 'force-dynamic';

async function getCoordinatorEventAndStats() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user?.app_metadata?.role !== 'coordinator' || !user?.app_metadata?.event_id) {
        return null;
    }

    const eventId = user.app_metadata.event_id;

    const admin = createAdminClient();

    // Fetch Event
    const { data: event, error } = await admin
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
            console.error("Failed to fetch sheet stats for ID:", spreadsheetId, e);
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
                    </div>
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

    const theme = colors[accent] || colors.teal;
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
