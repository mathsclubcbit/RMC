'use client';

import { memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Upload, CheckCircle, X } from 'lucide-react';
import { PremiumInput } from '../components';

/**
 * PaymentStep - Step 4: Payment details with QR code
 * @param {{
 *   utrId: string,
 *   onUtrChange: (value: string) => void,
 *   screenshot: File | null,
 *   onScreenshotChange: (file: File | null) => void,
 *   amountToPay: string | number,
 *   currentTeamSize: string | number,
 *   variablePricingEnabled: boolean,
 *   hasPricingTierForCurrentTeamSize: boolean,
 *   qrImageSrc: string
 * }} props
 */
function PaymentStep({
    utrId,
    onUtrChange,
    screenshot,
    onScreenshotChange,
    amountToPay,
    currentTeamSize,
    variablePricingEnabled,
    hasPricingTierForCurrentTeamSize,
    qrImageSrc
}) {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onScreenshotChange(file);
        }
    };

    const clearFile = (e) => {
        e.stopPropagation();
        onScreenshotChange(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            {/* Price Display */}
            <div className="bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-teal/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.2em] mb-2 font-mono">Total Amount</p>
                    <div className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight flex items-center justify-center gap-1">
                        <span className="text-teal text-2xl font-sans font-normal">₹</span>
                        {amountToPay}
                    </div>
                </div>
            </div>

            {/* QR Scanner effect */}
            <div className="flex flex-col items-center justify-center py-6 relative">
                <div className="relative p-4 bg-white/[0.02] border border-white/10 rounded-2xl md:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] group overflow-hidden">
                    <img
                        src={qrImageSrc}
                        alt="Payment QR"
                        className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-lg relative z-10 mix-blend-plus-lighter"
                    />

                    {/* Animated Scan Line */}
                    <motion.div
                        animate={{ top: ['0%', '100%', '0%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-1 bg-teal/50 shadow-[0_0_15px_rgba(45,212,191,0.5)] z-20 pointer-events-none"
                    />

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal/5 to-transparent z-0 opacity-50" />
                </div>

                <p className="mt-6 text-white/50 text-xs font-mono uppercase tracking-widest text-center flex items-center gap-2">
                    <Shield className="w-3 h-3 text-teal" />
                    Secure Payment Gateway
                </p>
            </div>

            {/* Payment Details Form */}
            <div className="space-y-6 pt-4 border-t border-white/10">
                <PremiumInput
                    label="Transaction / UTR ID"
                    variant="centered"
                    placeholder="XXXXXXXXXXXX"
                    value={utrId}
                    onChange={(e) => onUtrChange(e.target.value)}
                    className="placeholder:text-center text-lg md:text-xl font-bold tracking-widest text-teal"
                />

                <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1 block">
                        Payment Screenshot
                    </label>
                    <div className="relative group">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full py-6 border border-dashed rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${screenshot
                                    ? 'bg-teal/5 border-teal/50'
                                    : 'bg-white/[0.02] border-white/20 hover:border-teal/30 hover:bg-white/[0.04]'
                                }`}
                        >
                            {screenshot ? (
                                <>
                                    <CheckCircle className="w-5 h-5 text-teal" />
                                    <span className="text-teal text-xs font-bold font-mono uppercase tracking-wider truncate max-w-[200px]">
                                        {screenshot.name}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 text-white/40 group-hover:text-teal transition-colors" />
                                    <span className="text-white/40 text-xs font-mono uppercase tracking-wider group-hover:text-white transition-colors">
                                        Upload Proof
                                    </span>
                                </>
                            )}
                        </button>
                        {screenshot && (
                            <button
                                type="button"
                                onClick={clearFile}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-red-400/20 text-white/20 hover:text-red-400 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default memo(PaymentStep);
