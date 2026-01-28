"use client";

import SectionTitle from "@/components/ui/SectionTitle";
import PageHeader from "@/components/ui/PageHeader";
import SectionDivider from "@/components/ui/SectionDivider";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { useState } from "react";
import { ChevronRight, Terminal, User, Mail, Phone, Hash, BookOpen } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

export default function JoinPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        rollNumber: "",
        branch: "",
        year: "",
        phone: "",
        interests: [],
        whyJoin: "",
    });
    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "success"
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setModal({
            isOpen: true,
            title: "Transmission Received",
            message: "Protocol initiated. Standing by for administrative verification. You will receive an update via your comms channel shortly.",
            type: "success"
        });
        setFormData({
            name: "",
            email: "",
            rollNumber: "",
            branch: "",
            year: "",
            phone: "",
            interests: [],
            whyJoin: "",
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === "checkbox") {
            if (checked) {
                setFormData({ ...formData, interests: [...formData.interests, value] });
            } else {
                setFormData({
                    ...formData,
                    interests: formData.interests.filter((i) => i !== value),
                });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const benefits = [
        { icon: "🎯", title: "Priority Access", description: "First vector to workshops and competitions" },
        { icon: "🏆", title: "Competitive Edge", description: "Represent CBIT in inter-college math events" },
        { icon: "📚", title: "Classified Data", description: "Access exclusive study materials and problem sets" },
        { icon: "🤝", title: "Network", description: "Connect with like-minded math enthusiasts" },
    ];

    return (
        <div className="relative min-h-screen">

            <PageHeader
                title="INITIATION"
                subtitle="Begin your sequence. Enter the coordinates to join the collective."
            />

            {/* Benefits */}
            <section className="py-10 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <SectionDivider type="axiom" text="Member Privileges" />
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
                        {benefits.map((benefit, index) => (
                            <SpotlightCard
                                key={index}
                                className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center group hover:bg-white/10 transition-colors"
                            >
                                <div className="text-4xl mb-4 grayscale group-hover:grayscale-0 transition-all">{benefit.icon}</div>
                                <h3 className="font-[family-name:var(--font-cinzel)] font-bold text-lg text-white mb-2">{benefit.title}</h3>
                                <p className="text-white/50 text-xs font-mono uppercase tracking-widest">{benefit.description}</p>
                            </SpotlightCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* Registration Form */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="relative p-1 rounded-[2.5rem] bg-gradient-to-b from-white/10 to-transparent">
                        <div className="bg-[#020617] rounded-[2.4rem] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal to-transparent opacity-50" />

                            <div className="mb-10 text-center">
                                <SectionTitle
                                    title="Transmission Interface"
                                    subtitle="Input required parameters"
                                    center={true}
                                />
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-3">
                                            <User className="w-3 h-3" /> Agent Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-3">
                                            <Hash className="w-3 h-3" /> ID Sequence
                                        </label>
                                        <input
                                            type="text"
                                            name="rollNumber"
                                            value={formData.rollNumber}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif"
                                            placeholder="Roll Number"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-3">
                                            <Mail className="w-3 h-3" /> Comms Channel
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif"
                                            placeholder="Email Address"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-3">
                                            <Phone className="w-3 h-3" /> Signal Verify
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-8">
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-3">
                                            <Terminal className="w-3 h-3" /> Branch
                                        </label>
                                        <select
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif appearance-none"
                                        >
                                            <option value="" className="bg-black">Select Department</option>
                                            <option value="CSE" className="bg-black">Computer Science & Engineering</option>
                                            <option value="ECE" className="bg-black">Electronics & Communication</option>
                                            <option value="EEE" className="bg-black">Electrical & Electronics</option>
                                            <option value="IT" className="bg-black">Information Technology</option>
                                            <option value="MECH" className="bg-black">Mechanical Engineering</option>
                                            <option value="CIVIL" className="bg-black">Civil Engineering</option>
                                            <option value="AI-ML" className="bg-black">AI & Machine Learning</option>
                                            <option value="AIDS" className="bg-black">AI & Data Science</option>
                                        </select>
                                    </div>
                                    <div className="group">
                                        <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-3">
                                            <BookOpen className="w-3 h-3" /> Academic Year
                                        </label>
                                        <select
                                            name="year"
                                            value={formData.year}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif appearance-none"
                                        >
                                            <option value="" className="bg-black">Select Level</option>
                                            <option value="1" className="bg-black">Year 1 (Initiate)</option>
                                            <option value="2" className="bg-black">Year 2 (Associate)</option>
                                            <option value="3" className="bg-black">Year 3 (Fellow)</option>
                                            <option value="4" className="bg-black">Year 4 (Senior Fellow)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-4">
                                        Areas of Research Interest
                                    </label>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {[
                                            "Number Theory",
                                            "Algebra",
                                            "Geometry",
                                            "Calculus",
                                            "Probability & Statistics",
                                            "Cryptography",
                                            "Competitive Math",
                                            "Applied Mathematics",
                                        ].map((interest) => (
                                            <label key={interest} className="flex items-center gap-3 cursor-pointer group/item">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        name="interests"
                                                        value={interest}
                                                        checked={formData.interests.includes(interest)}
                                                        onChange={handleChange}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="w-4 h-4 border border-white/20 rounded-sm peer-checked:bg-teal peer-checked:border-teal transition-all" />
                                                </div>
                                                <span className="text-white/60 text-sm font-serif group-hover/item:text-white transition-colors">{interest}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-teal mb-3">
                                        Statement of Purpose
                                    </label>
                                    <textarea
                                        name="whyJoin"
                                        value={formData.whyJoin}
                                        onChange={handleChange}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif resize-none"
                                        placeholder="Enter your motivation..."
                                    />
                                </div>

                                <div className="p-4 border border-teal/20 bg-teal/5 rounded-lg">
                                    <p className="text-teal/80 text-xs font-mono text-center">
                                        ℹ NOTE: Annual subscription required upon approval (₹100).
                                    </p>
                                </div>

                                <button type="submit" className="w-full group bg-white text-black py-4 rounded-lg font-bold font-mono tracking-widest uppercase hover:bg-teal hover:text-white transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.5)] flex items-center justify-center gap-2">
                                    Initiate Protocol <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText="Acknowledge"
                isToast={true}
                duration={4000}
            />
        </div>
    );
}
