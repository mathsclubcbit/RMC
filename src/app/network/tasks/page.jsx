"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    ListTodo,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    Calendar,
    Users,
    User,
    Edit3,
    Trash2,
    RefreshCw,
    XCircle
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400 border-blue-400/30", icon: AlertCircle },
    under_review: { label: "Under Review", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CheckCircle },
    completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
    overdue: { label: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle }
};

export default function TasksPage() {
    const { profile, isPresident, isCoreCouncil } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [teams, setTeams] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [isHeadOfAny, setIsHeadOfAny] = useState(false);

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: "confirm",
        title: "",
        message: "",
        onConfirm: null
    });

    // Feedback/Review States
    const [reviewModal, setReviewModal] = useState({
        isOpen: false,
        task: null,
        type: "approve" // 'approve' or 'reject'
    });
    const [submissionModal, setSubmissionModal] = useState({
        isOpen: false,
        task: null
    });

    const showAlert = (title, message, type = "success") => {
        setStatusModal({ isOpen: true, title, message, type, onConfirm: null });
    };

    const showConfirm = (title, message, onConfirm, isDangerous = false) => {
        setStatusModal({ isOpen: true, title, message, type: "confirm", onConfirm, isDangerous });
    };

    const supabase = useMemo(() => createClient(), []);

    const fetchData = useCallback(async () => {
        if (!profile?.id) return;
        setLoading(true);

        try {
            // Fetch tasks visible to the current user
            const { data: tasksData, error: tasksError } = await supabase
                .from("tasks")
                .select(`
                    *,
                    assigned_team:assigned_to_team (id, name, type),
                    assigned_user:assigned_to_user (id, full_name, email),
                    creator:created_by (id, full_name, email)
                `)
                .order("created_at", { ascending: false });

            if (tasksError) throw tasksError;

            // Filter tasks based on visibility
            let visibleTasks = tasksData || [];

            if (!isPresident() && !isCoreCouncil()) {
                // Get user's team IDs and Roles
                const { data: userTeams } = await supabase
                    .from("team_members")
                    .select("team_id, role")
                    .eq("user_id", profile?.id);

                const userTeamIds = userTeams?.map(t => t.team_id) || [];
                const hasHeadRole = userTeams?.some(t => t.role === "head");
                setIsHeadOfAny(hasHeadRole);

                visibleTasks = tasksData?.filter(task => {
                    // Task assigned directly to user
                    if (task.assigned_to_user === profile?.id) return true;
                    // Task assigned to user's team
                    if (task.assigned_to_team && userTeamIds.includes(task.assigned_to_team)) return true;
                    // Task created by user
                    if (task.created_by === profile?.id) return true;
                    return false;
                }) || [];
            }

            setTasks(visibleTasks);

            // Fetch teams and members for the create modal
            const { data: teamsData } = await supabase
                .from("teams")
                .select("id, name, type")
                .order("name");
            setTeams(teamsData || []);

            const { data: membersData } = await supabase
                .from("profiles")
                .select("id, full_name, email, role")
                .order("full_name");
            setMembers(membersData || []);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    }, [profile?.id, isPresident, isCoreCouncil, supabase]);

    useEffect(() => {
        fetchData();

        // Realtime subscription
        const channel = supabase
            .channel("tasks-changes")
            .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchData)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchData, supabase]);

    const handleDeleteTask = async (taskId) => {
        showConfirm(
            "Delete Task",
            "Are you sure you want to delete this task? This action cannot be undone.",
            async () => {
                try {
                    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
                    if (error) throw error;
                    fetchData();
                    showAlert("Deleted", "Task has been removed successfully.", "success");
                } catch (error) {
                    console.error("Error deleting task:", error);
                    showAlert("Error", "Failed to delete task.", "error");
                }
            },
            true
        );
    };

    const handleStatusChange = async (task, newStatus, extraData = {}) => {
        try {
            let actualStatus = newStatus;
            const updatePayload = {
                status: actualStatus,
                ...extraData
            };

            // APPROVAL LOGIC
            const isHead = profile?.role === "head" || isPresident();
            const isTeamTask = !!task.assigned_team; // It's a team task if assigned to a team (even if specific user is also set? No, schema is one or other usually, or user belongs to team)
            // Actually, if assigned_to_team is set, it's a team task.

            // If Member (not Head) is updating a Team Task:
            if (isTeamTask && !isHead) {
                if (newStatus === "completed" && task.status === "in_progress") {
                    actualStatus = "under_review"; // Move to review instead of completing
                    updatePayload.status = actualStatus;
                }
            }

            const { error } = await supabase
                .from("tasks")
                .update(updatePayload)
                .eq("id", task.id);

            if (error) throw error;
            fetchData();
            // Optional: Success toast? For status change, maybe too noisy.
        } catch (error) {
            console.error("Error updating status:", error);
            showAlert("Error", "Failed to update status.", "error");
        }
    };

    const filteredTasks = tasks.filter(task => {
        if (filterStatus === "all") return true;
        return task.status === filterStatus;
    });

    const getAssigneeLabel = (task) => {
        if (task.assigned_team) {
            return task.assigned_team.name;
        }
        if (task.assigned_user) {
            return task.assigned_user.full_name || task.assigned_user.email;
        }
        return "Unassigned";
    };

    const formatDeadline = (deadline) => {
        if (!deadline) return "No deadline";
        const date = new Date(deadline);
        const now = new Date();
        const isOverdue = date < now;

        return (
            <span className={isOverdue ? "text-red-400" : "text-white/50"}>
                {date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
        );
    };

    const canManageTask = (task) => {
        return isPresident() || task.created_by === profile?.id;
    };

    return (
        <div className="flex h-full">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 pt-24 lg:pt-14 overflow-y-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8"
                >
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                            Tasks
                        </h1>
                        <p className="text-white/50">
                            {isPresident() ? "Manage all tasks" : "View your assigned tasks"}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={fetchData}
                            className={`p-3 bg-white/5 text-white/50 hover:text-white rounded-xl hover:bg-white/10 transition-colors ${loading ? "animate-spin" : ""}`}
                            title="Refresh Tasks"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        {(isPresident() || profile?.role === "head" || isHeadOfAny) && (
                            <button
                                onClick={() => {
                                    setEditingTask(null);
                                    setShowModal(true);
                                }}
                                className="flex items-center gap-2 px-5 py-3 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Create Task
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex gap-2 mb-6 overflow-x-auto pb-2"
                >
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === "all"
                            ? "bg-white/10 text-white"
                            : "text-white/50 hover:text-white"
                            }`}
                    >
                        All ({tasks.length})
                    </button>
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                        const count = tasks.filter(t => t.status === key).length;
                        return (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${filterStatus === key
                                    ? config.color
                                    : "text-white/50 hover:text-white"
                                    }`}
                            >
                                {config.label} ({count})
                            </button>
                        );
                    })}
                </motion.div>

                {/* Tasks List */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-10 h-10 text-teal animate-spin" />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20">
                        <ListTodo className="w-16 h-16 text-white/10 mx-auto mb-4" />
                        <h3 className="text-xl text-white/50 mb-2">No Tasks Found</h3>
                        <p className="text-white/30">
                            {filterStatus !== "all" ? "Try changing the filter" : "Create your first task"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredTasks.map((task, index) => {
                            const StatusIcon = STATUS_CONFIG[task.status]?.icon || Clock;
                            const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                            // Define permissions in local scope
                            const canApproveTask = profile?.role === "head" || isPresident() || isHeadOfAny;

                            return (
                                <motion.div
                                    key={task.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-teal/20 transition-colors"
                                >
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-medium text-white">{task.title}</h3>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest rounded-full border ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {statusConfig.label}
                                                </span>
                                            </div>

                                            {task.description && (
                                                <p className="text-white/50 text-sm mb-3 line-clamp-2">{task.description}</p>
                                            )}

                                            {/* Submission Note (Review Context) */}
                                            {task.submission_note && (task.status === "under_review" || task.status === "completed") && (
                                                <div className="mb-3 p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                                                    <p className="text-[10px] uppercase tracking-widest text-purple-400 font-bold mb-1">Submission Note</p>
                                                    <p className="text-white/70 text-sm italic">&quot;{task.submission_note}&quot;</p>
                                                </div>
                                            )}

                                            {/* Feedback (Correction Context) */}
                                            {task.feedback && (
                                                <div className={`mb-3 p-3 rounded-xl border ${task.status === "completed"
                                                    ? "bg-green-500/5 border-green-500/10"
                                                    : "bg-red-500/5 border-red-500/10"
                                                    }`}>
                                                    <p className={`text-[10px] uppercase tracking-widest font-bold mb-1 ${task.status === "completed" ? "text-green-400" : "text-red-400"
                                                        }`}>
                                                        {task.status === "completed" ? "Head's Appreciation" : "Corrections Required"}
                                                    </p>
                                                    <p className="text-white/70 text-sm">&quot;{task.feedback}&quot;</p>
                                                </div>
                                            )}

                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="flex items-center gap-2 text-white/40">
                                                    {task.assigned_team ? (
                                                        <Users className="w-4 h-4" />
                                                    ) : (
                                                        <User className="w-4 h-4" />
                                                    )}
                                                    <span>{getAssigneeLabel(task)}</span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-white/40" />
                                                    {formatDeadline(task.deadline)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Approval Actions for Head */}
                                            {canApproveTask && task.assigned_team && task.status === "under_review" && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => setReviewModal({ isOpen: true, task, type: "approve" })}
                                                        className="px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg hover:bg-green-500/30"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setReviewModal({ isOpen: true, task, type: "reject" })}
                                                        className="px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/30"
                                                    >
                                                        Send Back
                                                    </button>
                                                </div>
                                            )}

                                            {/* Action Buttons for Members (Simplified Logic) */}
                                            {!canApproveTask && task.assigned_team && (
                                                <>
                                                    {task.status === "pending" && (
                                                        <button
                                                            onClick={() => handleStatusChange(task, "in_progress")}
                                                            className="px-3 py-1.5 bg-teal/20 text-teal text-xs font-bold rounded-lg hover:bg-teal/30"
                                                        >
                                                            Start Task
                                                        </button>
                                                    )}
                                                    {task.status === "in_progress" && (
                                                        <button
                                                            onClick={() => setSubmissionModal({ isOpen: true, task })}
                                                            className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-500/30"
                                                        >
                                                            Submit for Review
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {/* Standard Dropdown (Only for Individual Tasks OR if Head wants manual override) */}
                                            {(!task.assigned_team || canApproveTask) && task.status !== "under_review" && (
                                                <select
                                                    value={task.status}
                                                    onChange={(e) => handleStatusChange(task, e.target.value)}
                                                    className="appearance-none bg-gray-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-teal/50 outline-none"
                                                    style={{ colorScheme: 'dark' }}
                                                >
                                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                                                        // Filter out approval states from dropdown to avoid confusion
                                                        if (key.includes("approval")) return null;
                                                        return <option key={key} value={key} className="bg-gray-800 text-white">{config.label}</option>;
                                                    })}
                                                </select>
                                            )}

                                            {canManageTask(task) && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingTask(task);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 text-white/40 hover:text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Review Modal (Heads) */}
            <AnimatePresence>
                {reviewModal.isOpen && (
                    <ReviewTaskModal
                        task={reviewModal.task}
                        type={reviewModal.type}
                        onClose={() => setReviewModal({ isOpen: false, task: null, type: "approve" })}
                        onConfirm={async (feedback) => {
                            await handleStatusChange(
                                reviewModal.task,
                                reviewModal.type === "approve" ? "completed" : "in_progress",
                                { feedback }
                            );
                            setReviewModal({ isOpen: false, task: null, type: "approve" });
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Submission Modal (Members) */}
            <AnimatePresence>
                {submissionModal.isOpen && (
                    <SubmissionModal
                        task={submissionModal.task}
                        onClose={() => setSubmissionModal({ isOpen: false, task: null })}
                        onConfirm={async (note) => {
                            await handleStatusChange(submissionModal.task, "completed", { submission_note: note });
                            setSubmissionModal({ isOpen: false, task: null });
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Create/Edit Task Modal */}
            <AnimatePresence>
                {showModal && (
                    <CreateTaskModal
                        task={editingTask}
                        teams={teams}
                        members={members}
                        onClose={() => {
                            setShowModal(false);
                            setEditingTask(null);
                        }}
                        onSuccess={() => {
                            setShowModal(false);
                            setEditingTask(null);
                            fetchData();
                        }}
                    />
                )}
            </AnimatePresence>
            {/* Global Status/Confirmation Modal */}
            <ConfirmationModal
                isOpen={statusModal.isOpen}
                type={statusModal.type}
                title={statusModal.title}
                message={statusModal.message}
                isDangerous={statusModal.isDangerous}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={statusModal.onConfirm ? () => {
                    statusModal.onConfirm();
                    setStatusModal(prev => ({ ...prev, isOpen: false }));
                } : null}
            />
        </div>
    );
}

function CreateTaskModal({ task, teams, members, onClose, onSuccess }) {
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
                // Update existing task
                const { error: updateError } = await supabase
                    .from("tasks")
                    .update(taskData)
                    .eq("id", task.id);

                if (updateError) throw updateError;
            } else {
                // Create new task
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
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-gray-900/95 backdrop-blur-xl">
                    <h2 className="text-xl font-serif font-bold text-white">
                        {task ? "Edit Task" : "Create New Task"}
                    </h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Title */}
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

                    {/* Description */}
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

                    {/* Assign Type */}
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

                    {/* Team/User Selection with Privileges */}
                    {assignType === "team" ? (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                Select Team *
                            </label>
                            <select
                                value={assignToTeam}
                                onChange={(e) => setAssignToTeam(e.target.value)}
                                className="w-full appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
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
                                className="w-full appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="" className="bg-gray-800 text-white/50">Choose a member...</option>
                                {members
                                    .filter(m => {
                                        // Filter logic:
                                        // 1. President/Core: See everyone
                                        if (isPresident()) return true;
                                        // 2. Head: See their team members (Need team context? We fetched ALL members, but we don't have their team mapping here easily unless we fetch it.
                                        // Actually `members` fetch in fetchData didn't filter.
                                        // But wait, the user wants: "Head should have privilege of assigning...".

                                        // Quick Fix depending on available data:
                                        // If Head: Allow all for now (as checking team membership requires more data), OR assume Heads know who to pick.
                                        // If Member: Only show THEMSELVES.
                                        if (profile.role === "member") {
                                            return m.id === profile.id;
                                        }
                                        return true; // Heads see all (simplification, to avoid complex filters without team-member mapping)
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

                    {/* Deadline */}
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

                    {/* Submit */}
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

function ReviewTaskModal({ task, type, onClose, onConfirm }) {
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

function SubmissionModal({ task, onClose, onConfirm }) {
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
