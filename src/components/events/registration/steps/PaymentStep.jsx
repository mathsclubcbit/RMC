'use client';

import { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, X, Upload, CreditCard } from 'lucide-react';
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
            className="space-y-10"
        >
            {/* Amount */}
            <div className="bg-zinc-900/30 border border-zinc-800 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CreditCard className="w-24 h-24" />
                </div>
                <div className="relative z-10 text-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-3 font-medium">Total Amount Payable</div>
                    <div className="text-5xl md:text-6xl font-mono font-medium text-white tracking-tighter">
                        ₹{amountToPay}
                    </div>
                </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-6">
                <div className="p-3 bg-white rounded-none border border-zinc-200 shadow-xl shadow-white/5 relative group">
                    <img src={qrImageSrc} alt="Payment QR Code" className="w-48 h-48 md:w-56 md:h-56 object-contain" />
                    
                    {/* Corner accents for the QR frame */}
                    <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-zinc-900" />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-zinc-900" />
                </div>
                <div className="text-xs text-zinc-500 font-mono text-center max-w-xs leading-relaxed">
                    Scan using any UPI app. Verify the merchant name before proceeding.
                </div>
            </div>

            {/* Payment Details Form */}
            <div className="space-y-8 pt-8 border-t border-zinc-900">
                <PremiumInput
                    label="UTR / Transaction ID"
                    placeholder="xxxxxxxxxxxx"
                    value={utrId}
                    onChange={(e) => onUtrChange(e.target.value)}
                    variant="default"
                    className="font-mono tracking-widest text-lg"
                    maxLength={12}
                />

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-white/40 rounded-full" />
                        <label className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500">
                            Payment Screenshot
                        </label>
                    </div>
                    
                    <div className="relative group/proof">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        
                        {screenshot ? (
                            <div className="w-full p-4 border border-zinc-700 bg-zinc-900/40 flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                                        <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="text-sm text-white font-medium truncate max-w-[150px] sm:max-w-xs">{screenshot.name}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase tracking-wider mt-0.5">Uploaded Successfully</div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="p-3 text-zinc-500 hover:text-red-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-10 border border-zinc-800 bg-black hover:bg-zinc-900 hover:border-zinc-600 transition-all flex flex-col items-center justify-center gap-3 group"
                            >
                                <div className="p-3 bg-zinc-900 rounded-full group-hover:bg-zinc-800 transition-colors">
                                    <Upload className="w-5 h-5 text-zinc-400" />
                                </div>
                                <span className="text-xs text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">
                                    Click to Upload Proof
                                </span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

export default memo(PaymentStep);
