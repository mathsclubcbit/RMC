"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import {
    ListTodo,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Calendar,
    Users,
    User,
    RefreshCw
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { CreateTaskModal, ReviewTaskModal, SubmissionModal } from "./TaskModals";

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-500/20 text-blue-400 border-blue-400/30", icon: AlertCircle },
    under_review: { label: "Under Review", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: CheckCircle },
    completed: { label: "Completed", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle },
    overdue: { label: "Overdue", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: AlertCircle }
};

export default function TasksClient() {

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

    const [reviewModal, setReviewModal] = useState({
        isOpen: false,
        task: null,
        type: "approve"
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
        if (!profile?.id || !supabase) return;
        setLoading(true);

        try {
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

            let visibleTasks = tasksData || [];

            if (!isPresident() && !isCoreCouncil()) {
                const { data: userTeams } = await supabase
                    .from("team_members")
                    .select("team_id, role")
                    .eq("user_id", profile?.id);

                const userTeamIds = userTeams?.map(t => t.team_id) || [];
                const hasHeadRole = userTeams?.some(t => t.role === "head");
                setIsHeadOfAny(hasHeadRole);

                visibleTasks = tasksData?.filter(task => {
                    if (task.assigned_to_user === profile?.id) return true;
                    if (task.assigned_to_team && userTeamIds.includes(task.assigned_to_team)) return true;
                    if (task.created_by === profile?.id) return true;
                    return false;
                }) || [];
            }

            setTasks(visibleTasks);

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
        if (!supabase) return;
        fetchData();

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

            const isHead = profile?.role === "head" || isPresident();
            const isTeamTask = !!task.assigned_team;

            if (isTeamTask && !isHead) {
                if (newStatus === "completed" && task.status === "in_progress") {
                    actualStatus = "under_review";
                    updatePayload.status = actualStatus;
                }
            }

            const { error } = await supabase
                .from("tasks")
                .update(updatePayload)
                .eq("id", task.id);

            if (error) throw error;
            fetchData();
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
        <main className="flex-1 p-6 lg:p-10 pt-20 lg:pt-14 overflow-y-auto w-full">
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredTasks.map((task, index) => {
                        const StatusIcon = STATUS_CONFIG[task.status]?.icon || Clock;
                        const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                        const canApproveTask = profile?.role === "head" || isPresident() || isHeadOfAny;

                        return (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-teal/20 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1 line-clamp-1">{task.title}</h3>
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full border ${statusConfig.color}`}>
                                                <StatusIcon className="w-3 h-3" />
                                                {statusConfig.label}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {canManageTask(task) && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditingTask(task);
                                                            setShowModal(true);
                                                        }}
                                                        className="p-2 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="p-2 text-red-500/30 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-all"
                                                    >
                                                        <Plus className="w-4 h-4 rotate-45" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {task.description && (
                                        <p className="text-white/50 text-sm mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                        <div className="space-y-1">
                                            <span className="text-[10px] uppercase tracking-widest text-white/20 font-mono">Assignee</span>
                                            <div className="flex items-center gap-2 text-white/60 text-xs">
                                                {task.assigned_team ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                                <span className="truncate">{getAssigneeLabel(task)}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <span className="text-[10px] uppercase tracking-widest text-white/20 font-mono">Deadline</span>
                                            <div className="flex items-center justify-end gap-2 text-xs">
                                                <Calendar className="w-3.5 h-3.5 text-white/20" />
                                                <span>{formatDeadline(task.deadline)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                                    {(isPresident() || profile?.id === task.created_by || isHeadOfAny) && task.status === "under_review" && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setReviewModal({ isOpen: true, task, type: "reject" })}
                                                className="px-4 py-2 bg-red-500/10 text-red-500 text-xs font-bold rounded-xl hover:bg-red-500/20 border border-red-500/20"
                                            >
                                                Send Back
                                            </button>
                                            <button
                                                onClick={() => setReviewModal({ isOpen: true, task, type: "approve" })}
                                                className="px-4 py-2 bg-green-500 text-white text-xs font-bold rounded-xl hover:bg-green-600"
                                            >
                                                Approve
                                            </button>
                                        </div>
                                    )}

                                    {task.status === "in_progress" && (task.assigned_to_user === profile?.id || (task.assigned_to_team && isHeadOfAny)) && (
                                        <button
                                            onClick={() => setSubmissionModal({ isOpen: true, task })}
                                            className="px-4 py-2 bg-purple-500 text-white text-xs font-bold rounded-xl hover:bg-purple-600 w-full md:w-auto"
                                        >
                                            Submit for Review
                                        </button>
                                    )}

                                    {task.status === "pending" && (task.assigned_to_user === profile?.id || (task.assigned_to_team && isHeadOfAny)) && (
                                        <button
                                            onClick={() => handleStatusChange(task, "in_progress")}
                                            className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-white/80 w-full md:w-auto"
                                        >
                                            Start Task
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {showModal && (
                    <CreateTaskModal
                        task={editingTask}
                        teams={teams}
                        members={members}
                        onClose={() => setShowModal(false)}
                        onSuccess={() => {
                            setShowModal(false);
                            fetchData();
                        }}
                    />
                )}

                {reviewModal.isOpen && (
                    <ReviewTaskModal
                        task={reviewModal.task}
                        type={reviewModal.type}
                        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
                        onConfirm={async (feedback) => {
                            await handleStatusChange(
                                reviewModal.task,
                                reviewModal.type === "approve" ? "completed" : "in_progress",
                                { feedback: feedback || null }
                            );
                            setReviewModal({ ...reviewModal, isOpen: false });
                        }}
                    />
                )}

                {submissionModal.isOpen && (
                    <SubmissionModal
                        task={submissionModal.task}
                        onClose={() => setSubmissionModal({ ...submissionModal, isOpen: false })}
                        onConfirm={async (note) => {
                            await handleStatusChange(
                                submissionModal.task,
                                "under_review",
                                { submission_note: note || null }
                            );
                            setSubmissionModal({ ...submissionModal, isOpen: false });
                        }}
                    />
                )}
            </AnimatePresence>

            <ConfirmationModal
                {...statusModal}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
            />
        </main>
    );
}
