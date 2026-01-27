"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RegistrationForm({ event }) {
    const [status, setStatus] = useState("idle"); // idle, submitting, success, error
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        collegeId: "",
        branch: "",
        year: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("submitting");

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        setStatus("success");
    };

    if (status === "success") {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md mx-auto p-8 rounded-3xl bg-black/40 backdrop-blur-xl border border-teal/20 text-center shadow-[0_0_50px_rgba(45,212,191,0.1)]"
            >
                <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-teal/50">
                    <Check className="w-10 h-10 text-teal" />
                </div>
                <h3 className="text-2xl font-serif font-bold text-white mb-2">Registration Confirmed</h3>
                <p className="text-muted mb-8">You have successfully registered for <span className="text-teal font-mono">{event.title}</span>.</p>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-sm font-mono text-left space-y-2">
                    <div className="flex justify-between">
                        <span className="text-muted">Event ID:</span>
                        <span className="text-white">{event.id}</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
        >
            <form onSubmit={handleSubmit} className="relative p-8 md:p-12 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-teal/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-teal/10 transition-colors duration-700" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 group-hover:bg-purple-500/10 transition-colors duration-700" />

                <div className="relative z-10 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-bold ml-1">Full Name</label>
                            <input
                                required
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Srinivasa Ramanujan"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-mono"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-bold ml-1">Email Address</label>
                            <input
                                required
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ramanujan@cbit.ac.in"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-mono"
                            />
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-bold ml-1">Phone Number</label>
                            <input
                                required
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+91 98765 43210"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-mono"
                            />
                        </div>

                        {/* College ID */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-bold ml-1">College ID</label>
                            <input
                                required
                                type="text"
                                name="collegeId"
                                value={formData.collegeId}
                                onChange={handleChange}
                                placeholder="160120733001"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-mono"
                            />
                        </div>

                        {/* Branch */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-bold ml-1">Branch</label>
                            <select
                                required
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-mono appearance-none"
                            >
                                <option value="" className="bg-black text-muted">Select Branch</option>
                                <option value="CSE" className="bg-black">CSE</option>
                                <option value="CSM" className="bg-black">CSM</option>
                                <option value="IT" className="bg-black">IT</option>
                                <option value="AIDS" className="bg-black">AIDS</option>
                                <option value="ECE" className="bg-black">ECE</option>
                                <option value="EEE" className="bg-black">EEE</option>
                                <option value="MECH" className="bg-black">Mechanical</option>
                                <option value="CIVIL" className="bg-black">Civil</option>
                                <option value="CHEM" className="bg-black">Chemical</option>
                                <option value="BIOTECH" className="bg-black">Biotech</option>
                            </select>
                        </div>

                        {/* Year */}
                        <div className="space-y-2">
                            <label className="text-xs uppercase tracking-widest text-muted font-bold ml-1">Year</label>
                            <select
                                required
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-mono appearance-none"
                            >
                                <option value="" className="bg-black text-muted">Select Year</option>
                                <option value="1" className="bg-black">1st Year</option>
                                <option value="2" className="bg-black">2nd Year</option>
                                <option value="3" className="bg-black">3rd Year</option>
                                <option value="4" className="bg-black">4th Year</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={status === "submitting"}
                            className="w-full relative group overflow-hidden bg-white text-black font-bold py-4 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="relative flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                                {status === "submitting" ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Processing Algorithm...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Complete Registration</span>
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </div>
                        </button>
                        <p className="text-center text-xs text-muted mt-4">
                            By registering, you agree to our terms of service and data policy.
                        </p>
                    </div>
                </div>
            </form>
        </motion.div>
    );
}
