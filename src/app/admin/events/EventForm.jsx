"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
    ChevronRight,
    ChevronLeft,
    Save,
    Calendar,
    MapPin,
    Users,
    DollarSign,
    Image as ImageIcon,
    Lock,
    CheckCircle2,
    Plus,
    X,
    Clock
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

// Builder Components for Hackathon/Ideathon
function ThemesBuilder({ themes, onChange }) {
    const addTheme = () => onChange([...themes, ""]);
    const removeTheme = (idx) => onChange(themes.filter((_, i) => i !== idx));
    const updateTheme = (idx, value) => {
        const updated = [...themes];
        updated[idx] = value;
        onChange(updated);
    };

    return (
        <div className="space-y-2">
            {themes.map((theme, idx) => (
                <div key={idx} className="flex gap-2">
                    <input
                        value={theme || ""}
                        onChange={(e) => updateTheme(idx, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        placeholder={`Theme ${idx + 1}`}
                    />
                    <button
                        type="button"
                        onClick={() => removeTheme(idx)}
                        className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={addTheme}
                className="w-full px-4 py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Theme
            </button>
        </div>
    );
}

function StagesBuilder({ stages, onChange }) {
    const addStage = () => onChange([...stages, { name: "", date: "", judgingCriteria: "", description: "" }]);
    const removeStage = (idx) => onChange(stages.filter((_, i) => i !== idx));
    const updateStage = (idx, field, value) => {
        const updated = [...stages];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {stages.map((stage, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-black/20 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-teal-400">Stage {idx + 1}</h4>
                        <button
                            type="button"
                            onClick={() => removeStage(idx)}
                            className="p-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <input
                        value={stage.name || ""}
                        onChange={(e) => updateStage(idx, "name", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        placeholder="Stage Name (e.g., Registration, Submission)"
                    />
                    <input
                        type="date"
                        value={stage.date || ""}
                        onChange={(e) => updateStage(idx, "date", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 [color-scheme:dark]"
                    />
                    <textarea
                        value={stage.description || ""}
                        onChange={(e) => updateStage(idx, "description", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        placeholder="Stage Description (e.g., What happens in this stage?)"
                        rows={3}
                    />
                    <textarea
                        value={stage.judgingCriteria || ""}
                        onChange={(e) => updateStage(idx, "judgingCriteria", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        placeholder="Judging criteria (optional)"
                        rows={2}
                    />
                </div>
            ))}
            <button
                type="button"
                onClick={addStage}
                className="w-full px-4 py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Stage
            </button>
        </div>
    );
}

function RulesBuilder({ rules, onChange }) {
    const addRule = () => onChange([...rules, ""]);
    const removeRule = (idx) => onChange(rules.filter((_, i) => i !== idx));
    const updateRule = (idx, value) => {
        const updated = [...rules];
        updated[idx] = value;
        onChange(updated);
    };

    return (
        <div className="space-y-2">
            {rules.map((rule, idx) => (
                <div key={idx} className="flex gap-2">
                    <input
                        value={rule || ""}
                        onChange={(e) => updateRule(idx, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        placeholder={`Rule ${idx + 1}`}
                    />
                    <button
                        type="button"
                        onClick={() => removeRule(idx)}
                        className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={addRule}
                className="w-full px-4 py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Rule
            </button>
        </div>
    );
}

function ContactsBuilder({ contacts, onChange }) {
    const addContact = () => onChange([...contacts, { name: "", phone: "" }]);
    const removeContact = (idx) => onChange(contacts.filter((_, i) => i !== idx));
    const updateContact = (idx, field, value) => {
        const updated = [...contacts];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-3">
            {contacts.map((contact, idx) => (
                <div key={idx} className="flex gap-2">
                    <input
                        value={contact.name || ""}
                        onChange={(e) => updateContact(idx, "name", e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        placeholder="Name"
                    />
                    <input
                        value={contact.phone || ""}
                        onChange={(e) => updateContact(idx, "phone", e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                        placeholder="Phone"
                    />
                    <button
                        type="button"
                        onClick={() => removeContact(idx)}
                        className="px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <button
                type="button"
                onClick={addContact}
                className="w-full px-4 py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Contact
            </button>
        </div>
    );
}

function TimeSlotsBuilder({ timeSlots, onChange }) {
    const addSlot = () => onChange([...timeSlots, { name: "", date: "", startTime: "", endTime: "", maxTeams: "" }]);
    const removeSlot = (idx) => onChange(timeSlots.filter((_, i) => i !== idx));
    const updateSlot = (idx, field, value) => {
        const updated = [...timeSlots];
        updated[idx] = { ...updated[idx], [field]: value };
        onChange(updated);
    };

    return (
        <div className="space-y-4">
            {timeSlots.map((slot, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-black/20 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Slot {idx + 1}
                        </h4>
                        <button
                            type="button"
                            onClick={() => removeSlot(idx)}
                            className="p-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <input
                        value={slot.name || ""}
                        onChange={(e) => updateSlot(idx, "name", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-cyan-400/50"
                        placeholder="Theme / Topic Name (e.g., Machine Learning)"
                    />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-[10px] uppercase text-white/40 font-mono mb-1 block">Date</label>
                            <input
                                type="date"
                                value={slot.date || ""}
                                onChange={(e) => updateSlot(idx, "date", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-cyan-400/50 [color-scheme:dark] text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-white/40 font-mono mb-1 block">Start</label>
                            <input
                                type="time"
                                value={slot.startTime || ""}
                                onChange={(e) => updateSlot(idx, "startTime", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-cyan-400/50 [color-scheme:dark] text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-white/40 font-mono mb-1 block">End</label>
                            <input
                                type="time"
                                value={slot.endTime || ""}
                                onChange={(e) => updateSlot(idx, "endTime", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-cyan-400/50 [color-scheme:dark] text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] uppercase text-white/40 font-mono mb-1 block">Max Teams</label>
                            <input
                                type="number"
                                min="1"
                                value={slot.maxTeams || ""}
                                onChange={(e) => updateSlot(idx, "maxTeams", e.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-cyan-400/50 text-sm"
                                placeholder="10"
                            />
                        </div>
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={addSlot}
                className="w-full px-4 py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> Add Time Slot
            </button>
        </div>
    );
}

// --- Default State ---
const defaultEvent = {
    id: "",
    title: "",
    date: "",
    time: "",
    location: "",
    category: "Competition",
    eventType: "General",
    venueType: "Offline",
    status: "Registration Open",
    isHidden: false,
    description: "",
    year: "",
    registrationFee: "",
    variablePricingEnabled: false,
    pricingTiers: [],
    password: "",
    img: "",
    posterDesktop: "",
    sampleAbstract: "",
    samplePpt: "",
    qrCode: "",
    teamSize: "",
    minTeamSize: "",
    maxTeamSize: "",
    regStartDate: "",
    regEndDate: "",
    isOneDay: true,
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    // Time Slots
    timeSlotsEnabled: false,
    timeSlots: [],
    // Fallback Redirect
    useExternalRegistration: false,
    externalRegistrationUrl: "",
    // Success Content
    successMessage: "You're In!",
    whatsappLink: "",
    // Hackathon/Ideathon specific
    themes: [],
    eligibility: "",
    submissionGuidelines: "",
    stages: [],
    interactiveSessions: "",
    rules: [],
    contactOrganizers: [],
    prizes: {
        winner: "",
        runnerUp: "",
        participation: ""
    },
    // Quiz specific
    quizConfig: {
        totalQuestions: 15,
        durationMinutes: 20,
        easyCount: 5,
        mediumCount: 5,
        hardCount: 5,
        negativeMarking: false,
        negativeMarkValue: 0,
        showAnswersAfter: true
    }
};

function toNumberOrKeep(value) {
    if (value === "") return value;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
}

// --- Steps Configuration ---
const STEPS = [
    { id: 1, label: "Basics", icon: CheckCircle2 },
    { id: 2, label: "Time & Place", icon: Calendar },
    { id: 3, label: "Registration", icon: Users },
    { id: 4, label: "Graphics", icon: ImageIcon },
    { id: 5, label: "Security", icon: Lock },
];

const HACKATHON_STEPS = [
    { id: 1, label: "Basics", icon: CheckCircle2 },
    { id: 2, label: "Time & Place", icon: Calendar },
    { id: 3, label: "Registration", icon: Users },
    { id: 4, label: "Competition Details", icon: Users },
    { id: 5, label: "Graphics", icon: ImageIcon },
    { id: 6, label: "Security", icon: Lock },
];

const QUIZ_STEPS = [
    { id: 1, label: "Basics", icon: CheckCircle2 },
    { id: 2, label: "Time & Place", icon: Calendar },
    { id: 3, label: "Registration", icon: Users },
    { id: 4, label: "Quiz Config", icon: CheckCircle2 },
    { id: 5, label: "Graphics", icon: ImageIcon },
    { id: 6, label: "Security", icon: Lock },
];

export default function EventForm({ mode, initialEvent, backLink = "/admin/events" }) {
    // When editing, exclude the password field (it's hashed and shouldn't be displayed)
    const [event, setEvent] = useState(() => {
        const base = { ...defaultEvent, ...(initialEvent || {}) };

        // Ensure explicit empty strings for nullable fields to preventing uncontrolled inputs
        const stringFields = ['img', 'posterDesktop', 'samplePpt', 'sampleAbstract', 'externalRegistrationUrl'];
        stringFields.forEach(key => {
            if (base[key] === undefined || base[key] === null) base[key] = "";
        });

        // Ensure arrays default properly (old events may not have these fields)
        if (!Array.isArray(base.timeSlots)) base.timeSlots = [];
        if (!Array.isArray(base.pricingTiers)) base.pricingTiers = [];
        if (!Array.isArray(base.themes)) base.themes = [];
        if (!Array.isArray(base.stages)) base.stages = [];
        if (!Array.isArray(base.rules)) base.rules = [];
        if (!Array.isArray(base.contactOrganizers)) base.contactOrganizers = [];

        // Ensure booleans default properly
        if (base.timeSlotsEnabled === undefined) base.timeSlotsEnabled = false;
        if (base.variablePricingEnabled === undefined) base.variablePricingEnabled = false;

        // Don't populate password field when editing - it might contain a bcrypt hash
        if (mode === "edit") {
            delete base.password;
        }
        return base;
    });
    const [imgFile, setImgFile] = useState(null);
    const [posterDesktopFile, setPosterDesktopFile] = useState(null);
    const [sampleAbstractFile, setSampleAbstractFile] = useState(null);
    const [samplePptFile, setSamplePptFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [warning, setWarning] = useState("");
    const [toast, setToast] = useState({ isOpen: false, title: "", message: "", type: "success" });

    // Stepper State
    const [currentStep, setCurrentStep] = useState(1);

    const isEdit = mode === "edit";

    // Determine which step configuration to use
    const activeSteps = event.eventType === "Hackathon" || event.eventType === "Ideathon"
        ? HACKATHON_STEPS
        : event.eventType === "Quiz"
            ? QUIZ_STEPS
            : STEPS;

    // --- Logic Reuse ---
    const payload = useMemo(() => {
        const out = { ...event };
        out.teamSize = toNumberOrKeep(out.teamSize);
        out.minTeamSize = toNumberOrKeep(out.minTeamSize);
        out.maxTeamSize = toNumberOrKeep(out.maxTeamSize);
        out.participants = out.participants ?? 0;

        if (Array.isArray(out.pricingTiers)) {
            out.pricingTiers = out.pricingTiers
                .map((t) => ({
                    teamSize: toNumberOrKeep(t?.teamSize ?? ""),
                    price: toNumberOrKeep(t?.price ?? ""),
                }))
                .filter((t) => t.teamSize !== "" || t.price !== "");
        }

        if (out.isOneDay) {
            if (out.startDate) out.date = out.startDate;
            if (out.startTime || out.endTime) out.time = `${out.startTime || ""}${out.startTime && out.endTime ? " - " : ""}${out.endTime || ""}`.trim();
        }

        Object.keys(out).forEach((k) => {
            if (out[k] === "") delete out[k];
        });

        return out;
    }, [event]);

    async function onSubmit(e) {
        if (e) e.preventDefault();
        setError("");
        setSuccess("");
        setWarning("");

        // Validation
        if (!event.title) return setError("Title is required");
        if (!(event.date || event.startDate)) return setError("Date is required");

        // Password validation: required for new events, optional for edits
        if (!isEdit) {
            if (!event.password || !event.password.trim()) {
                return setError("Coordinator password is required");
            }
            if (event.password.trim().length < 6) {
                return setError("Password must be at least 6 characters");
            }
        } else if (event.password && event.password.trim().length > 0 && event.password.trim().length < 6) {
            return setError("Password must be at least 6 characters");
        }

        const minTeam = event.minTeamSize === "" ? null : Number(event.minTeamSize);
        const maxTeam = event.maxTeamSize === "" ? null : Number(event.maxTeamSize);
        if (minTeam != null || maxTeam != null) {
            if (!Number.isFinite(minTeam ?? 1) || !Number.isFinite(maxTeam ?? 1)) return setError("Min/Max team size must be a number");
            if ((minTeam ?? 1) < 1 || (maxTeam ?? 1) < 1) return setError("Team sizes must be at least 1");
            if (minTeam != null && maxTeam != null && minTeam > maxTeam) return setError("Min team size cannot be greater than max team size");
        }

        if (event.variablePricingEnabled) {
            const tiers = Array.isArray(event.pricingTiers) ? event.pricingTiers : [];
            if (!tiers.length) return setError("Add at least one pricing tier");
        }

        setSaving(true);
        try {
            const url = isEdit ? `/api/events/${encodeURIComponent(initialEvent.id)}` : "/api/events";
            const method = isEdit ? "PUT" : "POST";

            const form = new FormData();
            form.append("payload", JSON.stringify(payload));
            if (imgFile) form.append("imgFile", imgFile);
            if (posterDesktopFile) form.append("posterDesktopFile", posterDesktopFile);
            if (sampleAbstractFile) form.append("sampleAbstractFile", sampleAbstractFile);
            if (samplePptFile) form.append("samplePptFile", samplePptFile);

            const res = await fetch(url, { method, body: form });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) throw new Error(data?.error || "Failed to save event");

            if (Array.isArray(data?.uploadErrors) && data.uploadErrors.length) {
                setWarning(`Saved, but some uploads failed: ${data.uploadErrors.join(" | ")}`);
            }

            // Show success toast
            setToast({
                isOpen: true,
                title: isEdit ? "Event Updated!" : "Event Created!",
                message: isEdit
                    ? "Your changes have been saved successfully."
                    : "The event has been created and is ready to go.",
                type: "success"
            });

            // Also update the inline success message
            setSuccess(isEdit ? "Event saved!" : "Event created!");

            if (!isEdit && data?.id) {
                // Redirect if new (slight delay for toast to show)
                setTimeout(() => {
                    window.location.href = `/admin/events/${encodeURIComponent(data.id)}/edit`;
                }, 1500);
            }

            // Clear files
            setImgFile(null);
            setPosterDesktopFile(null);
            setSampleAbstractFile(null);
            setSamplePptFile(null);

        } catch (err) {
            setError(err?.message || "Failed to save");
            // Show error toast
            setToast({
                isOpen: true,
                title: "Save Failed",
                message: err?.message || "Failed to save the event. Please try again.",
                type: "error"
            });
        } finally {
            setSaving(false);
        }
    }

    function setField(name, value) {
        setEvent((prev) => ({ ...prev, [name]: value }));
    }

    // --- Navigation Handlers ---
    const nextStep = () => {
        // Simple validation before next
        if (currentStep === 1 && !event.title) {
            setError("Title is required");
            return;
        }
        setError(""); // clear previous errors
        setCurrentStep((p) => Math.min(p + 1, activeSteps.length));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const prevStep = () => {
        setCurrentStep((p) => Math.max(p - 1, 1));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // --- Render Helpers ---
    function renderStepContent() {
        const isHackathon = event.eventType === "Hackathon" || event.eventType === "Ideathon";

        // Step 1: Basics
        if (currentStep === 1) {
            return (
                <div key="step-1" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    {!isEdit && (
                        <Field label="Custom ID (optional)" hint="Unique URL slug (e.g., math-heist-2026)">
                            <input
                                value={event.id || ""}
                                onChange={(e) => setField("id", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 transition-all font-mono text-sm"
                                placeholder="auto-generated-if-empty"
                            />
                        </Field>
                    )}
                    <Field label="Event Title" required>
                        <input
                            value={event.title || ""}
                            onChange={(e) => setField("title", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 transition-all text-lg font-semibold"
                            placeholder="e.g. Math Heist"
                        />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Event Type">
                            <select
                                value={event.eventType || "General"}
                                onChange={(e) => setField("eventType", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 appearance-none text-white"
                            >
                                <option className="bg-gray-900">General</option>
                                <option className="bg-gray-900">Competition</option>
                                <option className="bg-gray-900">Workshop</option>
                                <option className="bg-gray-900">Hackathon</option>
                                <option className="bg-gray-900">Ideathon</option>
                                <option className="bg-gray-900">Seminar</option>
                                <option className="bg-gray-900">Placement Series</option>
                                <option className="bg-gray-900">Quiz</option>
                            </select>
                        </Field>
                        <Field label="Status">
                            <select
                                value={event.status || "Registration Open"}
                                onChange={(e) => setField("status", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 appearance-none text-white"
                            >
                                <option className="bg-gray-900">Registration Open</option>
                                <option className="bg-gray-900">Registration Closed</option>
                                <option className="bg-gray-900">Coming Soon</option>
                                <option className="bg-gray-900">Completed</option>
                            </select>
                        </Field>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <label className="flex items-center gap-3 text-sm text-white/90 font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!event.secureWalkInMode}
                                onChange={(e) => setField("secureWalkInMode", e.target.checked)}
                                className="w-4 h-4 accent-emerald-500"
                            />
                            <span className="flex items-center gap-2">
                                Secure Walk-In Mode (Requires Live QR Scan)
                            </span>
                        </label>
                        <p className="text-xs text-white/40 mt-2 pl-7">
                            If checked, the quiz landing page will require participants to scan the dynamic QR code displayed on the Coordinator Screen to enter the arena. This prevents remote access.
                        </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <label className="flex items-center gap-3 text-sm text-white/90 font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!event.isHidden}
                                onChange={(e) => setField("isHidden", e.target.checked)}
                                className="w-4 h-4 accent-teal-500"
                            />
                            <span className="flex items-center gap-2">
                                Hide this event from the public website
                            </span>
                        </label>
                        <p className="text-xs text-white/40 mt-2 pl-7">
                            If checked, this event will only be accessible via direct link and will not show up on the main events page. Useful for testing.
                        </p>
                    </div>

                    {event.eventType === 'Quiz' && (
                        <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-6">
                            <div className="flex items-center justify-between border-b border-violet-500/10 pb-4">
                                <h3 className="text-lg font-semibold text-violet-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Quiz Configuration
                                </h3>
                                <span className="px-3 py-1 bg-violet-500/20 text-violet-300 text-[10px] font-bold uppercase tracking-wider rounded-full">
                                    {((event.quizConfig?.easyCount || 0) + (event.quizConfig?.mediumCount || 0) + (event.quizConfig?.hardCount || 0))} QUESTIONS
                                </span>
                            </div>

                            <Field label="Total Questions" description="Auto-distributes across difficulty levels">
                                <input
                                    readOnly
                                    value={(event.quizConfig?.easyCount || 0) + (event.quizConfig?.mediumCount || 0) + (event.quizConfig?.hardCount || 0)}
                                    className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/5 text-white/50 cursor-not-allowed outline-none"
                                />
                            </Field>

                            <div className="grid grid-cols-3 gap-4">
                                <Field label={<span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Easy</span>} description="1 pt each">
                                    <input
                                        type="number"
                                        min="0"
                                        value={event.quizConfig?.easyCount || 0}
                                        onChange={(e) => setField("quizConfig", { ...event.quizConfig, easyCount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-emerald-500/20 outline-none focus:border-emerald-400/50 text-center font-bold text-emerald-400"
                                    />
                                </Field>
                                <Field label={<span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Medium</span>} description="2 pts each">
                                    <input
                                        type="number"
                                        min="0"
                                        value={event.quizConfig?.mediumCount || 0}
                                        onChange={(e) => setField("quizConfig", { ...event.quizConfig, mediumCount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-amber-500/20 outline-none focus:border-amber-400/50 text-center font-bold text-amber-400"
                                    />
                                </Field>
                                <Field label={<span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /> Hard</span>} description="3 pts each">
                                    <input
                                        type="number"
                                        min="0"
                                        value={event.quizConfig?.hardCount || 0}
                                        onChange={(e) => setField("quizConfig", { ...event.quizConfig, hardCount: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-red-500/20 outline-none focus:border-red-400/50 text-center font-bold text-red-400"
                                    />
                                </Field>
                            </div>

                            <Field label="Duration (minutes)" description="Per participant timer">
                                <input
                                    type="number"
                                    min="1"
                                    value={event.quizConfig?.durationMinutes || 20}
                                    onChange={(e) => setField("quizConfig", { ...event.quizConfig, durationMinutes: parseInt(e.target.value) || 20 })}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-violet-400/50"
                                />
                            </Field>
                        </div>
                    )}
                </div>
            );
        }

        // Step 2: Time & Place
        if (currentStep === 2) {
            return (
                <div key="step-2" className="space-y-6 pb-8 animate-in slide-in-from-right-4 duration-300">
                    <Field label="Description">
                        <textarea
                            rows={5}
                            value={event.description || ""}
                            onChange={(e) => setField("description", e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                            placeholder="Detailed event description..."
                        />
                    </Field>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Venue Type">
                            <select
                                value={event.venueType || "Offline"}
                                onChange={(e) => setField("venueType", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 appearance-none text-white"
                            >
                                <option className="bg-gray-900">Offline</option>
                                <option className="bg-gray-900">Online</option>
                                <option className="bg-gray-900">Hybrid</option>
                            </select>
                        </Field>
                        <Field label="Venue/Location">
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    value={event.location || ""}
                                    onChange={(e) => setField("location", e.target.value)}
                                    className="w-full px-10 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                    placeholder="e.g. Main Auditorium"
                                />
                            </div>
                        </Field>
                    </div>

                    {/* Time Slots Section */}
                    <div className="p-6 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-4">
                        <div className="flex items-center justify-between border-b border-cyan-500/10 pb-4">
                            <h3 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
                                <Clock className="w-5 h-4" />
                                Time Slots Configuration
                            </h3>
                            {event.timeSlotsEnabled && (
                                <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full uppercase font-bold">Enabled</span>
                            )}
                        </div>

                        <p className="text-sm text-white/60">
                            Enable this if participants should choose a specific time/theme slot during registration.
                        </p>

                        <label className="flex items-center gap-3 text-sm text-white/90 font-medium cursor-pointer p-3 rounded-xl bg-black/40 border border-white/5 hover:border-cyan-400/30 transition-all">
                            <input
                                type="checkbox"
                                checked={!!event.timeSlotsEnabled}
                                onChange={(e) => setField("timeSlotsEnabled", e.target.checked)}
                                className="w-4 h-4 accent-cyan-400"
                            />
                            <span className="flex items-center gap-2">
                                Enable time slots for this event
                            </span>
                        </label>

                        {event.timeSlotsEnabled && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <p className="text-xs text-white/40 mb-3 italic">
                                    Each slot can have a theme name and a maximum team capacity.
                                </p>
                                <TimeSlotsBuilder
                                    timeSlots={event.timeSlots || []}
                                    onChange={(slots) => setField("timeSlots", slots)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                        <label className="flex items-center gap-3 text-sm text-white/90 font-medium mb-4 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!event.isOneDay}
                                onChange={(e) => setField("isOneDay", e.target.checked)}
                                className="w-4 h-4 accent-teal-400"
                            />
                            Is this a one-day event?
                        </label>

                        {event.isOneDay ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Field label="Date" required>
                                    <input
                                        type="date"
                                        value={event.startDate || event.date || ""}
                                        onChange={(e) => {
                                            setField("startDate", e.target.value);
                                            setField("date", e.target.value);
                                        }}
                                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 [color-scheme:dark]"
                                    />
                                </Field>
                                <Field label="Start Time">
                                    <input
                                        type="time"
                                        value={event.startTime || ""}
                                        onChange={(e) => setField("startTime", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 [color-scheme:dark]"
                                    />
                                </Field>
                                <Field label="End Time">
                                    <input
                                        type="time"
                                        value={event.endTime || ""}
                                        onChange={(e) => setField("endTime", e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 [color-scheme:dark]"
                                    />
                                </Field>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Start Date">
                                    <input type="date" value={event.startDate || ""} onChange={(e) => setField("startDate", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none [color-scheme:dark]" />
                                </Field>
                                <Field label="End Date">
                                    <input type="date" value={event.endDate || ""} onChange={(e) => setField("endDate", e.target.value)} className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none [color-scheme:dark]" />
                                </Field>
                            </div>
                        )}
                    </div>

                </div>
            );
        }

        // Step 3: Registration
        if (currentStep === 3) {
            return (
                <div key="step-3" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    {/* Fallback Redirect Section */}
                    <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4 mb-8">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-4 mb-2">
                            <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                Fallback Registration Redirect
                            </h3>
                        </div>

                        <p className="text-sm text-white/70 mb-2">
                            Enable this to instantly redirect users to an external Google Form if the internal system is down.
                        </p>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                            <label className="flex items-center gap-3 font-semibold cursor-pointer text-amber-200">
                                <input
                                    type="checkbox"
                                    checked={!!event.useExternalRegistration}
                                    onChange={(e) => setField("useExternalRegistration", e.target.checked)}
                                    className="w-5 h-5 accent-amber-500"
                                />
                                Activate External Redirect
                            </label>
                            {event.useExternalRegistration && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full animate-pulse uppercase font-bold">Active</span>
                            )}
                        </div>

                        {event.useExternalRegistration && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <Field label="External Registration URL" hint="Link to Google Form (starts with https://)">
                                    <input
                                        value={event.externalRegistrationUrl || ""}
                                        onChange={(e) => setField("externalRegistrationUrl", e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-amber-500/30 outline-none focus:border-amber-400 transition-all font-mono text-sm text-amber-100 placeholder:text-white/10"
                                        placeholder="https://forms.gle/your-form-link"
                                    />
                                </Field>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Field label="Reg Start Date">
                            <input type="date" value={event.regStartDate || ""} onChange={(e) => setField("regStartDate", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none [color-scheme:dark]" />
                        </Field>
                        <Field label="Reg End Date">
                            <input type="date" value={event.regEndDate || ""} onChange={(e) => setField("regEndDate", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none [color-scheme:dark]" />
                        </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-5">
                        <Field label="Min Team Size">
                            <input type="number" placeholder="1" value={event.minTeamSize || ""} onChange={(e) => setField("minTeamSize", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none" />
                        </Field>
                        <Field label="Max Team Size">
                            <input type="number" placeholder="5" value={event.maxTeamSize || ""} onChange={(e) => setField("maxTeamSize", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none" />
                        </Field>
                    </div>

                    <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                            <h3 className="text-lg font-semibold text-white/90">Registration Pricing</h3>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 font-medium cursor-pointer">
                                <input type="checkbox" checked={!!event.variablePricingEnabled} onChange={(e) => setField("variablePricingEnabled", e.target.checked)} className="w-4 h-4 accent-teal-400" />
                                Variable Pricing?
                            </label>
                        </div>

                        {event.variablePricingEnabled ? (
                            <PricingTiersEditor
                                tiers={event.pricingTiers}
                                onChange={(tiers) => setField("pricingTiers", tiers)}
                            />
                        ) : (
                            <Field label="Standard Registration Fee">
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input
                                        value={event.registrationFee || ""}
                                        onChange={(e) => setField("registrationFee", e.target.value)}
                                        className="w-full px-10 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none"
                                        placeholder="150"
                                    />
                                </div>
                            </Field>
                        )}
                    </div>

                    {/* Post-Registration Content Section */}
                    <div className="p-5 rounded-2xl bg-teal-500/5 border border-teal-500/20 space-y-4">
                        <div className="flex items-center justify-between border-b border-teal-500/10 pb-4 mb-2">
                            <h3 className="text-lg font-semibold text-teal-400">Post-Registration Content</h3>
                        </div>

                        <p className="text-sm text-white/60 mb-2">
                            This content is shown to the user AFTER they successfully register.
                        </p>

                        <Field label="Success Message" hint="Displayed at the top of the success screen">
                            <input
                                value={event.successMessage || ""}
                                onChange={(e) => setField("successMessage", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 transition-all font-sans"
                                placeholder="You're In!"
                            />
                        </Field>

                        <Field label="WhatsApp Group Link" hint="Displayed as a 'Join Group' button">
                            <input
                                value={event.whatsappLink || ""}
                                onChange={(e) => setField("whatsappLink", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50 transition-all font-mono text-sm"
                                placeholder="https://chat.whatsapp.com/..."
                            />
                        </Field>
                    </div>
                </div>
            );
        }

        // Step 4: Competition Details (Hackathon/Ideathon) OR Quiz Config OR Graphics (regular)
        if (currentStep === 4) {
            const isQuiz = event.eventType === "Quiz";
            if (isQuiz) {
                const qc = event.quizConfig || {};
                const setQuizField = (field, value) => {
                    const updated = { ...event.quizConfig, [field]: value };
                    // Auto-default difficulty counts when totalQuestions changes
                    if (field === 'totalQuestions') {
                        const total = parseInt(value) || 0;
                        const base = Math.floor(total / 3);
                        const remainder = total % 3;
                        updated.easyCount = base;
                        updated.mediumCount = base + (remainder >= 1 ? 1 : 0);
                        updated.hardCount = base + (remainder >= 2 ? 1 : 0);
                    }
                    // Recalculate total when individual counts change
                    if (field === 'easyCount' || field === 'mediumCount' || field === 'hardCount') {
                        const e = field === 'easyCount' ? (parseInt(value) || 0) : (parseInt(updated.easyCount) || 0);
                        const m = field === 'mediumCount' ? (parseInt(value) || 0) : (parseInt(updated.mediumCount) || 0);
                        const h = field === 'hardCount' ? (parseInt(value) || 0) : (parseInt(updated.hardCount) || 0);
                        updated.totalQuestions = e + m + h;
                    }
                    setField('quizConfig', updated);
                };

                return (
                    <div key="step-4-quiz" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-5">
                            <div className="flex items-center justify-between border-b border-violet-500/10 pb-4">
                                <h3 className="text-lg font-semibold text-violet-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Quiz Configuration
                                </h3>
                                <span className="text-[10px] bg-violet-500/20 text-violet-400 px-2 py-1 rounded-full uppercase font-bold">
                                    {(parseInt(qc.easyCount) || 0) + (parseInt(qc.mediumCount) || 0) + (parseInt(qc.hardCount) || 0)} Questions
                                </span>
                            </div>

                            <Field label="Total Questions" hint="Auto-distributes across difficulty levels">
                                <input
                                    type="number"
                                    min="1"
                                    value={qc.totalQuestions || ""}
                                    onChange={(e) => setQuizField('totalQuestions', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-violet-400/50"
                                    placeholder="15"
                                />
                            </Field>

                            <div className="grid grid-cols-3 gap-4">
                                <Field label="🟢 Easy" hint={`${1} pt each`}>
                                    <input
                                        type="number"
                                        min="0"
                                        value={qc.easyCount ?? ""}
                                        onChange={(e) => setQuizField('easyCount', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-emerald-500/20 outline-none focus:border-emerald-400/50 text-center text-lg font-bold text-emerald-400"
                                    />
                                </Field>
                                <Field label="🟡 Medium" hint={`${2} pts each`}>
                                    <input
                                        type="number"
                                        min="0"
                                        value={qc.mediumCount ?? ""}
                                        onChange={(e) => setQuizField('mediumCount', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-amber-500/20 outline-none focus:border-amber-400/50 text-center text-lg font-bold text-amber-400"
                                    />
                                </Field>
                                <Field label="🔴 Hard" hint={`${3} pts each`}>
                                    <input
                                        type="number"
                                        min="0"
                                        value={qc.hardCount ?? ""}
                                        onChange={(e) => setQuizField('hardCount', e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-red-500/20 outline-none focus:border-red-400/50 text-center text-lg font-bold text-red-400"
                                    />
                                </Field>
                            </div>

                            <Field label="Duration (minutes)" hint="Per participant timer">
                                <input
                                    type="number"
                                    min="1"
                                    value={qc.durationMinutes || ""}
                                    onChange={(e) => setQuizField('durationMinutes', e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-violet-400/50"
                                    placeholder="20"
                                />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
                                    <label className="flex items-center gap-3 text-sm text-white/90 font-medium cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!qc.negativeMarking}
                                            onChange={(e) => setQuizField('negativeMarking', e.target.checked)}
                                            className="w-4 h-4 accent-violet-400"
                                        />
                                        Negative Marking
                                    </label>
                                    {qc.negativeMarking && (
                                        <input
                                            type="number"
                                            step="0.25"
                                            min="0"
                                            value={qc.negativeMarkValue || ""}
                                            onChange={(e) => setQuizField('negativeMarkValue', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 outline-none focus:border-violet-400/50 text-sm"
                                            placeholder="Deduction per wrong answer (e.g. 0.25)"
                                        />
                                    )}
                                </div>
                                <div className="p-4 rounded-xl bg-black/30 border border-white/5">
                                    <label className="flex items-center gap-3 text-sm text-white/90 font-medium cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={qc.showAnswersAfter !== false}
                                            onChange={(e) => setQuizField('showAnswersAfter', e.target.checked)}
                                            className="w-4 h-4 accent-violet-400"
                                        />
                                        Show correct answers after submission
                                    </label>
                                </div>
                            </div>

                            <div className="text-xs text-white/30 text-center pt-2 border-t border-white/5">
                                Max Score: {(parseInt(qc.easyCount) || 0) * 1 + (parseInt(qc.mediumCount) || 0) * 2 + (parseInt(qc.hardCount) || 0) * 3} pts
                                &nbsp;•&nbsp;
                                Easy({(parseInt(qc.easyCount) || 0)}×1) + Medium({(parseInt(qc.mediumCount) || 0)}×2) + Hard({(parseInt(qc.hardCount) || 0)}×3)
                            </div>
                        </div>
                    </div>
                );
            } else if (isHackathon) {
                return (
                    <div key="step-4-hackathon" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Field label="Themes" hint="Add themes/problem statements">
                            <ThemesBuilder
                                themes={event.themes || []}
                                onChange={(themes) => setField("themes", themes)}
                            />
                        </Field>

                        <Field label="Eligibility Criteria">
                            <textarea
                                rows={3}
                                value={event.eligibility || ""}
                                onChange={(e) => setField("eligibility", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="e.g. Open to all students, teams of 3-5 members"
                            />
                        </Field>

                        <Field label="Submission Guidelines">
                            <textarea
                                rows={4}
                                value={event.submissionGuidelines || ""}
                                onChange={(e) => setField("submissionGuidelines", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="What should teams submit? Format requirements?"
                            />
                        </Field>

                        <Field label="Stages" hint="Define event stages with dates and criteria">
                            <StagesBuilder
                                stages={event.stages || []}
                                onChange={(stages) => setField("stages", stages)}
                            />
                        </Field>

                        <Field label="Interactive Sessions">
                            <textarea
                                rows={3}
                                value={event.interactiveSessions || ""}
                                onChange={(e) => setField("interactiveSessions", e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                placeholder="e.g. Mentorship sessions, Q&A panels"
                            />
                        </Field>

                        <Field label="Rules & Regulations">
                            <RulesBuilder
                                rules={event.rules || []}
                                onChange={(rules) => setField("rules", rules)}
                            />
                        </Field>

                        <Field label="Contact Organizers">
                            <ContactsBuilder
                                contacts={event.contactOrganizers || []}
                                onChange={(contacts) => setField("contactOrganizers", contacts)}
                            />
                        </Field>

                        <Field label="Prizes">
                            <div className="space-y-3">
                                <input
                                    value={event.prizes?.winner || ""}
                                    onChange={(e) => setField("prizes", { ...event.prizes, winner: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                    placeholder="Winner Prize"
                                />
                                <input
                                    value={event.prizes?.runnerUp || ""}
                                    onChange={(e) => setField("prizes", { ...event.prizes, runnerUp: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                    placeholder="Runner-up Prize"
                                />
                                <input
                                    value={event.prizes?.participation || ""}
                                    onChange={(e) => setField("prizes", { ...event.prizes, participation: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-teal-400/50"
                                    placeholder="Participation Prize"
                                />
                            </div>
                        </Field>
                    </div>
                );
            } else {
                // Graphics for regular events at step 4
                return (
                    <div key="step-4-graphics" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Field label="Event Card Image" hint="Square image for lists.">
                            <div className="flex flex-col gap-3">
                                <input value={event.img || ""} onChange={(e) => setField("img", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono focus:border-teal-400/50 outline-none" placeholder="/assets/img.jpg" />
                                <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files?.[0])} className="text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                            </div>
                        </Field>
                        <Field label="Desktop Poster" hint="Large banner.">
                            <div className="flex flex-col gap-3">
                                <input value={event.posterDesktop || ""} onChange={(e) => setField("posterDesktop", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono focus:border-teal-400/50 outline-none" placeholder="/assets/poster-d.jpg" />
                                <input type="file" accept="image/*" onChange={(e) => setPosterDesktopFile(e.target.files?.[0])} className="text-sm text-white/60" />
                            </div>
                        </Field>
                    </div>
                );
            }
        }

        // Step 5: Graphics (for H/I/Quiz) OR Security (for regular)
        if (currentStep === 5) {
            const isQuiz = event.eventType === "Quiz";
            if (isHackathon || isQuiz) {
                // Graphics for H/I at step 5
                return (
                    <div key="step-5-graphics" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Field label="Event Card Image" hint="Square image for lists.">
                            <div className="flex flex-col gap-3">
                                <input value={event.img || ""} onChange={(e) => setField("img", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono focus:border-teal-400/50 outline-none" placeholder="/assets/img.jpg" />
                                <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files?.[0])} className="text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
                            </div>
                        </Field>
                        <Field label="Desktop Poster" hint="Large banner.">
                            <div className="flex flex-col gap-3">
                                <input value={event.posterDesktop || ""} onChange={(e) => setField("posterDesktop", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono focus:border-teal-400/50 outline-none" placeholder="/assets/poster-d.jpg" />
                                <input type="file" accept="image/*" onChange={(e) => setPosterDesktopFile(e.target.files?.[0])} className="text-sm text-white/60" />
                            </div>
                        </Field>
                        <Field label="Sample Presentation" hint="PPT/PDF format template for participants.">
                            <div className="flex flex-col gap-3">
                                <input value={event.samplePpt || ""} onChange={(e) => setField("samplePpt", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono focus:border-teal-400/50 outline-none" placeholder="/assets/sample.pptx" />
                                <input
                                    type="file"
                                    accept=".ppt,.pptx,.pdf"
                                    onChange={(e) => setSamplePptFile(e.target.files?.[0])}
                                    className="text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                />
                            </div>
                        </Field>
                        <Field label="Sample Abstract" hint="Abstract format/template for participants (especially for Ideathon).">
                            <div className="flex flex-col gap-3">
                                <input value={event.sampleAbstract || ""} onChange={(e) => setField("sampleAbstract", e.target.value)} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm font-mono focus:border-teal-400/50 outline-none" placeholder="/assets/sample-abstract.pdf" />
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => setSampleAbstractFile(e.target.files?.[0])}
                                    className="text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                                />
                            </div>
                        </Field>
                    </div>
                );
            } else {
                // Security for regular events at step 5
                return (
                    <div key="step-5-security" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <Field label="Coordinator Password" required={!isEdit} hint={isEdit ? "Leave empty to keep existing password" : "Used for coordinator login"}>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    value={event.password || ""}
                                    onChange={(e) => setField("password", e.target.value)}
                                    className="w-full px-10 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none"
                                    placeholder={isEdit ? "Enter new password to change" : "SecretPassword123"}
                                />
                            </div>
                        </Field>
                        <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                            <h3 className="text-teal-300 font-semibold mb-2">Ready to Publish?</h3>
                            <p className="text-sm text-teal-100/70 mb-4">
                                Make sure all details are correct. You can always edit this later.
                            </p>
                            <button
                                type="button"
                                onClick={onSubmit}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-400 text-black font-bold uppercase tracking-wider hover:bg-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Event</>}
                            </button>
                        </div>
                    </div>
                );
            }
        }

        // Step 6: Security (for H/I only)
        if (currentStep === 6 && (isHackathon || event.eventType === "Quiz")) {
            return (
                <div key="step-6-security" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <Field label="Coordinator Password" required={!isEdit} hint={isEdit ? "Leave empty to keep existing password" : "Used for coordinator login"}>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <input
                                value={event.password || ""}
                                onChange={(e) => setField("password", e.target.value)}
                                className="w-full px-10 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none"
                                placeholder={isEdit ? "Enter new password to change" : "SecretPassword123"}
                            />
                        </div>
                    </Field>
                    <div className="p-5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-center">
                        <h3 className="text-teal-300 font-semibold mb-2">Ready to Publish?</h3>
                        <p className="text-sm text-teal-100/70 mb-4">
                            Make sure all details are correct. You can always edit this later.
                        </p>
                        <button
                            type="button"
                            onClick={onSubmit}
                            disabled={saving}
                            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-teal-400 text-black font-bold uppercase tracking-wider hover:bg-teal-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Event</>}
                        </button>
                    </div>
                </div>
            );
        }

        return null;
    }

    return (
        <div className="min-h-screen bg-black text-white px-4 py-8 md:py-12">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">{isEdit ? "Edit Event" : "New Event"}</h1>
                    <Link href={backLink} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition">Cancel</Link>
                </div>

                {/* Notifications */}
                {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>}
                {success && <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm">{success}</div>}
                {warning && <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">{warning}</div>}

                {/* Stepper Progress */}
                <div className="mb-8 overflow-x-auto pb-2">
                    <div className="flex items-center justify-between min-w-[600px]">
                        {activeSteps.map((step, idx) => {
                            const Icon = step.icon;
                            const isCompleted = currentStep > step.id;
                            const isCurrent = currentStep === step.id;
                            return (
                                <div key={step.id} className="flex flex-col items-center relative z-10 group cursor-pointer" onClick={() => setCurrentStep(step.id)}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${isCurrent ? "bg-teal-400 border-teal-400 text-black shadow-[0_0_15px_rgba(45,212,191,0.5)]" :
                                        isCompleted ? "bg-teal-900/50 border-teal-500/50 text-teal-400" :
                                            "bg-black border-white/10 text-white/30"
                                        }`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className={`mt-2 text-xs font-medium uppercase tracking-wider transition-colors ${isCurrent ? "text-teal-400" : isCompleted ? "text-teal-600" : "text-white/30"
                                        }`}>{step.label}</span>

                                    {/* Connector Line */}
                                    {idx !== activeSteps.length - 1 && (
                                        <div className={`absolute top-5 left-1/2 w-full h-[2px] -z-10 transition-colors duration-500 ${currentStep > step.id ? "bg-teal-500/30" : "bg-white/5"
                                            }`} style={{ width: "calc(100% + 2rem)" }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl min-h-[400px]">
                    {renderStepContent()}
                </div>

                {/* Footer Navigation */}
                <div className="flex items-center justify-between mt-8">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 transition"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    {currentStep < activeSteps.length ? (
                        <button
                            onClick={nextStep}
                            className="px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 flex items-center gap-2 transition"
                        >
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <span className="text-xs text-white/30">Review and Save</span>
                    )}
                </div>
            </div>

            {/* Success/Error Toast */}
            <ConfirmationModal
                isOpen={toast.isOpen}
                onClose={() => setToast({ ...toast, isOpen: false })}
                title={toast.title}
                message={toast.message}
                type={toast.type}
                isToast={true}
                duration={4000}
            />
        </div>
    );
}

// --- Sub-components ---

function Field({ label, required, hint, children }) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/80">
                    {label} {required && <span className="text-red-400">*</span>}
                </label>
                {hint && <span className="text-xs text-white/40">{hint}</span>}
            </div>
            {children}
        </div>
    );
}

function PricingTiersEditor({ tiers = [], onChange }) {
    const safeTiers = Array.isArray(tiers) ? tiers : [];

    const addTier = () => onChange([...safeTiers, { teamSize: "", price: "" }]);
    const removeTier = (idx) => onChange(safeTiers.filter((_, i) => i !== idx));
    const updateTier = (idx, field, val) => {
        const newTiers = [...safeTiers];
        newTiers[idx] = { ...newTiers[idx], [field]: val };
        onChange(newTiers);
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 text-xs uppercase tracking-widest text-white/40 mb-1">
                <span>Team Size</span>
                <span>Price (₹)</span>
            </div>
            {safeTiers.map((t, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                    <input
                        type="number"
                        placeholder="Size"
                        value={t.teamSize || ""}
                        onChange={(e) => updateTier(idx, "teamSize", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none"
                    />
                    <input
                        type="number"
                        placeholder="Price"
                        value={t.price || ""}
                        onChange={(e) => updateTier(idx, "price", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 focus:border-teal-400/50 outline-none"
                    />
                    <button onClick={() => removeTier(idx)} className="p-2 text-white/40 hover:text-red-400 transition">×</button>
                </div>
            ))}
            <button onClick={addTier} className="text-xs text-teal-400 hover:text-teal-300 font-medium">+ Add Tier</button>
        </div>
    );
}
