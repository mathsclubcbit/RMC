"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, Send, Video, MessageCircle, FileText, X } from "lucide-react";
import SpotlightCard from "@/components/ui/SpotlightCard";

export default function TeamDashboardClient({ initialApplicants, teamName }) {
    const [applicants, setApplicants] = useState(initialApplicants);
    const [search, setSearch] = useState("");
    const [loadingAction, setLoadingAction] = useState(null); // stores applicationId
    
    // Modal state for Interview Scheduling
    const [interviewModal, setInterviewModal] = useState({ open: false, applicant: null });
    const [meetLink, setMeetLink] = useState("");
    const [meetTime, setMeetTime] = useState("");

    const filtered = applicants.filter(a => 
        a.name.toLowerCase().includes(search.toLowerCase()) || 
        a.email.toLowerCase().includes(search.toLowerCase()) ||
        a.roll_number.includes(search)
    );

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
            
            if (res.ok) {
                setApplicants(prev => prev.map(a => 
                    a.id === applicant.id ? { ...a, task_status: 'SENT' } : a
                ));
                alert("Task sent successfully!");
            } else {
                alert(data.error || "Failed to send task");
            }
        } catch (e) {
            alert("Error sending task.");
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
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input 
                    type="text" 
                    placeholder="Search by name, email, or roll..." 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:border-teal/50 outline-none text-white"
                />
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
                                        {app.task_status === 'PENDING' && <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/50 font-mono">Pending</span>}
                                        {app.task_status === 'SENT' && <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-[10px] font-mono">Sent</span>}
                                        {app.task_status === 'SUBMITTED' && (
                                            <a href={app.task_file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-teal/10 text-teal rounded text-[10px] font-mono hover:bg-teal/20 transition-colors">
                                                <FileText className="w-3 h-3" /> View PDF
                                            </a>
                                        )}
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
                                            disabled={loadingAction === app.id || app.task_status !== 'PENDING'}
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
        </div>
    );
}
