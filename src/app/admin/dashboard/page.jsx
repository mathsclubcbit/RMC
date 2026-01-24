"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Calendar, MapPin, Users, Edit, Trash2, X, Check, BarChart3, LogOut, Clock, Copy, Shield, AlertTriangle, AlertCircle, CheckCircle2, Upload, TrendingUp } from "lucide-react";
// import { upcomingEvents } from "@/data/upcomingEvents"; // Removed static import
import MathBackground from "@/components/ui/MathBackground";

export default function AdminDashboard() {
    const router = useRouter();
    const [events, setEvents] = useState([]); // Initialize empty
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dashboardStats, setDashboardStats] = useState({
        totalRegistrations: 0,
        totalRevenue: 0,
        totalEvents: 0
    });

    // Success Modal State
    const [createdEventCreds, setCreatedEventCreds] = useState(null);

    // Custom Modal States
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [notification, setNotification] = useState({ isOpen: false, message: "", type: "success" }); // type: success | error

    const showNotification = (message, type = "success") => {
        setNotification({ isOpen: true, message, type });
        // Auto hide after 3 seconds if success
        if (type === "success") {
            setTimeout(() => setNotification({ isOpen: false, message: "", type: "success" }), 3000);
        }
    };

    // Auth Check & Data Fetch
    useEffect(() => {
        const auth = sessionStorage.getItem("admin-auth");
        if (auth !== "main") {
            router.push("/admin/login");
        } else {
            // Fetch events from API
            fetch('/api/events')
                .then(res => res.json())
                .then(data => setEvents(data))
                .catch(err => console.error("Failed to fetch events:", err));

            // Fetch analytics overview for stat cards
            fetch('/api/analytics/overview')
                .then(res => res.json())
                .then(data => {
                    if (data.overview) {
                        setDashboardStats(data.overview);
                    }
                })
                .catch(err => console.error("Failed to fetch analytics:", err));
        }
    }, [router]);

    // Create State
    const [newEvent, setNewEvent] = useState({
        title: "",
        isOneDay: true,
        startDate: "",
        endDate: "",
        startTime: "",
        endTime: "",
        location: "",
        category: "Competition",
        description: "",
        status: "Registration Open",
        registrationFee: "",
        teamSize: 1
    });

    // Poster upload state
    const [posterMobile, setPosterMobile] = useState(null);
    const [posterDesktop, setPosterDesktop] = useState(null);
    const [posterMobilePreview, setPosterMobilePreview] = useState(null);
    const [posterDesktopPreview, setPosterDesktopPreview] = useState(null);

    const handlePosterChange = (file, type) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        if (type === 'mobile') {
            setPosterMobile(file);
            setPosterMobilePreview(preview);
        } else {
            setPosterDesktop(file);
            setPosterDesktopPreview(preview);
        }
    };

    const generateEventPassword = (title) => {
        const sanitizedTitle = title.toLowerCase().replace(/\s+/g, '');
        const commonSuffix = "rmc2026";
        return `${sanitizedTitle}${commonSuffix}`;
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        // Generate Secure Password
        const eventPassword = generateEventPassword(newEvent.title);

        // Format date string based on selection
        let dateString = newEvent.startDate;
        if (!newEvent.isOneDay && newEvent.endDate) {
            dateString = `${newEvent.startDate} - ${newEvent.endDate}`;
        }

        // Format time string
        let timeString = "";
        if (newEvent.startTime) {
            timeString = newEvent.startTime;
            if (newEvent.endTime) {
                timeString += ` - ${newEvent.endTime}`;
            }
        }

        // Generate simple ID - timestamps are safer than length for concurrent usage, but for now length + random is ok
        // Using length can cause collisions if we delete items, so let's use a timestamp suffix
        const created = {
            id: `u${Date.now().toString(36)}`,
            ...newEvent,
            date: dateString,
            time: timeString,
            participants: 0,
            year: "2025-26",
            password: eventPassword, // Store internally
            img: "/assets/events/math-heist.jpg"
        };

        // API Call to Persist
        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(created)
            });

            if (res.ok) {
                // Upload posters if provided
                if (posterMobile || posterDesktop) {
                    const posterData = new FormData();
                    posterData.append('eventId', created.id);
                    if (posterMobile) posterData.append('posterMobile', posterMobile);
                    if (posterDesktop) posterData.append('posterDesktop', posterDesktop);

                    const posterRes = await fetch('/api/events/upload', {
                        method: 'POST',
                        body: posterData
                    });

                    if (posterRes.ok) {
                        const posterResult = await posterRes.json();
                        // Update event with poster URLs
                        created.posterMobile = posterResult.posterMobile;
                        created.posterDesktop = posterResult.posterDesktop;
                        created.img = posterResult.posterDesktop || posterResult.posterMobile || created.img;

                        // Update event in backend with poster URLs
                        await fetch('/api/events/update', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(created)
                        });
                    }
                }

                setEvents([...events, created]);
                setIsCreateModalOpen(false);
                setCreatedEventCreds({ title: newEvent.title, password: eventPassword });

                // Reset form
                setNewEvent({
                    title: "", isOneDay: true, startDate: "", endDate: "", startTime: "", endTime: "",
                    location: "", category: "Competition", description: "", status: "Registration Open", registrationFee: "", teamSize: 1
                });
                setPosterMobile(null);
                setPosterDesktop(null);
                setPosterMobilePreview(null);
                setPosterDesktopPreview(null);
            } else {
                showNotification("Failed to save event.", "error");
            }
        } catch (error) {
            console.error("Creation error:", error);
            showNotification("Error creating event.", "error");
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("admin-auth");
        router.push("/admin/login");
    };

    // --- EDIT FUNCTIONALITY ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState(null);

    // Lock Body Scroll when any Modal is Open
    useEffect(() => {
        if (isCreateModalOpen || isEditModalOpen) {
            document.body.classList.add("noscroll");
        } else {
            document.body.classList.remove("noscroll");
        }
        return () => { document.body.classList.remove("noscroll"); };
    }, [isCreateModalOpen, isEditModalOpen]);

    // Edit poster state
    const [editPosterMobile, setEditPosterMobile] = useState(null);
    const [editPosterDesktop, setEditPosterDesktop] = useState(null);
    const [editPosterMobilePreview, setEditPosterMobilePreview] = useState(null);
    const [editPosterDesktopPreview, setEditPosterDesktopPreview] = useState(null);

    const handleEditPosterChange = (file, type) => {
        if (!file) return;
        const preview = URL.createObjectURL(file);
        if (type === 'mobile') {
            setEditPosterMobile(file);
            setEditPosterMobilePreview(preview);
        } else {
            setEditPosterDesktop(file);
            setEditPosterDesktopPreview(preview);
        }
    };

    const openEditModal = (event) => {
        // Parse date
        const dates = event.date.includes(" - ") ? event.date.split(" - ") : [event.date];
        const times = event.time ? (event.time.includes(" - ") ? event.time.split(" - ") : [event.time]) : ["", ""];

        setEditFormData({
            ...event,
            isOneDay: dates.length === 1,
            startDate: dates[0] || "",
            endDate: dates[1] || "",
            startTime: times[0] || "",
            endTime: times[1] || ""
        });
        // Set existing poster previews
        setEditPosterMobilePreview(event.posterMobile || null);
        setEditPosterDesktopPreview(event.posterDesktop || null);
        setEditPosterMobile(null);
        setEditPosterDesktop(null);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        let dateString = editFormData.startDate;
        if (!editFormData.isOneDay && editFormData.endDate) {
            dateString = `${editFormData.startDate} - ${editFormData.endDate}`;
        }

        let timeString = "";
        if (editFormData.startTime) {
            timeString = editFormData.startTime;
            if (editFormData.endTime) {
                timeString += ` - ${editFormData.endTime}`;
            }
        }

        const updatedEvent = {
            ...editFormData,
            date: dateString,
            time: timeString
        };

        // Remove temp fields
        delete updatedEvent.isOneDay;
        delete updatedEvent.startDate;
        delete updatedEvent.endDate;
        delete updatedEvent.startTime;
        delete updatedEvent.endTime;

        try {
            // Upload new posters if provided
            if (editPosterMobile || editPosterDesktop) {
                const posterData = new FormData();
                posterData.append('eventId', updatedEvent.id);
                if (editPosterMobile) posterData.append('posterMobile', editPosterMobile);
                if (editPosterDesktop) posterData.append('posterDesktop', editPosterDesktop);

                const posterRes = await fetch('/api/events/upload', {
                    method: 'POST',
                    body: posterData
                });

                if (posterRes.ok) {
                    const posterResult = await posterRes.json();
                    if (posterResult.posterMobile) updatedEvent.posterMobile = posterResult.posterMobile;
                    if (posterResult.posterDesktop) updatedEvent.posterDesktop = posterResult.posterDesktop;
                    updatedEvent.img = posterResult.posterDesktop || posterResult.posterMobile || updatedEvent.img;
                }
            }

            const res = await fetch('/api/events/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedEvent)
            });

            if (res.ok) {
                setEvents(events.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
                setIsEditModalOpen(false);
                setEditPosterMobile(null);
                setEditPosterDesktop(null);
                setEditPosterMobilePreview(null);
                setEditPosterDesktopPreview(null);
                showNotification("Event updated successfully!");
            } else {
                showNotification("Failed to update event.", "error");
            }
        } catch (err) {
            console.error(err);
            showNotification("Error updating event.", "error");
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (!deleteModal.id) return;
        const id = deleteModal.id;

        try {
            const res = await fetch('/api/events/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });

            if (res.ok) {
                setEvents(events.filter(e => e.id !== id));
                showNotification("Event deleted successfully.");
            } else {
                showNotification("Failed to delete event.", "error");
            }
        } catch (error) {
            console.error("Delete error:", error);
            showNotification("Error deleting event.", "error");
        }
        setDeleteModal({ isOpen: false, id: null });
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        showNotification("Copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
            <MathBackground />
            <div className="fixed inset-0 bg-gradient-to-b from-black/20 via-black/80 to-black pointer-events-none z-0" />

            {/* Nav */}
            <nav className="border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0 z-30 relative">
                <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-teal/20 to-teal/5 border border-teal/30 rounded-xl flex items-center justify-center font-bold text-teal font-serif shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                            A
                        </div>
                        <div>
                            <h1 className="font-serif font-bold text-sm md:text-xl leading-none text-white tracking-wide">RMC Admin</h1>
                            <span className="text-[8px] md:text-[10px] text-teal/50 font-mono uppercase tracking-[0.2em] block mt-0.5">Dashboard</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="flex items-center gap-2 text-[10px] md:text-xs text-white/40 hover:text-red-400 transition-colors uppercase tracking-widest font-mono">
                        <LogOut className="w-3 h-3" /> <span className="hidden md:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 relative z-10">
                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                    {[
                        { label: "Total Events", value: events.length, icon: Calendar, color: "text-teal" },
                        { label: "Total Participants", value: (dashboardStats.totalRegistrations || 0).toLocaleString(), icon: Users, color: "text-blue-400" },
                        { label: "Revenue Collected", value: `₹${(dashboardStats.totalRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: "text-purple-400" }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 relative overflow-hidden group hover:border-teal/30 transition-colors">
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                                {stat.icon === TrendingUp ? <TrendingUp className="w-12 h-12 md:w-16 md:h-16" /> : <stat.icon className="w-12 h-12 md:w-16 md:h-16" />}
                            </div>
                            <div className="flex items-start justify-between mb-4">
                                <div className={`p-2 md:p-3 bg-white/5 rounded-lg ${stat.color} border border-white/5`}>
                                    {stat.icon === TrendingUp ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <stat.icon className="w-4 h-4 md:w-5 md:h-5" />}
                                </div>
                            </div>
                            <h3 className="text-3xl md:text-4xl font-serif font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">{stat.value}</h3>
                            <span className="text-[10px] md:text-xs text-white/30 uppercase font-mono tracking-widest">{stat.label}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 md:mb-8">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-3.5 w-4 h-4 text-white/30 group-focus-within:text-teal transition-colors" />
                        <input
                            type="text"
                            placeholder="Search events..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-teal/50 focus:bg-white/10 outline-none transition-all placeholder-white/20 text-white font-mono"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => router.push("/admin/analytics")}
                            className="flex-1 md:flex-none px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] uppercase tracking-widest text-xs"
                        >
                            <BarChart3 className="w-4 h-4" /> <span>Analytics</span>
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 md:flex-none px-6 py-3 bg-teal/10 hover:bg-teal text-teal hover:text-black border border-teal/50 font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] uppercase tracking-widest text-xs"
                        >
                            <Plus className="w-4 h-4" /> <span className="hidden md:inline">Create New Event</span><span className="md:hidden">Create Event</span>
                        </button>
                    </div>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 gap-4">
                    {events.filter(e => e.title.toLowerCase().includes(searchTerm.toLowerCase())).map((event) => (
                        <motion.div
                            layout
                            key={event.id}
                            className="group bg-white/5 border border-white/10 hover:border-teal/30 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 transition-all hover:bg-white/[0.07]"
                        >
                            <div className="w-full md:w-auto flex justify-center md:block">
                                <div className="w-14 h-14 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center relative overflow-hidden group-hover:border-teal/50 transition-colors">
                                    <span className="font-serif font-bold text-white/20 text-lg group-hover:text-teal transition-colors">
                                        {event.title.substring(0, 2).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 text-center md:text-left grid md:grid-cols-3 gap-4 w-full">
                                <div>
                                    <h3 className="text-lg font-bold text-white/90 group-hover:text-teal transition-colors font-serif">{event.title}</h3>
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-mono">ID: {event.id}</span>
                                </div>
                                <div className="flex flex-col justify-center text-xs text-white/50 space-y-1 items-center md:items-start">
                                    <span className="flex items-center gap-2"><Calendar className="w-3 h-3 text-teal/50" /> {event.date}</span>
                                    {event.time && <span className="flex items-center gap-2"><Clock className="w-3 h-3 text-teal/50" /> {event.time}</span>}
                                    <span className="flex items-center gap-2"><MapPin className="w-3 h-3 text-teal/50" /> {event.location || "CBIT"}</span>
                                </div>
                                <div className="flex items-center justify-center md:justify-start">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${event.status === 'Registration Open' ? 'bg-teal/10 text-teal border-teal/30' : 'bg-white/5 text-white/50 border-white/10'
                                        }`}>
                                        {event.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-2 mt-4 md:mt-0 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                <button onClick={() => openEditModal(event)} className="p-2 hover:bg-teal/20 hover:text-teal rounded-lg transition-colors text-white/40 border border-transparent hover:border-teal/30" title="Edit Event">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteClick(event.id)} className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-white/40 border border-transparent hover:border-red-500/30" title="Delete Event">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Create Modal - Ported to Body */}
            {isCreateModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        onClick={() => setIsCreateModalOpen(false)}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="relative bg-black border border-white/10 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_-12px_rgba(45,212,191,0.3)] max-h-[85vh] flex flex-col overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal to-transparent opacity-50 rounded-t-2xl" />

                        {/* Fixed Header */}
                        <div className="flex justify-between items-center p-6 md:p-8 pb-4 border-b border-white/5 flex-shrink-0">
                            <div>
                                <h2 className="text-xl md:text-2xl font-serif font-bold text-white">Create Event</h2>
                                <p className="text-xs text-teal/70 font-mono uppercase tracking-widest">Add a new event to the roster</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-8 pt-4 min-h-0" data-lenis-prevent>
                            <form onSubmit={handleCreate} className="space-y-4 md:space-y-6">
                                {/* Title Section */}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Event Title</label>
                                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white placeholder-white/20 transition-colors focus:bg-black" value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g. Paradox Puzzle" />
                                </div>

                                {/* Date & Time Section */}
                                <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/10">
                                    {/* One Day Checkbox */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isOneDay"
                                            checked={newEvent.isOneDay}
                                            onChange={(e) => setNewEvent({ ...newEvent, isOneDay: e.target.checked })}
                                            className="w-4 h-4 rounded border-white/30 text-teal bg-white/5 focus:ring-teal/50"
                                        />
                                        <label htmlFor="isOneDay" className="text-xs text-white/70 cursor-pointer select-none">One Day Event</label>
                                    </div>

                                    {/* Date Inputs */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">
                                                {newEvent.isOneDay ? "Event Date" : "Start Date"}
                                            </label>
                                            <div className="relative">
                                                <input required type="date" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-teal/50 outline-none text-white [color-scheme:dark]" value={newEvent.startDate} onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })} />
                                            </div>
                                        </div>

                                        {!newEvent.isOneDay && (
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">End Date</label>
                                                <div className="relative">
                                                    <input required type="date" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-teal/50 outline-none text-white [color-scheme:dark]" value={newEvent.endDate} onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Time Inputs */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Start Time</label>
                                            <div className="relative">
                                                <input required type="time" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-teal/50 outline-none text-white [color-scheme:dark]" value={newEvent.startTime} onChange={e => setNewEvent({ ...newEvent, startTime: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">End Time</label>
                                            <div className="relative">
                                                <input required type="time" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-teal/50 outline-none text-white [color-scheme:dark]" value={newEvent.endTime} onChange={e => setNewEvent({ ...newEvent, endTime: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Location</label>
                                        <div className="relative">
                                            <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white placeholder-white/20 pr-10" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} placeholder="Room / Venue" />
                                            <MapPin className="absolute right-4 top-3.5 w-4 h-4 text-white/30 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Registration Fee</label>
                                        <div className="relative">
                                            <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white placeholder-white/20" value={newEvent.registrationFee} onChange={e => setNewEvent({ ...newEvent, registrationFee: e.target.value })} placeholder="₹100" />
                                        </div>
                                    </div>
                                </div>

                                {/* Team Size Field */}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Team Size</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white placeholder-white/20"
                                            value={newEvent.teamSize}
                                            onChange={e => setNewEvent({ ...newEvent, teamSize: parseInt(e.target.value) || 1 })}
                                            placeholder="1"
                                        />
                                        <span className="absolute right-4 top-3.5 text-white/30 text-xs">members</span>
                                    </div>
                                    <p className="text-[9px] text-white/40 pl-3">1 for individual, 2-10 for team events</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">\
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Category</label>
                                        <div className="relative">
                                            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white appearance-none" value={newEvent.category} onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}>
                                                <option className="bg-black text-white p-2">Competition</option>
                                                <option className="bg-black text-white p-2">Workshop</option>
                                                <option className="bg-black text-white p-2">Guest Talk</option>
                                                <option className="bg-black text-white p-2">Seminar</option>
                                            </select>
                                            <div className="absolute right-4 top-4 w-2 h-2 border-r border-b border-white/30 rotate-45 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Status</label>
                                        <div className="relative">
                                            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none text-white appearance-none" value={newEvent.status} onChange={e => setNewEvent({ ...newEvent, status: e.target.value })}>
                                                <option className="bg-black text-white p-2">Registration Open</option>
                                                <option className="bg-black text-white p-2">Coming Soon</option>
                                                <option className="bg-black text-white p-2">Completed</option>
                                            </select>
                                            <div className="absolute right-4 top-4 w-2 h-2 border-r border-b border-white/30 rotate-45 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Description</label>
                                    <textarea required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-teal/50 outline-none min-h-[120px] text-white placeholder-white/20 resize-y" value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Enter event details, rules, and requirements..." />
                                </div>

                                {/* Event Posters */}
                                <div className="space-y-3">
                                    <label className="text-[10px] uppercase text-teal/70 font-mono pl-3 tracking-widest">Event Posters</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Mobile Poster */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-white/50 pl-1">Mobile (9:16)</p>
                                            <label className="block cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    className="hidden"
                                                    onChange={e => handlePosterChange(e.target.files?.[0], 'mobile')}
                                                />
                                                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${posterMobilePreview ? 'border-teal/50' : 'border-white/20 hover:border-teal/30'}`}>
                                                    {posterMobilePreview ? (
                                                        <img src={posterMobilePreview} alt="Mobile preview" className="w-full h-32 object-cover rounded-lg" />
                                                    ) : (
                                                        <div className="h-32 flex flex-col items-center justify-center">
                                                            <Upload className="w-6 h-6 text-white/30 mb-2" />
                                                            <span className="text-[10px] text-white/40">1080×1920</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                        {/* Desktop Poster */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-white/50 pl-1">Desktop (16:9)</p>
                                            <label className="block cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp"
                                                    className="hidden"
                                                    onChange={e => handlePosterChange(e.target.files?.[0], 'desktop')}
                                                />
                                                <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${posterDesktopPreview ? 'border-teal/50' : 'border-white/20 hover:border-teal/30'}`}>
                                                    {posterDesktopPreview ? (
                                                        <img src={posterDesktopPreview} alt="Desktop preview" className="w-full h-32 object-cover rounded-lg" />
                                                    ) : (
                                                        <div className="h-32 flex flex-col items-center justify-center">
                                                            <Upload className="w-6 h-6 text-white/30 mb-2" />
                                                            <span className="text-[10px] text-white/40">1920×1080</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-teal hover:bg-teal-400 text-black font-bold rounded-xl mt-4 uppercase tracking-widest shadow-[0_0_20px_rgba(45,212,191,0.2)] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all">
                                    Publish Event
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>,
                document.body
            )}


            {/* Edit Modal */}
            {
                isEditModalOpen && editFormData && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                            onClick={() => setIsEditModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-black border border-white/10 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_-12px_rgba(168,85,247,0.3)] max-h-[85vh] flex flex-col overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50 rounded-t-2xl" />

                            {/* Fixed Header */}
                            <div className="flex justify-between items-center p-6 md:p-8 pb-4 border-b border-white/5 flex-shrink-0">
                                <div>
                                    <h2 className="text-xl md:text-2xl font-serif font-bold text-white">Edit Event</h2>
                                    <p className="text-xs text-purple-400 font-mono uppercase tracking-widest">Update event details & credentials</p>
                                </div>
                                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-8 pt-4 min-h-0" data-lenis-prevent>
                                <form onSubmit={handleUpdate} className="space-y-4 md:space-y-6">
                                    {/* Title Section */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Event Title</label>
                                        <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none text-white placeholder-white/20 transition-colors focus:bg-black" value={editFormData.title} onChange={e => setEditFormData({ ...editFormData, title: e.target.value })} />
                                    </div>

                                    {/* Password Section - SPECIAL FOR EDIT */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest flex items-center gap-2">
                                            <Shield className="w-3 h-3" /> Event Admin Password
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-purple-500/10 border border-purple-500/30 rounded-xl px-4 py-3 focus:border-purple-500 outline-none text-purple-200 font-mono tracking-wider transition-colors focus:bg-black/50"
                                            value={editFormData.password}
                                            onChange={e => setEditFormData({ ...editFormData, password: e.target.value })}
                                            placeholder="Event Password"
                                        />
                                        <p className="text-[10px] text-white/30 pl-3 pt-1">This password allows the Event Coordinator to login.</p>
                                    </div>

                                    {/* Date & Time Section */}
                                    <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/10">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="editIsOneDay"
                                                checked={editFormData.isOneDay}
                                                onChange={(e) => setEditFormData({ ...editFormData, isOneDay: e.target.checked })}
                                                className="w-4 h-4 rounded border-white/30 text-purple-500 bg-white/5 focus:ring-purple-500/50"
                                            />
                                            <label htmlFor="editIsOneDay" className="text-xs text-white/70 cursor-pointer select-none">One Day Event</label>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">
                                                    {editFormData.isOneDay ? "Event Date" : "Start Date"}
                                                </label>
                                                <div className="relative">
                                                    <input required type="date" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-purple-500/50 outline-none text-white [color-scheme:dark]" value={editFormData.startDate} onChange={e => setEditFormData({ ...editFormData, startDate: e.target.value })} />
                                                </div>
                                            </div>

                                            {!editFormData.isOneDay && (
                                                <div className="space-y-1">
                                                    <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">End Date</label>
                                                    <div className="relative">
                                                        <input required type="date" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-purple-500/50 outline-none text-white [color-scheme:dark]" value={editFormData.endDate} onChange={e => setEditFormData({ ...editFormData, endDate: e.target.value })} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Start Time</label>
                                                <div className="relative">
                                                    <input type="time" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-purple-500/50 outline-none text-white [color-scheme:dark]" value={editFormData.startTime} onChange={e => setEditFormData({ ...editFormData, startTime: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">End Time</label>
                                                <div className="relative">
                                                    <input type="time" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-purple-500/50 outline-none text-white [color-scheme:dark]" value={editFormData.endTime} onChange={e => setEditFormData({ ...editFormData, endTime: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Location</label>
                                            <div className="relative">
                                                <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none text-white placeholder-white/20 pr-10" value={editFormData.location} onChange={e => setEditFormData({ ...editFormData, location: e.target.value })} placeholder="Room / Venue" />
                                                <MapPin className="absolute right-4 top-3.5 w-4 h-4 text-white/30 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Registration Fee</label>
                                            <div className="relative">
                                                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none text-white placeholder-white/20" value={editFormData.registrationFee || ''} onChange={e => setEditFormData({ ...editFormData, registrationFee: e.target.value })} placeholder="₹100" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team Size Field */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Team Size</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                max="10"
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none text-white placeholder-white/20"
                                                value={editFormData.teamSize || 1}
                                                onChange={e => setEditFormData({ ...editFormData, teamSize: parseInt(e.target.value) || 1 })}
                                                placeholder="1"
                                            />
                                            <span className="absolute right-4 top-3.5 text-white/30 text-xs">members</span>
                                        </div>
                                        <p className="text-[9px] text-white/40 pl-3">1 for individual, 2-10 for team events</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">\
                                        <div className="space-y-1">
                                            <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Category</label>
                                            <div className="relative">
                                                <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none text-white appearance-none" value={editFormData.category} onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}>
                                                    <option className="bg-black text-white p-2">Competition</option>
                                                    <option className="bg-black text-white p-2">Workshop</option>
                                                    <option className="bg-black text-white p-2">Guest Talk</option>
                                                    <option className="bg-black text-white p-2">Seminar</option>
                                                </select>
                                                <div className="absolute right-4 top-4 w-2 h-2 border-r border-b border-white/30 rotate-45 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Status</label>
                                        <div className="relative">
                                            <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none text-white appearance-none" value={editFormData.status} onChange={e => setEditFormData({ ...editFormData, status: e.target.value })}>
                                                <option className="bg-black text-white p-2">Registration Open</option>
                                                <option className="bg-black text-white p-2">Coming Soon</option>
                                                <option className="bg-black text-white p-2">Planning</option>
                                                <option className="bg-black text-white p-2">Closed</option>
                                            </select>
                                            <div className="absolute right-4 top-4 w-2 h-2 border-r border-b border-white/30 rotate-45 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Description</label>
                                        <textarea required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-purple-500/50 outline-none min-h-[120px] text-white placeholder-white/20 resize-y" value={editFormData.description} onChange={e => setEditFormData({ ...editFormData, description: e.target.value })} />
                                    </div>

                                    {/* Event Posters */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] uppercase text-purple-400 font-mono pl-3 tracking-widest">Event Posters</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            {/* Mobile Poster */}
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-white/50 pl-1">Mobile (9:16)</p>
                                                <label className="block cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        className="hidden"
                                                        onChange={e => handleEditPosterChange(e.target.files?.[0], 'mobile')}
                                                    />
                                                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${editPosterMobilePreview ? 'border-purple-500/50' : 'border-white/20 hover:border-purple-500/30'}`}>
                                                        {editPosterMobilePreview ? (
                                                            <img src={editPosterMobilePreview} alt="Mobile poster" className="w-full h-32 object-cover rounded-lg" />
                                                        ) : (
                                                            <div className="h-32 flex flex-col items-center justify-center">
                                                                <Upload className="w-6 h-6 text-white/30 mb-2" />
                                                                <span className="text-[10px] text-white/40">1080×1920</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                            {/* Desktop Poster */}
                                            <div className="space-y-2">
                                                <p className="text-[10px] text-white/50 pl-1">Desktop (16:9)</p>
                                                <label className="block cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/jpeg,image/png,image/webp"
                                                        className="hidden"
                                                        onChange={e => handleEditPosterChange(e.target.files?.[0], 'desktop')}
                                                    />
                                                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${editPosterDesktopPreview ? 'border-purple-500/50' : 'border-white/20 hover:border-purple-500/30'}`}>
                                                        {editPosterDesktopPreview ? (
                                                            <img src={editPosterDesktopPreview} alt="Desktop poster" className="w-full h-32 object-cover rounded-lg" />
                                                        ) : (
                                                            <div className="h-32 flex flex-col items-center justify-center">
                                                                <Upload className="w-6 h-6 text-white/30 mb-2" />
                                                                <span className="text-[10px] text-white/40">1920×1080</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl mt-4 uppercase tracking-widest shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all">
                                        Save Changes
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )
            }


            {/* Success Credentials Modal */}
            {
                createdEventCreds && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                            onClick={() => setCreatedEventCreds(null)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative bg-black border border-teal/30 rounded-2xl p-8 w-full max-w-md shadow-[0_0_100px_rgba(45,212,191,0.3)] text-center"
                        >
                            <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal/50 animate-pulse">
                                <Shield className="w-8 h-8 text-teal" />
                            </div>
                            <h2 className="text-2xl font-serif font-bold text-white mb-2">Event Created Successfully</h2>
                            <p className="text-white/50 text-sm mb-8">Please share these credentials with the Event Coordinator securely.</p>

                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 space-y-4 text-left">
                                <div>
                                    <span className="text-[10px] uppercase text-teal/70 font-mono tracking-widest block mb-1">Event Name (Login ID)</span>
                                    <div className="font-mono text-white text-lg">{createdEventCreds.title}</div>
                                </div>
                                <div className="relative">
                                    <span className="text-[10px] uppercase text-teal/70 font-mono tracking-widest block mb-1">Auto-Generated Password</span>
                                    <div className="font-mono text-teal text-xl tracking-wider break-all pr-10">{createdEventCreds.password}</div>
                                    <button
                                        onClick={() => copyToClipboard(createdEventCreds.password)}
                                        className="absolute right-0 bottom-0 p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                                        title="Copy Password"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setCreatedEventCreds(null)}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl uppercase tracking-widest text-xs transition-all"
                            >
                                Acknowledge & Close
                            </button>
                        </motion.div>
                    </div>
                )
            }

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                        onClick={() => setDeleteModal({ isOpen: false, id: null })}
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative bg-black border border-red-500/30 rounded-2xl p-8 w-full max-w-sm shadow-[0_0_100px_rgba(239,68,68,0.2)] text-center"
                    >
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/50">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-serif font-bold text-white mb-2">Delete Event?</h2>
                        <p className="text-white/50 text-xs mb-8">This action cannot be undone. The event will be permanently removed from the system.</p>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setDeleteModal({ isOpen: false, id: null })}
                                className="py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl uppercase tracking-widest text-[10px] transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                            >
                                Delete
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Notification Toast/Modal */}
            <AnimatePresence>
                {notification.isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 20, x: "-50%" }}
                        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[11000] px-6 py-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-4 min-w-[300px] ${notification.type === 'success' ? 'bg-teal/10 border-teal/30 text-teal' : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                    >
                        {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="text-sm font-bold tracking-wide">{notification.message}</span>
                        <button onClick={() => setNotification({ ...notification, isOpen: false })} className="ml-auto opacity-50 hover:opacity-100">
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>


        </div >
    );
}
