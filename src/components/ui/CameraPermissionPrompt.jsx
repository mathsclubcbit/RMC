"use client";

import { Camera, AlertTriangle, RefreshCw, Keyboard, Loader2, ShieldAlert, MonitorX } from "lucide-react";

/**
 * CameraPermissionPrompt - Shows appropriate UI based on camera permission state
 * 
 * Props:
 * - permissionState: 'idle' | 'requesting' | 'granted' | 'denied' | 'not-supported'
 * - error: Error message string or null
 * - onRequestPermission: Function to request camera permission
 * - onManualEntry: Function or URL for manual entry fallback
 * - accentColor: 'teal' (coordinator) or 'indigo' (admin)
 */
export function CameraPermissionPrompt({
    permissionState,
    error,
    onRequestPermission,
    onManualEntry,
    accentColor = "teal"
}) {
    const colors = {
        teal: {
            bg: "bg-teal-500/20",
            border: "border-teal-500/30",
            text: "text-teal-400",
            button: "bg-teal-400 hover:bg-teal-500",
            buttonShadow: "shadow-[0_0_20px_rgba(45,212,191,0.4)]",
            icon: "text-teal-400",
        },
        indigo: {
            bg: "bg-indigo-500/20",
            border: "border-indigo-500/30",
            text: "text-indigo-400",
            button: "bg-indigo-500 hover:bg-indigo-600",
            buttonShadow: "shadow-[0_0_20px_rgba(99,102,241,0.4)]",
            icon: "text-indigo-400",
        },
    };

    const c = colors[accentColor] || colors.teal;

    // Idle state - show enable camera prompt
    if (permissionState === "idle") {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center min-h-[300px]">
                <div className={`p-4 rounded-2xl ${c.bg} ${c.border} border mb-6`}>
                    <Camera className={`w-12 h-12 ${c.icon}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Camera Access Required</h3>
                <p className="text-white/60 text-sm mb-6 max-w-xs">
                    To scan QR codes, we need access to your camera. Your camera feed never leaves your device.
                </p>
                <button
                    onClick={onRequestPermission}
                    className={`px-6 py-3 rounded-xl ${c.button} text-black font-bold text-sm uppercase tracking-widest transition-all ${c.buttonShadow} hover:scale-105`}
                >
                    Enable Camera
                </button>
                <button
                    onClick={onManualEntry}
                    className="mt-4 flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
                >
                    <Keyboard className="w-4 h-4" />
                    Enter Code Manually
                </button>
            </div>
        );
    }

    // Requesting state - show loading
    if (permissionState === "requesting") {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center min-h-[300px]">
                <div className={`p-4 rounded-2xl ${c.bg} ${c.border} border mb-6`}>
                    <Loader2 className={`w-12 h-12 ${c.icon} animate-spin`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Requesting Access</h3>
                <p className="text-white/60 text-sm max-w-xs">
                    Please allow camera access in the browser prompt...
                </p>
            </div>
        );
    }

    // Denied state - show retry option
    if (permissionState === "denied") {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center min-h-[300px]">
                <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30 mb-6">
                    <ShieldAlert className="w-12 h-12 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-amber-400 mb-2">Camera Access Denied</h3>
                <p className="text-white/60 text-sm mb-2 max-w-xs">
                    {error || "Camera permission was denied."}
                </p>
                <p className="text-white/40 text-xs mb-6 max-w-xs">
                    You can enable it in your browser settings or use manual entry below.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onRequestPermission}
                        className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 font-semibold text-sm flex items-center gap-2 hover:bg-amber-500/30 transition-all"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                    </button>
                    <button
                        onClick={onManualEntry}
                        className="px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-sm flex items-center gap-2 hover:bg-white/20 transition-all"
                    >
                        <Keyboard className="w-4 h-4" />
                        Manual Entry
                    </button>
                </div>
            </div>
        );
    }

    // Not supported state
    if (permissionState === "not-supported") {
        return (
            <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center min-h-[300px]">
                <div className="p-4 rounded-2xl bg-red-500/20 border border-red-500/30 mb-6">
                    <MonitorX className="w-12 h-12 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-red-400 mb-2">Camera Not Available</h3>
                <p className="text-white/60 text-sm mb-2 max-w-xs">
                    {error || "Camera access is not available on this device."}
                </p>
                <p className="text-white/40 text-xs mb-6 max-w-xs">
                    Camera requires HTTPS. Use manual entry to continue.
                </p>
                <button
                    onClick={onManualEntry}
                    className={`px-6 py-3 rounded-xl ${c.button} text-black font-bold text-sm uppercase tracking-widest transition-all ${c.buttonShadow} hover:scale-105 flex items-center gap-2`}
                >
                    <Keyboard className="w-4 h-4" />
                    Use Manual Entry
                </button>
            </div>
        );
    }

    // Granted state - this component shouldn't be shown when granted
    // Return null and let the parent render the scanner
    return null;
}
