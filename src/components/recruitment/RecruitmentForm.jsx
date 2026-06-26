"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, User, Mail, Phone, Hash, BookOpen, Terminal, Loader2 } from "lucide-react";
import SpotlightCard from "@/components/ui/SpotlightCard";
import { useRouter } from "next/navigation";

// ─── Branch & Year Options ────────────────────────────────────────────────────
const BRANCHES = [
    { value: "CSE", label: "Computer Science & Engineering" },
    { value: "ECE", label: "Electronics & Communication" },
    { value: "EEE", label: "Electrical & Electronics" },
    { value: "IT", label: "Information Technology" },
    { value: "MECH", label: "Mechanical Engineering" },
    { value: "CIVIL", label: "Civil Engineering" },
    { value: "AI-ML", label: "AI & Machine Learning" },
    { value: "AIDS", label: "AI & Data Science" },
];

const YEARS = [
    { value: "1", label: "Year 1 — Initiate" },
    { value: "2", label: "Year 2 — Associate" },
    { value: "3", label: "Year 3 — Fellow" },
    { value: "4", label: "Year 4 — Senior Fellow" },
];

// ─── Input Styles ─────────────────────────────────────────────────────────────
const inputCls =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/20 " +
    "focus:outline-none focus:border-teal/50 focus:bg-white/10 transition-all font-serif text-sm";

const labelCls =
    "flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-teal/80 mb-3";

// ─── Field Renderer ───────────────────────────────────────────────────────────
function DynamicField({
    field,
    value,
    onChange,
    error,
}) {
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
                    <select
                        id={`field-${id}`}
                        value={value || ""}
                        onChange={(e) => onChange(id, e.target.value)}
                        className={`${inputCls} appearance-none`}
                    >
                        <option value="">Select an option</option>
                        {(options || []).map((opt) => (
                            <option key={opt} value={opt} className="bg-black">
                                {opt}
                            </option>
                        ))}
                    </select>
                );

            case "checkbox":
                return (
                    <div className="grid sm:grid-cols-2 gap-3">
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
                                        {checked && (
                                            <Check className="absolute top-0 left-0 w-4 h-4 text-black p-0.5" />
                                        )}
                                    </div>
                                    <span className="text-white/60 text-sm font-serif group-hover/item:text-white transition-colors">
                                        {opt}
                                    </span>
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
                                    <input
                                        type="radio"
                                        className="peer sr-only"
                                        checked={value === opt}
                                        onChange={() => onChange(id, opt)}
                                    />
                                    <div className="w-4 h-4 rounded-full border border-white/20 peer-checked:border-teal peer-checked:bg-teal/20 transition-all" />
                                    {value === opt && (
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-teal" />
                                    )}
                                </div>
                                <span className="text-white/60 text-sm font-serif group-hover/item:text-white transition-colors">
                                    {opt}
                                </span>
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

            default: // text
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

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
    return (
        <div className="flex items-center gap-2 mb-10">
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} className="flex-1 relative">
                    <div
                        className={`h-[2px] rounded-full transition-all duration-700 ${i < current
                            ? "bg-teal shadow-[0_0_8px_rgba(58,188,179,0.6)]"
                            : i === current
                                ? "bg-teal/40"
                                : "bg-white/10"
                            }`}
                    />
                    {i === current && (
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 rounded-full bg-teal shadow-[0_0_8px_rgba(58,188,179,0.9)] animate-pulse" />
                    )}
                </div>
            ))}
            <span className="text-[10px] font-mono text-teal/60 ml-2 whitespace-nowrap">
                {current + 1}/{total}
            </span>
        </div>
    );
}

