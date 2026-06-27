"use client";

import { useState, use, useEffect } from "react";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle, Loader2, FileText } from "lucide-react";
import SpotlightCard from "@/components/ui/SpotlightCard";

export default function TaskSubmissionPage({ params }) {
    const { id } = use(params);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            if (selected.type !== "application/pdf") {
                setError("Please upload a PDF file only.");
                setFile(null);
                return;
            }
            if (selected.size > 5 * 1024 * 1024) {
                setError("File size must be under 5MB.");
                setFile(null);
                return;
            }
            setError("");
            setFile(selected);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("applicationId", id);

            const res = await fetch("/api/recruitment/task-submit", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (res.ok) {
                setSubmitted(true);
            } else {
                setError(data.error || "Submission failed");
            }
        } catch (err) {
            setError("Something went wrong during upload.");
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
                <SpotlightCard className="max-w-md w-full p-8 text-center border-white/10 bg-black/40">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mx-auto w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-8 h-8 text-teal" />
                    </motion.div>
                    <h1 className="text-2xl font-serif text-white mb-3">Task Received</h1>
                    <p className="text-sm text-white/60 mb-6">
                        Your assignment has been securely uploaded and attached to your application. Our team heads will review it shortly.
                    </p>
                    <div className="p-4 border border-teal/20 bg-teal/5 rounded-lg mb-6">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-teal/70 mb-1">Status</p>
                        <p className="font-mono text-teal">SUBMITTED</p>
                    </div>
                </SpotlightCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#060606] flex items-center justify-center p-4">
            <SpotlightCard className="max-w-lg w-full p-6 sm:p-10 border-white/10 bg-black/40">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif text-white mb-2">Submit Task</h1>
                    <p className="text-xs font-mono uppercase tracking-widest text-white/40">Application ID: {id.slice(0, 8)}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 rounded-xl border border-coral/30 bg-coral/5 text-coral/90 text-xs font-mono">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 block mb-2">Upload PDF Assignment</label>
                        <div className="relative border-2 border-dashed border-white/10 hover:border-teal/50 transition-colors rounded-2xl bg-white/[0.02] overflow-hidden group">
                            <input 
                                type="file" 
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            />
                            <div className="p-10 flex flex-col items-center justify-center text-center">
                                {file ? (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-teal/20 flex items-center justify-center mb-3">
                                            <FileText className="w-6 h-6 text-teal" />
                                        </div>
                                        <p className="text-sm font-bold text-white">{file.name}</p>
                                        <p className="text-xs text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:bg-teal/10 transition-colors">
                                            <UploadCloud className="w-6 h-6 text-white/40 group-hover:text-teal transition-colors" />
                                        </div>
                                        <p className="text-sm font-medium text-white mb-1">Click to upload or drag and drop</p>
                                        <p className="text-xs text-white/40 font-mono">PDF only (Max 5MB)</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !file}
                        className="w-full py-4 rounded-xl font-bold font-mono text-xs uppercase tracking-widest
                                   bg-white text-black hover:bg-teal hover:shadow-[0_0_20px_rgba(58,188,179,0.3)] 
                                   disabled:opacity-50 disabled:hover:bg-white disabled:hover:shadow-none transition-all
                                   flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Assignment"}
                    </button>
                </form>
            </SpotlightCard>
        </div>
    );
}
