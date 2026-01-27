"use client";

import { useEffect, useMemo, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminScanPage() {
    const router = useRouter();
    const [ticketCode, setTicketCode] = useState("");
    const [envInfo, setEnvInfo] = useState({ secure: true, hasMedia: true, origin: "" });
    const normalized = useMemo(() => String(ticketCode || "").replace(/\s+/g, "").trim(), [ticketCode]);
    const isValid = /^\d{6}$/.test(normalized);

    useEffect(() => {
        try {
            setEnvInfo({
                secure: Boolean(window.isSecureContext),
                hasMedia: Boolean(navigator?.mediaDevices?.getUserMedia),
                origin: window.location.origin,
            });
        } catch {
            // ignore
        }

        const scanner = new Html5QrcodeScanner(
            "rmc-qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                showTorchButtonIfSupported: true,
            },
            false
        );

        scanner.render(
            (decodedText) => {
                const id = String(decodedText || "").trim();
                if (!id) return;

                scanner
                    .clear()
                    .catch(() => {})
                    .finally(() => {
                        router.push(`/admin/ticket/${encodeURIComponent(id)}`);
                    });
            },
            () => {
                // ignore per-frame errors
            }
        );

        return () => {
            scanner.clear().catch(() => {});
        };
    }, [router]);

    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Tech background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.20),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.16),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full bg-teal-400/10 blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-10">
                <div className="max-w-5xl mx-auto">
                    <header className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                                Scanner Console
                            </div>
                            <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                                Scan QR
                                <span className="text-teal-300">.</span>
                            </h1>
                            <p className="mt-2 text-sm md:text-base text-white/60 max-w-xl">
                                Point camera at the ticket QR. Auto-routes to the verification screen.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/admin"
                                className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/admin/events"
                                className="hidden sm:inline-flex px-4 py-2 rounded-2xl bg-white/10 border border-white/10 hover:bg-white/15 transition text-sm"
                            >
                                Events
                            </Link>
                            <Link
                                href="/"
                                className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-sm text-white/80"
                            >
                                Site
                            </Link>
                        </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Camera</div>
                                    <div className="mt-1 text-sm text-white/70">Auto-detect • Fast focus • Low-light friendly</div>
                                </div>
                                <div className="text-[11px] font-mono text-white/50">LIVE</div>
                            </div>

                            {!envInfo.hasMedia || !envInfo.secure ? (
                                <div className="px-5 py-4 border-b border-white/10">
                                    <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
                                        <div className="text-sm font-semibold text-amber-100">Camera blocked by browser security</div>
                                        <div className="mt-1 text-sm text-amber-100/80">
                                            Camera access needs a secure context.
                                            {envInfo.origin ? ` Current: ${envInfo.origin}` : ""}
                                        </div>
                                        <div className="mt-2 text-xs text-amber-100/70 font-mono">
                                            Use `https://` OR open from `http://localhost:3000`.
                                            On phone, use an HTTPS tunnel (ngrok/localtunnel) or deploy.
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            <div className="p-4 md:p-5">
                                <div id="rmc-qr-reader" className="rmc-qr-shell rounded-2xl overflow-hidden bg-black/40 border border-white/10" />
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
                                <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Manual Override</div>
                                <div className="mt-2 text-base font-semibold">Enter Ticket Code</div>
                                <p className="mt-1 text-sm text-white/60">If camera acts up, type the 6-digit code.</p>

                                <div className="mt-4 flex flex-col gap-3">
                                    <input
                                        value={ticketCode}
                                        onChange={(e) => setTicketCode(e.target.value)}
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="123456"
                                        className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-white outline-none focus:border-teal-400/50"
                                    />
                                    <button
                                        type="button"
                                        disabled={!isValid}
                                        onClick={() => router.push(`/admin/ticket/${encodeURIComponent(normalized)}`)}
                                        className="rounded-2xl px-5 py-3 bg-teal-400 text-black font-bold uppercase tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Open Ticket
                                    </button>
                                    {!isValid && normalized.length > 0 ? (
                                        <div className="text-xs text-red-200/80">Ticket code must be exactly 6 digits.</div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
                                <div className="text-[11px] font-mono text-white/50 uppercase tracking-widest">Tips</div>
                                <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-white/70">
                                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                        <div className="text-xs font-mono text-white/50">Lighting</div>
                                        <div className="mt-1">Tilt phone 10–15° to avoid glare.</div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                                        <div className="text-xs font-mono text-white/50">Distance</div>
                                        <div className="mt-1">Keep QR inside the square, steady for 1 sec.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Style html5-qrcode internal UI */}
            <style jsx global>{`
                /* Scope to this page */
                .rmc-qr-shell * { box-sizing: border-box; }
                #rmc-qr-reader { color: rgba(255,255,255,0.85); }

                /* Hide noisy library header blocks if present (keep camera/start controls visible) */
                #rmc-qr-reader__header_message { display: none !important; }

                /* Camera / control bar */
                #rmc-qr-reader video { width: 100% !important; height: auto !important; border-radius: 16px; }
                #rmc-qr-reader select, #rmc-qr-reader button, #rmc-qr-reader input {
                    border-radius: 14px !important;
                    border: 1px solid rgba(255,255,255,0.12) !important;
                    background: rgba(0,0,0,0.55) !important;
                    color: rgba(255,255,255,0.9) !important;
                    padding: 10px 12px !important;
                    outline: none !important;
                }
                #rmc-qr-reader button {
                    font-weight: 800 !important;
                    letter-spacing: 0.12em !important;
                    text-transform: uppercase !important;
                    font-size: 11px !important;
                }
                #rmc-qr-reader button:hover { background: rgba(45,212,191,0.18) !important; border-color: rgba(45,212,191,0.35) !important; }
                #rmc-qr-reader a { color: rgba(45,212,191,0.9) !important; }

                /* Make the internal control area feel native */
                #rmc-qr-reader__dashboard_section { padding: 14px !important; }
                #rmc-qr-reader__dashboard_section_csr, #rmc-qr-reader__dashboard_section_swaplink {
                    padding: 12px !important;
                }
                #rmc-qr-reader__dashboard_section_csr > div { gap: 10px !important; }

                /* Result text */
                #rmc-qr-reader__dashboard_section span { color: rgba(255,255,255,0.75) !important; }
            `}</style>
        </div>
    );
}
