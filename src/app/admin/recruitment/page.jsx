"use client";

// Auth is enforced server-side via the admin layout — no additional guard needed here.
// The /admin/layout.jsx wraps all admin routes with authentication.

import { useState, useEffect, useCallback } from "react";
import {
    Users, Settings, LayoutList, Search, Check, X, ChevronRight,
    Plus, Trash2, GripVertical, ArrowUp, ArrowDown, ToggleLeft, ToggleRight,
    Loader2, RefreshCw, ChevronDown, Eye, Filter, ListTodo, Upload, Send
} from "lucide-react";

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
    { id: "applications", label: "Applications", icon: Users },
    { id: "form-builder", label: "Form Builder", icon: LayoutList },
    { id: "settings", label: "Settings", icon: Settings },
];

// ─── Field Types ──────────────────────────────────────────────────────────────
const FIELD_TYPES = [
    { value: "text", label: "Short Text" },
    { value: "textarea", label: "Long Text" },
    { value: "select", label: "Dropdown" },
    { value: "checkbox", label: "Checkboxes (multi-select)" },
    { value: "radio", label: "Radio Buttons (single)" },
    { value: "number", label: "Number" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
const statBadge = (status) => {
    const map = {
        PENDING: "bg-orange/10 text-orange border-orange/20",
        APPROVED: "bg-teal/10 text-teal border-teal/20",
        REJECTED: "bg-coral/10 text-coral border-coral/20",
    };
    return map[status] || "bg-white/10 text-white/50 border-white/10";
};

function SectionCard({ children, className = "" }) {
    return (
        <div className={`rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl overflow-hidden ${className}`}>
            {children}
        </div>
    );
}

// ─── Application Drawer ───────────────────────────────────────────────────────
function ApplicationDrawer({ app, onClose, onDecision }) {
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState("");

    const decide = async (status) => {
        setSubmitting(true);
        setErr("");
        try {
            const res = await fetch("/api/admin/recruitment", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: app.id, status }),
            });
            const data = await res.json();
            if (!res.ok) { setErr(data.error || "Failed"); return; }
            onDecision(app.id, status);
            onClose();
        } catch { setErr("Network error."); }
        finally { setSubmitting(false); }
    };

    const formatDate = (iso) => iso ? new Date(iso).toLocaleString("en-IN") : "—";

    const rows = [
        { label: "Email", value: app.email },
        { label: "Phone", value: app.phone },
        { label: "Roll No.", value: app.roll_number },
        { label: "Branch", value: app.branch },
        { label: "Year", value: `Year ${app.year}` },
        { label: "Team", value: app.team },
        { label: "Applied", value: formatDate(app.applied_at) },
        { label: "Academic Year", value: app.academic_year },
    ];

    const extra = app.extra_fields || {};

    return (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
            <div
                className="w-full max-w-md h-full bg-[#0a0a0a] border-l border-white/10 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30">Application</p>
                        <h2 className="text-lg font-semibold text-white">{app.name}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition text-white/50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Status badge */}
                <div className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-mono border ${statBadge(app.status)}`}>
                        {app.status}
                    </span>
                </div>

                {/* Core details */}
                <div className="px-6 pb-4">
                    <div className="rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                        {rows.map(({ label, value }) => (
                            <div key={label} className="flex justify-between gap-4 px-4 py-3">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-white/30">{label}</span>
                                <span className="text-sm font-serif text-white/70 text-right break-all">{value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Extra fields */}
                {Object.keys(extra).length > 0 && (
                    <div className="px-6 pb-4">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Custom Fields</p>
                        <div className="rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                            {Object.entries(extra).map(([key, val]) => (
                                <div key={key} className="px-4 py-3">
                                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">{key}</p>
                                    <p className="text-sm font-serif text-white/70">
                                        {Array.isArray(val) ? val.join(", ") || "—" : String(val || "—")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Task Responses */}
                {app.task_responses && (
                    <div className="px-6 pb-4">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Task Submission</p>
                        <div className="rounded-2xl border border-white/10 overflow-hidden divide-y divide-white/5 bg-white/[0.02]">
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">Why do you want to join RMC?</p>
                                <p className="text-sm font-serif text-white/70 whitespace-pre-wrap">
                                    {app.task_responses.why_join || "—"}
                                </p>
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">Why this team?</p>
                                <p className="text-sm font-serif text-white/70 whitespace-pre-wrap">
                                    {app.task_responses.why_team || "—"}
                                </p>
                            </div>
                            <div className="px-4 py-3">
                                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">Drive Link</p>
                                {app.task_responses.drive_link ? (
                                    <a href={app.task_responses.drive_link} target="_blank" rel="noreferrer" className="text-sm text-teal hover:underline break-all">
                                        {app.task_responses.drive_link}
                                    </a>
                                ) : (
                                    <p className="text-sm font-serif text-white/70">—</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                {app.status === "PENDING" && (
                    <div className="px-6 pb-4">
                        {err && <p className="text-xs text-red-400 mt-1 mb-3">{err}</p>}

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => decide("APPROVED")}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal/10 border border-teal/30
                                           text-teal text-xs font-mono rounded-xl hover:bg-teal hover:text-black transition-all disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Approve
                            </button>
                            <button
                                onClick={() => decide("REJECTED")}
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-coral/10 border border-coral/30
                                           text-coral text-xs font-mono rounded-xl hover:bg-coral hover:text-white transition-all disabled:opacity-50"
                            >
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                                Reject
                            </button>
                        </div>
                    </div>
                )}

                {/* Already reviewed info */}
                {app.status !== "PENDING" && (
                    <div className="px-6 pb-6">
                        <div className={`p-4 rounded-xl border ${statBadge(app.status)}`}>
                            <p className="text-xs font-mono">
                                {app.status === "APPROVED" ? "✅ Application approved." : "❌ Application rejected."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────
function ApplicationsTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [teamFilter, setTeamFilter] = useState("ALL");
    const [selected, setSelected] = useState(null);
    const [page, setPage] = useState(1);

    const fetchApps = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20, status: statusFilter, team: teamFilter, search });
            const res = await fetch(`/api/admin/recruitment?${params}`);
            const json = await res.json();
            setData(json);
        } catch { console.error("Failed to fetch applications"); }
        finally { setLoading(false); }
    }, [page, statusFilter, teamFilter, search]);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const handleDecision = (id, status) => {
        setData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                applications: prev.applications.map((a) =>
                    a.id === id ? { ...a, status } : a
                ),
            };
        });
    };

    const summary = data?.summary || {};

    return (
        <div>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total", value: summary.total ?? 0, color: "text-white/80" },
                    { label: "Pending", value: summary.pending ?? 0, color: "text-orange" },
                    { label: "Approved", value: summary.approved ?? 0, color: "text-teal" },
                    { label: "Rejected", value: summary.rejected ?? 0, color: "text-coral" },
                ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
                        <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">{label}</p>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                        type="text"
                        placeholder="Search name, email, roll no..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                                   placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                               focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                    {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                        <option key={s} value={s} className="bg-black">{s}</option>
                    ))}
                </select>
                <select
                    value={teamFilter}
                    onChange={(e) => { setTeamFilter(e.target.value); setPage(1); }}
                    className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                               focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                    <option value="ALL" className="bg-black">All Teams</option>
                    <option value="WebDev" className="bg-black">Web Dev</option>
                    <option value="Content & Media" className="bg-black">Content & Media</option>
                    <option value="PR" className="bg-black">PR</option>
                    <option value="Events" className="bg-black">Events</option>
                </select>
                <button onClick={fetchApps} className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition">
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Table */}
            <SectionCard>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-white/30" />
                    </div>
                ) : (data?.applications?.length ?? 0) === 0 ? (
                    <div className="text-center py-16 text-white/30 text-sm">No applications found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {["Name", "Email", "Roll No.", "Branch", "Year", "Team", "Status", "Applied", ""].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-mono uppercase tracking-widest text-white/30">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.applications.map((app) => (
                                    <tr
                                        key={app.id}
                                        className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                                        onClick={() => setSelected(app)}
                                    >
                                        <td className="px-4 py-3 font-medium text-white/80">{app.name}</td>
                                        <td className="px-4 py-3 text-white/50 max-w-[180px] truncate">{app.email}</td>
                                        <td className="px-4 py-3 font-mono text-white/50 text-xs">{app.roll_number}</td>
                                        <td className="px-4 py-3 text-white/50">{app.branch}</td>
                                        <td className="px-4 py-3 text-white/50">Y{app.year}</td>
                                        <td className="px-4 py-3 font-medium text-teal/80">{app.team}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono border ${statBadge(app.status)}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-white/30 text-xs">
                                            {new Date(app.applied_at).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Eye className="w-4 h-4 text-white/20 hover:text-white transition" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </SectionCard>

            {/* Pagination */}
            {(data?.total ?? 0) > 20 && (
                <div className="flex justify-center gap-3 mt-4">
                    <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                        className="px-4 py-2 text-xs font-mono text-white/50 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition">
                        ← Prev
                    </button>
                    <span className="px-4 py-2 text-xs font-mono text-white/30">Page {page}</span>
                    <button onClick={() => setPage((p) => p + 1)} disabled={data.applications?.length < 20}
                        className="px-4 py-2 text-xs font-mono text-white/50 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition">
                        Next →
                    </button>
                </div>
            )}

            {selected && (
                <ApplicationDrawer
                    app={selected}
                    onClose={() => setSelected(null)}
                    onDecision={handleDecision}
                />
            )}
        </div>
    );
}

// ─── Field Editor Row ─────────────────────────────────────────────────────────
function FieldEditor({ field, index, total, onChange, onDelete, onMove }) {
    const [expanded, setExpanded] = useState(false);
    const needsOptions = ["select", "checkbox", "radio"].includes(field.type);

    const update = (key, val) => onChange(index, { ...field, [key]: val });

    const addOption = () => update("options", [...(field.options || []), ""]);
    const removeOption = (i) => update("options", (field.options || []).filter((_, idx) => idx !== i));
    const updateOption = (i, val) => {
        const opts = [...(field.options || [])];
        opts[i] = val;
        update("options", opts);
    };

    return (
        <div className="border border-white/10 rounded-2xl overflow-hidden bg-white/[0.02]">
            {/* Header */}
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex flex-col gap-1 text-white/20 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{field.label || "Untitled Field"}</p>
                    <p className="text-[10px] font-mono text-white/30 uppercase">{field.type}</p>
                </div>

                {field.required && (
                    <span className="text-[10px] font-mono text-coral/60 border border-coral/20 rounded px-1.5 py-0.5">required</span>
                )}

                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}
                        className="p-1 text-white/30 hover:text-white disabled:opacity-20 transition">
                        <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onMove(index, 1); }} disabled={index === total - 1}
                        className="p-1 text-white/30 hover:text-white disabled:opacity-20 transition">
                        <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(index); }}
                        className="p-1 text-white/30 hover:text-coral transition">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </div>
            </div>

            {/* Expanded editor */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-white/5 space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Label</label>
                            <input
                                value={field.label}
                                onChange={(e) => update("label", e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm
                                           focus:outline-none focus:border-indigo-500/50"
                                placeholder="Field label"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Type</label>
                            <select
                                value={field.type}
                                onChange={(e) => update("type", e.target.value)}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm
                                           focus:outline-none focus:border-indigo-500/50 appearance-none"
                            >
                                {FIELD_TYPES.map((t) => (
                                    <option key={t.value} value={t.value} className="bg-black">{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Placeholder</label>
                        <input
                            value={field.placeholder || ""}
                            onChange={(e) => update("placeholder", e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm
                                       focus:outline-none focus:border-indigo-500/50"
                            placeholder="Hint text for the user"
                        />
                    </div>

                    {(field.type === "text" || field.type === "textarea") && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Min Length</label>
                                <input type="number" min={0}
                                    value={field.minLength || ""}
                                    onChange={(e) => update("minLength", e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm
                                               focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Max Length</label>
                                <input type="number" min={0}
                                    value={field.maxLength || ""}
                                    onChange={(e) => update("maxLength", e.target.value ? Number(e.target.value) : undefined)}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm
                                               focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>
                    )}

                    {needsOptions && (
                        <div>
                            <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-2">Options</label>
                            <div className="space-y-2">
                                {(field.options || []).map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input
                                            value={opt}
                                            onChange={(e) => updateOption(i, e.target.value)}
                                            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm
                                                       focus:outline-none focus:border-indigo-500/50"
                                            placeholder={`Option ${i + 1}`}
                                        />
                                        <button onClick={() => removeOption(i)}
                                            className="p-2 text-white/30 hover:text-coral transition">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={addOption}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-mono text-white/40 border border-dashed
                                               border-white/10 rounded-lg hover:border-white/30 hover:text-white transition w-full justify-center">
                                    <Plus className="w-3.5 h-3.5" /> Add Option
                                </button>
                            </div>
                        </div>
                    )}

                    <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                            <input type="checkbox" className="peer sr-only"
                                checked={field.required || false}
                                onChange={(e) => update("required", e.target.checked)}
                            />
                            <div className="w-4 h-4 border border-white/20 rounded peer-checked:bg-indigo-500 peer-checked:border-indigo-500 transition" />
                            {field.required && <Check className="absolute top-0 left-0 w-4 h-4 text-white p-0.5" />}
                        </div>
                        <span className="text-sm text-white/60">Required field</span>
                    </label>
                </div>
            )}
        </div>
    );
}

// ─── Form Builder Tab ─────────────────────────────────────────────────────────
function FormBuilderTab() {
    const [schema, setSchema] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/admin/recruitment/settings")
            .then((r) => r.json())
            .then((d) => { setSchema(d.schema || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const addField = () => {
        const newField = {
            id: `field_${Date.now()}`,
            type: "text",
            label: "New Field",
            placeholder: "",
            required: false,
            options: [],
        };
        setSchema((s) => [...s, newField]);
    };

    const updateField = (index, updated) => {
        setSchema((s) => s.map((f, i) => (i === index ? updated : f)));
    };

    const deleteField = (index) => {
        setSchema((s) => s.filter((_, i) => i !== index));
    };

    const moveField = (index, direction) => {
        setSchema((s) => {
            const arr = [...s];
            const newIdx = index + direction;
            if (newIdx < 0 || newIdx >= arr.length) return arr;
            [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
            return arr;
        });
    };

    const save = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/admin/recruitment/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ schema }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Save failed"); return; }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { setError("Network error."); }
        finally { setSaving(false); }
    };

    if (loading) {
        return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>;
    }

    return (
        <div>
            {/* Locked core fields info */}
            <div className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">
                    🔒 Core Fields — Always Collected (Locked)
                </p>
                <div className="flex flex-wrap gap-2">
                    {["Full Name", "Email", "Phone", "Roll Number", "Branch", "Year"].map((f) => (
                        <span key={f} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white/40 text-xs font-mono">
                            {f}
                        </span>
                    ))}
                </div>
            </div>

            {/* Custom fields */}
            <div className="space-y-3 mb-6">
                {schema.length === 0 && (
                    <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl text-white/30 text-sm">
                        No custom fields yet. Add one below.
                    </div>
                )}
                {schema.map((field, i) => (
                    <FieldEditor
                        key={field.id}
                        field={field}
                        index={i}
                        total={schema.length}
                        onChange={updateField}
                        onDelete={deleteField}
                        onMove={moveField}
                    />
                ))}
            </div>

            <button
                onClick={addField}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-white/20
                           rounded-2xl text-white/40 text-sm font-mono hover:border-indigo-500/50 hover:text-indigo-400 transition mb-8"
            >
                <Plus className="w-4 h-4" /> Add Custom Field
            </button>

            {error && <p className="text-xs text-red-400 font-mono mb-4">{error}</p>}

            <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-500 text-white text-xs font-mono uppercase
                           tracking-widest rounded-xl hover:bg-indigo-400 transition disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                {saved ? "Saved!" : "Save Schema"}
            </button>
        </div>
    );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function SettingsTab() {
    const [isOpen, setIsOpen] = useState(true);
    const [academicYear, setAcademicYear] = useState("2025-26");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetch("/api/admin/recruitment/settings")
            .then((r) => r.json())
            .then((d) => {
                setIsOpen(d.isOpen ?? true);
                setAcademicYear(d.academicYear ?? "2025-26");
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const save = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/admin/recruitment/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOpen, academicYear }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Failed"); return; }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch { setError("Network error."); }
        finally { setSaving(false); }
    };

    if (loading) {
        return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>;
    }

    return (
        <div className="max-w-lg space-y-8">
            {/* Recruitment toggle */}
            <SectionCard>
                <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-white/90">Recruitment Status</h3>
                        <p className="text-xs text-white/40 mt-0.5">Controls whether the /join form is visible to students</p>
                    </div>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-all duration-300
                            ${isOpen
                                ? "bg-teal/10 border border-teal/30 text-teal hover:bg-teal hover:text-black"
                                : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"}`}
                    >
                        {isOpen ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {isOpen ? "OPEN" : "CLOSED"}
                    </button>
                </div>
                <div className="px-6 py-4">
                    <div className={`p-3 rounded-xl text-xs font-sans ${isOpen ? "bg-teal/5 border border-teal/20 text-teal/70" : "bg-coral/5 border border-coral/20 text-coral/70"}`}>
                        {isOpen
                            ? "✅ Students can currently see and submit the join form."
                            : "🔒 The join form is hidden. Students will see a 'Recruitment Closed' message."}
                    </div>
                </div>
            </SectionCard>

            {/* Academic year */}
            <SectionCard>
                <div className="px-6 py-5 border-b border-white/5">
                    <h3 className="font-semibold text-white/90">Academic Year</h3>
                    <p className="text-xs text-white/40 mt-0.5">All new applications will be tagged with this year</p>
                </div>
                <div className="px-6 py-4">
                    <input
                        type="text"
                        value={academicYear}
                        onChange={(e) => setAcademicYear(e.target.value)}
                        placeholder="e.g. 2025-26"
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm
                                   focus:outline-none focus:border-indigo-500/50 font-mono"
                    />
                </div>
            </SectionCard>

            {error && <p className="text-xs text-red-400 font-mono">{error}</p>}

            <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-indigo-500 text-white text-xs font-mono uppercase
                           tracking-widest rounded-xl hover:bg-indigo-400 transition disabled:opacity-50"
            >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
                {saved ? "Saved!" : "Save Settings"}
            </button>
        </div>
    );
}// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RecruitmentAdminPage() {
    const [activeTab, setActiveTab] = useState("applications");

    return (
        <div className="min-h-[100dvh] bg-black text-white relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.15),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.15),transparent_55%)]" />
                <div className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px]" />
            </div>

            <div className="relative z-10 px-4 py-8 md:py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <header className="mb-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono text-white/70 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.9)]" />
                            Admin Console
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            Recruitment<span className="text-indigo-500">.</span>
                        </h1>
                        <p className="mt-2 text-white/50 max-w-xl text-sm">
                            Manage applications, build your intake form, and control the recruitment cycle.
                        </p>
                    </header>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 border-b border-white/10 pb-0">
                        {TABS.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                onClick={() => setActiveTab(id)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px
                                    ${activeTab === id
                                        ? "border-indigo-500 text-indigo-300"
                                        : "border-transparent text-white/40 hover:text-white hover:border-white/20"}`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    {activeTab === "applications" && <ApplicationsTab />}
                    {activeTab === "form-builder" && <FormBuilderTab />}
                    {activeTab === "settings" && <SettingsTab />}
                </div>
            </div>
        </div>
    );
}
