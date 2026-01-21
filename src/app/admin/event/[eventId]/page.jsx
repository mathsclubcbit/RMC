"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Upload, User, Search, Download, LogOut } from "lucide-react";
import { upcomingEvents } from "@/data/upcomingEvents";
import MathBackground from "@/components/ui/MathBackground";

export default function EventAdminPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId;

    // Find Event
    const event = upcomingEvents.find(e => e.id == eventId);

    const [formData, setFormData] = useState(event || {});
    const [mockRegistrants, setMockRegistrants] = useState([
        { id: 1, name: "Srinivasa Ramanujan", roll: "160122733001", branch: "CSE", year: "3", email: "ramanujan@example.com" },
        { id: 2, name: "Alan Turing", roll: "160122733002", branch: "AI & DS", year: "2", email: "turing@example.com" },
        { id: 3, name: "Ada Lovelace", roll: "160122733003", branch: "IT", year: "4", email: "ada@example.com" },
        { id: 4, name: "John Nash", roll: "160122733004", branch: "Math", year: "1", email: "nash@example.com" },
    ]);

    // Auth Check
    useEffect(() => {
        const auth = sessionStorage.getItem("admin-auth");
        if (!auth) {
            router.push("/admin/login");
            return;
        }

        // If Main Admin, allow access.
        if (auth === "main") return;

        // If Event Admin, check if authorized for THIS event
        if (!event) {
            router.push("/admin/dashboard");
        }

    }, [router, event]);

    const handleSave = (e) => {
        e.preventDefault();
        alert("Changes Saved Successfully");
    };

    const handleLogout = () => {
        sessionStorage.removeItem("admin-auth");
        router.push("/admin/login");
    };

    if (!event) return <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono animate-pulse">Loading Event Data...</div>;

    return (
        <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
            <MathBackground />
            <div className="fixed inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black pointer-events-none z-0" />

            {/* Nav */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-30 relative">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-serif font-bold text-sm md:text-lg leading-none text-white">{formData.title}</h1>
                            <span className="text-[8px] md:text-[10px] text-teal/70 font-mono uppercase tracking-[0.2em]">Event Management</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] md:text-xs text-white/40 hover:text-red-400 transition-colors uppercase tracking-widest font-mono">
                        <LogOut className="w-3 h-3" /> <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
                {/* Left Column: Event Settings */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-teal/10 blur-2xl rounded-full pointer-events-none" />
                        <h2 className="text-xl font-serif font-bold mb-6 text-white flex items-center gap-2">
                            <div className="w-1 h-6 bg-teal rounded-full" />
                            Event Settings
                        </h2>
                        <form onSubmit={handleSave} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Event Name</label>
                                <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white transition-colors" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Date</label>
                                <input type="text" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white transition-colors" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Status</label>
                                <select className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option className="bg-black">Registration Open</option>
                                    <option className="bg-black">Closed</option>
                                    <option className="bg-black">Upcoming</option>
                                    <option className="bg-black">Completed</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Description</label>
                                <textarea className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none min-h-[150px] text-white transition-colors" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <button type="submit" className="w-full py-4 bg-teal/10 hover:bg-teal text-teal hover:text-black border border-teal/50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(45,212,191,0.2)]">
                                <Save className="w-4 h-4" /> Save Settings
                            </button>
                        </form>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h2 className="text-xl font-serif font-bold mb-6 text-white flex items-center gap-2">
                            <div className="w-1 h-6 bg-purple-500 rounded-full" />
                            Event Poster
                        </h2>
                        <div className="aspect-video bg-black/50 rounded-xl mb-4 border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                            <div className="absolute inset-0 bg-teal/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Upload className="w-8 h-8 text-teal" />
                            </div>
                            <img src={formData.img || '/noise.png'} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <button className="w-full py-3 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-widest">
                            <Upload className="w-4 h-4" /> Upload New Poster
                        </button>
                    </div>
                </div>

                {/* Right Column: Registrations */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col h-full min-h-[500px]">
                        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/[0.02]">
                            <div className="text-center md:text-left">
                                <h2 className="text-xl font-serif font-bold text-white">Registrations</h2>
                                <p className="text-[10px] text-teal/70 font-mono mt-1 uppercase tracking-widest">{mockRegistrants.length} Total Registered</p>
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:flex-none">
                                    <Search className="absolute left-3 top-2.5 w-3 h-3 text-white/30" />
                                    <input type="text" placeholder="Search..." className="bg-black/40 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:border-teal/30 outline-none w-full md:w-48" />
                                </div>
                                <button className="px-4 py-2 bg-white/5 hover:bg-teal/20 hover:text-teal border border-white/10 hover:border-teal/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all">
                                    <Download className="w-3 h-3" /> <span className="hidden md:inline">Export CSV</span><span className="md:hidden">Export</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="text-[10px] text-white/30 uppercase font-mono tracking-widest bg-black/20">
                                    <tr>
                                        <th className="px-6 py-4 font-normal">Student Name</th>
                                        <th className="px-6 py-4 font-normal">Roll Number</th>
                                        <th className="px-6 py-4 font-normal">Branch</th>
                                        <th className="px-6 py-4 font-normal">Email Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {mockRegistrants.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-teal text-xs font-bold group-hover:border-teal/50 transition-colors">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-white/90 block font-serif tracking-wide">{user.name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-teal/70 font-mono tracking-wider">{user.roll}</td>
                                            <td className="px-6 py-4 text-xs text-white/60">
                                                {user.branch} <span className="text-white/20 ml-1">Yr {user.year}</span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-white/40 font-mono">{user.email}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination Mock */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-center gap-2 bg-black/20">
                            <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-white/50 hover:text-white transition-colors">1</button>
                            <button className="w-8 h-8 rounded-lg bg-teal/10 border border-teal/30 text-teal flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(45,212,191,0.1)]">2</button>
                            <button className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs text-white/50 hover:text-white transition-colors">3</button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
