"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    ArrowLeft, Save, Upload, Search, Download, LogOut,
    Users, TrendingUp, Clock, CheckCircle2, XCircle, AlertCircle,
    BarChart3, RefreshCw, ExternalLink, Eye, QrCode, X
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from "recharts";
import MathBackground from "@/components/ui/MathBackground";
import { format, parseISO } from "date-fns";

const CHART_COLORS = ["#3ABCB3", "#AFF44A", "#E36951", "#E8B237", "#A855F7"];

export default function EventAdminPage() {
    const params = useParams();
    const router = useRouter();
    const eventId = params.eventId;

    const [event, setEvent] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [analyticsData, setAnalyticsData] = useState(null);
    const [registrations, setRegistrations] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [processingId, setProcessingId] = useState(null);
    const [teamModalData, setTeamModalData] = useState(null); // For viewing team members

    // Auth Check
    useEffect(() => {
        const auth = sessionStorage.getItem("admin-auth");
        if (!auth) {
            router.push("/admin/login");
            return;
        }
    }, [router]);

    // Fetch event and analytics data
    const fetchData = useCallback(async () => {
        try {
            // Fetch event details
            const eventsRes = await fetch('/api/events');
            const events = await eventsRes.json();
            const foundEvent = events.find(e => e.id === eventId);

            if (foundEvent) {
                setEvent(foundEvent);
                setFormData(foundEvent);
            }

            // Fetch analytics
            const analyticsRes = await fetch(`/api/analytics/event/${eventId}`);
            if (analyticsRes.ok) {
                const data = await analyticsRes.json();
                setAnalyticsData(data);
                setRegistrations(data.registrations || []);
            }
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    // Handle registration approval/rejection
    const handleApproval = async (registrationId, action) => {
        if (processingId) return;
        setProcessingId(registrationId);

        try {
            const response = await fetch('/api/registrations/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationId, action })
            });

            const data = await response.json();

            if (data.success) {
                // Update local state
                setRegistrations(prev => prev.map(r =>
                    r.registrationId === registrationId
                        ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' }
                        : r
                ));

                if (action === 'APPROVE' && data.emailSent) {
                    alert(`✅ Registration approved! Ticket email sent to participant.`);
                } else if (action === 'APPROVE') {
                    alert(`✅ Registration approved! (Email not configured)`);
                } else {
                    alert(`Registration rejected.`);
                }
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Approval error:', error);
            alert('Failed to process approval');
        } finally {
            setProcessingId(null);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        alert("Changes Saved Successfully");
    };

    const handleLogout = () => {
        sessionStorage.removeItem("admin-auth");
        router.push("/admin/login");
    };

    const handlePosterUpload = () => {
        const url = window.prompt("Enter Image URL for Poster:", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop");
        if (url) {
            setFormData({ ...formData, img: url });
        }
    };

    // Export CSV for this event
    const exportCSV = () => {
        if (!registrations.length) return;

        const headers = ["Name", "Email", "Roll No", "Department", "Amount", "UTR", "Status", "Date"];
        const rows = registrations.map(r => [
            r.name,
            r.email,
            r.rollNo,
            r.department,
            r.amount,
            r.utrId,
            r.status,
            r.timestamp
        ]);

        const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${event?.title || 'event'}_registrations.csv`;
        a.click();
    };

    // Format department data for chart
    const formatDeptData = (deptDistribution) => {
        if (!deptDistribution) return [];
        return Object.entries(deptDistribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
    };

    // Format status data for pie chart
    const formatStatusData = (statusDist) => {
        if (!statusDist) return [];
        return [
            { name: 'Approved', value: statusDist.approved || 0, color: '#22C55E' },
            { name: 'Pending', value: statusDist.pending || 0, color: '#EAB308' },
            { name: 'Rejected', value: statusDist.rejected || 0, color: '#EF4444' }
        ].filter(s => s.value > 0);
    };

    // Filter registrations
    const filteredRegistrations = registrations.filter(r => {
        const matchesSearch = !searchTerm ||
            r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.rollNo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Status badge component
    const StatusBadge = ({ status }) => {
        const styles = {
            APPROVED: "bg-green-500/20 text-green-400 border-green-500/30",
            PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            REJECTED: "bg-red-500/20 text-red-400 border-red-500/30"
        };
        const icons = {
            APPROVED: <CheckCircle2 className="w-3 h-3" />,
            PENDING: <AlertCircle className="w-3 h-3" />,
            REJECTED: <XCircle className="w-3 h-3" />
        };
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${styles[status] || styles.PENDING}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <MathBackground />
                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-400">Loading Event Data...</p>
                </div>
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <MathBackground />
                <div className="relative z-10 text-center">
                    <p className="text-red-400 text-xl mb-4">Event not found</p>
                    <button onClick={() => router.back()} className="text-teal-400 hover:underline">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const overview = analyticsData?.overview || {};

    return (
        <div className="min-h-screen bg-black text-white font-sans relative overflow-hidden">
            <MathBackground />

            {/* Nav */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-30 relative">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="font-serif font-bold text-sm md:text-lg leading-none text-white">{formData.title}</h1>
                            <span className="text-[8px] md:text-[10px] text-teal/70 font-mono uppercase tracking-[0.2em]">Event Analytics & Management</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push(`/admin/event/${eventId}/scan`)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-xs font-medium transition-colors"
                        >
                            <QrCode className="w-4 h-4" />
                            <span className="hidden md:inline">Scan QR</span>
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-teal disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] md:text-xs text-white/40 hover:text-red-400 transition-colors uppercase tracking-widest font-mono">
                            <LogOut className="w-3 h-3" /> <span className="hidden md:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 relative z-10">
                {/* Analytics Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-teal-500/20 to-teal-600/10 border border-teal-500/30 rounded-xl p-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-teal-500/20">
                                <Users className="w-5 h-5 text-teal-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{overview.totalRegistrations || 0}</p>
                                <p className="text-xs text-gray-400">Total Registrations</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl p-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-500/20">
                                <TrendingUp className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">₹{(overview.totalRevenue || 0).toLocaleString()}</p>
                                <p className="text-xs text-gray-400">Revenue Collected</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-500/20">
                                <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{overview.pendingApprovals || 0}</p>
                                <p className="text-xs text-gray-400">Pending Approvals</p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <CheckCircle2 className="w-5 h-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{overview.approvalRate || 0}%</p>
                                <p className="text-xs text-gray-400">Approval Rate</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Department Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="w-5 h-5 text-purple-400" />
                            <h3 className="font-semibold">Department Distribution</h3>
                        </div>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formatDeptData(analyticsData?.departmentDistribution)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={50} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                                            border: "1px solid rgba(168, 85, 247, 0.3)",
                                            borderRadius: "8px"
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#A855F7" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Status Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                    >
                        <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <h3 className="font-semibold">Registration Status</h3>
                        </div>
                        <div className="h-48 flex items-center justify-center">
                            {formatStatusData(analyticsData?.statusDistribution).length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={formatStatusData(analyticsData?.statusDistribution)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            dataKey="value"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {formatStatusData(analyticsData?.statusDistribution).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                                border: "1px solid #1e293b",
                                                borderRadius: "8px"
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500">No registration data yet</p>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Event Settings */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass-premium rounded-2xl p-6 relative overflow-hidden border border-white/10">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-teal/10 blur-2xl rounded-full pointer-events-none" />
                            <h2 className="text-lg font-serif font-bold mb-5 text-white flex items-center gap-2">
                                <div className="w-1 h-5 bg-teal rounded-full" />
                                Event Settings
                            </h2>
                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Event Name</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal/50 outline-none text-white text-sm" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Status</label>
                                    <select
                                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-2.5 focus:border-teal/50 outline-none text-white text-sm"
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option className="bg-[#0f172a]">Registration Open</option>
                                        <option className="bg-[#0f172a]">Closed</option>
                                        <option className="bg-[#0f172a]">Upcoming</option>
                                        <option className="bg-[#0f172a]">Completed</option>
                                    </select>
                                </div>

                                <button type="submit" className="w-full py-3 bg-teal/10 hover:bg-teal text-teal hover:text-black border border-teal/50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-xs">
                                    <Save className="w-4 h-4" /> Save Settings
                                </button>
                            </form>
                        </div>

                        <div className="glass-premium rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-serif font-bold mb-4 text-white flex items-center gap-2">
                                <div className="w-1 h-5 bg-purple-500 rounded-full" />
                                Event Poster
                            </h2>
                            <div className="aspect-video bg-black/50 rounded-xl mb-4 border border-white/10 flex items-center justify-center overflow-hidden relative group cursor-pointer" onClick={handlePosterUpload}>
                                <div className="absolute inset-0 bg-teal/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                    <Upload className="w-8 h-8 text-teal" />
                                </div>
                                <img src={formData.img || '/noise.png'} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <button onClick={handlePosterUpload} className="w-full py-2.5 border border-white/10 hover:bg-white/5 text-white/70 hover:text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-xs uppercase tracking-widest">
                                <Upload className="w-4 h-4" /> Upload New Poster
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Registrations Table */}
                    <div className="lg:col-span-2">
                        <div className="glass-premium rounded-2xl overflow-hidden flex flex-col border border-white/10">
                            <div className="p-5 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/[0.02]">
                                <div className="text-center md:text-left">
                                    <h2 className="text-lg font-serif font-bold text-white">Registrations</h2>
                                    <p className="text-[10px] text-teal/70 font-mono mt-1 uppercase tracking-widest">{filteredRegistrations.length} of {registrations.length} shown</p>
                                </div>
                                <div className="flex gap-2 w-full md:w-auto flex-wrap">
                                    <div className="relative flex-1 md:flex-none">
                                        <Search className="absolute left-3 top-2.5 w-3 h-3 text-white/30" />
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-lg py-2 pl-8 pr-3 text-xs text-white focus:border-teal/30 outline-none w-full md:w-40 placeholder-white/20"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-[#0f172a] border border-white/10 rounded-lg py-2 px-3 text-xs text-white focus:border-teal/30 outline-none"
                                        style={{ colorScheme: 'dark' }}
                                    >
                                        <option value="all" className="bg-[#0f172a]">All Status</option>
                                        <option value="PENDING" className="bg-[#0f172a]">Pending</option>
                                        <option value="APPROVED" className="bg-[#0f172a]">Approved</option>
                                        <option value="REJECTED" className="bg-[#0f172a]">Rejected</option>
                                    </select>
                                    <button
                                        onClick={exportCSV}
                                        className="px-4 py-2 bg-white/5 hover:bg-teal/20 hover:text-teal border border-white/10 hover:border-teal/30 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                                    >
                                        <Download className="w-3 h-3" /> Export
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto max-h-[400px]">
                                <table className="w-full text-left min-w-[700px]">
                                    <thead className="text-[10px] text-white/30 uppercase font-mono tracking-widest bg-black/20 sticky top-0">
                                        <tr>
                                            <th className="px-5 py-3 font-normal">Student</th>
                                            <th className="px-5 py-3 font-normal">Roll No</th>
                                            <th className="px-5 py-3 font-normal">Department</th>
                                            <th className="px-5 py-3 font-normal">Amount</th>
                                            <th className="px-5 py-3 font-normal">Team</th>
                                            <th className="px-5 py-3 font-normal">Status</th>
                                            <th className="px-5 py-3 font-normal">Screenshot</th>
                                            <th className="px-5 py-3 font-normal">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredRegistrations.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-5 py-8 text-center text-gray-500">
                                                    {registrations.length === 0 ? "No registrations yet" : "No matching registrations"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredRegistrations.map((reg, i) => (
                                                <tr key={reg.registrationId || i} className="hover:bg-white/[0.03] transition-colors">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-teal text-xs font-bold">
                                                                {reg.name?.charAt(0) || '?'}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-white/90 block text-sm">{reg.name}</span>
                                                                <span className="text-[10px] text-gray-500">{reg.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3 text-xs text-teal/70 font-mono">{reg.rollNo}</td>
                                                    <td className="px-5 py-3 text-xs text-white/60">{reg.department}</td>
                                                    <td className="px-5 py-3 text-xs text-white/80">₹{reg.amount}</td>
                                                    <td className="px-5 py-3">
                                                        {reg.teamSize > 1 ? (
                                                            <button
                                                                onClick={() => setTeamModalData(reg)}
                                                                className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded text-[10px] font-bold uppercase tracking-wide transition-all"
                                                                title="View team members"
                                                            >
                                                                <Users className="w-3 h-3" />
                                                                {reg.teamSize}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-white/40 italic">Solo</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        <StatusBadge status={reg.status} />
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {reg.driveViewUrl ? (
                                                            <a
                                                                href={reg.driveViewUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300"
                                                            >
                                                                <Eye className="w-3 h-3" /> View
                                                            </a>
                                                        ) : (
                                                            <span className="text-xs text-gray-500">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-3">
                                                        {reg.status === 'PENDING' ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleApproval(reg.registrationId, 'APPROVE')}
                                                                    disabled={processingId === reg.registrationId}
                                                                    className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border border-green-500/30 rounded text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-wait flex items-center gap-1"
                                                                >
                                                                    {processingId === reg.registrationId ? (
                                                                        <span className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                                                                    ) : (
                                                                        <CheckCircle2 className="w-3 h-3" />
                                                                    )}
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleApproval(reg.registrationId, 'REJECT')}
                                                                    disabled={processingId === reg.registrationId}
                                                                    className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 border border-red-500/30 rounded text-[10px] font-bold uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-wait flex items-center gap-1"
                                                                >
                                                                    <XCircle className="w-3 h-3" />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-500 italic">Processed</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Team Members Modal */}
            {teamModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setTeamModalData(null)}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-gradient-to-br from-gray-900 to-black border border-purple-500/30 rounded-2xl p-6 max-w-lg w-full shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    Team Members
                                </h3>
                                <p className="text-xs text-white/40 mt-1">Registration: {teamModalData.registrationId.substring(0, 8)}...</p>
                            </div>
                            <button
                                onClick={() => setTeamModalData(null)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Leader */}
                            <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-400 text-[10px] font-bold uppercase tracking-wider rounded">Leader</span>
                                </div>
                                <p className="text-white font-medium">{teamModalData.name}</p>
                                <p className="text-xs text-white/60 font-mono mt-1">{teamModalData.rollNo}</p>
                                <p className="text-xs text-white/40 mt-1">{teamModalData.email}</p>
                            </div>

                            {/* Team Members */}
                            {teamModalData.teamMembers && teamModalData.teamMembers.length > 0 && (
                                <div className="space-y-3">
                                    {teamModalData.teamMembers.map((member, index) => (
                                        <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-[10px] font-bold uppercase tracking-wider rounded">
                                                    Member {index + 2}
                                                </span>
                                            </div>
                                            <p className="text-white font-medium">{member.name}</p>
                                            <p className="text-xs text-white/60 font-mono mt-1">{member.rollNo}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs text-white/40">Total Members: {teamModalData.teamSize}</span>
                            <button
                                onClick={() => setTeamModalData(null)}
                                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-sm font-medium transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
