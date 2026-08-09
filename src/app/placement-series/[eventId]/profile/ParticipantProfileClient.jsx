"use client";

import { useState, useEffect } from "react";
import {
    User, Medal, Flame, Calendar, Award, Share2, Loader2,
    ArrowRight, Pencil, X, Check, BookOpen, Building2, Hash, BadgeCheck, LogOut, Copy, ExternalLink, Download
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const BRANCH_OPTIONS = [
    "CSE", "CSE (AI & ML)", "CSE (Data Science)", "CSE (IoT)",
    "ECE", "EEE", "Mechanical", "Civil", "IT", "Chemical", "Other"
];

// ─── Editable field ────────────────────────────────────────────────────────────
function EditableField({ label, value, icon: Icon, isEditing, editValue, onChange, type = "text", options }) {
    if (!isEditing) {
        return (
            <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                    <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-0.5">{label}</p>
                    <p className="text-white font-medium">{value || <span className="text-white/30 italic">Not set</span>}</p>
                </div>
            </div>
        );
    }

    if (options) {
        return (
            <div>
                <label className="block text-xs text-white/40 font-semibold uppercase tracking-widest mb-1.5">{label}</label>
                <select
                    value={editValue}
                    onChange={e => onChange(e.target.value)}
                    className="w-full bg-black/60 border border-teal-400/40 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-400 transition-colors appearance-none"
                >
                    <option value="" className="bg-black">Select…</option>
                    {options.map(o => <option key={o} value={o} className="bg-black">{o}</option>)}
                </select>
            </div>
        );
    }

    return (
        <div>
            <label className="block text-xs text-white/40 font-semibold uppercase tracking-widest mb-1.5">{label}</label>
            <input
                type={type}
                value={editValue}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-black/60 border border-teal-400/40 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-teal-400 transition-colors"
            />
        </div>
    );
}

// ─── LinkedIn Share Modal ──────────────────────────────────────────────────────
function ShareModal({ badge, userName, onClose }) {
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [activeTab, setActiveTab] = useState('image'); // 'image' | 'text'
    const text = badge?.linkedinText || '';

    // Build the badge image URL
    const earnedDate = badge?.earnedAt
        ? new Date(badge.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : '';
    const imageUrl = `/api/placement-series/badge-image?${new URLSearchParams({
        badgeType:  badge?.badgeType  || '',
        badgeIcon:  badge?.badgeIcon  || '🏆',
        badgeLabel: badge?.badgeLabel || '',
        name:       userName          || 'Participant',
        earnedAt:   earnedDate,
    }).toString()}`;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error('Could not copy. Please select and copy manually.');
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const res = await fetch(imageUrl);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rmc-badge-${badge?.badgeType || 'achievement'}.png`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Badge image downloaded!');
        } catch {
            toast.error('Download failed. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    const handlePostOnLinkedIn = () => {
        const encodedText = encodeURIComponent(text);
        window.open(
            `https://www.linkedin.com/feed/?shareActive=true&text=${encodedText}`,
            '_blank',
            'noopener,noreferrer'
        );
    };

    if (!badge) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-[#0A66C2] flex items-center justify-center">
                            <span className="text-white font-black text-sm leading-none">in</span>
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">Share Achievement</p>
                            <p className="text-white/40 text-xs">Download image · Copy text · Post to LinkedIn</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* ── Tabs ── */}
                <div className="flex px-6 pt-4 gap-2 shrink-0">
                    {['image', 'text'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                                activeTab === tab
                                    ? 'bg-teal-500/20 border border-teal-500/40 text-teal-400'
                                    : 'bg-white/5 border border-white/10 text-white/40 hover:text-white/70'
                            }`}
                        >
                            {tab === 'image' ? '🖼 Badge Image' : '✍️ Post Text'}
                        </button>
                    ))}
                </div>

                {/* ── Content area ── */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {activeTab === 'image' ? (
                        <div>
                            {/* Image preview */}
                            <div className="rounded-2xl overflow-hidden border border-white/10 mb-4 aspect-[1200/630] relative bg-[#050505]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt={badge.badgeLabel}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-white/30 text-xs">
                                💡 Download this image and attach it when posting on LinkedIn for maximum impact.
                            </p>
                        </div>
                    ) : (
                        <div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3">
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mb-3">Post Preview</p>
                                <pre className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap font-sans">{text}</pre>
                            </div>
                            <p className="text-white/30 text-xs">
                                💡 LinkedIn sometimes truncates pre-filled text. Copy first, then paste manually for best results.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Actions ── */}
                <div className="px-6 pb-6 pt-2 shrink-0 space-y-3">
                    {/* Row 1 */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white font-semibold text-sm transition-all disabled:opacity-50"
                        >
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {downloading ? 'Downloading…' : 'Download Image'}
                        </button>
                        <button
                            onClick={handleCopy}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border font-semibold text-sm transition-all ${
                                copied
                                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
                            }`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy Text'}
                        </button>
                    </div>
                    {/* Row 2 — LinkedIn CTA */}
                    <button
                        onClick={handlePostOnLinkedIn}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm transition-colors"
                    >
                        <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center shrink-0">
                            <span className="text-white font-black text-[11px] leading-none">in</span>
                        </div>
                        Post on LinkedIn
                        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ParticipantProfileClient({ eventId }) {
    const router = useRouter();
    const [session, setSession] = useState(null);
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [shareModal, setShareModal] = useState(null); // badge object or null

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", year: "", branch: "", college: "" });

    useEffect(() => { fetchProfile(); }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const sessRes = await fetch(`/api/placement-series/session`);
            if (sessRes.ok) {
                const sessData = await sessRes.json();
                setSession(sessData.participant);

                if (sessData.participant) {
                    const { name, year, branch, college } = sessData.participant;
                    setEditForm({ name: name || "", year: year || "", branch: branch || "", college: college || "" });

                    const badgeRes = await fetch(`/api/placement-series/badges`);
                    if (badgeRes.ok) {
                        const badgeData = await badgeRes.json();
                        setBadges(badgeData.badges || []);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to load profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditStart = () => {
        setEditForm({
            name: session.name || "",
            year: session.year || "",
            branch: session.branch || "",
            college: session.college || "",
        });
        setIsEditing(true);
    };

    const handleEditCancel = () => setIsEditing(false);

    const handleSave = async () => {
        if (!editForm.name.trim()) {
            toast.error("Name cannot be empty.");
            return;
        }
        setIsSaving(true);
        try {
            const res = await fetch(`/api/placement-series/update-profile`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            const data = await res.json();
            if (res.ok) {
                setSession(prev => ({ ...prev, ...data.participant }));
                toast.success("Profile updated!");
                setIsEditing(false);
            } else {
                toast.error(data.error || "Failed to save.");
            }
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const res = await fetch(`/api/placement-series/logout?eventId=${eventId}`, { method: 'POST' });
            const data = await res.json();
            if (res.ok) {
                router.push(data.redirectTo || `/placement-series/${eventId}`);
                router.refresh();
            } else {
                toast.error('Logout failed. Please try again.');
                setIsLoggingOut(false);
            }
        } catch {
            toast.error('Network error during logout.');
            setIsLoggingOut(false);
        }
    };

    const openShareModal = (badge) => setShareModal({ badge, userName: session?.name || 'Participant' });

    if (loading) {
        return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-teal-400" /></div>;
    }

    if (!session) {
        return (
            <div className="min-h-[100dvh] pt-24 pb-12 px-4 flex items-center justify-center bg-black">
                <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl max-w-md w-full p-8">
                    <User className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">Not Logged In</h3>
                    <p className="text-white/50 mb-6 text-sm">You need to register for the Placement Series first.</p>
                    <Link href={`/placement-series/${eventId}`} className="inline-block px-6 py-3 bg-teal-500 text-black font-bold rounded-xl w-full">
                        Join Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <>
    return (
        <>
        <div className="min-h-[100dvh] pt-20 sm:pt-24 md:pt-28 pb-12 px-3.5 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Ambient */}
            <div className="absolute inset-0 pointer-events-none opacity-25 z-0">
                <div className="absolute top-0 right-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-teal-500/10 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-emerald-500/10 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-4xl mx-auto relative z-10 space-y-6 sm:space-y-8">

                {/* ── Profile Hero ── */}
                <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
                    {/* Decorative gradient blob */}
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 p-[3px] shrink-0 shadow-lg shadow-teal-500/20">
                            <div className="w-full h-full rounded-full bg-[#090d16] flex items-center justify-center text-3xl sm:text-4xl font-extrabold text-teal-400">
                                {session.name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 text-center sm:text-left min-w-0">
                            <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-1 flex-wrap">
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">{session.name}</h1>
                                {session.isVerified && (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-green-500/15 text-green-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border border-green-500/30">
                                        <BadgeCheck className="w-3.5 h-3.5" /> Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-white/40 text-xs sm:text-sm mb-4 truncate">
                                {session.email}
                            </p>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="inline-flex items-center gap-2 px-3.5 py-2 mb-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-xl text-xs sm:text-sm font-semibold text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 min-h-[38px] active:scale-95 cursor-pointer"
                            >
                                {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                                {isLoggingOut ? 'Logging out…' : 'Log Out'}
                            </button>

                            {/* Stat chips */}
                            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full sm:max-w-md mx-auto sm:mx-0">
                                <div className="flex flex-col items-center sm:items-start gap-0.5 bg-orange-500/10 border border-orange-500/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl">
                                    <div className="flex items-center gap-1 text-orange-400">
                                        <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]" />
                                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">Streak</span>
                                    </div>
                                    <div className="font-mono font-bold text-base sm:text-xl text-white">{session.streakCurrent}</div>
                                </div>
                                <div className="flex flex-col items-center sm:items-start gap-0.5 bg-teal-500/10 border border-teal-500/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl">
                                    <div className="flex items-center gap-1 text-teal-400">
                                        <Medal className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
                                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">Badges</span>
                                    </div>
                                    <div className="font-mono font-bold text-base sm:text-xl text-white">{badges.length}</div>
                                </div>
                                <div className="flex flex-col items-center sm:items-start gap-0.5 bg-purple-500/10 border border-purple-500/20 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl">
                                    <div className="flex items-center gap-1 text-purple-400">
                                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                                        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-white/40">Joined</span>
                                    </div>
                                    <div className="font-bold text-[11px] sm:text-xs text-white mt-0.5 truncate">{new Date(session.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Info Card ── */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User className="w-5 h-5 text-teal-400" /> Personal Details
                        </h2>
                        {!isEditing ? (
                            <button
                                onClick={handleEditStart}
                                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-teal-400/40 rounded-xl text-sm font-medium text-white/70 hover:text-teal-400 transition-all duration-200"
                            >
                                <Pencil className="w-4 h-4" /> Edit
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleEditCancel}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/50 transition-all"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-60 rounded-xl text-sm font-bold text-black transition-all"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    {isSaving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        )}
                    </div>

                    {!isEditing ? (
                        /* View mode */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <EditableField label="Full Name" value={session.name} icon={User} isEditing={false} />
                            <EditableField label="Roll Number" value={session.rollNo} icon={Hash} isEditing={false} />
                            <EditableField label="Year" value={session.year} icon={Calendar} isEditing={false} />
                            <EditableField label="Branch" value={session.branch} icon={BookOpen} isEditing={false} />
                            <EditableField label="College" value={session.college} icon={Building2} isEditing={false} />
                        </div>
                    ) : (
                        /* Edit mode */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <EditableField
                                label="Full Name" icon={User}
                                isEditing editValue={editForm.name}
                                onChange={v => setEditForm(p => ({ ...p, name: v }))}
                            />
                            {/* Roll No — read-only even in edit mode */}
                            <div>
                                <label className="block text-xs text-white/40 font-semibold uppercase tracking-widest mb-1.5">Roll Number</label>
                                <div className="w-full bg-black/30 border border-white/5 rounded-xl px-4 py-2.5 text-white/40 font-mono text-sm cursor-not-allowed">
                                    {session.rollNo}
                                    <span className="ml-2 text-[10px] text-white/20">(cannot be changed)</span>
                                </div>
                            </div>
                            <EditableField
                                label="Year" icon={Calendar}
                                isEditing editValue={editForm.year}
                                options={YEAR_OPTIONS}
                                onChange={v => setEditForm(p => ({ ...p, year: v }))}
                            />
                            <EditableField
                                label="Branch" icon={BookOpen}
                                isEditing editValue={editForm.branch}
                                options={BRANCH_OPTIONS}
                                onChange={v => setEditForm(p => ({ ...p, branch: v }))}
                            />
                            <div className="sm:col-span-2">
                                <EditableField
                                    label="College" icon={Building2}
                                    isEditing editValue={editForm.college}
                                    onChange={v => setEditForm(p => ({ ...p, college: v }))}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Badges ── */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Award className="w-6 h-6 text-teal-400" /> My Achievements
                    </h2>

                    {badges.length === 0 ? (
                        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
                            <Medal className="w-12 h-12 text-white/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No Badges Yet</h3>
                            <p className="text-white/50 text-sm max-w-md mx-auto">
                                Keep answering daily questions to build your streak, and participate in weekly contests to earn exclusive badges!
                            </p>
                            <Link href={`/placement-series/${eventId}`} className="inline-flex items-center gap-2 mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors text-white font-medium rounded-xl">
                                Start Solving <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {badges.map((badge) => (
                                <div key={badge.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 group hover:border-white/20 transition-all duration-300">
                                    {/* Top row: icon + type label */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 group-hover:border-teal-400/50 group-hover:shadow-[0_0_20px_rgba(45,212,191,0.2)] transition-all duration-300">
                                            {badge.badgeIcon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="inline-block text-[10px] font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 border border-teal-500/20 rounded-full px-2 py-0.5 mb-1">
                                                {badge.badgeType.replace(/_/g, ' ')}
                                            </span>
                                            <h3 className="text-base font-bold text-white truncate">{badge.badgeLabel}</h3>
                                            <p className="text-white/30 text-xs">
                                                Earned {new Date(badge.earnedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="border-t border-white/5 mb-4" />

                                    {/* Share button */}
                                    <button
                                        onClick={() => openShareModal(badge)}
                                        className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl bg-[#0A66C2]/10 hover:bg-[#0A66C2]/20 border border-[#0A66C2]/20 hover:border-[#0A66C2]/50 text-[#4d9de0] hover:text-white font-semibold text-sm transition-all duration-200"
                                    >
                                        <div className="w-5 h-5 rounded bg-[#0A66C2] flex items-center justify-center shrink-0">
                                            <span className="text-white font-black text-[10px] leading-none">in</span>
                                        </div>
                                        Share on LinkedIn
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>

        {/* LinkedIn Share Modal */}
        {shareModal && (
            <ShareModal
                badge={shareModal.badge}
                userName={shareModal.userName}
                onClose={() => setShareModal(null)}
            />
        )}
        </>
    );
}
