"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Camera,
    CameraOff,
    CheckCircle2,
    XCircle,
    AlertCircle,
    User,
    Mail,
    Hash,
    Building,
    RefreshCw,
    Volume2,
    VolumeX,
    Flashlight
} from "lucide-react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import MathBackground from "@/components/ui/MathBackground";

export default function ScannerPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId;
    const scannerRef = useRef(null);
    const html5QrcodeScannerRef = useRef(null);

    const [isScanning, setIsScanning] = useState(false);
    const [lastScan, setLastScan] = useState(null);
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [scanHistory, setScanHistory] = useState([]);
    const [event, setEvent] = useState(null);

    // Auth check
    useEffect(() => {
        const auth = sessionStorage.getItem("admin-auth");
        if (!auth) {
            router.push("/admin/login");
        }
    }, [router]);

    // Fetch event details
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await fetch('/api/events');
                const events = await res.json();
                const foundEvent = events.find(e => e.id === eventId);
                setEvent(foundEvent);
            } catch (error) {
                console.error('Failed to fetch event:', error);
            }
        };
        fetchEvent();
    }, [eventId]);

    // Play sound effect
    const playSound = useCallback((type) => {
        if (!soundEnabled) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        if (type === 'success') {
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.3;
        } else if (type === 'error') {
            oscillator.frequency.value = 300;
            gainNode.gain.value = 0.3;
        } else if (type === 'warning') {
            oscillator.frequency.value = 500;
            gainNode.gain.value = 0.3;
        }

        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
    }, [soundEnabled]);

    // Verify scanned QR code
    const verifyAttendance = useCallback(async (registrationId) => {
        // Prevent duplicate scans within 3 seconds
        if (lastScan && Date.now() - lastScan.time < 3000 && lastScan.id === registrationId) {
            return;
        }

        setLoading(true);
        setLastScan({ id: registrationId, time: Date.now() });

        try {
            const res = await fetch('/api/attendance/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationId, eventId })
            });

            const data = await res.json();

            setScanResult(data);

            if (data.valid && !data.alreadyCheckedIn) {
                playSound('success');
            } else if (data.alreadyCheckedIn) {
                playSound('warning');
            } else {
                playSound('error');
            }

            // Add to history
            setScanHistory(prev => [{
                ...data,
                registrationId,
                timestamp: new Date().toLocaleTimeString()
            }, ...prev.slice(0, 19)]);

        } catch (error) {
            console.error('Verification failed:', error);
            setScanResult({ valid: false, error: 'Verification failed' });
            playSound('error');
        } finally {
            setLoading(false);
        }
    }, [eventId, lastScan, playSound]);

    // Initialize scanner
    const startScanning = useCallback(() => {
        if (html5QrcodeScannerRef.current) return;

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        };

        const scanner = new Html5QrcodeScanner("qr-reader", config, false);

        scanner.render(
            (decodedText) => {
                verifyAttendance(decodedText);
            },
            (errorMessage) => {
                // Ignore scan errors (camera still looking)
            }
        );

        html5QrcodeScannerRef.current = scanner;
        setIsScanning(true);
    }, [verifyAttendance]);

    // Stop scanner
    const stopScanning = useCallback(() => {
        if (html5QrcodeScannerRef.current) {
            html5QrcodeScannerRef.current.clear().catch(console.error);
            html5QrcodeScannerRef.current = null;
        }
        setIsScanning(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (html5QrcodeScannerRef.current) {
                html5QrcodeScannerRef.current.clear().catch(console.error);
            }
        };
    }, []);

    const clearResult = () => {
        setScanResult(null);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white relative">
            <MathBackground />

            {/* Header */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-bold text-lg">QR Scanner</h1>
                            <p className="text-xs text-teal-400">{event?.title || 'Event'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-500" />}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 py-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Scanner Section */}
                    <div className="space-y-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 overflow-hidden">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-teal-400" />
                                    Camera Scanner
                                </h2>
                                <button
                                    onClick={isScanning ? stopScanning : startScanning}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isScanning
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                            : 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                                        }`}
                                >
                                    {isScanning ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                                    {isScanning ? 'Stop' : 'Start'}
                                </button>
                            </div>

                            {/* QR Scanner Container */}
                            <div
                                id="qr-reader"
                                ref={scannerRef}
                                className="rounded-xl overflow-hidden bg-black min-h-[300px]"
                            />

                            {!isScanning && (
                                <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-white/10 rounded-xl">
                                    <button
                                        onClick={startScanning}
                                        className="flex flex-col items-center gap-3 text-gray-400 hover:text-teal-400 transition-colors"
                                    >
                                        <Camera className="w-12 h-12" />
                                        <span>Tap to start scanning</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Scan Result */}
                        <AnimatePresence mode="wait">
                            {scanResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className={`p-5 rounded-2xl border ${scanResult.valid && !scanResult.alreadyCheckedIn
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : scanResult.alreadyCheckedIn
                                                ? 'bg-yellow-500/10 border-yellow-500/30'
                                                : 'bg-red-500/10 border-red-500/30'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            {scanResult.valid && !scanResult.alreadyCheckedIn ? (
                                                <CheckCircle2 className="w-10 h-10 text-green-400" />
                                            ) : scanResult.alreadyCheckedIn ? (
                                                <AlertCircle className="w-10 h-10 text-yellow-400" />
                                            ) : (
                                                <XCircle className="w-10 h-10 text-red-400" />
                                            )}
                                            <div>
                                                <p className={`font-bold text-lg ${scanResult.valid && !scanResult.alreadyCheckedIn
                                                        ? 'text-green-400'
                                                        : scanResult.alreadyCheckedIn
                                                            ? 'text-yellow-400'
                                                            : 'text-red-400'
                                                    }`}>
                                                    {scanResult.message || scanResult.error || 'Unknown'}
                                                </p>
                                                {scanResult.registration && (
                                                    <p className="text-white font-medium">{scanResult.registration.name}</p>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={clearResult} className="text-gray-400 hover:text-white">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {scanResult.registration && (
                                        <div className="mt-4 grid grid-cols-2 gap-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-300 truncate">{scanResult.registration.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-300">{scanResult.registration.department}</span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Scan History */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold flex items-center gap-2">
                                <Hash className="w-5 h-5 text-amber-400" />
                                Scan History
                            </h2>
                            <span className="text-xs text-gray-500">{scanHistory.length} scans</span>
                        </div>

                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {scanHistory.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No scans yet</p>
                            ) : (
                                scanHistory.map((scan, i) => (
                                    <div
                                        key={i}
                                        className={`p-3 rounded-xl border ${scan.valid && !scan.alreadyCheckedIn
                                                ? 'bg-green-500/5 border-green-500/20'
                                                : scan.alreadyCheckedIn
                                                    ? 'bg-yellow-500/5 border-yellow-500/20'
                                                    : 'bg-red-500/5 border-red-500/20'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {scan.valid && !scan.alreadyCheckedIn ? (
                                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                ) : scan.alreadyCheckedIn ? (
                                                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-400" />
                                                )}
                                                <span className="text-sm font-medium">
                                                    {scan.registration?.name || scan.registrationId?.slice(0, 15) || 'Unknown'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500">{scan.timestamp}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
}
