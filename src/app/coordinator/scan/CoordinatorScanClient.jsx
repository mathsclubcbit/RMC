"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scan, Keyboard, Lightbulb } from "lucide-react";
import { useCameraPermission } from "@/hooks/useCameraPermission";
import { CameraPermissionPrompt } from "@/components/ui/CameraPermissionPrompt";

export default function CoordinatorScanPage() {
    const router = useRouter();
    const [ticketCode, setTicketCode] = useState("");
    const [scannerError, setScannerError] = useState("");
    const [isScanning, setIsScanning] = useState(false);
    const [showManualEntry, setShowManualEntry] = useState(false);
    const scannerRef = useRef(null);
    const manualInputRef = useRef(null);

    const normalized = useMemo(() => String(ticketCode || "").replace(/\s+/g, "").trim(), [ticketCode]);
    const isValid = /^\d{6}$/.test(normalized);

    const {
        permissionState,
        error: permissionError,
        requestPermission,
        isGranted,
    } = useCameraPermission();

    // Focus manual input when shown
    const handleManualEntry = useCallback(() => {
        setShowManualEntry(true);
        setTimeout(() => manualInputRef.current?.focus(), 100);
    }, []);

    // Start scanner only after permission is granted
    useEffect(() => {
        if (!isGranted) return;

        let isMounted = true;
        const scannerId = "coordinator-qr-reader";

        const startScanner = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));

            const element = document.getElementById(scannerId);
            if (!element || !isMounted) {
                console.warn("Scanner element not found or component unmounted");
                return;
            }

            const html5QrCode = new Html5Qrcode(scannerId);
            scannerRef.current = html5QrCode;

            try {
                await html5QrCode.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText) => {
                        const id = String(decodedText || "").trim();
                        if (!id) return;

                        html5QrCode.stop().then(() => {
                            router.push(`/coordinator/ticket/${encodeURIComponent(id)}`);
                        }).catch(e => {
                            console.error("Stop failed", e);
                            router.push(`/coordinator/ticket/${encodeURIComponent(id)}`);
                        });
                    },
                    () => { /* ignore per-frame errors */ }
                );
                if (isMounted) setIsScanning(true);
            } catch (err) {
                console.error("Scanner start error:", err);
                if (isMounted) {
                    setScannerError("Camera initialization failed. Please check permissions.");
                }
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerRef.current) {
                const scanner = scannerRef.current;
                if (scanner.isScanning) {
                    scanner.stop().catch(e => console.warn("Cleanup stop failed", e));
                }
                scannerRef.current = null;
            }
        };
    }, [router, isGranted]);

    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Tech background - Coordinator Teal */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(45,212,191,0.20),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.18),transparent_55%),radial-gradient(circle_at_60%_90%,rgba(59,130,246,0.16),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.22] [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[1100px] h-[1100px] rounded-full bg-teal-400/10 blur-3xl" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-12">
                <div className="max-w-5xl mx-auto">
                    <header className="mb-10">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.9)]" />
                            Coordinator Console
                        </div>
                        <h1 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">
                            Scan QR
                            <span className="text-teal-400">.</span>
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
                                    <Scan className="w-4 h-4 text-teal-400" />
                                    <span className="text-sm font-semibold text-white/90">Camera Feed</span>
                                </div>
                                {isScanning && (
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">LIVE</span>
                                    </div>
                                )}
                            </div>

                            {!isGranted ? (
                                <CameraPermissionPrompt
                                    permissionState={permissionState}
                                    error={permissionError}
                                    onRequestPermission={requestPermission}
                                    onManualEntry={handleManualEntry}
                                    accentColor="teal"
                                />
                            ) : (
                                <>
                                    {scannerError && (
                                        <div className="px-5 pb-5">
                                            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                                                <div className="text-sm font-semibold text-red-200">Camera Error</div>
                                                <div className="mt-1 text-xs text-red-200/70">{scannerError}</div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4 md:p-6 relative">
                                        {/* HUD Overlay */}
                                        <div className="absolute inset-4 md:inset-6 pointer-events-none z-10 overflow-hidden rounded-2xl border border-teal-500/20">
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,1)] animate-[scan_2s_ease-in-out_infinite]" />
                                            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-lg" />
                                            <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-lg" />
                                            <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-lg" />
                                            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-lg" />
                                        </div>

                                        <div id="coordinator-qr-reader" className="rmc-qr-shell rounded-2xl overflow-hidden bg-black/50 border border-white/10 shadow-inner relative z-0" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Manual Entry */}
                            <div className={`rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5 md:p-6 transition-all ${showManualEntry ? 'ring-2 ring-teal-500/50' : ''}`}>
                                <div className="flex items-center gap-2 mb-4 text-white/50">
                                    <Keyboard className="w-4 h-4" />
                                    <span className="text-[11px] font-mono uppercase tracking-widest">Manual Override</span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <input
                                        ref={manualInputRef}
                                        value={ticketCode}
                                        onChange={(e) => setTicketCode(e.target.value)}
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="123456"
                                        className="w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 text-white placeholder-white/20 outline-none focus:border-teal-500/50 focus:bg-teal-500/5 transition-all text-center tracking-widest font-mono text-lg"
                                    />
                                    <button
                                        type="button"
                                        disabled={!isValid}
                                        onClick={() => router.push(`/coordinator/ticket/${encodeURIComponent(normalized)}`)}
                                        className="w-full rounded-xl px-4 py-3 bg-teal-400 text-black font-semibold uppercase tracking-widest text-xs hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(45,212,191,0.2)]"
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
                #coordinator-qr-reader { color: rgba(255,255,255,0.85); min-height: 300px; display: flex; flex-direction: column; justify-content: center; }
                #coordinator-qr-reader__header_message { display: none !important; }
                #coordinator-qr-reader video { width: 100% !important; height: auto !important; border-radius: 12px; object-fit: cover; }
                
                /* Hide library buttons - we handle permission ourselves */
                #coordinator-qr-reader button { display: none !important; }
                #coordinator-qr-reader__dashboard_section_csr span, 
                #coordinator-qr-reader__dashboard_section_swaplink { display: none !important; }
                img[alt="Info icon"], img[alt="Camera based scan"] { display: none !important; }
                #coordinator-qr-reader img { display: none !important; }
            `}</style>
        </div>
    );
}
