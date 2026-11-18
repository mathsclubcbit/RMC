"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Calendar,
    Users,
    User,
    XCircle,
    UserPlus
} from "lucide-react";

export function CreateTaskModal({ task, teams, members, onClose, onSuccess }) {
    const { profile, isPresident } = useAuth();
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [assignType, setAssignType] = useState(task?.assigned_to_team ? "team" : "user");
    const [assignToTeam, setAssignToTeam] = useState(task?.assigned_to_team || "");
    const [assignToUser, setAssignToUser] = useState(task?.assigned_to_user || "");
    const [deadline, setDeadline] = useState(task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Task title is required");
            return;
        }

        if (assignType === "team" && !assignToTeam) {
            setError("Please select a team");
            return;
        }

        if (assignType === "user" && !assignToUser) {
            setError("Please select a user");
            return;
        }

        setSaving(true);

        try {
            const taskData = {
                title: title.trim(),
                description: description.trim() || null,
                assigned_to_team: assignType === "team" ? assignToTeam : null,
                assigned_to_user: assignType === "user" ? assignToUser : null,
                deadline: deadline ? new Date(deadline).toISOString() : null
            };

            if (task) {
                const { error: updateError } = await supabase
                    .from("tasks")
                    .update(taskData)
                    .eq("id", task.id);

                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from("tasks")
                    .insert({
                        ...taskData,
                        created_by: profile.id,
                        status: "pending"
                    });

                if (insertError) throw insertError;
            }

            onSuccess();
        } catch (err) {
            console.error("Error saving task:", err);
            setError(err.message || "Failed to save task");
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-gray-900/95 backdrop-blur-xl">
                    <h2 className="text-xl font-serif font-bold text-white">
                        {task ? "Edit Task" : "Create New Task"}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Task Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter task title"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Task details..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Assign To *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setAssignType("team")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${assignType === "team"
                                    ? "bg-teal/10 border-teal/50 text-teal"
                                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                                    }`}
                            >
                                <Users className="w-5 h-5" />
                                Team
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssignType("user")}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all ${assignType === "user"
                                    ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                                    }`}
                            >
                                <User className="w-5 h-5" />
                                Individual
                            </button>
                        </div>
                    </div>

                    {assignType === "team" ? (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                Select Team *
                            </label>
                            <select
                                value={assignToTeam}
                                onChange={(e) => setAssignToTeam(e.target.value)}
                                className="w-full appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none font-bold"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="" className="bg-gray-800 text-white/50">Choose a team...</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id} className="bg-gray-800 text-white">
                                        {team.name} ({team.type === "fest" ? "Fest" : "General"})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                Select Member *
                            </label>
                            <select
                                value={assignToUser}
                                onChange={(e) => setAssignToUser(e.target.value)}
                                className="w-full appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none font-bold"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="" className="bg-gray-800 text-white/50">Choose a member...</option>
                                {members
                                    .filter(m => {
                                        if (isPresident()) return true;
                                        if (profile.role === "member") {
                                            return m.id === profile.id;
                                        }
                                        return true;
                                    })
                                    .map(member => (
                                        <option key={member.id} value={member.id} className="bg-gray-800 text-white">
                                            {member.full_name || member.email}
                                        </option>
                                    ))}
                            </select>
                            {profile.role === "member" && (
                                <p className="text-[10px] text-white/30">Members can only assign tasks to themselves.</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Deadline
                        </label>
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            task ? "Update Task" : "Create Task"
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

export function ReviewTaskModal({ task, type, onClose, onConfirm }) {
    const [feedback, setFeedback] = useState("");
    const [saving, setSaving] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">
                            {type === "approve" ? "Approve Work" : "Send Back for Correction"}
                        </h2>
                        <p className="text-white/40 text-xs mt-1">
                            Task: {task?.title}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold">
                            {type === "approve" ? "Appreciation/Feedback (Optional)" : "Reason for Rejection *"}
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder={type === "approve" ? "Well done! Any final notes?" : "Please explain what needs to be fixed..."}
                            rows={4}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none resize-none"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={async () => {
                            if (type === "reject" && !feedback.trim()) return;
                            setSaving(true);
                            await onConfirm(feedback);
                            setSaving(false);
                        }}
                        disabled={saving || (type === "reject" && !feedback.trim())}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${type === "approve" ? "bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/20" : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20"
                            }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            type === "approve" ? <><CheckCircle className="w-5 h-5" /> Approve & Complete</> : <><XCircle className="w-5 h-5" /> Send Back</>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

export function SubmissionModal({ task, onClose, onConfirm }) {
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white uppercase tracking-tight">
                            Submit for Review
                        </h2>
                        <p className="text-white/40 text-xs mt-1">
                            Add a quick note about your progress
                        </p>
                    </div>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono font-bold">
                            Submission Note (Optional)
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="e.g. Completed the designs, files are in the shared drive."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-purple-500/50 outline-none resize-none"
                            autoFocus
                        />
                    </div>

                    <button
                        onClick={async () => {
                            setSaving(true);
                            await onConfirm(note);
                            setSaving(false);
                        }}
                        disabled={saving}
                        className="w-full bg-purple-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-purple-600 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Submit Work
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

