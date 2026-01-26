"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import NetworkSidebar from "@/components/network/Sidebar";
import { createClient } from "@/lib/supabase/client";
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    ListTodo,
    PartyPopper,
    X,
    Loader2
} from "lucide-react";

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
    const supabase = createClient();

    useEffect(() => {
        fetchCalendarData();
    }, [currentDate]);

    const fetchCalendarData = async () => {
        try {
            const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            // Fetch calendar events
            const { data: eventsData } = await supabase
                .from("calendar_events")
                .select("*")
                .or(`is_global.eq.true,visible_to_user.eq.${profile?.id}`)
                .gte("start_time", startOfMonth.toISOString())
                .lte("start_time", endOfMonth.toISOString());

            setEvents(eventsData || []);

            // Fetch tasks with deadlines
            const { data: tasksData } = await supabase
                .from("tasks")
                .select(`
                    id,
                    title,
                    deadline,
                    status,
                    assigned_to_team,
                    assigned_to_user
                `)
                .not("deadline", "is", null)
                .gte("deadline", startOfMonth.toISOString())
                .lte("deadline", endOfMonth.toISOString());

            // Filter tasks visible to user
            let visibleTasks = tasksData || [];
            if (!isPresident()) {
                const { data: userTeams } = await supabase
                    .from("team_members")
                    .select("team_id")
                    .eq("user_id", profile?.id);

                const userTeamIds = userTeams?.map(t => t.team_id) || [];

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
    };

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
            const newDate = new Date(prev);
            newDate.setMonth(newDate.getMonth() + direction);
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
        <div className="flex min-h-screen">
            <NetworkSidebar />

            <main className="flex-1 p-6 lg:p-10 overflow-auto">
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

                    {isPresident() && (
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
                                const hasItems = dayEvents.length > 0 || dayTasks.length > 0;

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDateClick(date)}
                                        disabled={!date}
                                        className={`min-h-[80px] lg:min-h-[100px] p-2 border-b border-r border-white/5 text-left transition-colors ${date ? 'hover:bg-white/5' : 'bg-black/20'
                                            } ${isToday(date) ? 'bg-teal/5' : ''}`}
                                    >
                                        {date && (
                                            <>
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm ${isToday(date)
                                                        ? 'bg-teal text-black font-bold'
                                                        : 'text-white/70'
                                                    }`}>
                                                    {date.getDate()}
                                                </span>

                                                {/* Event/Task Indicators */}
                                                <div className="mt-1 space-y-1">
                                                    {dayEvents.slice(0, 2).map((event, i) => (
                                                        <div
                                                            key={event.id}
                                                            className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded truncate"
                                                        >
                                                            {event.title}
                                                        </div>
                                                    ))}
                                                    {dayTasks.slice(0, 2).map((task, i) => (
                                                        <div
                                                            key={task.id}
                                                            className="text-[10px] px-1.5 py-0.5 bg-orange/20 text-orange rounded truncate"
                                                        >
                                                            {task.title}
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
                    <div className="flex items-center gap-2 text-white/50">
                        <div className="w-3 h-3 bg-purple-500/40 rounded" />
                        <span>Events</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50">
                        <div className="w-3 h-3 bg-orange/40 rounded" />
                        <span>Task Deadlines</span>
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
                        onClose={() => setViewingDate(null)}
                        onAddEvent={() => handleAddEvent(viewingDate)}
                    />
                )}
            </AnimatePresence>

            {/* Add Event Modal */}
            <AnimatePresence>
                {showEventModal && (
                    <AddEventModal
                        initialDate={selectedDate}
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

function DayDetailModal({ date, events, tasks, isPresident, onClose, onAddEvent }) {
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
                            {events.map(event => (
                                <div
                                    key={event.id}
                                    className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl"
                                >
                                    <PartyPopper className="w-5 h-5 text-purple-400 mt-0.5" />
                                    <div>
                                        <h4 className="text-white font-medium">{event.title}</h4>
                                        {event.description && (
                                            <p className="text-white/50 text-sm mt-1">{event.description}</p>
                                        )}
                                        <p className="text-purple-400/70 text-xs mt-2">
                                            {new Date(event.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Task Deadlines */}
                            {tasks.map(task => (
                                <div
                                    key={task.id}
                                    className="flex items-start gap-3 p-3 bg-orange/10 border border-orange/20 rounded-xl"
                                >
                                    <ListTodo className="w-5 h-5 text-orange mt-0.5" />
                                    <div>
                                        <h4 className="text-white font-medium">{task.title}</h4>
                                        <p className="text-orange/70 text-xs mt-1">
                                            Due: {new Date(task.deadline).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {isPresident && (
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
    );
}

function AddEventModal({ initialDate, onClose, onSuccess }) {
    const { profile } = useAuth();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startTime, setStartTime] = useState(
        initialDate ? new Date(initialDate).toISOString().slice(0, 16) : ""
    );
    const [isGlobal, setIsGlobal] = useState(true);
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

        setSaving(true);

        try {
            const { error: insertError } = await supabase
                .from("calendar_events")
                .insert({
                    title: title.trim(),
                    description: description.trim() || null,
                    start_time: new Date(startTime).toISOString(),
                    is_global: isGlobal,
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
                    <h2 className="text-xl font-serif font-bold text-white">Add Global Event</h2>
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
                            placeholder="e.g., Math Fest Planning Meeting"
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
