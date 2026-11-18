"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboardClient() {
    const router = useRouter();
    const [ticketCode, setTicketCode] = useState("");

    const normalized = useMemo(() => String(ticketCode || "").replace(/\s+/g, "").trim(), [ticketCode]);
    const isValid = /^\d{6}$/.test(normalized);

    return (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 md:p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                    <h3 className="text-base md:text-lg font-semibold tracking-wide">Quick Ticket Lookup</h3>
                    <p className="text-xs md:text-sm text-white/60">Enter 6-digit code to open verification page.</p>
                </div>
                <div className="text-[10px] md:text-xs font-mono text-white/50">Format: 6 digits</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <input
                    value={ticketCode}
                    onChange={(e) => setTicketCode(e.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="e.g. 123456"
                    className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-teal-400/50"
                />
                <button
                    type="button"
                    disabled={!isValid}
                    onClick={() => router.push(`/admin/ticket/${encodeURIComponent(normalized)}`)}
                    className="rounded-2xl px-5 py-3 bg-teal-400 text-black font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Open
                </button>
            </div>

            {!isValid && normalized.length > 0 ? (
                <div className="mt-3 text-xs text-red-200/80">Ticket code must be exactly 6 digits.</div>
            ) : null}
        </div>
    );
}
