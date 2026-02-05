'use client';

import { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Upload, CheckCircle, X } from 'lucide-react';
import { PremiumInput } from '../components';

/**
 * SubmissionStep - Step 3 for Hackathons/Ideathons: Abstract and PPT upload
 * @param {{ 
 *   abstract: string,
 *   setAbstract: (value: string) => void,
 *   pptFile: File | null,
 *   onPptChange: (file: File | null) => void,
 *   samplePptUrl?: string
 * }} props
 */
function SubmissionStep({ abstract, setAbstract, pptFile, onPptChange, samplePptUrl }) {
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
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            <div className="bg-teal/5 border border-teal/20 rounded-xl p-4 sm:p-6 mb-6">
                <h4 className="flex items-center gap-2 text-teal font-bold uppercase tracking-wider text-xs mb-3">
                    <Sparkles className="w-4 h-4" /> Submission Requirements
                </h4>
                <p className="text-white/60 text-xs sm:text-sm leading-relaxed">
                    Please provide a brief abstract of your idea and upload your presentation. This helps us evaluate your project before the event.
                </p>
            </div>

            <PremiumInput
                as="textarea"
                label="Project Abstract"
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                className="min-h-[150px] resize-none"
                placeholder="Describe your project idea in 100-200 words..."
            />

            <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-mono ml-1">
                        Presentation Upload
                    </label>
                    <a
                        href={samplePptUrl || "/sample-presentation.pptx"}
                        download={!samplePptUrl}
                        target={samplePptUrl ? "_blank" : "_self"}
                        rel={samplePptUrl ? "noopener noreferrer" : ""}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-teal hover:text-teal/80 transition-colors group"
                    >
                        <FileText className="w-3 h-3 group-hover:scale-110 transition-transform" />
                        <span className="border-b border-teal/30 group-hover:border-teal transition-colors">
                            Download Sample PPT
                        </span>
                    </a>
                </div>

                <div className="relative group">
                    <input
                        type="file"
                        ref={pptInputRef}
                        onChange={handlePptChange}
                        className="hidden"
                        accept=".ppt,.pptx,.pdf,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    />
                    <button
                        type="button"
                        onClick={() => pptInputRef.current?.click()}
                        className={`w-full py-10 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden group/btn ${pptFile
                                ? 'border-teal bg-teal/5'
                                : 'border-white/10 hover:border-teal/30 hover:bg-white/[0.03]'
                            }`}
                    >
                        {/* Glow Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-teal/0 via-teal/0 to-teal/5 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" />

                        {pptFile ? (
                            <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                                <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                                    <CheckCircle className="w-6 h-6 text-teal" />
                                </div>
                                <span className="text-teal text-sm font-bold font-mono px-4 text-center truncate w-full max-w-[250px]">
                                    {pptFile.name}
                                </span>
                                <span className="text-[10px] text-teal/50 mt-1 uppercase tracking-widest">
                                    Ready for Submission
                                </span>
                            </div>
                        ) : (
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover/btn:scale-110 group-hover/btn:bg-teal/10 transition-all duration-300">
                                    <Upload className="w-6 h-6 text-white/30 group-hover/btn:text-teal transition-colors" />
                                </div>
                                <span className="text-white/60 text-sm font-medium group-hover/btn:text-white transition-colors">
                                    Upload Presentation
                                </span>
                                <span className="text-[10px] text-white/30 mt-1 font-mono">
                                    PPT / PPTX / PDF • Max 10MB
                                </span>
                            </div>
                        )}
                    </button>
                    {pptFile && (
                        <button
                            type="button"
                            onClick={clearPpt}
                            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/40 text-white/30 hover:text-red-400 hover:bg-black/60 transition-colors backdrop-blur-sm border border-white/5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

export default memo(SubmissionStep);
