"use client";

import { useState } from "react";
import { Loader2, ArrowRight, GraduationCap } from "lucide-react";
import { useRouter } from "next/navigation";
import { use } from "react";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const BRANCH_OPTIONS = [
    "CSE", "CSE (AI & ML)", "CSE (Data Science)", "CSE (IoT)",
    "ECE", "EEE", "Mechanical", "Civil", "IT", "Chemical", "Other"
];

export default function CompleteProfilePage({ params }) {
    const { eventId } = use(params);
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        rollNo: "",
        year: "",
        branch: "",
        college: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch(`/api/placement-series/complete-profile`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ eventId, ...form }),
            });
            const data = await res.json();

            if (res.ok) {
                router.push(`/placement-series/${eventId}`);
                router.refresh();
            } else {
                setError(data.error || "Failed to complete profile.");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isValid =
        form.name.trim().length > 1 &&
        form.rollNo.trim().length >= 5 &&
        form.year !== "" &&
        form.branch !== "" &&
        form.college.trim().length > 1;

    return (
        <div className="min-h-[100dvh] pt-24 pb-12 px-4 relative flex items-center justify-center">
            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-teal-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-20 right-20 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
                        <GraduationCap className="w-8 h-8 text-teal-400" />
                    </div>
                    <h1 className="text-3xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-emerald-400">
                        Complete Your Profile
                    </h1>
                    <p className="text-white/50 text-sm">
                        Just a few details so we can personalise your experience. This is a one-time setup.
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-white/70 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                                Full Name
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. Ravi Kumar"
                                value={form.name}
                                onChange={e => set("name", e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none transition-colors text-white placeholder-white/30"
                            />
                        </div>

                        {/* Year & Branch — side by side */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-white/70 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                                    Year
                                </label>
                                <select
                                    required
                                    value={form.year}
                                    onChange={e => set("year", e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none transition-colors text-white appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="text-white/30">Select</option>
                                    {YEAR_OPTIONS.map(y => (
                                        <option key={y} value={y} className="bg-black">{y}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-white/70 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                                    Branch
                                </label>
                                <select
                                    required
                                    value={form.branch}
                                    onChange={e => set("branch", e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none transition-colors text-white appearance-none cursor-pointer"
                                >
                                    <option value="" disabled className="text-white/30">Select</option>
                                    {BRANCH_OPTIONS.map(b => (
                                        <option key={b} value={b} className="bg-black">{b}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* College */}
                        <div>
                            <label className="block text-white/70 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                                College
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. CBIT, VJIT, MGIT…"
                                value={form.college}
                                onChange={e => set("college", e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none transition-colors text-white placeholder-white/30"
                            />
                        </div>

                        {/* Roll Number */}
                        <div>
                            <label className="block text-white/70 text-xs font-bold mb-2 ml-1 uppercase tracking-wider">
                                College Roll Number
                            </label>
                            <input
                                required
                                type="text"
                                placeholder="e.g. 160121733001"
                                value={form.rollNo}
                                onChange={e => set("rollNo", e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-teal-400/50 outline-none transition-colors uppercase font-mono tracking-wider text-white placeholder-white/30"
                            />
                        </div>

                        <button
                            disabled={isSubmitting || !isValid}
                            type="submit"
                            className="w-full mt-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Complete Profile <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
