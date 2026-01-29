"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    ListTodo,
    PartyPopper,
    X,
    Loader2,
    Trash2
} from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function CalendarPage() {
    const { profile, isPresident } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [viewingDate, setViewingDate] = useState(null);
    const [myTeams, setMyTeams] = useState([]);
    const supabase = useMemo(() => createClient(), []);

    const fetchCalendarData = useCallback(async () => {
        if (!profile?.id) return;

        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            // Fetch user's teams (for permission checks and visibility)
            const { data: teamMemberships } = await supabase
                .from("team_members")
                .select(`
                    team_id,
                    role,
                    teams:team_id (id, name, type)
                `)
                .eq("user_id", profile?.id);

            const teams = teamMemberships?.map(tm => ({
                id: tm.teams.id,
                name: tm.teams.name,
                type: tm.teams.type,
                role: tm.role
            })) || [];

            setMyTeams(teams);
            const userTeamIds = teams.map(t => t.id);

            // Fetch calendar events with new visibility logic
            let query = supabase
                .from("calendar_events")
                .select("*")
                .gte("start_time", startOfMonth.toISOString())
                .lte("start_time", endOfMonth.toISOString());

            const { data: eventsData } = await query;

            const filteredEvents = eventsData?.filter(event => {
                if (event.created_by === profile?.id) return true;
                if (event.is_global) return true;
                return false;
            }) || [];

            setEvents(filteredEvents);

            // Fetch tasks with deadlines
            const { data: tasksData } = await supabase
                .from("tasks")
                .select(`
                    id,
                    title,
                    deadline,
                    status,
                    assigned_to_team,
                    assigned_to_user,
                    teams:assigned_to_team (name)
                `)
                .not("deadline", "is", null)
                .gte("deadline", startOfMonth.toISOString())
                .lte("deadline", endOfMonth.toISOString());

            // Filter tasks visible to user
            let visibleTasks = tasksData || [];
            if (!isPresident()) {
                visibleTasks = tasksData?.filter(task => {
                    if (task.assigned_to_user === profile?.id) return true;
                    if (task.assigned_to_team && userTeamIds.includes(task.assigned_to_team)) return true;
                    return false;
                }) || [];
            }

            setTasks(visibleTasks);
        } catch (error) {
            console.error("Error fetching calendar data:", error);
        } finally {
            setLoading(false);
        }
    }, [profile?.id, currentDate, isPresident, supabase]);

    useEffect(() => {
        fetchCalendarData();
    }, [fetchCalendarData]);

    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const days = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            days.push(new Date(year, month, day));
        }

        return days;
    }, [currentDate]);

    const getEventsForDate = (date) => {
        if (!date) return { events: [], tasks: [] };

        const dateStr = date.toDateString();

        const dayEvents = events.filter(event => {
            const eventDate = new Date(event.start_time);
            return eventDate.toDateString() === dateStr;
        });

        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.deadline);
            return taskDate.toDateString() === dateStr;
        });

        return { events: dayEvents, tasks: dayTasks };
    };

    const navigateMonth = (direction) => {
        setCurrentDate(prev => {
            // Create a new date set to the 1st of the current month to avoid overflow issues
            // e.g., Jan 31 + 1 month would become March 3 instead of Feb 1
            const newDate = new Date(prev.getFullYear(), prev.getMonth() + direction, 1);
            return newDate;
        });
    };

    const isToday = (date) => {
        return date?.toDateString() === new Date().toDateString();
    };

    const handleDateClick = (date) => {
        if (!date) return;
        setViewingDate(date);
    };

    const handleAddEvent = (date) => {
        setSelectedDate(date || new Date());
        setShowEventModal(true);
    };

    return (
        <div className="flex h-full">
            <NetworkSidebar />

            <main className="flex-1 p-4 lg:p-10 pt-24 lg:pt-14 overflow-y-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
                >
                    <div>
                        <h1 className="text-3xl lg:text-4xl font-serif font-bold text-white mb-2">
                            Calendar
                        </h1>
                        <p className="text-white/50">
                            Your personal schedule and deadlines
                        </p>
                    </div>

                    {(isPresident() || myTeams.some(t => t.role === 'head')) && (
                        <button
                            onClick={() => handleAddEvent(null)}
                            className="flex items-center gap-2 px-5 py-3 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            Add Event
                        </button>
                    )}
                </motion.div>

                {/* Calendar Navigation */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between mb-6"
                >
                    <button
                        onClick={() => navigateMonth(-1)}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <h2 className="text-xl font-serif font-bold text-white">
                        {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>

                    <button
                        onClick={() => navigateMonth(1)}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </motion.div>

                {/* Calendar Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden"
                >
                    {/* Day Headers */}
                    <div className="grid grid-cols-7 border-b border-white/5">
                        {DAYS.map(day => (
                            <div
                                key={day}
                                className="px-2 py-3 text-center text-[10px] uppercase tracking-widest text-white/40 font-mono"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-teal animate-spin" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-7">
                            {calendarDays.map((date, index) => {
                                const { events: dayEvents, tasks: dayTasks } = getEventsForDate(date);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDateClick(date)}
                                        disabled={!date}
                                        className={`
                                            min-h-[80px] md:min-h-[100px] lg:min-h-[120px] p-1.5 md:p-3 
                                            border-b border-r border-white/5 
                                            text-left transition-all duration-300 relative group
                                            ${date
                                                ? 'hover:bg-white/5 hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]'
                                                : 'bg-black/20'
                                            } 
                                            ${isToday(date) ? 'bg-teal/5 ring-1 ring-inset ring-teal/20' : ''}
                                        `}
                                    >
                                        {date && (
                                            <>
                                                <span className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-xs md:text-sm ${isToday(date)
                                                    ? 'bg-teal text-black font-bold'
                                                    : 'text-white/70'
                                                    }`}>
                                                    {date.getDate()}
                                                </span>

                                                {/* Event/Task Indicators */}
                                                <div className="mt-1 space-y-1">
                                                    {dayEvents.slice(0, 3).map((event) => (
                                                        <div
                                                            key={event.id}
                                                            className={`
                                                                text-[9px] font-medium px-2 py-1 rounded-md truncate backdrop-blur-sm border
                                                                ${event.visibility === 'team'
                                                                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                                                                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                                                                }
                                                            `}
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                    {dayTasks.slice(0, 2).map((task) => (
                                                        <div
                                                            key={task.id}
                                                            className="text-[9px] font-medium px-2 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-md truncate"
                                                        >
                                                            {task.teams?.name ? `${task.teams.name}: ` : ""}{task.title}
                                                        </div>
                                                    ))}
                                                    {(dayEvents.length + dayTasks.length) > 2 && (
                                                        <div className="text-[10px] text-white/40">
                                                            +{dayEvents.length + dayTasks.length - 2} more
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Legend */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-6 mt-6 text-sm"
                >
                    <div className="flex items-center gap-2 text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
                        <span>Global Events</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <div className="w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.5)]" />
                        <span>Team Events</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <div className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
                        <span>Deadlines</span>
                    </div>
                </motion.div>
            </main>

            {/* Day Detail Modal */}
            <AnimatePresence>
                {viewingDate && (
                    <DayDetailModal
                        date={viewingDate}
                        events={getEventsForDate(viewingDate).events}
                        tasks={getEventsForDate(viewingDate).tasks}
                        isPresident={isPresident()}
                        currentUserId={profile?.id}
                        onClose={() => setViewingDate(null)}
                        onAddEvent={() => handleAddEvent(viewingDate)}
                        onDeleteEvent={async (eventId) => {
                            const { error } = await supabase
                                .from('calendar_events')
                                .delete()
                                .eq('id', eventId);
                            if (!error) {
                                fetchCalendarData();
                            }
                            return { error };
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Add Event Modal */}
            <AnimatePresence>
                {showEventModal && (
                    <AddEventModal
                        initialDate={selectedDate}
                        myTeams={myTeams}
                        onClose={() => setShowEventModal(false)}
                        onSuccess={() => {
                            setShowEventModal(false);
                            fetchCalendarData();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function DayDetailModal({ date, events, tasks, isPresident, currentUserId, onClose, onAddEvent, onDeleteEvent }) {
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, eventId: null, eventTitle: "" });
    const [deleting, setDeleting] = useState(false);

    const handleDeleteClick = (event) => {
        setDeleteModal({ isOpen: true, eventId: event.id, eventTitle: event.title });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.eventId) return;

        setDeleting(true);
        try {
            const result = await onDeleteEvent(deleteModal.eventId);
            if (result?.error) {
                console.error("Failed to delete event:", result.error);
            }
        } finally {
            setDeleting(false);
            setDeleteModal({ isOpen: false, eventId: null, eventTitle: "" });
        }
    };

    return (
        <>
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                type="confirm"
                title="Delete Event?"
                message={`Are you sure you want to delete "${deleteModal.eventTitle}"? This cannot be undone.`}
                confirmText={deleting ? "Deleting..." : "Delete"}
                isDangerous={true}
                onClose={() => setDeleteModal({ isOpen: false, eventId: null, eventTitle: "" })}
                onConfirm={handleConfirmDelete}
            />

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
                    className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                        <div>
                            <h2 className="text-xl font-serif font-bold text-white">
                                {date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                            </h2>
                        </div>
                        <button onClick={onClose} className="text-white/50 hover:text-white">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {events.length === 0 && tasks.length === 0 ? (
                            <div className="text-center py-8">
                                <CalendarIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
                                <p className="text-white/40">No events or deadlines</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Events */}
                                {events.map(event => {
                                    const isOwner = event.created_by === currentUserId;

                                    return (
                                        <div
                                            key={event.id}
                                            className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl group"
                                        >
                                            <PartyPopper className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white font-medium">{event.title}</h4>
                                                {event.description && (
                                                    <p className="text-white/50 text-sm mt-1">{event.description}</p>
                                                )}
                                                <p className="text-purple-400/70 text-xs mt-2">
                                                    {new Date(event.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            </div>
                                            {isOwner && (
                                                <button
                                                    onClick={() => handleDeleteClick(event)}
                                                    className="p-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Delete event"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Task Deadlines */}
                                {tasks.map(task => (
                                    <div
                                        key={task.id}
                                        className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                                    >
                                        <ListTodo className="w-5 h-5 text-amber-400 mt-0.5" />
                                        <div>
                                            <h4 className="text-white font-medium">
                                                {task.teams?.name && (
                                                    <span className="inline-block px-1.5 py-0.5 mr-2 bg-amber-500/20 text-[10px] rounded uppercase tracking-wider text-amber-300">
                                                        {task.teams.name}
                                                    </span>
                                                )}
                                                {task.title}
                                            </h4>
                                            <p className="text-amber-400/70 text-xs mt-1">
                                                Due: {new Date(task.deadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {(isPresident || onAddEvent) && (
                        <div className="px-6 py-4 border-t border-white/5">
                            <button
                                onClick={onAddEvent}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-teal text-black font-bold rounded-xl hover:bg-teal/80 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Add Event
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </>
    );
}

function AddEventModal({ initialDate, myTeams, onClose, onSuccess }) {
    const { profile, isPresident } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState(
        initialDate ? new Date(initialDate).toISOString().slice(0, 16) : ""
    );
    // Visibility State
    const [visibility, setVisibility] = useState(isPresident() ? "global" : "team");

    // Team ID State: Default to first Head team if not President user
    const headTeams = myTeams?.filter(t => t.role === 'head') || [];
    const [teamId, setTeamId] = useState(headTeams[0]?.id || "");

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const supabase = createClient();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Event title is required");
            return;
        }

        if (!startTime) {
            setError("Start time is required");
            return;
        }

        if (visibility === 'team' && !teamId) {
            setError("Please select a team");
            return;
        }

        setSaving(true);

        try {
            const { error: insertError } = await supabase
                .from("calendar_events")
                .insert({
                    title: title.trim(),
                    description: description.trim() || null,
                    start_time: new Date(startTime).toISOString(),
                    is_global: visibility === 'global',
                    type: "event",
                    created_by: profile.id
                });

            if (insertError) throw insertError;
            onSuccess();
        } catch (err) {
            console.error("Error creating event:", err);
            setError(err.message || "Failed to create event");
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
                className="bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                    <h2 className="text-xl font-serif font-bold text-white">Add Event</h2>
                    <button onClick={onClose} className="text-white/50 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Event Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Timeline Kickoff"
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
                            placeholder="Event details..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:border-teal/50 outline-none resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Date & Time *
                        </label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                        />
                    </div>

                    {/* Visibility Controls */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            Visibility
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {isPresident() && (
                                <button
                                    type="button"
                                    onClick={() => setVisibility("global")}
                                    className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${visibility === "global"
                                        ? "bg-teal/10 border-teal/50 text-teal"
                                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                                        }`}
                                >
                                    Global (Everyone)
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setVisibility("team")}
                                className={`px-4 py-3 rounded-xl border transition-all text-sm font-medium ${visibility === "team"
                                    ? "bg-purple-500/10 border-purple-500/50 text-purple-400"
                                    : "bg-white/5 border-white/10 text-white/50 hover:border-white/30"
                                    } ${!isPresident() ? 'col-span-2' : ''}`}
                            >
                                Team Only
                            </button>
                        </div>
                    </div>

                    {/* Team Selection (Only if Team Visibility) */}
                    {visibility === "team" && (
                        <div className="space-y-2">
                            <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                                Select Team *
                            </label>
                            <select
                                value={teamId}
                                onChange={(e) => setTeamId(e.target.value)}
                                className="w-full appearance-none bg-gray-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-teal/50 outline-none"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="" className="bg-gray-800 text-white/50">Choose a team...</option>
                                {/* If President, see all teams? No, passed myTeams. Wait, President isn't in all teams? 
                                    President might need ALL teams list. Currently fetching only user's teams.
                                    Ideally President should be able to post to ANY team? 
                                    For now, let's limit to teams they are part of OR improve `myTeams` for president.
                                    Actually, if President adds event for a team they are NOT in, it's weird.
                                    But let's assume President is added to teams or we fetch all teams if President.
                                    
                                    Current `myTeams` is strictly my memberships.
                                    We should update `CalendarPage.jsx` logic to fetch ALL teams if President?
                                    Actually, user request "President can add... adjust visibility... which to be shown for who."
                                    If "team" visibility, implied spec team.
                                    
                                    Let's stick to `myTeams` for now or better yet, verify.
                                    If President assigns to a team, they should select from available teams.
                                 */}
                                {myTeams.map(team => (
                                    <option key={team.id} value={team.id} className="bg-gray-800 text-white">
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full bg-teal text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-teal/80 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Event"
                        )}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}
