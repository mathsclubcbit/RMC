"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X, Check, Loader2 } from "lucide-react";

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    isDangerous = false,
    isLoading = false
}) {
    // Prevent closing if loading
    const handleClose = () => {
        if (!isLoading) onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                {/* Icon */}
                                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border ${isDangerous
                                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                                        : "bg-teal/10 border-teal/20 text-teal"
                                    }`}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>

                                {/* Text */}
                                <div className="flex-1">
                                    <h3 className="text-xl font-serif font-bold text-white mb-2">
                                        {title}
                                    </h3>
                                    <p className="text-white/60 text-sm leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-end gap-3">
                            <button
                                onClick={handleClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white transition-colors disabled:opacity-50"
                            >
                                {cancelText}
                            </button>

                            <button
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isDangerous
                                        ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                                        : "bg-teal hover:bg-teal/80 text-black shadow-lg shadow-teal/20"
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {isDangerous ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
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
