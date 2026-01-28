"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Check, Loader2, CheckCircle, XCircle, Info } from "lucide-react";
import { useEffect } from 'react';

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "OK",
    cancelText = "Cancel",
    type = "confirm", // 'confirm', 'success', 'error', 'info'
    isDangerous = false,
    isLoading = false,
    isToast = false,
    duration = 0 // Auto-close duration in ms. 0 = manual.
}) {
    // Auto-close logic
    useEffect(() => {
        if (isOpen && isToast && duration > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, isToast, duration, onClose]);
    // Prevent closing if loading
    const handleClose = () => {
        if (!isLoading) onClose();
    };

    // Determine icon and colors based on type
    const getConfig = () => {
        switch (type) {
            case "success":
                return {
                    icon: CheckCircle,
                    iconClass: "bg-green-500/10 border-green-500/20 text-green-500",
                    btnClass: "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20",
                    showCancel: false
                };
            case "error":
                return {
                    icon: XCircle,
                    iconClass: "bg-red-500/10 border-red-500/20 text-red-500",
                    btnClass: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
                    showCancel: false
                };
            case "info":
                return {
                    icon: Info,
                    iconClass: "bg-blue-500/10 border-blue-500/20 text-blue-500",
                    btnClass: "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20",
                    showCancel: false
                };
            case "confirm":
            default:
                return {
                    icon: AlertTriangle,
                    iconClass: isDangerous
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : "bg-teal/10 border-teal/20 text-teal",
                    btnClass: isDangerous
                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                        : "bg-teal hover:bg-teal/80 text-black shadow-lg shadow-teal/20",
                    showCancel: true
                };
        }
    };

    const config = getConfig();
    const Icon = config.icon;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed z-[100] p-4 pointer-events-none flex ${isToast ? "inset-y-0 right-0 items-start justify-end pt-24" : "inset-0 items-center justify-center"}`}>
                    {!isToast && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleClose}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
                        />
                    )}

                    <motion.div
                        initial={isToast ? { opacity: 0, x: 50, scale: 0.9 } : { opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
                        exit={isToast ? { opacity: 0, x: 20, scale: 0.9 } : { opacity: 0, scale: 0.95, y: 20 }}
                        className={`relative w-full ${isToast ? "max-w-xs" : "max-w-md"} bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto`}
                    >
                        <div className="p-6">
                            <div className="flex flex-col items-center text-center gap-4">
                                {/* Icon */}
                                <div className={`flex-shrink-0 ${isToast ? "w-10 h-10" : "w-16 h-16"} rounded-full flex items-center justify-center border-2 ${config.iconClass}`}>
                                    <Icon className={isToast ? "w-5 h-5" : "w-8 h-8"} />
                                </div>

                                {/* Text */}
                                <div className="flex-1">
                                    <h3 className={`${isToast ? "text-lg" : "text-2xl"} font-serif font-bold text-white mb-2`}>
                                        {title}
                                    </h3>
                                    <p className="text-white/60 text-sm leading-relaxed whitespace-pre-wrap">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-center gap-4">
                            {config.showCancel && (
                                <button
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-white/50 hover:text-white transition-colors disabled:opacity-50 hover:bg-white/5 rounded-xl border border-white/5"
                                >
                                    {cancelText}
                                </button>
                            )}

                            <button
                                onClick={() => {
                                    if (onConfirm) onConfirm();
                                    else handleClose();
                                }}
                                disabled={isLoading}
                                className={`flex-1 px-4 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${config.btnClass}`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Please wait...
                                    </>
                                ) : (
                                    <>
                                        {(type === "confirm" && isDangerous) ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                        {confirmText}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
