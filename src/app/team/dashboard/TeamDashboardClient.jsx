"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Send, Video, MessageCircle, FileText, X, Upload } from "lucide-react";
import SpotlightCard from "@/components/ui/SpotlightCard";

export default function TeamDashboardClient({ initialApplicants, teamName }) {
    const [applicants, setApplicants] = useState(initialApplicants);
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("ALL"); // ALL, 1, 2
    const [loadingAction, setLoadingAction] = useState(null); // stores applicationId
    
    // Modal state for Interview Scheduling
    const [interviewModal, setInterviewModal] = useState({ open: false, applicant: null });
    const [meetLink, setMeetLink] = useState("");
    const [meetTime, setMeetTime] = useState("");

    // Modal state for Submission View
    const [submissionModal, setSubmissionModal] = useState({ open: false, app: null });

    // Task management state
    const [tasks, setTasks] = useState(["", "", ""]);
    const [deadlineDays, setDeadlineDays] = useState(3);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [savingTasks, setSavingTasks] = useState(false);
    const [saveTaskSuccess, setSaveTaskSuccess] = useState(false);
    const [saveTaskError, setSaveTaskError] = useState("");
    
    // Batch Send state
    const [sendingBatch, setSendingBatch] = useState(false);
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0, errors: [] });

    // Fetch team's existing tasks
    const fetchTasks = useCallback(async () => {
        setLoadingTasks(true);
        try {
            const res = await fetch("/api/team/tasks");
            const data = await res.json();
            if (data.task) {
                setTasks([data.task.task_1_url || "", data.task.task_2_url || "", data.task.task_3_url || ""]);
                setDeadlineDays(data.task.deadline_days || 3);
            }
        } catch (e) {
            console.error(e);
        }
        setLoadingTasks(false);
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleSaveTasks = async () => {
        setSavingTasks(true);
        setSaveTaskError("");
        try {
            const res = await fetch("/api/team/tasks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task_1_url: tasks[0], task_2_url: tasks[1], task_3_url: tasks[2], deadline_days: deadlineDays })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setSaveTaskSuccess(true);
            setTimeout(() => setSaveTaskSuccess(false), 3000);
        } catch (e) {
            setSaveTaskError(e.message);
        }
        setSavingTasks(false);
    };

    const handleBatchSend = async () => {
        if (!confirm(`Are you sure you want to send tasks to all pending applicants for ${teamName}?`)) return;
        
        setSendingBatch(true);
        setSendProgress({ current: 0, total: 0, errors: [] });
        
        try {
            const pendingIds = applicants
                .filter(a => {
                    const status = a.task_responses?.team_tracking?.[teamName]?.status;
                    const p = getPriority(a.team);
                    const isEligibleStatus = status === undefined || status === 'PENDING';
                    return isEligibleStatus && (p === 1 || p === 2);
                })
                .map(a => a.id);

            if (pendingIds.length === 0) {
                alert("No eligible applicants found. Ensure they haven't received tasks yet.");
                setSendingBatch(false);
                return;
            }

            setSendProgress(p => ({ ...p, total: pendingIds.length }));

            const errors = [];
            let processed = 0;
            const CHUNK_SIZE = 5;

            for (let i = 0; i < pendingIds.length; i += CHUNK_SIZE) {
                const chunk = pendingIds.slice(i, i + CHUNK_SIZE);
                
                const batchRes = await fetch('/api/team/assign-tasks/batch', {
                    method: 'POST',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ applicant_ids: chunk })
                });
                
                const batchData = await batchRes.json();
                if (!batchRes.ok) {
                    errors.push(batchData.error || "Batch failed");
                    break;
                }
                
                if (batchData.results?.errors?.length) {
                    errors.push(...batchData.results.errors);
                }
                
                processed += batchData.results?.successful?.length ?? chunk.length;
                setSendProgress(p => ({ ...p, current: processed, errors }));
                
                // Update local state for success
                if (batchData.results?.successful) {
                    setApplicants(prev => prev.map(a => {
                        if (batchData.results.successful.includes(a.id)) {
                            return {
                                ...a,
                                task_responses: {
                                    ...(a.task_responses || {}),
                                    team_tracking: {
                                        ...((a.task_responses || {}).team_tracking || {}),
                                        [teamName]: { status: 'SENT' }
                                    }
                                }
                            };
                        }
                        return a;
                    }));
                }
            }
            
            if (errors.length) {
                alert("Finished with some errors. Check the logs.");
            } else {
                alert("Successfully sent tasks to all pending applicants.");
            }
            
        } catch (e) {
            alert("Error: " + e.message);
        }
        setSendingBatch(false);
    };

    const normalize = (s) => s.replace(/[^a-z0-9]/gi, '').toLowerCase();
    const matchTeam = normalize(teamName);
    const getPriority = (teamStr) => {
        if (!teamStr) return 99;
        const parts = teamStr.split('|').map(s => s.trim());
        for (let i = 0; i < parts.length; i++) {
            if (normalize(parts[i]).includes(matchTeam)) return i + 1;
        }
        return 99;
    };

    let filtered = applicants.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.roll_number.includes(search)
    );

    if (priorityFilter !== "ALL") {
        const targetPriority = parseInt(priorityFilter, 10);
        filtered = filtered.filter(a => getPriority(a.team) === targetPriority);
    } else {
        filtered = filtered.filter(a => {
            const p = getPriority(a.team);
            return p === 1 || p === 2;
        });
    }

    const handleSendTask = async (applicant) => {
        if (!confirm(`Send task assignment to ${applicant.name}?`)) return;
        
        setLoadingAction(applicant.id);
        try {
            const res = await fetch("/api/team/send-task", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicationId: applicant.id, teamName })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send task");
            
            setApplicants(prev => prev.map(a => 
                a.id === applicant.id ? { 
                    ...a, 
                    task_responses: {
                        ...(a.task_responses || {}),
                        team_tracking: {
                            ...((a.task_responses || {}).team_tracking || {}),
                            [teamName]: { status: 'SENT' }
                        }
                    }
                } : a
            ));
            
            if (data.warning) {
                alert(`⚠️ ${data.warning}`);
            } else {
                alert("Task sent successfully!");
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setLoadingAction(null);
        }
    };

    const handleScheduleInterview = async (e) => {
        e.preventDefault();
        const applicantId = interviewModal.applicant.id;
        
        setLoadingAction(applicantId);
        try {
            const res = await fetch("/api/team/schedule-interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    applicationId: applicantId, 
                    teamName,
                    meetLink,
                    meetTime
                })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                setApplicants(prev => prev.map(a => 
                    a.id === applicantId ? { ...a, interview_status: 'SCHEDULED', interview_link: meetLink, interview_time: meetTime } : a
                ));
                alert("Interview scheduled and email sent!");
                setInterviewModal({ open: false, applicant: null });
                setMeetLink("");
                setMeetTime("");
            } else {
                alert(data.error || "Failed to schedule interview");
            }
        } catch (e) {
            alert("Error scheduling interview.");
        } finally {
            setLoadingAction(null);
        }
    };

    const getWhatsAppLink = (applicant) => {
        const phone = applicant.phone.replace(/[^0-9]/g, '');
        // default to India code if 10 digits
        const formattedPhone = phone.length === 10 ? `91${phone}` : phone; 
        const message = encodeURIComponent(`Hi ${applicant.name}, this is regarding your RMC Application for the ${teamName} team. Your interview has been scheduled.`);
        return `https://wa.me/${formattedPhone}?text=${message}`;
    };

    return (
        <div className="space-y-8">
            {/* Task Management Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Task URLs Manager */}
                <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="font-semibold text-white/90">Task PDFs</h3>
                        <p className="text-xs text-white/40 mt-0.5">Provide 3 Google Drive or Storage URLs for the tasks. The system will randomly pick one per applicant.</p>
                    </div>
                    <div className="px-6 py-5 space-y-4">
                        {loadingTasks ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
                        ) : (
                            [0, 1, 2].map((i) => (
                                <div key={i}>
                                    <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Task {i+1} URL</label>
                                    <input
                                        type="url"
                                        value={tasks[i]}
                                        onChange={(e) => {
                                            const newTasks = [...tasks];
                                            newTasks[i] = e.target.value;
                                            setTasks(newTasks);
                                        }}
                                        placeholder="https://..."
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal/50"
                                    />
                                </div>
                            ))
                        )}
                        
                        {!loadingTasks && (
                            <div>
                                <label className="block text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1.5">Task Deadline (Days)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={deadlineDays}
                                    onChange={(e) => setDeadlineDays(e.target.value)}
                                    placeholder="e.g., 3"
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-teal/50"
                                />
                                <p className="text-[10px] text-white/30 mt-1">Number of days the applicant has to complete the task.</p>
                            </div>
                        )}

                        {saveTaskError && <p className="text-xs text-coral">{saveTaskError}</p>}
                        <button onClick={handleSaveTasks} disabled={savingTasks} className="flex items-center gap-2 px-6 py-2.5 bg-white/10 text-white rounded-lg hover:bg-white/20 transition disabled:opacity-50 text-sm">
                            {savingTasks ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {saveTaskSuccess ? "Saved!" : "Save Tasks"}
                        </button>
                    </div>
                </div>

                {/* Batch Sender */}
                <div className="rounded-xl border border-white/10 bg-black/40 overflow-hidden">
                    <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                        <h3 className="font-semibold text-white/90">Distribute Tasks</h3>
                        <p className="text-xs text-white/40 mt-0.5">Send a task email to all <strong>PENDING</strong> applicants in your team who haven't received one yet.</p>
                    </div>
                    <div className="px-6 py-5">
                        <button
                            onClick={handleBatchSend}
                            disabled={sendingBatch || tasks.every(t => !t)}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-teal hover:bg-teal/90 text-black rounded-xl font-bold transition disabled:opacity-50"
                        >
                            {sendingBatch ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            Send Tasks to All Pending Applicants
                        </button>
                        
                        {tasks.every(t => !t) && (
                            <p className="text-xs text-coral mt-3 text-center">Please configure at least one task URL first.</p>
                        )}

                        {sendingBatch && (
                            <div className="mt-6 space-y-2">
                                <div className="flex justify-between text-xs text-white/50 font-mono">
                                    <span>Processing...</span>
                                    <span>{sendProgress.current} / {sendProgress.total}</span>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-1.5">
                                    <div className="bg-teal h-1.5 rounded-full transition-all duration-300" style={{ width: `${(sendProgress.current / (sendProgress.total || 1)) * 100}%` }} />
                                </div>
                            </div>
                        )}
                        
                        {sendProgress.errors.length > 0 && (
                            <div className="mt-4 p-3 bg-coral/10 border border-coral/20 rounded-lg">
                                <p className="text-xs font-bold text-coral mb-2">Errors Encountered:</p>
                                <ul className="text-[10px] text-coral/80 space-y-1 max-h-32 overflow-y-auto font-mono">
                                    {sendProgress.errors.map((err, idx) => (
                                        <li key={idx}>- {err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
                <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 w-full md:w-auto">
                    {["ALL", "1", "2"].map(p => (
                        <button
                            key={p}
                            onClick={() => setPriorityFilter(p)}
                            className={`flex-1 md:flex-none px-4 py-1.5 text-xs font-mono rounded-md transition-colors ${priorityFilter === p ? 'bg-teal text-black font-bold' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                        >
                            {p === "ALL" ? "All (Pri 1 & 2)" : `Priority ${p}`}
                        </button>
                    ))}
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input 
                        type="text" 
                        placeholder="Search by name, email, or roll..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-teal/50 outline-none text-white transition-colors"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/40">
                <table className="w-full text-left text-sm text-white/80">
                    <thead className="text-[10px] font-mono uppercase tracking-widest text-white/40 bg-white/5 border-b border-white/10">
                        <tr>
                            <th className="px-6 py-4">Applicant</th>
                            <th className="px-6 py-4">Priorities</th>
                            <th className="px-6 py-4">Task Status</th>
                            <th className="px-6 py-4">Interview</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-white/40 font-mono text-xs">
                                    No applicants found.
                                </td>
                            </tr>
                        ) : (
                            filtered.map(app => (
                                <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-serif text-white">{app.name}</div>
                                        <div className="text-xs text-white/40">{app.email}</div>
                                        <div className="text-[10px] font-mono text-white/30 mt-1">{app.phone}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] font-mono text-teal/70 leading-relaxed max-w-[150px]">
                                            {app.team}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const teamTracking = app.task_responses?.team_tracking?.[teamName];
                                            const teamStatus = teamTracking?.status || 'PENDING';
                                            const assignedUrl = teamTracking?.assignedUrl;
                                            
                                            let taskName = "";
                                            if (assignedUrl) {
                                                if (assignedUrl === tasks[0]) taskName = "Task 1";
                                                else if (assignedUrl === tasks[1]) taskName = "Task 2";
                                                else if (assignedUrl === tasks[2]) taskName = "Task 3";
                                                else taskName = "Assigned"; // tasks state not loaded yet
                                            }

                                            if (teamStatus === 'PENDING') return <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50 font-mono">Pending</span>;
                                            if (teamStatus === 'SENT') return (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-[10px] font-mono inline-block">Sent</span>
                                                    {taskName && <span className="text-[9px] font-mono text-white/40 tracking-wider">({taskName})</span>}
                                                </div>
                                            );
                                            if (teamStatus === 'SUBMITTED') return (
                                                <div className="flex flex-col gap-1 items-start">
                                                    <button 
                                                        onClick={() => setSubmissionModal({ open: true, app })}
                                                        className="flex items-center gap-1.5 px-2 py-1 bg-teal/10 text-teal rounded text-[10px] font-mono hover:bg-teal/20 transition-colors"
                                                    >
                                                        <FileText className="w-3 h-3" /> View Submission
                                                    </button>
                                                    {taskName && <span className="text-[9px] font-mono text-white/40 tracking-wider">({taskName})</span>}
                                                </div>
                                            );
                                            return <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50 font-mono">{teamStatus}</span>;
                                        })()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {app.interview_status === 'SCHEDULED' ? (
                                            <div className="flex flex-col gap-1">
                                                <span className="px-2 py-1 bg-teal/10 text-teal rounded text-[10px] font-mono inline-block w-max">Scheduled</span>
                                                <a href={getWhatsAppLink(app)} target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 text-green-400 hover:underline mt-1">
                                                    <MessageCircle className="w-3 h-3" /> WhatsApp
                                                </a>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-white/30 font-mono">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                                        <button 
                                            onClick={() => handleSendTask(app)}
                                            disabled={loadingAction === app.id || (app.task_responses?.team_tracking?.[teamName]?.status && app.task_responses?.team_tracking?.[teamName]?.status !== 'PENDING')}
                                            className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-mono uppercase rounded text-white/70 disabled:opacity-30 inline-flex items-center gap-1 transition-colors"
                                        >
                                            {loadingAction === app.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                            Task
                                        </button>
                                        <button 
                                            onClick={() => setInterviewModal({ open: true, applicant: app })}
                                            disabled={loadingAction === app.id}
                                            className="px-3 py-1.5 bg-teal/10 border border-teal/20 hover:bg-teal/20 text-[10px] font-mono uppercase rounded text-teal disabled:opacity-30 inline-flex items-center gap-1 transition-colors"
                                        >
                                            <Video className="w-3 h-3" />
                                            Interview
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Interview Modal */}
            <AnimatePresence>
                {interviewModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setInterviewModal({ open: false, applicant: null })}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 overflow-hidden"
                        >
                            <button onClick={() => setInterviewModal({ open: false, applicant: null })} className="absolute top-4 right-4 text-white/40 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-serif text-white mb-1">Schedule Interview</h2>
                            <p className="text-xs font-mono text-white/40 mb-6 uppercase tracking-widest">For {interviewModal.applicant?.name}</p>
                            
                            <form onSubmit={handleScheduleInterview} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 block mb-1">Meet Link</label>
                                    <input 
                                        type="url" 
                                        required 
                                        value={meetLink} 
                                        onChange={e => setMeetLink(e.target.value)}
                                        placeholder="https://meet.google.com/..." 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-teal/50 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 block mb-1">Date & Time</label>
                                    <input 
                                        type="datetime-local" 
                                        required 
                                        value={meetTime} 
                                        onChange={e => setMeetTime(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-teal/50 outline-none"
                                    />
                                </div>
                                
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setInterviewModal({ open: false, applicant: null })} className="flex-1 py-3 text-xs font-mono uppercase rounded-xl border border-white/10 hover:bg-white/5 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={loadingAction === interviewModal.applicant?.id} className="flex-1 py-3 text-xs font-mono uppercase font-bold rounded-xl bg-teal text-black hover:bg-teal/90 transition-colors flex justify-center items-center gap-2">
                                        {loadingAction === interviewModal.applicant?.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Submission Modal */}
            <AnimatePresence>
                {submissionModal.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setSubmissionModal({ open: false, app: null })}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 overflow-hidden max-h-[80vh] overflow-y-auto"
                        >
                            <button onClick={() => setSubmissionModal({ open: false, app: null })} className="absolute top-4 right-4 text-white/40 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                            <h2 className="text-xl font-serif text-teal mb-1">Task Submission</h2>
                            <p className="text-xs font-mono text-white/40 mb-6 uppercase tracking-widest">{submissionModal.app?.name}</p>
                            
                            <div className="space-y-6 text-sm text-white/80">
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Why do you want to join RMC?</h4>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl whitespace-pre-wrap">
                                        {submissionModal.app?.task_responses?.team_tracking?.[teamName]?.why_join || submissionModal.app?.task_responses?.why_join || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Why this team?</h4>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl whitespace-pre-wrap">
                                        {submissionModal.app?.task_responses?.team_tracking?.[teamName]?.why_team || submissionModal.app?.task_responses?.why_team || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Why should we select you?</h4>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl whitespace-pre-wrap">
                                        {submissionModal.app?.task_responses?.team_tracking?.[teamName]?.why_select_you || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Other Clubs</h4>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl whitespace-pre-wrap">
                                        {submissionModal.app?.task_responses?.team_tracking?.[teamName]?.other_clubs || "N/A"}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Previous Work</h4>
                                    <div className="p-4 bg-white/5 border border-white/10 rounded-xl whitespace-pre-wrap">
                                        {submissionModal.app?.task_responses?.team_tracking?.[teamName]?.previous_work || "N/A"}
                                    </div>
                                </div>
                                {submissionModal.app?.task_responses?.team_tracking?.[teamName]?.dynamic_answers && 
                                    Object.entries(submissionModal.app.task_responses.team_tracking[teamName].dynamic_answers).map(([key, val]) => (
                                        <div key={key}>
                                            <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">{key.replace(/_/g, ' ')}</h4>
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl whitespace-pre-wrap">
                                                {val || "N/A"}
                                            </div>
                                        </div>
                                    ))
                                }
                                <div>
                                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">Drive Link</h4>
                                    <a href={submissionModal.app?.task_responses?.team_tracking?.[teamName]?.drive_link || submissionModal.app?.task_responses?.drive_link} target="_blank" rel="noreferrer" className="inline-block p-4 bg-teal/10 border border-teal/20 text-teal rounded-xl break-all hover:bg-teal/20 transition-colors">
                                        {submissionModal.app?.task_responses?.team_tracking?.[teamName]?.drive_link || submissionModal.app?.task_responses?.drive_link || "N/A"}
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
