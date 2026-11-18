"use client";

import { useState } from "react";
import MathBackground from "@/components/ui/MathBackground";
import SectionTitle from "@/components/ui/SectionTitle";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { Mail, MapPin, Send, Instagram, Linkedin, Globe, Radio } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactPage() {
    const [formState, setFormState] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate transmission
        setTimeout(() => {
            setIsSubmitting(false);
            setIsSent(true);
            setFormState({ name: "", email: "", subject: "", message: "" });
        }, 1500);
    };

    const contactInfo = [
        {
            icon: Mail,
            label: "Quantum Link",
            value: "rmc_cbit@gmail.com",
            href: "mailto:rmc_cbit@gmail.com",
            color: "teal"
        },
        {
            icon: MapPin,
            label: "Coordinates",
            value: "CBIT, Gandipet Only, Hyderabad",
            href: "https://goo.gl/maps/xyz",
            color: "lime"
        },
        {
            icon: Globe,
            label: "Digital Frequency",
            value: "www.rmccbit.com",
            href: "https://www.rmccbit.com",
            color: "coral"
        }
    ];

    return (
        <div className="relative min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
            <MathBackground />

            <div className="max-w-7xl mx-auto relative z-10">
                <SectionTitle
                    title="Establish Connection"
                    subtitle="Transmit your signals to the Council."
                    center={true}
                />

                <div className="grid lg:grid-cols-2 gap-12 mt-12 items-start">
                    {/* Transmission Form */}
                    <div className="order-2 lg:order-1">
                        <SpotlightCard className="bg-black/40 border border-white/10 p-8 rounded-3xl backdrop-blur-md">
                            <div className="flex items-center gap-3 mb-8 border-b border-white/10 pb-6">
                                <Radio className="w-5 h-5 text-teal animate-pulse" />
                                <span className="font-mono text-xs uppercase tracking-widest text-teal">
                                    Transmission_Protocol_v3.0
                                </span>
                            </div>

                            {isSent ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-20"
                                >
                                    <div className="w-20 h-20 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6 text-teal border border-teal/30">
                                        <Send className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-bold font-serif text-white mb-2">Signal Received</h3>
                                    <p className="text-muted text-sm">Our operatives will decode your message shortly.</p>
                                    <button
                                        onClick={() => setIsSent(false)}
                                        className="mt-8 text-teal text-xs font-mono uppercase hover:underline"
                                    >
                                        Send New Transmission
                                    </button>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-mono text-muted uppercase tracking-wider ml-1">Identity</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-sans"
                                                placeholder="Name"
                                                value={formState.name}
                                                onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-mono text-muted uppercase tracking-wider ml-1">Frequency</label>
                                            <input
                                                type="email"
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-sans"
                                                placeholder="Email Address"
                                                value={formState.email}
                                                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-muted uppercase tracking-wider ml-1">Variable of Interest</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-sans"
                                            placeholder="Subject"
                                            value={formState.subject}
                                            onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-muted uppercase tracking-wider ml-1">Encrypted Data</label>
                                        <textarea
                                            required
                                            rows={5}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-teal/50 focus:ring-1 focus:ring-teal/50 transition-all font-sans resize-none"
                                            placeholder="Type your message..."
                                            value={formState.message}
                                            onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full btn btn-primary py-4 rounded-xl flex items-center justify-center gap-2 group relative overflow-hidden"
                                    >
                                        {isSubmitting ? (
                                            <span className="font-mono animate-pulse">TRANSMITTING...</span>
                                        ) : (
                                            <>
                                                <span className="font-bold tracking-wide">INITIATE UPLINK</span>
                                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                            </>
                                        )}
                                        {/* Scanline effect */}
                                        <div className="absolute inset-0 bg-white/10 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
                                    </button>
                                </form>
                            )}
                        </SpotlightCard>
                    </div>

                    {/* Contact Info */}
                    <div className="order-1 lg:order-2 space-y-8">
                        <div className="prose prose-invert">
                            <h3 className="text-3xl font-serif font-bold mb-4">
                                Reach Out to the <span className="text-gradient">Unknown.</span>
                            </h3>
                            <p className="text-muted leading-relaxed font-light">
                                Whether you have a complex equation to solve, a collaboration proposal, or just want to discuss the nature of infinity, the RMC Council is listening.
                            </p>
                        </div>

                        <div className="grid gap-4">
                            {contactInfo.map((info, index) => (
                                <SpotlightCard
                                    key={index}
                                    className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 group hover:bg-white/10 transition-colors"
                                >
                                    <div className={`w-12 h-12 rounded-full bg-${info.color}/10 flex items-center justify-center text-${info.color} group-hover:scale-110 transition-transform`}>
                                        <info.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-mono uppercase tracking-widest text-muted mb-1">{info.label}</h4>
                                        <a href={info.href} className="text-white font-medium hover:text-teal transition-colors font-sans text-lg">
                                            {info.value}
                                        </a>
                                    </div>
                                </SpotlightCard>
                            ))}
                        </div>

                        {/* Social Links */}
                        <div className="pt-8 border-t border-white/10">
                            <h4 className="text-xs font-mono uppercase tracking-widest text-muted mb-6">Social Frequencies</h4>
                            <div className="flex gap-4">
                                {[
                                    { icon: Instagram, href: "#" },
                                    { icon: Linkedin, href: "#" },
                                    { icon: Globe, href: "#" }
                                ].map((social, i) => (
                                    <a
                                        key={i}
                                        href={social.href}
                                        className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white hover:text-black hover:border-white transition-all duration-300"
                                    >
                                        <social.icon className="w-5 h-5" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
