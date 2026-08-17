"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { 
    CalendarDays, 
    CheckCircle2, 
    XCircle, 
    Flame, 
    TrendingUp, 
    TrendingDown,
    Users, 
    Target, 
    Award, 
    Download, 
    RefreshCw, 
    Search, 
    ArrowUpRight, 
    Check, 
    BarChart3, 
    Clock, 
    FileQuestion,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    AlertCircle,
    UserX
} from "lucide-react";

export default function DailyStatsDashboard({ eventId, initialTotalParticipants = 0 }) {
    const todayStr = useMemo(() => {
        // Today in IST
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    }, []);

    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState({
        stats: [],
        summary: null,
        lostStreakUsers: [],
        recentSubmissions: [],
        trend: []
    });

    // Submissions table & tab state
    const [activeTab, setActiveTab] = useState("all"); // "all" | "gained" | "started" | "lost"
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all"); // "all" | "correct" | "incorrect"
    const [questionFilter, setQuestionFilter] = useState("all"); // "all" | 1 | 2 | 3
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const fetchStats = useCallback(async (dateToFetch, isManualRefresh = false) => {
        if (isManualRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const res = await fetch(`/api/placement-series/daily/stats?eventId=${eventId}&date=${dateToFetch}`);
            if (res.ok) {
                const json = await res.json();
                setData({
                    stats: json.stats || [],
                    summary: json.summary || null,
                    lostStreakUsers: json.lostStreakUsers || [],
                    recentSubmissions: json.recentSubmissions || [],
                    trend: json.trend || []
                });
            } else {
                console.error("Failed to load daily stats");
            }
        } catch (error) {
            console.error("Error fetching daily stats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchStats(selectedDate);
        setCurrentPage(1);
    }, [selectedDate, fetchStats]);

    const handleDateShortcut = (offsetDays) => {
        const d = new Date();
        d.setDate(d.getDate() - offsetDays);
        const dateString = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        setSelectedDate(dateString);
    };

    // Filter submissions or lost streak users
    const filteredSubmissions = useMemo(() => {
        if (activeTab === "lost") {
            return (data.lostStreakUsers || []).filter((u) => {
                return (
                    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
                );
            });
        }

        return (data.recentSubmissions || []).filter((sub) => {
            const matchesSearch = 
                sub.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.rollNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sub.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = 
                statusFilter === "all" ? true :
                statusFilter === "correct" ? sub.isCorrect :
                !sub.isCorrect;

            const matchesQuestion = 
                questionFilter === "all" ? true :
                sub.questionNumber === Number(questionFilter);

            const matchesTab = 
                activeTab === "all" ? true :
                activeTab === "gained" ? sub.streakType === "gained" :
                activeTab === "started" ? sub.streakType === "started" : true;

            return matchesSearch && matchesStatus && matchesQuestion && matchesTab;
        });
    }, [data.recentSubmissions, data.lostStreakUsers, activeTab, searchQuery, statusFilter, questionFilter]);

    const totalPages = Math.ceil(filteredSubmissions.length / pageSize) || 1;
    const paginatedSubmissions = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredSubmissions.slice(start, start + pageSize);
    }, [filteredSubmissions, currentPage]);

    // CSV Export
    const handleExportCSV = () => {
        if (activeTab === "lost") {
            if (!data.lostStreakUsers || data.lostStreakUsers.length === 0) {
                alert("No lost streak users to export for this date.");
                return;
            }

            const headers = ["Student Name", "Roll Number", "Email", "Previous Streak Length", "Missed Date"];
            const rows = data.lostStreakUsers.map(u => [
                `"${u.name.replace(/"/g, '""')}"`,
                `"${u.rollNo}"`,
                `"${u.email}"`,
                u.previousStreak,
                `"${selectedDate}"`
            ]);

            const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `lost_streaks_${eventId}_${selectedDate}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        if (!data.recentSubmissions || data.recentSubmissions.length === 0) {
            alert("No submissions available to export for this date.");
            return;
        }

        const headers = ["Student Name", "Roll Number", "Email", "Question Number", "Result", "Streak", "Streak Type", "Submitted At"];
        const rows = data.recentSubmissions.map(s => [
            `"${s.name.replace(/"/g, '""')}"`,
            `"${s.rollNo}"`,
            `"${s.email}"`,
            `"Q${s.questionNumber}"`,
            `"${s.isCorrect ? "Correct" : "Incorrect"}"`,
            s.streak,
            `"${s.streakType === "gained" ? "Extended" : "Started"}"`,
            `"${new Date(s.submittedAt).toLocaleString()}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `daily_stats_${eventId}_${selectedDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Format date for display
    const formattedSelectedDate = useMemo(() => {
        if (!selectedDate) return "";
        try {
            const parts = selectedDate.split("-");
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
        } catch {
            return selectedDate;
        }
    }, [selectedDate]);

    const isToday = selectedDate === todayStr;

    // Max submissions count in trend for relative bar heights
    const maxTrendSubmissions = useMemo(() => {
        if (!data.trend || data.trend.length === 0) return 10;
        const max = Math.max(...data.trend.map(t => t.totalSubmissions || 0));
        return max > 0 ? max : 10;
    }, [data.trend]);

    return (
        <section className="mb-12 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-5 md:p-8 relative overflow-hidden">
            {/* Header / Date Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                        <span className="text-xs font-mono uppercase tracking-widest text-teal-300 font-semibold">
                            Live Daily Insights
                        </span>
                        {isToday && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono border border-teal-500/30">
                                Today
                            </span>
                        )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
                        Daily Challenge Statistics
                    </h2>
                    <p className="text-sm text-white/50 mt-0.5">
                        Performance analytics, participation, and streak flow for {formattedSelectedDate}
                    </p>
                </div>

                {/* Date Controls & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Quick date shortcuts */}
                    <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-1">
                        <button
                            onClick={() => handleDateShortcut(0)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                isToday ? "bg-teal-500 text-black font-semibold" : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handleDateShortcut(1)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                !isToday && selectedDate === new Date(Date.now() - 86400000).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
                                    ? "bg-teal-500 text-black font-semibold"
                                    : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}
                        >
                            Yesterday
                        </button>
                    </div>

                    {/* Date Picker */}
                    <div className="relative flex items-center">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={todayStr}
                            className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs md:text-sm text-white focus:border-teal-400/50 outline-none transition-all [color-scheme:dark]"
                        />
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => fetchStats(selectedDate, true)}
                        disabled={refreshing || loading}
                        title="Refresh Stats"
                        className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-teal-400" : ""}`} />
                    </button>

                    {/* CSV Export Button */}
                    <button
                        onClick={handleExportCSV}
                        disabled={activeTab === "lost" ? (!data.lostStreakUsers || data.lostStreakUsers.length === 0) : (!data.recentSubmissions || data.recentSubmissions.length === 0)}
                        title="Export current view as CSV"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-40"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>

                    {/* Assign Questions CTA */}
                    <Link
                        href="/coordinator/daily"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                    >
                        <span>Manage Qs</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-teal-400 border-t-transparent animate-spin" />
                    <span className="text-sm font-mono text-white/50">Fetching daily challenge statistics...</span>
                </div>
            ) : (
                <div className="mt-6 space-y-8">
                    {/* Primary KPI Metric Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Total Daily Submissions */}
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 relative overflow-hidden group hover:border-teal-500/30 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                                    Submissions Today
                                </span>
                                <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                    <Target className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tight text-white">
                                    {data.summary?.totalSubmissions || 0}
                                </span>
                                <span className="text-xs text-white/40 font-mono">answers</span>
                            </div>
                            <div className="mt-2 text-xs text-white/50">
                                Across {data.summary?.assignedQuestionsCount || 0} assigned questions
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-teal-500/10 rounded-full blur-xl pointer-events-none" />
                        </div>

                        {/* 2. Active Students */}
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                                    Active Students
                                </span>
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <Users className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tight text-white">
                                    {data.summary?.uniqueParticipants || 0}
                                </span>
                                <span className="text-xs text-white/40 font-mono">
                                    / {data.summary?.totalEnrolled || initialTotalParticipants || 0} enrolled
                                </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-400 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, data.summary?.participationRate || 0)}%` }}
                                    />
                                </div>
                                <span className="text-[11px] font-mono text-blue-300 font-semibold">
                                    {data.summary?.participationRate || 0}%
                                </span>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                        </div>

                        {/* 3. Accuracy Rate */}
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                                    Accuracy Rate
                                </span>
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tight text-white">
                                    {data.summary?.overallAccuracy || 0}%
                                </span>
                                <span className="text-xs font-mono text-emerald-400">
                                    ({data.summary?.totalCorrect || 0} correct)
                                </span>
                            </div>
                            <div className="mt-2 text-xs text-white/50 flex items-center gap-1.5">
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                    (data.summary?.overallAccuracy || 0) >= 70 ? "bg-emerald-400" :
                                    (data.summary?.overallAccuracy || 0) >= 40 ? "bg-yellow-400" : "bg-red-400"
                                }`} />
                                <span>
                                    {(data.summary?.overallAccuracy || 0) >= 70 ? "High Performance" :
                                     (data.summary?.overallAccuracy || 0) >= 40 ? "Moderate Challenge" : "High Difficulty"}
                                </span>
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                        </div>

                        {/* 4. Perfect Scorers */}
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono uppercase tracking-wider text-white/50">
                                    Perfect Solvers
                                </span>
                                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                    <Award className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-baseline gap-2">
                                <span className="text-3xl font-black tracking-tight text-white">
                                    {data.summary?.perfectScorersCount || 0}
                                </span>
                                <span className="text-xs text-white/40 font-mono">students</span>
                            </div>
                            <div className="mt-2 text-xs text-white/50">
                                100% correct answers on this date
                            </div>
                            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                        </div>
                    </div>

                    {/* Streak Dynamics Flow & Retention Section */}
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <Flame className="w-5 h-5 text-amber-400" />
                                <h3 className="text-base font-bold text-white">Streak Dynamics & Retention</h3>
                            </div>
                            <span className="text-xs font-mono text-white/40">
                                Day-over-day streak progression for {formattedSelectedDate}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {/* Streaks Extended / Gained */}
                            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-300 font-semibold">
                                        Streaks Gained / Extended
                                    </span>
                                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-black tracking-tight text-emerald-400">
                                        +{data.summary?.streakStats?.gainedStreakCount || 0}
                                    </div>
                                    <div className="text-xs text-emerald-200/60 mt-0.5">
                                        Continued streak from previous day
                                    </div>
                                </div>
                            </div>

                            {/* Streaks Started / Reset */}
                            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-blue-300 font-semibold">
                                        New Streaks Started
                                    </span>
                                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                                        <Flame className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-black tracking-tight text-blue-400">
                                        {data.summary?.streakStats?.startedStreakCount || 0}
                                    </div>
                                    <div className="text-xs text-blue-200/60 mt-0.5">
                                        New or restarted at 1 day streak
                                    </div>
                                </div>
                            </div>

                            {/* Streaks Lost / Broken */}
                            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-red-300 font-semibold">
                                        Streaks Lost / Broken
                                    </span>
                                    <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
                                        <TrendingDown className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-black tracking-tight text-red-400">
                                        -{data.summary?.streakStats?.lostStreakCount || 0}
                                    </div>
                                    <div className="text-xs text-red-200/60 mt-0.5">
                                        Solved yesterday but missed today
                                    </div>
                                </div>
                            </div>

                            {/* Cohort Retention Rate */}
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-mono uppercase tracking-wider text-white/70 font-semibold">
                                        Cohort Retention
                                    </span>
                                    <div className="p-1.5 rounded-lg bg-white/10 text-white/70">
                                        <Users className="w-4 h-4" />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <div className="text-2xl font-black tracking-tight text-white">
                                        {data.summary?.streakStats?.retentionRate || 0}%
                                    </div>
                                    <div className="text-xs text-white/50 mt-0.5">
                                        {data.summary?.streakStats?.gainedStreakCount || 0} of {data.summary?.streakStats?.yesterdayActiveCount || 0} retained
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Questions Grid for the Selected Date */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FileQuestion className="w-5 h-5 text-teal-400" />
                                <h3 className="text-lg font-bold text-white">Assigned Daily Questions</h3>
                                <span className="text-xs font-mono text-white/50">
                                    ({data.stats.length}/3 Assigned)
                                </span>
                            </div>
                            {data.stats.length === 0 && (
                                <Link
                                    href="/coordinator/daily"
                                    className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1"
                                >
                                    Assign questions now
                                    <ArrowUpRight className="w-3 h-3" />
                                </Link>
                            )}
                        </div>

                        {data.stats.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
                                <CalendarDays className="w-10 h-10 text-white/20 mx-auto mb-3" />
                                <h4 className="text-base font-semibold text-white/80">No questions assigned for this date</h4>
                                <p className="text-xs text-white/50 max-w-md mx-auto mt-1">
                                    Students cannot attempt daily questions until you assign up to 3 problems from the question bank.
                                </p>
                                <Link
                                    href="/coordinator/daily"
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-black text-xs font-bold transition-all"
                                >
                                    <span>Go to Daily Questions</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {data.stats.map((q) => {
                                    const difficultyColor = 
                                        q.difficulty === 'hard' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                                        q.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' :
                                        'bg-green-500/20 text-green-300 border-green-500/30';

                                    return (
                                        <div 
                                            key={q.questionId}
                                            className="rounded-2xl border border-white/10 bg-black/40 p-5 flex flex-col justify-between hover:border-white/20 transition-all group"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/30 text-teal-300 font-bold text-xs flex items-center justify-center">
                                                            Q{q.questionNumber}
                                                        </span>
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-white/70">
                                                            {q.category}
                                                        </span>
                                                    </div>
                                                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border ${difficultyColor}`}>
                                                        {q.difficulty}
                                                    </span>
                                                </div>

                                                <p className="text-sm font-medium text-white/90 line-clamp-3 mb-4 group-hover:text-white transition-colors">
                                                    {q.questionText}
                                                </p>
                                            </div>

                                            <div className="pt-3 border-t border-white/10 space-y-2.5">
                                                <div className="flex items-center justify-between text-xs font-mono">
                                                    <span className="text-white/50">Submissions</span>
                                                    <span className="text-white font-bold">{q.totalSubmissions}</span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs font-mono">
                                                    <span className="text-white/50">Correct / Incorrect</span>
                                                    <span className="text-white">
                                                        <span className="text-emerald-400 font-bold">{q.correctSubmissions}</span>
                                                        <span className="text-white/30 mx-1">/</span>
                                                        <span className="text-red-400 font-bold">{q.incorrectSubmissions}</span>
                                                    </span>
                                                </div>
                                                
                                                {/* Accuracy Progress Bar */}
                                                <div>
                                                    <div className="flex items-center justify-between text-xs mb-1 font-mono">
                                                        <span className="text-white/50">Accuracy</span>
                                                        <span className={`font-bold ${
                                                            q.accuracy >= 70 ? 'text-emerald-400' :
                                                            q.accuracy >= 40 ? 'text-yellow-400' : 'text-red-400'
                                                        }`}>
                                                            {q.accuracy}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                q.accuracy >= 70 ? 'bg-emerald-400' :
                                                                q.accuracy >= 40 ? 'bg-yellow-400' : 'bg-red-400'
                                                            }`}
                                                            style={{ width: `${Math.min(100, q.accuracy)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 7-Day Activity & Streak Trend */}
                    {data.trend && data.trend.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 md:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-teal-400" />
                                    <h3 className="text-base font-bold text-white">7-Day Participation & Streak Continuity</h3>
                                </div>
                                <span className="text-xs font-mono text-white/40">
                                    Click any day to view detailed breakdown
                                </span>
                            </div>

                            <div className="grid grid-cols-7 gap-2 md:gap-3 items-end pt-4 pb-2">
                                {data.trend.map((dayItem) => {
                                    const isSelected = dayItem.date === selectedDate;
                                    const heightPercent = maxTrendSubmissions > 0 
                                        ? Math.max(12, Math.round((dayItem.totalSubmissions / maxTrendSubmissions) * 100))
                                        : 12;

                                    // Format label
                                    const dateObj = new Date(dayItem.date + "T00:00:00Z");
                                    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
                                    const dayNumber = dateObj.toLocaleDateString("en-US", { day: "numeric", month: "numeric", timeZone: "UTC" });

                                    return (
                                        <div 
                                            key={dayItem.date}
                                            onClick={() => setSelectedDate(dayItem.date)}
                                            className={`group cursor-pointer flex flex-col items-center gap-2 p-2 rounded-xl transition-all ${
                                                isSelected 
                                                    ? 'bg-teal-500/10 border border-teal-500/30' 
                                                    : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                        >
                                            {/* Submissions & streak delta */}
                                            <div className="text-[10px] font-mono text-white/60 group-hover:text-white transition-colors text-center">
                                                <div>{dayItem.totalSubmissions} ans</div>
                                                {dayItem.gainedStreak > 0 && (
                                                    <div className="text-[9px] text-emerald-400">+{dayItem.gainedStreak}</div>
                                                )}
                                            </div>

                                            {/* Bar container */}
                                            <div className="w-full h-24 bg-white/5 rounded-lg flex items-end p-1 relative overflow-hidden">
                                                <div 
                                                    className={`w-full rounded-md transition-all duration-500 ${
                                                        isSelected 
                                                            ? 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.5)]' 
                                                            : dayItem.totalSubmissions > 0 
                                                            ? 'bg-white/30 group-hover:bg-teal-400/70' 
                                                            : 'bg-white/10'
                                                    }`}
                                                    style={{ height: `${heightPercent}%` }}
                                                />
                                            </div>

                                            {/* Accuracy badge */}
                                            {dayItem.totalSubmissions > 0 ? (
                                                <span className={`text-[10px] font-mono font-bold ${
                                                    dayItem.accuracy >= 70 ? 'text-emerald-400' :
                                                    dayItem.accuracy >= 40 ? 'text-yellow-400' : 'text-red-400'
                                                }`}>
                                                    {dayItem.accuracy}%
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-mono text-white/30">
                                                    -
                                                </span>
                                            )}

                                            {/* Day label */}
                                            <div className="text-center">
                                                <div className={`text-[11px] font-bold ${isSelected ? 'text-teal-300' : 'text-white/80'}`}>
                                                    {dayName}
                                                </div>
                                                <div className="text-[9px] font-mono text-white/40">
                                                    {dayNumber}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Participant Submissions & Streak Activity Table */}
                    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 md:p-6">
                        {/* Tab Switcher & Search Bar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            {/* Tabs */}
                            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl">
                                <button
                                    onClick={() => {
                                        setActiveTab("all");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        activeTab === "all" ? "bg-teal-500 text-black font-bold" : "text-white/60 hover:text-white"
                                    }`}
                                >
                                    All Submissions ({data.recentSubmissions?.length || 0})
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab("gained");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        activeTab === "gained" ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30" : "text-white/60 hover:text-white"
                                    }`}
                                >
                                    Streaks Extended (+{data.summary?.streakStats?.gainedStreakCount || 0})
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab("started");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        activeTab === "started" ? "bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30" : "text-white/60 hover:text-white"
                                    }`}
                                >
                                    New Streaks ({data.summary?.streakStats?.startedStreakCount || 0})
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab("lost");
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        activeTab === "lost" ? "bg-red-500/20 text-red-300 font-bold border border-red-500/30" : "text-white/60 hover:text-white"
                                    }`}
                                >
                                    Lost Streaks (-{data.summary?.streakStats?.lostStreakCount || 0})
                                </button>
                            </div>

                            {/* Filters & Search */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Search input */}
                                <div className="relative flex-1 sm:w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40" />
                                    <input
                                        type="text"
                                        placeholder="Search student or roll no..."
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-teal-400/50 outline-none transition-all"
                                    />
                                </div>

                                {activeTab !== "lost" && (
                                    <>
                                        {/* Status Filter */}
                                        <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-1">
                                            <button
                                                onClick={() => {
                                                    setStatusFilter("all");
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                    statusFilter === "all" ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
                                                }`}
                                            >
                                                All
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setStatusFilter("correct");
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                    statusFilter === "correct" ? "bg-emerald-500/20 text-emerald-300" : "text-white/60 hover:text-white"
                                                }`}
                                            >
                                                Correct
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setStatusFilter("incorrect");
                                                    setCurrentPage(1);
                                                }}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                                                    statusFilter === "incorrect" ? "bg-red-500/20 text-red-300" : "text-white/60 hover:text-white"
                                                }`}
                                            >
                                                Incorrect
                                            </button>
                                        </div>

                                        {/* Question filter */}
                                        <select
                                            value={questionFilter}
                                            onChange={(e) => {
                                                setQuestionFilter(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:border-teal-400/50 outline-none [color-scheme:dark]"
                                        >
                                            <option value="all">All Questions</option>
                                            <option value="1">Question 1</option>
                                            <option value="2">Question 2</option>
                                            <option value="3">Question 3</option>
                                        </select>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Submissions or Lost Streak Table */}
                        {paginatedSubmissions.length === 0 ? (
                            <div className="py-12 text-center border border-white/5 rounded-xl bg-white/[0.01]">
                                {activeTab === "lost" ? (
                                    <>
                                        <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-white/80">No students lost their streak on this date!</p>
                                        <p className="text-xs text-white/40 mt-0.5">
                                            All active participants from yesterday maintained their engagement today.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Users className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                        <p className="text-sm font-medium text-white/60">No records found</p>
                                        <p className="text-xs text-white/40 mt-0.5">
                                            {searchQuery || statusFilter !== "all" || questionFilter !== "all"
                                                ? "Try adjusting your filters or search term."
                                                : "No participant records available for this tab."}
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : activeTab === "lost" ? (
                            /* Lost Streak Cohort Table */
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10 text-white/50 font-mono uppercase tracking-wider">
                                            <th className="pb-3 px-3">Student</th>
                                            <th className="pb-3 px-3">Roll No</th>
                                            <th className="pb-3 px-3">Previous Streak</th>
                                            <th className="pb-3 px-3">Status</th>
                                            <th className="pb-3 px-3 text-right">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedSubmissions.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-3">
                                                    <div className="font-semibold text-white/90">{user.name}</div>
                                                    <div className="text-[11px] text-white/40 font-mono">{user.email}</div>
                                                </td>
                                                <td className="py-3 px-3 font-mono text-white/70">
                                                    {user.rollNo}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono font-bold">
                                                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                                                        <span>{user.previousStreak}d Streak</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                                                        <TrendingDown className="w-3 h-3" />
                                                        <span>Streak Broken</span>
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 text-right font-mono text-white/50 text-[11px]">
                                                    Did not submit on {selectedDate}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            /* Submissions Activity Table */
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-white/10 text-white/50 font-mono uppercase tracking-wider">
                                            <th className="pb-3 px-3">Student</th>
                                            <th className="pb-3 px-3">Roll No</th>
                                            <th className="pb-3 px-3">Question</th>
                                            <th className="pb-3 px-3">Result</th>
                                            <th className="pb-3 px-3">Streak Flow</th>
                                            <th className="pb-3 px-3 text-right">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedSubmissions.map((sub) => (
                                            <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-3">
                                                    <div className="font-semibold text-white/90">{sub.name}</div>
                                                    <div className="text-[11px] text-white/40 font-mono">{sub.email}</div>
                                                </td>
                                                <td className="py-3 px-3 font-mono text-white/70">
                                                    {sub.rollNo}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-teal-300 font-mono font-semibold">
                                                        Q{sub.questionNumber}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3">
                                                    {sub.isCorrect ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            <span>Correct</span>
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                                                            <XCircle className="w-3 h-3" />
                                                            <span>Incorrect</span>
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center gap-1 text-amber-400 font-mono font-bold">
                                                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                                                            <span>{sub.streak}d</span>
                                                        </span>
                                                        {sub.streakType === "gained" ? (
                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                                                                +1 Gained
                                                            </span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">
                                                                Started
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-right font-mono text-white/50 text-[11px]">
                                                    {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10 text-xs text-white/60">
                                <div>
                                    Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredSubmissions.length)} of {filteredSubmissions.length}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-mono text-white/80">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
