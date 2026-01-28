"use client";

import { useState, useEffect } from "react";
import { Loader2, Send, Mail, Users, CheckCircle, AlertCircle } from "lucide-react";

export default function NewsletterPage() {
    const [subscribersCount, setSubscribersCount] = useState(0);
    const [statsLoading, setStatsLoading] = useState(true);

    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState(null); // { type: 'success' | 'error', message: '' }


    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            const res = await fetch('/api/newsletter/stats');
            const data = await res.json();

            if (res.ok) {
                setSubscribersCount(data.count || 0);
            } else {
                console.error("Failed to load stats:", data.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setStatsLoading(false);
        }
    }

    async function handleSend(isTest = false) {
        if (!subject || !body) {
            setStatus({ type: 'error', message: "Subject and Body are required." });
            return;
        }

        setSending(true);
        setStatus(null);

        try {
            const payload = {
                subject,
                body,
                testEmail: isTest ? 'mathsclub.cbit@gmail.com' : undefined // Send test to self/admin email
                // Ideally, could prompt for a test email. For now, hardcode or use current user email? 
                // Let's use the hardcoded admin email for safety test.
            };

            const res = await fetch('/api/newsletter/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                setStatus({
                    type: 'success',
                    message: isTest ? "Test email sent to Admin!" : `Broadcast sent to ${data.sent} subscribers!`
                });
                if (!isTest) {
                    setSubject("");
                    setBody("");
                }
            } else {
                throw new Error(data.error || "Failed to send");
            }
        } catch (error) {
            setStatus({ type: 'error', message: error.message });
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-serif text-white mb-2">Email Newsletter</h1>
                <p className="text-white/60">Compose and send updates to all subscribers.</p>
            </header>

            {/* Stats Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal/10 rounded-lg text-teal">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Active Subscribers</p>
                        {statsLoading ? (
                            <div className="h-8 w-24 bg-white/10 animate-pulse rounded mt-1" />
                        ) : (
                            <p className="text-3xl font-light text-white">{subscribersCount}</p>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-xs font-mono border border-green-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        SYSTEM ONLINE
                    </div>
                </div>
            </div>

            {/* Composer */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-mono text-white/40 uppercase mb-2">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="e.g., Upcoming Event: The Enigma..."
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-teal/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-white/40 uppercase mb-2">Message Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Write your update here..."
                            rows={12}
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-teal/50 font-serif text-lg leading-relaxed resize-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="bg-black/40 p-6 border-t border-white/10 flex items-center justify-between">
                    <button
                        onClick={() => handleSend(true)}
                        disabled={sending}
                        className="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-mono flex items-center gap-2"
                    >
                        <Mail className="w-4 h-4" /> Send Test to Admin
                    </button>

                    <button
                        onClick={() => handleSend(false)}
                        disabled={sending || subscribersCount === 0}
                        className="relative px-6 py-3 bg-teal text-black font-bold rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        BROADCAST TO ALL
                    </button>
                </div>
            </div>

            {/* Status Feedback */}
            {status && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-teal/10 border border-teal/20 text-teal' : 'bg-red-500/10 border border-red-500/20 text-red-500'}`}>
                    {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="font-mono text-sm">{status.message}</p>
                </div>
            )}
        </div>
    );
}
