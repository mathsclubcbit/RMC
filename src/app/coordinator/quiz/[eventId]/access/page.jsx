"use client";

import { useState, useEffect, use } from "react";
import QRCode from "react-qr-code";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";

export default function CoordinatorAccessScreen({ params }) {
    const { eventId } = use(params);
    const [qrData, setQrData] = useState(null);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState(100);

    // Refresh QR Code every 4 seconds
    useEffect(() => {
        let refreshTimer;
        let progressTimer;

        const generateQR = async () => {
            try {
                const res = await fetch('/api/coordinator/quiz/generate-qr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId })
                });

                const data = await res.json();
                
                if (!res.ok) {
                    setError(data.error || 'Failed to generate QR');
                    return;
                }

                setError(null);
                // Create the join URL with the generated entryCode
                const origin = window.location.origin;
                const url = `${origin}/quiz/${eventId}?entryCode=${data.id}`;
                setQrData(url);
                setProgress(100);

            } catch (err) {
                setError('Network error');
            }
        };

        generateQR();

        // Regenerate every 4 seconds
        refreshTimer = setInterval(generateQR, 4000);

        // Progress bar ticking (100% to 0% over 4000ms)
        const TICK_RATE = 50;
        progressTimer = setInterval(() => {
            setProgress(p => Math.max(0, p - (100 / (4000 / TICK_RATE))));
        }, TICK_RATE);

        return () => {
            clearInterval(refreshTimer);
            clearInterval(progressTimer);
        };
    }, [eventId]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
            <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase tracking-widest text-sm mb-4">
                    <ShieldCheck className="w-5 h-5" /> Secure Live Entry
                </div>
                <h1 className="text-4xl md:text-5xl font-black mb-2 uppercase tracking-tight">Scan to Enter Arena</h1>
                <p className="text-white/50">Code refreshes automatically to prevent sharing.</p>
            </div>

            {error ? (
                <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-md w-full text-center">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Error Generating Code</h3>
                    <p>{error}</p>
                </div>
            ) : qrData ? (
                <div className="relative">
                    {/* QR Code Container */}
                    <div className="p-8 bg-white rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <QRCode
                            value={qrData}
                            size={400}
                            bgColor="#ffffff"
                            fgColor="#000000"
                            level="H"
                        />
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="absolute -bottom-12 left-0 w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-emerald-500 transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
                    <p className="text-white/50 font-mono tracking-widest uppercase">Initializing Sec-Protocol...</p>
                </div>
            )}
        </div>
    );
}
