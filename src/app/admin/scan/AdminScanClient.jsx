"use client";

import { useEffect, useMemo, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scan, Keyboard, Lightbulb } from "lucide-react";

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

        const scanner = new Html5QrcodeScanner({
            elementId: "rmc-qr-reader",
            config: {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                rememberLastUsedCamera: true,
                showTorchButtonIfSupported: true,
            },
            verbose: false,
        });

        scanner.render(
            (decodedText) => {
                const id = String(decodedText || "").trim();
                if (!id) return;

                scanner
                    .clear()
                    .catch(() => { })
                    .finally(() => {
                        router.push(`/admin/ticket/${encodeURIComponent(id)}`);
                    });
            },
            () => {
                // ignore per-frame errors
            }
        );

        return () => {
            scanner.clear().catch(() => { });
        };
    }, [router]);

    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Tech background - Admin Indigo */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.20),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.16),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-12">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                            Admin Console
                        </div>
                        <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                            Ticket Scanner
                            <span className="text-indigo-500">.</span>
                        </h1>
                        <p className="mt-2 text-white/50 max-w-xl">
                            Point camera at ticket QR or manually enter code.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Scanner Module */}
                        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                <div className="flex items-center gap-2">
                                    <Scan className="w-4 h-4 text-indigo-400" />
                                    <span className="text-sm font-semibold text-white/90">Camera Feed</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">LIVE</span>
                                </div>
                            </div>

                            {!envInfo.hasMedia || !envInfo.secure ? (
                                <div className="p-5">
                                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
                                        <div className="text-sm font-semibold text-amber-200">Camera blocked by browser security</div>
                                        <div className="mt-1 text-xs text-amber-200/70">
                                            Camera access needs a secure context, localhost, or HTTPS.
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="p-4 md:p-6 relative">
                                {/* HUD Overlay */}
                                <div className="absolute inset-4 md:inset-6 pointer-events-none z-10 overflow-hidden rounded-2xl border border-indigo-500/20">
                                    {/* Scanning Line Animation */}
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_15px_rgba(99,102,241,1)] animate-[scan_2s_ease-in-out_infinite]" />

                                    {/* Corner Brackets */}
                                    <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-indigo-400 rounded-tl-lg" />
                                    <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-indigo-400 rounded-tr-lg" />
                                    <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-indigo-400 rounded-bl-lg" />
                                    <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-indigo-400 rounded-br-lg" />
                                </div>

                                <div id="rmc-qr-reader" className="rmc-qr-shell rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-inner relative z-0" />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Manual Entry */}
                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-4 text-white/50">
                                    <Keyboard className="w-4 h-4" />
                                    <span className="text-[11px] font-mono uppercase tracking-widest">Manual Override</span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <input
                                        value={ticketCode}
                                        onChange={(e) => setTicketCode(e.target.value)}
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="123456"
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-white/20 outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all text-center tracking-widest font-mono text-lg"
                                    />
                                    <button
                                        type="button"
                                        disabled={!isValid}
                                        onClick={() => router.push(`/admin/ticket/${encodeURIComponent(normalized)}`)}
                                        className="w-full rounded-xl px-4 py-3 bg-indigo-500 text-white font-semibold uppercase tracking-widest text-xs hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                                    >
                                        Open Ticket
                                    </button>
                                </div>
                            </div>

                            {/* Tips */}
                            <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 md:p-6">
                                <div className="flex items-center gap-2 mb-4 text-white/50">
                                    <Lightbulb className="w-4 h-4" />
                                    <span className="text-[11px] font-mono uppercase tracking-widest">Pro Tips</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/60">
                                        <strong className="block text-white/80 mb-0.5">Lighting</strong>
                                        Tilt phone 10–15° to avoid glare on the screen.
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/60">
                                        <strong className="block text-white/80 mb-0.5">Distance</strong>
                                        Keep QR inside the box. Hold steady for 1s.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Style html5-qrcode internal UI */}
            <style jsx global>{`
                @keyframes scan {
                    0% { top: 10%; opacity: 0; }
                    50% { opacity: 1; }
                    100% { top: 90%; opacity: 0; }
                }

                .rmc-qr-shell * { box-sizing: border-box; }
                #rmc-qr-reader { color: rgba(255,255,255,0.85); min-height: 300px; display: flex; flex-direction: column; justify-content: center; }
                #rmc-qr-reader__header_message { display: none !important; }
                #rmc-qr-reader video { width: 100% !important; height: auto !important; border-radius: 12px; object-fit: cover; }
                
                #rmc-qr-reader select, #rmc-qr-reader button, #rmc-qr-reader input {
                    border-radius: 12px !important;
                    border: 1px solid rgba(255,255,255,0.1) !important;
                    background: rgba(0,0,0,0.6) !important;
                    color: rgba(255,255,255,0.9) !important;
                    padding: 8px 12px !important;
                    outline: none !important;
                }
                
                #rmc-qr-reader button {
                    display: inline-flex !important;
                    align-items: center !important;
                    justify-content: center !important;
                    padding: 12px 24px !important;
                    background: #6366f1 !important; /* Indigo 500 */
                    color: white !important;
                    font-weight: 700 !important;
                    font-size: 11px !important;
                    letter-spacing: 0.1em !important;
                    text-transform: uppercase !important;
                    border-radius: 12px !important;
                    border: none !important;
                    cursor: pointer !important;
                    box-shadow: 0 0 20px rgba(99,102,241,0.4) !important;
                    transition: all 0.2s !important;
                    margin: 20px auto !important;
                }
                #rmc-qr-reader button:hover {
                    transform: scale(1.05);
                    background: #4f46e5 !important; /* Indigo 600 */
                    box-shadow: 0 0 30px rgba(99,102,241,0.6) !important;
                }
                
                #rmc-qr-reader a { color: rgba(99,102,241,0.9) !important; }
                #rmc-qr-reader__dashboard_section_csr span, #rmc-qr-reader__dashboard_section_swaplink { display: none !important; }
                
                /* Hide error icon and default placeholder icon */
                img[alt="Info icon"], img[alt="Camera based scan"] { display: none !important; }
                #rmc-qr-reader img { display: none !important; }
            `}</style>
        </div>
    );
}
