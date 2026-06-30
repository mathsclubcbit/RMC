"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ChevronRight, ChevronLeft, ChevronDown, Check,
    User, Mail, Phone, Hash, BookOpen, GraduationCap, Loader2,
    Code2, FileText, Megaphone, CalendarDays, Camera
} from "lucide-react";

// ─── Teams ────────────────────────────────────────────────────────────────────
const TEAMS = [
    {
        value: "WebDev",
        label: "Web Dev",
        description: "Build & maintain the club's digital presence",
        icon: Code2,
        symbol: "∑",
    },
    {
        value: "Content",
        label: "Content",
        description: "Design, write and create visual content",
        icon: FileText,
        symbol: "π",
    },
    {
        value: "PR",
        label: "PR",
        description: "Outreach, partnerships & communications",
        icon: Megaphone,
        symbol: "∞",
    },
    {
        value: "Events",
        label: "Events",
        description: "Plan and execute club events & workshops",
        icon: CalendarDays,
        symbol: "∫",
    },
    {
        value: "Visual Media",
        label: "Visual Media",
        description: "Capture and create visual experiences",
        icon: Camera,
        symbol: "Δ",
    },
];

// ─── Branch & Year Options ────────────────────────────────────────────────────
const BRANCHES = [
    { value: "CSE", label: "Computer Science & Engineering" },
    { value: "CSM", label: "AI & Machine Learning" },
    { value: "AIDS", label: "AI & Data Science" },
    { value: "IT", label: "Information Technology" },
    { value: "CIC", label: "Cyber Security & IOT" },
    { value: "ECE", label: "Electronics & Communication" },
    { value: "EVL", label: "Electronics & VLSI" },
    { value: "EEE", label: "Electrical & Electronics" },
    { value: "MECH", label: "Mechanical Engineering" },
    { value: "CIVIL", label: "Civil Engineering" },

];

const YEARS = [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
];

// ─── Shared styles ────────────────────────────────────────────────────────────
const inputCls =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white " +
    "placeholder-white/20 focus:outline-none focus:border-teal/50 focus:bg-white/10 " +
    "transition-all font-serif text-sm";

const labelCls =
    "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-teal/80 mb-3";

// ─── Team Card Picker ─────────────────────────────────────────────────────────
function TeamPicker({ value, onChange, error }) {
    // value is an array of team values e.g. ["WebDev", "PR"]
    const toggleTeam = (teamValue) => {
        if (value.includes(teamValue)) {
            // Remove it
            onChange(value.filter((v) => v !== teamValue));
        } else {
            // Add it to the end
            onChange([...value, teamValue]);
        }
    };

    return (
        <div>
            <p className={labelCls}>
                <Megaphone className="w-3 h-3" /> Team Preferences (Ranked)
                <span className="text-coral/70">*</span>
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TEAMS.map((team) => {
                    const Icon = team.icon;
                    const rankIndex = value.indexOf(team.value);
                    const isSelected = rankIndex !== -1;
                    const rank = rankIndex + 1; // 1-based rank

                    return (
                        <button
                            key={team.value}
                            type="button"
                            onClick={() => toggleTeam(team.value)}
                            className={
                                "relative flex flex-col items-center gap-2 p-4 rounded-xl border " +
                                "transition-all duration-200 text-center group " +
                                (isSelected
                                    ? "border-teal/60 bg-teal/10 shadow-[0_0_20px_rgba(58,188,179,0.12)]"
                                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]")
                            }
                        >
                            {/* Math symbol watermark */}
                            <span
                                className={
                                    "absolute top-2 right-2.5 font-serif text-base select-none transition-colors " +
                                    (isSelected ? "text-teal/30" : "text-white/10")
                                }
                            >
                                {team.symbol}
                            </span>

                            {/* Icon */}
                            <div
                                className={
                                    "w-9 h-9 rounded-lg flex items-center justify-center transition-all " +
                                    (isSelected
                                        ? "bg-teal/20 text-teal"
                                        : "bg-white/5 text-white/40 group-hover:text-white/70")
                                }
                            >
                                <Icon className="w-4 h-4" />
                            </div>

                            <span
                                className={
                                    "text-xs font-mono font-semibold leading-tight transition-colors " +
                                    (isSelected ? "text-teal" : "text-white/60 group-hover:text-white/90")
                                }
                            >
                                {team.label}
                            </span>

                            <p
                                className={
                                    "hidden sm:block text-[10px] leading-tight transition-colors " +
                                    (isSelected ? "text-teal/60" : "text-white/25")
                                }
                            >
                                {team.description}
                            </p>

                            {/* Rank badge */}
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md bg-teal flex items-center justify-center shadow-lg"
                                >
                                    <span className="text-[10px] font-bold text-black font-mono">{rank}</span>
                                </motion.div>
                            )}
                        </button>
                    );
                })}
            </div>

            {value.length > 0 && (
                <div className="mt-4 p-3 rounded-lg border border-teal/20 bg-teal/5 flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono text-teal/70 uppercase tracking-widest mr-1">Your Priority:</span>
                    {value.map((v, idx) => {
                        const teamLabel = TEAMS.find(t => t.value === v)?.label;
                        return (
                            <span key={v} className="text-xs font-serif text-white/90 flex items-center gap-1.5">
                                {idx > 0 && <span className="text-teal/40">→</span>}
                                <span className="text-teal font-mono font-bold">{idx + 1}.</span> {teamLabel}
                            </span>
                        );
                    })}
                </div>
            )}

            {error && <p className="mt-2 text-xs text-coral/80 font-mono">{error}</p>}
        </div>
    );
}