// ─── Confirmation Card ────────────────────────────────────────────────────────
function ConfirmationCard({ name, applicationId }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center py-12"
        >
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-teal/10 border border-teal/30 flex items-center justify-center mx-auto mb-8
                           shadow-[0_0_40px_rgba(58,188,179,0.3)]"
            >
                <Check className="w-10 h-10 text-teal" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-teal/60 mb-3">
                    Transmission Complete
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-white mb-3">
                    Welcome, {name}.
                </h2>
                <p className="text-white/50 font-sans text-sm leading-relaxed max-w-sm mx-auto mb-8">
                    Your application to join the Ramanujan Math Club has been received.
                    The council will review your submission and notify you via email.
                </p>

                <div className="inline-block border border-teal/20 bg-teal/5 rounded-lg px-6 py-4 mb-8">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
                        Reference ID
                    </p>
                    <p className="font-mono text-teal text-lg tracking-widest">
                        {applicationId.toUpperCase().slice(0, 8)}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                        href="/join/status"
                        className="px-6 py-3 border border-teal/30 text-teal text-xs font-mono uppercase tracking-widest rounded-lg
                                   hover:bg-teal/10 transition-all"
                    >
                        Track Status →
                    </a>
                    <a
                        href="/"
                        className="px-6 py-3 border border-white/10 text-white/50 text-xs font-mono uppercase tracking-widest rounded-lg
                                   hover:bg-white/5 transition-all"
                    >
                        Return Home
                    </a>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RecruitmentForm({ schema, academicYear }) {
    const router = useRouter();

    // Core fields state
    const [core, setCore] = useState({
        name: "", email: "", phone: "", rollNumber: "", branch: "", year: "",
    });

    // Extra (dynamic) fields state
    const [extra, setExtra] = useState({});

    // Errors
    const [errors, setErrors] = useState({});

    // Steps: 0 = personal, 1 = academic, then one per schema field group, last = review
    // We group all schema fields into a single "dynamic" step for simplicity
    const totalSteps = 2 + (schema.length > 0 ? 1 : 0) + 1; // personal + academic + [dynamic] + review
    const STEP_PERSONAL = 0;
    const STEP_ACADEMIC = 1;
    const STEP_DYNAMIC = 2;
    const STEP_REVIEW = schema.length > 0 ? 3 : 2;

    const [step, setStep] = useState(0);
    const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
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

    // ── Validation per step ───────────────────────────────────────────────────
    const validateStep = (s) => {
        const errs = {};

        if (s === STEP_PERSONAL) {
            if (!core.name.trim()) errs.name = "Name is required.";
            if (!core.email.trim()) errs.email = "Email is required.";
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(core.email)) errs.email = "Invalid email.";
            if (!core.phone.trim()) errs.phone = "Phone is required.";
            else if (!/^[0-9]{10}$/.test(core.phone.replace(/\s/g, ""))) errs.phone = "Must be 10 digits.";
        }

        if (s === STEP_ACADEMIC) {
            if (!core.rollNumber.trim()) errs.rollNumber = "Roll number is required.";
            else if (!/^\d{12}$/.test(core.rollNumber)) errs.rollNumber = "Must be exactly 12 digits.";
            if (!core.branch) errs.branch = "Branch is required.";
            if (!core.year) errs.year = "Year is required.";
        }

        if (s === STEP_DYNAMIC && schema.length > 0) {
            for (const field of schema) {
                if (!field.required) continue;
                const val = extra[field.id];
                const empty =
                    val === undefined || val === null || val === "" ||
                    (Array.isArray(val) && val.length === 0);
                if (empty) {
                    errs[field.id] = `${field.label} is required.`;
                } else if ((field.type === "textarea" || field.type === "text") && field.minLength) {
                    if (String(val).length < field.minLength) {
                        errs[field.id] = `Minimum ${field.minLength} characters required.`;
                    }
                }
            }
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const goNext = () => {
        if (!validateStep(step)) return;
        setDirection(1);
        setStep((s) => s + 1);
    };

    const goBack = () => {
        setDirection(-1);
        setStep((s) => s - 1);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
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

    // ── Animation variants ────────────────────────────────────────────────────
    const variants = {
        enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    if (submitted) {
        return <ConfirmationCard name={core.name} applicationId={applicationId} />;
    }

    const getStepTitle = () => {
        if (step === STEP_PERSONAL) return { title: "Signal Lock-On", sub: "Your identity coordinates" };
        if (step === STEP_ACADEMIC) return { title: "Sector Classification", sub: "Academic parameters" };
        if (schema.length > 0 && step === STEP_DYNAMIC) return { title: "Research Profile", sub: "Tell us more" };
        return { title: "Review & Transmit", sub: "Confirm your submission" };
    };

    const { title: stepTitle, sub: stepSub } = getStepTitle();

    return (
        <div>
            <ProgressBar current={step} total={totalSteps} />

            {/* Step label */}
            <motion.div
                key={step + "-label"}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-teal/50 mb-1">{stepSub}</p>
                <h2 className="font-serif text-2xl md:text-3xl text-white">{stepTitle}</h2>
            </motion.div>

            {/* Step content */}
            <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                    key={step}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                    {/* STEP 0 — Personal */}
                    {step === STEP_PERSONAL && (
                        <div className="space-y-6">
                            <div>
                                <label className={labelCls} htmlFor="name">
                                    <User className="w-3 h-3" /> Agent Name <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={core.name}
                                    onChange={(e) => updateCore("name", e.target.value)}
                                    placeholder="Full Name"
                                    className={inputCls}
                                />
                                {errors.name && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.name}</p>}
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="email">
                                    <Mail className="w-3 h-3" /> Comms Channel <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={core.email}
                                    onChange={(e) => updateCore("email", e.target.value)}
                                    placeholder="Email Address"
                                    className={inputCls}
                                />
                                {errors.email && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.email}</p>}
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="phone">
                                    <Phone className="w-3 h-3" /> Signal Frequency <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    value={core.phone}
                                    onChange={(e) => updateCore("phone", e.target.value)}
                                    placeholder="10-digit Phone Number"
                                    className={inputCls}
                                    maxLength={10}
                                />
                                {errors.phone && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.phone}</p>}
                            </div>
                        </div>
                    )}

                    {/* STEP 1 — Academic */}
                    {step === STEP_ACADEMIC && (
                        <div className="space-y-6">
                            <div>
                                <label className={labelCls} htmlFor="rollNumber">
                                    <Hash className="w-3 h-3" /> ID Sequence <span className="text-coral/70">*</span>
                                </label>
                                <input
                                    id="rollNumber"
                                    type="text"
                                    value={core.rollNumber}
                                    onChange={(e) => updateCore("rollNumber", e.target.value)}
                                    placeholder="12-digit Roll Number"
                                    className={inputCls}
                                    maxLength={12}
                                />
                                {errors.rollNumber && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.rollNumber}</p>}
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="branch">
                                    <Terminal className="w-3 h-3" /> Sector <span className="text-coral/70">*</span>
                                </label>
                                <select
                                    id="branch"
                                    value={core.branch}
                                    onChange={(e) => updateCore("branch", e.target.value)}
                                    className={`${inputCls} appearance-none`}
                                >
                                    <option value="">Select Branch</option>
                                    {BRANCHES.map((b) => (
                                        <option key={b.value} value={b.value} className="bg-black">{b.label}</option>
                                    ))}
                                </select>
                                {errors.branch && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.branch}</p>}
                            </div>

                            <div>
                                <label className={labelCls} htmlFor="year">
                                    <BookOpen className="w-3 h-3" /> Level <span className="text-coral/70">*</span>
                                </label>
                                <select
                                    id="year"
                                    value={core.year}
                                    onChange={(e) => updateCore("year", e.target.value)}
                                    className={`${inputCls} appearance-none`}
                                >
                                    <option value="">Select Year</option>
                                    {YEARS.map((y) => (
                                        <option key={y.value} value={y.value} className="bg-black">{y.label}</option>
                                    ))}
                                </select>
                                {errors.year && <p className="mt-1 text-xs text-coral/80 font-mono">{errors.year}</p>}
                            </div>
                        </div>
                    )}

                    {/* STEP 2 — Dynamic schema fields */}
                    {schema.length > 0 && step === STEP_DYNAMIC && (
                        <div className="space-y-8">
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

                    {/* STEP REVIEW — Summary */}
                    {step === STEP_REVIEW && (
                        <div className="space-y-6">
                            <div className="border border-white/10 rounded-xl divide-y divide-white/5 overflow-hidden">
                                {[
                                    { label: "Agent Name", value: core.name },
                                    { label: "Comms Channel", value: core.email },
                                    { label: "Signal Frequency", value: core.phone },
                                    { label: "ID Sequence", value: core.rollNumber },
                                    { label: "Sector", value: core.branch },
                                    { label: "Level", value: core.year },
                                    ...schema.map((f) => {
                                        const val = extra[f.id];
                                        const valueStr = Array.isArray(val) ? val.join(", ") : String(val || "—");
                                        return { label: f.label, value: valueStr || "—" };
                                    }),
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex justify-between gap-4 px-5 py-3 hover:bg-white/5 transition-colors">
                                        <span className="text-[10px] font-mono uppercase tracking-widest text-white/30 flex-shrink-0 pt-0.5">
                                            {label}
                                        </span>
                                        <span className="text-sm font-serif text-white/80 text-right break-all">{value}</span>
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

            {/* Navigation buttons */}
            <div className={`mt-10 flex ${step > 0 ? "justify-between" : "justify-end"}`}>
                {step > 0 && (
                    <button
                        onClick={goBack}
                        className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/50 text-xs font-mono
                                   uppercase tracking-widest rounded-lg hover:bg-white/5 hover:text-white transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                )}

                {step < STEP_REVIEW ? (
                    <button
                        onClick={goNext}
                        className="flex items-center gap-2 px-8 py-3 bg-teal/10 border border-teal/30 text-teal text-xs font-mono
                                   uppercase tracking-widest rounded-lg hover:bg-teal hover:text-black transition-all duration-300
                                   shadow-[0_0_20px_rgba(58,188,179,0.1)] hover:shadow-[0_0_30px_rgba(58,188,179,0.4)] group"
                    >
                        Next <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                ) : (
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex items-center gap-2 px-8 py-3 bg-white text-black text-xs font-bold font-mono
                                   uppercase tracking-widest rounded-lg hover:bg-teal hover:text-black transition-all duration-300
                                   shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(58,188,179,0.4)] disabled:opacity-50"
                    >
                        {submitting ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Transmitting...</>
                        ) : (
                            <>Initiate Protocol <ChevronRight className="w-4 h-4" /></>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
