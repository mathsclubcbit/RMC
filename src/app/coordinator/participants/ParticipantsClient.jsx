"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Search,
    Filter,
    User,
    Mail,
    Hash,
    ChevronDown,
    ExternalLink,
    X,
    Eye,
    RefreshCw,
    Loader2,
    AlertCircle
} from "lucide-react";

export default function ParticipantsClient({ event }) {
    const [participants, setParticipants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedParticipant, setSelectedParticipant] = useState(null);

    const fetchParticipants = async (showRefresh = false) => {
        if (showRefresh) setIsRefreshing(true);
        try {
            const res = await fetch('/api/coordinator/participants');
            if (!res.ok) throw new Error('Failed to fetch participant data');
            const data = await res.json();
            setParticipants(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchParticipants();
    }, []);

    // Filtering logic
    const filteredParticipants = useMemo(() => {
        return participants.filter(p => {
            const matchesSearch =
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.registrationId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.rollNo?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                p.status?.toUpperCase() === statusFilter.toUpperCase();

            return matchesSearch && matchesStatus;
        });
    }, [participants, searchQuery, statusFilter]);

    // Statistics
    const stats = useMemo(() => {
        const total = filteredParticipants.length;
        const confirmed = filteredParticipants.filter(p => ["CONFIRMED", "SUCCESS", "ATTENDED"].includes(p.status?.toUpperCase())).length;
        const pending = filteredParticipants.filter(p => p.status?.toUpperCase() === "PENDING").length;
        return { total, confirmed, pending };
    }, [filteredParticipants]);

    const getStatusStyles = (status) => {
        const s = status?.toUpperCase();
        if (s === "ATTENDED" || s === "SUCCESS" || s === "CONFIRMED")
            return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
        if (s === "PENDING")
            return "bg-amber-500/10 text-amber-400 border-amber-500/20";
        return "bg-white/5 text-white/40 border-white/10";
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <div className="text-white/40 font-mono text-xs uppercase tracking-widest">Hydrating participant data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
                <AlertCircle className="w-12 h-12 text-red-500/50" />
                <div className="space-y-1">
                    <h3 className="text-lg font-bold">Data Access Interrupted</h3>
                    <p className="text-sm text-white/40 max-w-xs mx-auto">{error}</p>
                </div>
                <button
                    onClick={() => { setIsLoading(true); fetchParticipants(); }}
                    className="mt-4 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                    Retry Protocol
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 backdrop-blur-md mb-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.9)]" />
                        Attendee Records
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                        Participants
                        <span className="text-blue-400">.</span>
                    </h1>
                    <p className="text-white/50 text-sm mt-1 max-w-md">
                        Managing registrations for <span className="text-white font-semibold">{event.title}</span>
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchParticipants(true)}
                        disabled={isRefreshing}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                        title="Force Refresh Data"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total</div>
                        <div className="text-xl font-bold font-mono">{stats.total}</div>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center text-emerald-400">
                        <div className="text-[10px] uppercase tracking-widest text-emerald-500/40 mb-1">Confirmed</div>
                        <div className="text-xl font-bold font-mono">{stats.confirmed}</div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-blue-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search name, email, roll no, or ticket code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-400/50 focus:bg-white/[0.05] transition-all text-sm"
                    />
                </div>
                <div className="md:col-span-4 relative">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-400/50 transition-all text-sm appearance-none cursor-pointer"
                    >
                        <option value="all">All Registrations</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="attended">Attended</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                </div>
            </div>

            {/* Table Area */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-mono text-white/40 uppercase tracking-widest">
                                <th className="px-6 py-4 font-medium">Participant</th>
                                <th className="px-6 py-4 font-medium">Ticket ID</th>
                                <th className="px-6 py-4 font-medium">Details</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredParticipants.length > 0 ? (
                                filteredParticipants.map((p) => (
                                    <tr key={p.registrationId} className="group hover:bg-white/[0.03] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all">
                                                    <User className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white/90 group-hover:text-white">{p.name}</div>
                                                    <div className="text-xs text-white/40 flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {p.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 font-mono text-xs text-blue-400/80">
                                                <Hash className="w-3 h-3" />
                                                {p.registrationId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-0.5">
                                                <div className="text-[10px] text-white/30 uppercase tracking-wider">{p.department}</div>
                                                <div className="text-xs text-white/60">{p.rollNo}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyles(p.status)}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedParticipant(p)}
                                                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                                title="View Details"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <AlertCircle className="w-10 h-10" />
                                            <div className="text-sm font-medium">No registrations found</div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedParticipant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedParticipant(null)} />
                    <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-lg font-bold">Participant Details</h3>
                            <button onClick={() => setSelectedParticipant(null)} className="p-2 hover:bg-white/5 rounded-full transition">
                                <X className="w-5 h-5 text-white/40" />
                            </button>
                        </div>
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto max-h-[80vh] custom-scrollbar">
                            <div className="space-y-6">
                                <section>
                                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Basic Information</div>
                                    <div className="space-y-3">
                                        <DetailItem label="Full Name" value={selectedParticipant.name} />
                                        <DetailItem label="Email Address" value={selectedParticipant.email} />
                                        <DetailItem label="Phone Number" value={selectedParticipant.phone || "N/A"} />
                                        <DetailItem label="Roll Number" value={selectedParticipant.rollNo} />
                                        <DetailItem label="Department" value={selectedParticipant.department} />
                                    </div>
                                </section>

                                <section>
                                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Event Record</div>
                                    <div className="space-y-3">
                                        <DetailItem label="Ticket Code" value={selectedParticipant.registrationId} isMono />
                                        <DetailItem label="Status" value={selectedParticipant.status} />
                                        <DetailItem label="Registered On" value={selectedParticipant.timestamp} />
                                        {selectedParticipant.checkedInAt && (
                                            <DetailItem label="Checked In At" value={selectedParticipant.checkedInAt} />
                                        )}
                                    </div>
                                </section>
                            </div>

                            <div className="space-y-6">
                                <section>
                                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Technical/Team Info</div>
                                    <div className="space-y-3">
                                        <DetailItem label="Team Members" value={selectedParticipant.teamMembers || "Solo"} />
                                        {selectedParticipant.abstract && (
                                            <DetailItem label="Abstract" value={selectedParticipant.abstract} />
                                        )}
                                        {selectedParticipant.pptLink && (
                                            <div className="space-y-1">
                                                <div className="text-xs text-white/40">Presentation Link</div>
                                                <a href={selectedParticipant.pptLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2">
                                                    Open PPT <ExternalLink className="w-3 h-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section>
                                    <div className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Payment Verification</div>
                                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                        <DetailItem label="UTR ID" value={selectedParticipant.utrId} isMono />
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-white/40">Amount Paid</span>
                                            <span className="text-sm font-mono text-emerald-400 underline decoration-emerald-500/30 underline-offset-4">₹{selectedParticipant.amount}</span>
                                        </div>
                                        {selectedParticipant.driveViewUrl && (
                                            <a
                                                href={selectedParticipant.driveViewUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-4 block w-full py-2.5 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider text-center hover:bg-blue-500/20 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                View Payment Screenshot
                                            </a>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetailItem({ label, value, isMono }) {
    return (
        <div className="space-y-1">
            <div className="text-xs text-white/40">{label}</div>
            <div className={`text-sm ${isMono ? 'font-mono text-blue-300' : 'text-white/80'}`}>
                {value || "Not provided"}
            </div>
        </div>
    );
}

function ImageIcon({ className }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    );
}