// ─── Custom Dropdown — inline accordion ───────────────────────────────────────
function MathSelect({ id, value, onChange, options, placeholder, error }) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <div
            id={id}
            className={
                "rounded-lg border transition-colors duration-200 overflow-hidden bg-white/5 " +
                (open ? "border-teal/50" : error ? "border-coral/40" : "border-white/10")
            }
        >
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={
                    "w-full flex items-center justify-between px-4 py-3 text-sm font-serif text-left transition-colors duration-200 " +
                    (open ? "border-b border-white/10" : "hover:bg-white/[0.06]")
                }
            >
                <span className={selected ? "text-white" : "text-white/25"}>
                    {selected ? selected.label : placeholder}
                </span>
                <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                    <ChevronDown
                        className={"w-4 h-4 flex-shrink-0 transition-colors " + (open ? "text-teal" : "text-white/30")}
                    />
                </motion.span>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="opts"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <div className="h-px bg-gradient-to-r from-transparent via-teal/30 to-transparent" />
                        <div
                            className="bg-[#070b11] max-h-52 overflow-y-auto"
                            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(45,212,191,0.2) transparent" }}
                        >
                            {options.map((opt, i) => {
                                const isSelected = opt.value === value;
                                return (
                                    <motion.button
                                        key={opt.value}
                                        type="button"
                                        initial={{ opacity: 0, x: -4 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.025, duration: 0.14 }}
                                        onClick={() => { onChange(opt.value); setOpen(false); }}
                                        className={
                                            "w-full flex items-center justify-between px-4 py-2.5 text-sm font-serif text-left " +
                                            "transition-all duration-150 border-b border-white/[0.04] last:border-0 " +
                                            (isSelected
                                                ? "bg-teal/10 text-teal"
                                                : "text-white/55 hover:bg-white/5 hover:text-white")
                                        }
                                    >
                                        <span>{opt.label}</span>
                                        {isSelected && <Check className="w-3.5 h-3.5 text-teal flex-shrink-0" />}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Dynamic field renderer ───────────────────────────────────────────────────
function DynamicField({ field, value, onChange, error }) {
    const { id, type, label, placeholder, options, minLength, maxLength } = field;

    const renderInput = () => {
        switch (type) {
            case "textarea":
                return (
                    <>
                        <textarea
                            id={`field-${id}`}
                            value={value || ""}
                            onChange={(e) => onChange(id, e.target.value)}
                            rows={4}
                            minLength={minLength}
                            maxLength={maxLength}
                            placeholder={placeholder || `Enter ${label}...`}
                            className={`${inputCls} resize-none`}
                        />
                        {(minLength || maxLength) && (
                            <p className="mt-1 text-[10px] font-mono text-white/30 text-right">
                                {String(value || "").length}
                                {maxLength ? ` / ${maxLength}` : ""} chars
                                {minLength ? ` (min ${minLength})` : ""}
                            </p>
                        )}
                    </>
                );

            case "select":
                return (
                    <MathSelect
                        id={`field-${id}`}
                        value={value || ""}
                        onChange={(v) => onChange(id, v)}
                        options={(options || []).map((o) => ({ value: o, label: o }))}
                        placeholder={`Select ${label}`}
                        error={error}
                    />
                );

            case "checkbox":
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(options || []).map((opt) => {
                            const checked = Array.isArray(value) && value.includes(opt);
                            return (
                                <label key={opt} className="flex items-center gap-3 cursor-pointer group/item">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={checked}
                                            onChange={() => {
                                                const arr = Array.isArray(value) ? value : [];
                                                onChange(id, checked ? arr.filter((v) => v !== opt) : [...arr, opt]);
                                            }}
                                        />
                                        <div className="w-4 h-4 border border-white/20 rounded-sm peer-checked:bg-teal peer-checked:border-teal transition-all" />
                                        {checked && <Check className="absolute top-0 left-0 w-4 h-4 text-black p-0.5" />}
                                    </div>
                                    <span className="text-white/60 text-sm font-serif group-hover/item:text-white transition-colors">{opt}</span>
                                </label>
                            );
                        })}
                    </div>
                );

            case "radio":
                return (
                    <div className="space-y-3">
                        {(options || []).map((opt) => (
                            <label key={opt} className="flex items-center gap-3 cursor-pointer group/item">
                                <div className="relative flex-shrink-0">
                                    <input type="radio" className="peer sr-only" checked={value === opt} onChange={() => onChange(id, opt)} />
                                    <div className="w-4 h-4 rounded-full border border-white/20 peer-checked:border-teal peer-checked:bg-teal/20 transition-all" />
                                    {value === opt && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal" />}
                                </div>
                                <span className="text-white/60 text-sm font-serif group-hover/item:text-white transition-colors">{opt}</span>
                            </label>
                        ))}
                    </div>
                );

            case "number":
                return (
                    <input
                        id={`field-${id}`}
                        type="number"
                        value={value || ""}
                        onChange={(e) => onChange(id, e.target.value)}
                        placeholder={placeholder || `Enter ${label}...`}
                        className={inputCls}
                    />
                );

            default:
                return (
                    <input
                        id={`field-${id}`}
                        type="text"
                        value={value || ""}
                        onChange={(e) => onChange(id, e.target.value)}
                        placeholder={placeholder || `Enter ${label}...`}
                        className={inputCls}
                    />
                );
        }
    };

    return (
        <div>
            <label className={labelCls} htmlFor={`field-${id}`}>
                {label}
                {field.required && <span className="text-coral/70 ml-1">*</span>}
            </label>
            {renderInput()}
            {error && <p className="mt-1 text-xs text-coral/80 font-mono">{error}</p>}
        </div>
    );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
    const symbols = ["α", "β", "γ", "δ", "ε"];
    return (
        <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-3">
                {Array.from({ length: total }).map((_, i) => (
                    <div key={i} className="flex-1 relative">
                        <div
                            className={
                                "h-[2px] rounded-full transition-all duration-700 " +
                                (i < current
                                    ? "bg-teal shadow-[0_0_8px_rgba(58,188,179,0.6)]"
                                    : i === current
                                        ? "bg-teal/40"
                                        : "bg-white/10")
                            }
                        />
                        {i === current && (
                            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-teal shadow-[0_0_8px_rgba(58,188,179,0.9)] animate-pulse" />
                        )}
                    </div>
                ))}
            </div>
            <p className="text-[10px] font-mono text-white/30">
                Step <span className="text-teal/60">{symbols[current] ?? current + 1}</span> of {total}
            </p>
        </div>
    );
}

// ─── Confirmation card ────────────────────────────────────────────────────────
function ConfirmationCard({ name, applicationId }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center py-8 sm:py-12"
        >
            <motion.div
                initial={{ scale: 0, rotate: -15 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 180 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-[0_0_40px_rgba(58,188,179,0.3)]"
            >
                <span className="text-teal text-3xl sm:text-4xl font-serif select-none">∑</span>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-teal/60 mb-3">Application Received</p>
                <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-white mb-3">Thank you, {name}.</h2>
                <p className="text-white/50 font-sans text-sm leading-relaxed max-w-sm mx-auto mb-6 sm:mb-8 px-2">
                    Your application to join the Ramanujan Math Club has been submitted.
                    The council will review it and notify you by email.
                </p>

                <div className="inline-block border border-teal/20 bg-teal/5 rounded-lg px-5 sm:px-6 py-4 mb-6 sm:mb-8">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">Reference ID</p>
                    <p className="font-mono text-teal text-base sm:text-lg tracking-widest">{applicationId.toUpperCase().slice(0, 8)}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center px-2">
                    <a href="/join/status" className="px-5 sm:px-6 py-3 border border-teal/30 text-teal text-xs font-mono uppercase tracking-widest rounded-lg hover:bg-teal/10 transition-all text-center">
                        Check Status →
                    </a>
                    <a href="/" className="px-5 sm:px-6 py-3 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-widest rounded-lg hover:bg-white/5 transition-all text-center">
                        Return Home
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main form ────────────────────────────────────────────────────────────────
export default function RecruitmentForm({ schema, academicYear }) {
    // team is stored in extraFields on submit — no DB migration needed
    const [core, setCore] = useState({ name: "", email: "", phone: "", rollNumber: "", branch: "", year: "" });
    const [team, setTeam] = useState([]);
    const [extra, setExtra] = useState({});
    const [errors, setErrors] = useState({});

    const totalSteps = 2 + (schema.length > 0 ? 1 : 0) + 1;
    const STEP_PERSONAL = 0;
    const STEP_ACADEMIC = 1;
    const STEP_DYNAMIC = 2;
    const STEP_REVIEW = schema.length > 0 ? 3 : 2;

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [applicationId, setApplicationId] = useState("");
    const [apiError, setApiError] = useState("");

    const updateCore = (key, val) => {
        setCore((p) => ({ ...p, [key]: val }));
        setErrors((p) => ({ ...p, [key]: "" }));
    };
    const updateExtra = (id, val) => {
        setExtra((p) => ({ ...p, [id]: val }));
        setErrors((p) => ({ ...p, [id]: "" }));
    };

    const validateStep = (s) => {
        const errs = {};
        if (s === STEP_PERSONAL) {
            if (!core.name.trim()) errs.name = "Name is required.";
            if (!core.email.trim()) errs.email = "Email is required.";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(core.email)) errs.email = "Invalid email address.";
            if (!core.phone.trim()) errs.phone = "Phone number is required.";
            else if (!/^[0-9]{10}$/.test(core.phone.replace(/\s/g, ""))) errs.phone = "Must be exactly 10 digits.";
            if (team.length === 0) errs.team = "Please select at least one team preference.";
        }
        if (s === STEP_ACADEMIC) {
            if (!core.rollNumber.trim()) errs.rollNumber = "Roll number is required.";
            else if (!/^\d{12}$/.test(core.rollNumber)) errs.rollNumber = "Must be exactly 12 digits.";
            if (!core.branch) errs.branch = "Please select your branch.";
            if (!core.year) errs.year = "Please select your year.";
        }
        if (s === STEP_DYNAMIC && schema.length > 0) {
            for (const field of schema) {
                if (!field.required) continue;
                const val = extra[field.id];
                const empty = val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0);
                if (empty) errs[field.id] = `${field.label} is required.`;
                else if ((field.type === "textarea" || field.type === "text") && field.minLength && String(val).length < field.minLength)
                    errs[field.id] = `Minimum ${field.minLength} characters required.`;
            }
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const goNext = () => { if (!validateStep(step)) return; setDirection(1); setStep((s) => s + 1); };
    const goBack = () => { setDirection(-1); setStep((s) => s - 1); };

    const handleSubmit = async () => {
        setSubmitting(true);
        setApiError("");
        try {
            const res = await fetch("/api/recruitment/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: core.name.trim(),
                    email: core.email.trim(),
                    phone: core.phone.trim(),
                    rollNumber: core.rollNumber.trim(),
                    branch: core.branch,
                    year: core.year,
                    team: team.map((t, idx) => `${idx + 1}. ${TEAMS.find(x => x.value === t)?.label || t}`).join(" | "),
                    extraFields: extra,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setApiError(data.message || data.error || "Submission failed. Please try again.");
                return;
            }
            setApplicationId(data.applicationId);
            setSubmitted(true);
        } catch {
            setApiError("Network error. Please check your connection and try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
    };

    if (submitted) return <ConfirmationCard name={core.name} applicationId={applicationId} />;

    const getStepMeta = () => {
        if (step === STEP_PERSONAL) return { title: "Personal Details", sub: "Step 1 — Tell us who you are" };
        if (step === STEP_ACADEMIC) return { title: "Academic Details", sub: "Step 2 — Your academic profile" };
        if (schema.length > 0 && step === STEP_DYNAMIC) return { title: "Your Profile", sub: "Step 3 — A few more questions" };
        return { title: "Review & Submit", sub: "Verify your answers before submitting" };
    };
    const { title: stepTitle, sub: stepSub } = getStepMeta();

    return (
        <div>
            <ProgressBar current={step} total={totalSteps} />

            <motion.div
                key={step + "-label"}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8"
            >
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-teal/50 mb-1">{stepSub}</p>
                <h2 className="font-serif text-xl sm:text-2xl md:text-3xl text-white">{stepTitle}</h2>
            </motion.div>

            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* ── STEP 0 — Personal + Team ── */}
                    {step === STEP_PERSONAL && (
                        <div className="space-y-5 sm:space-y-6">
                            <div>
                                <label className={labelCls} htmlFor="name">
                                    <User className="w-3 h-3" /> Full Name <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={core.name}
                                    onChange={(e) => updateCore("name", e.target.value)}
                                    placeholder="Your full name"
                                    className={inputCls}
                                />
                                {errors.name && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.name}</p>}
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="email">
                                    <Mail className="w-3 h-3" /> Email Address <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={core.email}
                                    onChange={(e) => updateCore("email", e.target.value)}
                                    placeholder="you@example.com"
                                    className={inputCls}
                                />
                                {errors.email && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.email}</p>}
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="phone">
                                    <Phone className="w-3 h-3" /> Phone Number <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={core.phone}
                                    onChange={(e) => updateCore("phone", e.target.value)}
                                    placeholder="10-digit mobile number"
                                    className={inputCls}
                                    maxLength={10}
                                    inputMode="numeric"
                                />
                                {errors.phone && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.phone}</p>}
                            </div>

                            {/* Team picker */}
                            <TeamPicker
                                value={team}
                                onChange={(v) => { setTeam(v); setErrors((p) => ({ ...p, team: "" })); }}
                                error={errors.team}
                            />
                        </div>
                    )}

                    {/* ── STEP 1 — Academic ── */}
                    {step === STEP_ACADEMIC && (
                        <div className="space-y-5 sm:space-y-6">
                            <div>
                                <label className={labelCls} htmlFor="rollNumber">
                                    <Hash className="w-3 h-3" /> Roll Number <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="rollNumber"
                                    type="text"
                                    value={core.rollNumber}
                                    onChange={(e) => updateCore("rollNumber", e.target.value)}
                                    placeholder="12-digit roll number"
                                    className={inputCls}
                                    maxLength={12}
                                    inputMode="numeric"
                                />
                                {errors.rollNumber && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.rollNumber}</p>}
                            </div>

                            <div>
                                <label className={labelCls}>
                                    <GraduationCap className="w-3 h-3" /> Branch <span className="text-coral/70">*</span>
                                </label>
                                <MathSelect
                                    id="branch"
                                    value={core.branch}
                                    onChange={(v) => updateCore("branch", v)}
                                    options={BRANCHES}
                                    placeholder="Select your branch"
                                    error={errors.branch}
                                />
                                {errors.branch && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.branch}</p>}
                            </div>

                            <div>
                                <label className={labelCls}>
                                    <BookOpen className="w-3 h-3" /> Year of Study <span className="text-coral/70">*</span>
                                </label>
                                <MathSelect
                                    id="year"
                                    value={core.year}
                                    onChange={(v) => updateCore("year", v)}
                                    options={YEARS}
                                    placeholder="Select your year"
                                    error={errors.year}
                                />
                                {errors.year && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.year}</p>}
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2 — Dynamic schema fields ── */}
                    {schema.length > 0 && step === STEP_DYNAMIC && (
                        <div className="space-y-6 sm:space-y-8">
                            {schema.map((field) => (
                                <DynamicField
                                    key={field.id}
                                    field={field}
                                    value={extra[field.id]}
                                    onChange={updateExtra}
                                    error={errors[field.id]}
                                />
                            ))}
                        </div>
                    )}

                    {/* ── STEP REVIEW ── */}
                    {step === STEP_REVIEW && (
                        <div className="space-y-4 sm:space-y-6">
                            <p className="text-center font-serif text-white/20 text-base sm:text-lg tracking-widest select-none">
                                ∫ ∑ π ∂ √
                            </p>

                            <div className="border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden">
                                {[
                                    { label: "Full Name", value: core.name },
                                    { label: "Email Address", value: core.email },
                                    { label: "Phone Number", value: core.phone },
                                    { label: "Roll Number", value: core.rollNumber },
                                    { label: "Branch", value: BRANCHES.find((b) => b.value === core.branch)?.label || core.branch },
                                    { label: "Year of Study", value: YEARS.find((y) => y.value === core.year)?.label || core.year },
                                    { label: "Team Preferences", value: team.length > 0 ? team.map((t, idx) => `${idx + 1}. ${TEAMS.find(x => x.value === t)?.label || t}`).join(" → ") : "—" },
                                    ...schema.map((f) => {
                                        const val = extra[f.id];
                                        return { label: f.label, value: Array.isArray(val) ? val.join(", ") : String(val || "—") };
                                    }),
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex justify-between items-start gap-3 sm:gap-4 px-4 sm:px-5 py-3 hover:bg-white/5 transition-colors"
                                    >
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 flex-shrink-0 pt-0.5 min-w-[80px]">
                                            {label}
                                        </span>
                                        <span className="text-sm font-serif text-white/80 text-right break-words min-w-0">
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {apiError && (
                                <div className="p-4 border border-coral/20 bg-coral/5 rounded-lg">
                                    <p className="text-coral/80 text-xs font-mono">{apiError}</p>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* ── Navigation ── */}
            <div className={"mt-8 sm:mt-10 flex items-center " + (step > 0 ? "justify-between" : "justify-end")}>
                {step > 0 && (
                    <button
                        onClick={goBack}
                        className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 border border-white/10 text-white/50
                                   text-xs font-mono uppercase tracking-widest rounded-lg hover:bg-white/5 hover:text-white
                                   transition-all touch-manipulation"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="hidden xs:inline">Back</span>
                    </button>
                )}

                {step < STEP_REVIEW ? (
                    <button
                        onClick={goNext}
                        className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-teal/10 border border-teal/30 text-teal
                                   text-xs font-mono uppercase tracking-widest rounded-lg hover:bg-teal hover:text-black
                                   transition-all duration-300 shadow-[0_0_20px_rgba(58,188,179,0.1)]
                                   hover:shadow-[0_0_30px_rgba(58,188,179,0.4)] group touch-manipulation"
                    >
                        Continue
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-white text-black text-xs font-bold font-mono
                                   uppercase tracking-widest rounded-lg hover:bg-teal hover:text-black transition-all duration-300
                                   shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(58,188,179,0.4)]
                                   disabled:opacity-50 touch-manipulation"
                    >
                        {submitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                            : <>Submit Application <ChevronRight className="w-4 h-4" /></>
                        }
                    </button>
                )}
            </div>
        </div>
    );
}
