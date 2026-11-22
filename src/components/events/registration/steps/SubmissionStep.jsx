'use client';

import { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Upload, CheckCircle, X, Info } from 'lucide-react';
import { PremiumInput } from '../components';

/**
 * @param {{ 
 *   abstract: string,
 *   setAbstract: (value: string) => void,
 *   pptFile: File | null,
 *   onPptChange: (file: File | null) => void,
 *   samplePptUrl?: string,
 *   sampleAbstractUrl?: string,
 *   isIdeathon?: boolean
 * }} props
 */
function SubmissionStep({ abstract, setAbstract, pptFile, onPptChange, samplePptUrl, sampleAbstractUrl, isIdeathon = false }) {
    const pptInputRef = useRef(null);

    const handlePptChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            onPptChange(file);
        }
    };

    const clearPpt = (e) => {
        e.stopPropagation();
        onPptChange(null);
        if (pptInputRef.current) {
            pptInputRef.current.value = '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            {/* Info Box */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 flex gap-4">
                <Info className="w-5 h-5 text-zinc-400 shrink-0" />
                <div className="space-y-1">
                    <h4 className="text-sm font-medium text-zinc-200">Submission Requirements</h4>
                    <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
                        {isIdeathon
                            ? "Please provide a structured abstract and document upload for preliminary protocol evaluation."
                            : "Initialize abstract data and presentation upload to complete your project dossier."
                        }
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    {isIdeathon && sampleAbstractUrl && (
                        <a
                            href={sampleAbstractUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 px-4 border border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Abstract Reference</span>
                        </a>
                    )}
                    {samplePptUrl && (
                        <a
                            href={samplePptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-3 px-4 border border-zinc-800 hover:bg-zinc-900 text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-2 uppercase tracking-wide"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Format Specification</span>
                        </a>
                    )}
                </div>

                {/* Upload Zone */}
                <div className="relative">
                    <input
                        type="file"
                        ref={pptInputRef}
                        onChange={handlePptChange}
                        className="hidden"
                        accept=".ppt,.pptx,.pdf,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    />

                    {pptFile ? (
                        <div className="w-full p-6 border border-zinc-700 bg-zinc-900/40 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white text-black flex items-center justify-center">
                                    <CheckCircle className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm text-white font-medium">{pptFile.name}</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">Ready for upload</div>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={clearPpt}
                                className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => pptInputRef.current?.click()}
                            className="w-full py-12 border-2 border-dashed border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/30 transition-all flex flex-col items-center justify-center gap-3 group"
                        >
                            <div className="p-3 bg-zinc-900 rounded-full group-hover:bg-zinc-800 transition-colors">
                                <Upload className="w-5 h-5 text-zinc-400" />
                            </div>
                            <span className="text-sm text-zinc-300 font-medium">
                                {isIdeathon ? "Upload Abstract" : "Upload Presentation"}
                            </span>
                            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
                                {isIdeathon ? "PDF / DOCX • MAX 10MB" : "PPTX / PDF • MAX 10MB"}
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default memo(SubmissionStep);
