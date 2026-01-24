"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    RefreshCw,
    Calendar,
    Users,
    User,
    TrendingUp,
    Clock,
    Download,
    Search,
    ChevronDown,
    CheckCircle2,
    XCircle,
    AlertCircle,
    BarChart3,
    PieChart as PieChartIcon,
    Activity,
    Filter
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from "recharts";
import MathBackground from "@/components/ui/MathBackground";
import StatCard from "@/components/admin/StatCard";
import { format, parseISO } from "date-fns";

// Teal + Gold Duotone Color Palette
const CHART_COLORS = ["#2DD4BF", "#14B8A6", "#0D9488", "#F59E0B", "#D97706", "#0F766E", "#115E59"];

export default function AnalyticsDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // Analytics data
    const [analyticsData, setAnalyticsData] = useState(null);

    // Registrations table state
    const [registrations, setRegistrations] = useState([]);
    const [regTotal, setRegTotal] = useState(0);
    const [regLoading, setRegLoading] = useState(false);
    const [departments, setDepartments] = useState([]);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");
    const [eventFilter, setEventFilter] = useState("all");

    // Pagination
    const [page, setPage] = useState(0);
    const limit = 10;

    // Auth check
    useEffect(() => {
        const auth = sessionStorage.getItem("admin-auth");
        if (auth !== "main") {
            router.push("/admin/login");
        }
    }, [router]);

    // Fetch analytics overview
    const fetchAnalytics = useCallback(async () => {
        try {
            const res = await fetch("/api/analytics/overview");
            if (!res.ok) throw new Error("Failed to fetch analytics");
            const data = await res.json();
            setAnalyticsData(data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError(err.message);
        }
    }, []);

    // Fetch registrations
    const fetchRegistrations = useCallback(async () => {
        setRegLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.set("search", searchTerm);
            if (statusFilter !== "all") params.set("status", statusFilter);
            if (deptFilter !== "all") params.set("department", deptFilter);
            if (eventFilter !== "all") params.set("eventId", eventFilter);
            params.set("limit", limit.toString());
            params.set("offset", (page * limit).toString());

            const res = await fetch(`/api/analytics/registrations?${params}`);
            if (!res.ok) throw new Error("Failed to fetch registrations");
            const data = await res.json();
            setRegistrations(data.registrations);
            setRegTotal(data.total);
            setDepartments(data.departments || []);
        } catch (err) {
            console.error(err);
        } finally {
            setRegLoading(false);
        }
    }, [searchTerm, statusFilter, deptFilter, eventFilter, page]);

    // Initial load
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchAnalytics(), fetchRegistrations()]);
            setLoading(false);
        };
        loadData();
    }, [fetchAnalytics, fetchRegistrations]);

    // Refresh data
    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([fetchAnalytics(), fetchRegistrations()]);
        setRefreshing(false);
    };

    // Export CSV
    const exportCSV = async () => {
        try {
            const res = await fetch("/api/analytics/registrations?limit=10000");
            const data = await res.json();
            const allRegs = data.registrations;

            if (!allRegs.length) return;

            const headers = ["Timestamp", "Name", "Email", "Roll No", "Department", "Event", "Amount", "UTR", "Status"];
            const rows = allRegs.map(r => [
                r.timestamp,
                r.name,
                r.email,
                r.rollNo,
                r.department,
                r.eventName,
                r.amount,
                r.utrId,
                r.status
            ]);

            const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `registrations_${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
        } catch (err) {
            console.error("Export failed:", err);
        }
    };

    // Format trends data for chart
    const formatTrendsData = (trends) => {
        if (!trends?.length) return [];
        return trends.map(t => ({
            date: format(parseISO(t.date), "MMM dd"),
            fullDate: t.date,
            count: t.count
        }));
    };

    // Format category data for pie chart
    const formatCategoryData = (categoryDistribution) => {
        if (!categoryDistribution) return [];
        return Object.entries(categoryDistribution).map(([name, value]) => ({
            name,
            value
        }));
    };

    // Format department data for bar chart
    const formatDeptData = (deptDistribution) => {
        if (!deptDistribution) return [];
        return Object.entries(deptDistribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    };

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
            <div className="min-h-screen bg-[#020617] flex items-center justify-center relative overflow-hidden">
                <MathBackground />
                {/* Animated gradient orbs */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-500" />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    {/* Premium loading spinner */}
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-teal-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-transparent border-t-teal-400 rounded-full animate-spin" />
                        <div className="absolute inset-2 border-4 border-transparent border-t-lime-400 rounded-full animate-spin animation-delay-150" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                        <div className="absolute inset-4 border-4 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDuration: '2s' }} />
                    </div>
                    <div className="text-center">
                        <p className="text-white font-medium text-lg">Loading Analytics</p>
                        <p className="text-gray-500 text-sm mt-1">Fetching latest data...</p>
                    </div>
                </div>
            </div>
        );
    }

    const { overview, topEvents, categoryDistribution, departmentDistribution, trends, eventStats } = analyticsData || {};

    return (
        <div className="min-h-screen bg-[#020617] text-white relative">
            <MathBackground />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10"
                >
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/admin/dashboard")}
                            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-white/20 hover:scale-105"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-teal-400">
                                Analytics Dashboard
                            </h1>
                            {analyticsData?.lastUpdated && (
                                <p className="text-gray-500 text-sm mt-1.5 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Last updated: {format(parseISO(analyticsData.lastUpdated), "MMM dd, yyyy HH:mm")}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportCSV}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all hover:border-white/20 text-sm font-medium hover:scale-105"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-lime-500/20 hover:from-teal-500/30 hover:to-lime-500/30 border border-teal-500/30 transition-all text-teal-400 text-sm font-medium disabled:opacity-50 hover:scale-105 hover:shadow-[0_0_20px_rgba(45,212,191,0.2)]"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                        {error}
                    </div>
                )}

                {/* Overview Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-10">
                    <StatCard
                        title="Total Events"
                        value={overview?.totalEvents || 0}
                        subtitle={`${overview?.activeEvents || 0} active`}
                        icon={Calendar}
                        color="teal"
                        index={0}
                    />
                    <StatCard
                        title="Total Registrations"
                        value={overview?.totalRegistrations || 0}
                        subtitle={`${overview?.pendingApprovals || 0} pending`}
                        icon={Users}
                        color="lime"
                        index={1}
                    />
                    <StatCard
                        title="Revenue Collected"
                        value={`₹${(overview?.totalRevenue || 0).toLocaleString()}`}
                        subtitle="All events combined"
                        icon={TrendingUp}
                        color="orange"
                        index={2}
                    />
                    <StatCard
                        title="Approval Rate"
                        value={overview?.totalRegistrations ? `${Math.round((overview.approvedCount / overview.totalRegistrations) * 100)}%` : "0%"}
                        subtitle={`${overview?.approvedCount || 0} approved`}
                        icon={CheckCircle2}
                        color="purple"
                        index={3}
                    />
                </div>

                {/* Team Statistics Row */}
                {overview?.totalTeams > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6 mb-10">
                        <StatCard
                            title="Total Teams"
                            value={overview?.totalTeams || 0}
                            subtitle="Team registrations"
                            icon={Users}
                            color="purple"
                            index={4}
                        />
                        <StatCard
                            title="Individual Registrations"
                            value={overview?.individualRegistrations || 0}
                            subtitle="Solo participants"
                            icon={User}
                            color="blue"
                            index={5}
                        />
                        <StatCard
                            title="Average Team Size"
                            value={overview?.averageTeamSize || 0}
                            subtitle="Members per team"
                            icon={TrendingUp}
                            color="indigo"
                            index={6}
                        />
                    </div>
                )}

                {/* Charts Section */}\
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                    {/* Registration Trends Line Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        whileHover={{ scale: 1.01 }}
                        className="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden hover:border-teal-500/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(45,212,191,0.1)]"
                    >
                        {/* Decorative glow */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/20">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Registration Trends</h3>
                                <p className="text-gray-500 text-xs">Daily registration activity</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={formatTrendsData(trends)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                                            border: "1px solid rgba(45, 212, 191, 0.3)",
                                            borderRadius: "12px",
                                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#14B8A6"
                                        strokeWidth={3}
                                        dot={{ fill: "#2DD4BF", strokeWidth: 2, r: 4 }}
                                        activeDot={{ r: 7, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }}
                                    />
                                    <defs>
                                        <linearGradient id="tealGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#14B8A6" />
                                            <stop offset="100%" stopColor="#2DD4BF" />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Category Distribution Pie Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                        whileHover={{ scale: 1.01 }}
                        className="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden hover:border-teal-400/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(45,212,191,0.1)]"
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-400/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-300 to-teal-500 shadow-lg shadow-teal-400/20">
                                <PieChartIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Category Distribution</h3>
                                <p className="text-gray-500 text-xs">Events by category type</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={formatCategoryData(categoryDistribution)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        innerRadius={40}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        stroke="rgba(0,0,0,0.3)"
                                        strokeWidth={2}
                                    >
                                        {formatCategoryData(categoryDistribution).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                                            border: "1px solid rgba(163, 230, 53, 0.3)",
                                            borderRadius: "12px",
                                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Top Events Bar Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        whileHover={{ scale: 1.01 }}
                        className="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(245,158,11,0.1)]"
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Top Events</h3>
                                <p className="text-gray-500 text-xs">By registration count</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={topEvents} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis type="number" stroke="#64748b" fontSize={12} />
                                    <YAxis dataKey="title" type="category" stroke="#64748b" fontSize={11} width={100} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                                            border: "1px solid rgba(245, 158, 11, 0.3)",
                                            borderRadius: "12px",
                                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                        }}
                                    />
                                    <Bar dataKey="registrations" fill="url(#amberGradient)" radius={[0, 6, 6, 0]} />
                                    <defs>
                                        <linearGradient id="amberGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#F59E0B" />
                                            <stop offset="100%" stopColor="#D97706" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Department Distribution */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        whileHover={{ scale: 1.01 }}
                        className="group relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden hover:border-teal-600/30 transition-all duration-300 hover:shadow-[0_0_40px_rgba(13,148,136,0.1)]"
                    >
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-600/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="flex items-center gap-3 mb-5 relative z-10">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-600/20">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Department Participation</h3>
                                <p className="text-gray-500 text-xs">Registrations by department</p>
                            </div>
                        </div>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={formatDeptData(departmentDistribution)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} angle={-45} textAnchor="end" height={60} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "rgba(15, 23, 42, 0.95)",
                                            border: "1px solid rgba(13, 148, 136, 0.3)",
                                            borderRadius: "12px",
                                            boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                        }}
                                    />
                                    <Bar dataKey="value" fill="url(#tealDarkGradient)" radius={[6, 6, 0, 0]} />
                                    <defs>
                                        <linearGradient id="tealDarkGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#14B8A6" />
                                            <stop offset="100%" stopColor="#0F766E" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* Registrations Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
                >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-teal-400" />
                            <h3 className="font-semibold text-lg">Recent Registrations</h3>
                            <span className="text-gray-500 text-sm">({regTotal} total)</span>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                                    className="pl-9 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-teal-500/50 w-40"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                                className="px-3 py-2 rounded-lg bg-[#0f172a] border border-white/10 text-sm focus:outline-none focus:border-teal-500/50 text-white cursor-pointer"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="all" className="bg-[#0f172a] text-white">All Status</option>
                                <option value="PENDING" className="bg-[#0f172a] text-white">Pending</option>
                                <option value="APPROVED" className="bg-[#0f172a] text-white">Approved</option>
                                <option value="REJECTED" className="bg-[#0f172a] text-white">Rejected</option>
                            </select>

                            {/* Department Filter */}
                            <select
                                value={deptFilter}
                                onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}
                                className="px-3 py-2 rounded-lg bg-[#0f172a] border border-white/10 text-sm focus:outline-none focus:border-teal-500/50 text-white cursor-pointer"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="all" className="bg-[#0f172a] text-white">All Departments</option>
                                {departments.map(d => (
                                    <option key={d} value={d} className="bg-[#0f172a] text-white">{d}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-left">
                                    <th className="pb-3 font-medium text-gray-400">Name</th>
                                    <th className="pb-3 font-medium text-gray-400 hidden sm:table-cell">Event</th>
                                    <th className="pb-3 font-medium text-gray-400 hidden md:table-cell">Department</th>
                                    <th className="pb-3 font-medium text-gray-400">Amount</th>
                                    <th className="pb-3 font-medium text-gray-400">Status</th>
                                    <th className="pb-3 font-medium text-gray-400 hidden lg:table-cell">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {regLoading ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : registrations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-gray-500">No registrations found</td>
                                    </tr>
                                ) : (
                                    registrations.map((reg, i) => (
                                        <tr key={reg.registrationId || i} className="border-b border-white/5 hover:bg-white/5">
                                            <td className="py-3">
                                                <div>
                                                    <p className="font-medium">{reg.name}</p>
                                                    <p className="text-gray-500 text-xs">{reg.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 hidden sm:table-cell text-gray-300">{reg.eventName}</td>
                                            <td className="py-3 hidden md:table-cell text-gray-400">{reg.department}</td>
                                            <td className="py-3 text-gray-300">₹{reg.amount}</td>
                                            <td className="py-3">
                                                <StatusBadge status={reg.status} />
                                            </td>
                                            <td className="py-3 hidden lg:table-cell text-gray-500 text-xs">
                                                {reg.timestamp ? format(parseISO(reg.timestamp), "MMM dd, HH:mm") : "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {regTotal > limit && (
                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                            <p className="text-sm text-gray-500">
                                Showing {page * limit + 1} - {Math.min((page + 1) * limit, regTotal)} of {regTotal}
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(page + 1) * limit >= regTotal}
                                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
