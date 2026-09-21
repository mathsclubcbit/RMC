'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Users, UserPlus, CheckCircle, Copy, Search, X, MessageCircle } from 'lucide-react';
import { PremiumInput } from '@/components/events/registration/components';
import UserProfileMenu from '../components/UserProfileMenu';

import { createClient } from '@/lib/supabase/client';

export default function MPLRegistrationClient() {
    const searchParams = useSearchParams();
    const urlCode = searchParams.get('code');
    const supabase = createClient();

    const [session, setSession] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const [currentStep, setCurrentStep] = useState(1);
    const [teamMode, setTeamMode] = useState(null);
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        rollNo: '',
        section: '',
        branch: '',
        year: '1st',
        teamName: '',
        teamCode: urlCode || '',
        consent: true
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [teamCodeResult, setTeamCodeResult] = useState('');
    const [teamRoster, setTeamRoster] = useState([]);
    
    const [availableTeams, setAvailableTeams] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showTeamDropdown, setShowTeamDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState(urlCode || '');

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setSession(session);
                setFormData(prev => ({ 
                    ...prev, 
                    name: prev.name || session.user.user_metadata?.full_name || '',
                    email: session.user.email 
                }));
            }
            setAuthLoading(false);
        };
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (session) {
                setFormData(prev => ({ 
                    ...prev, 
                    name: prev.name || session.user.user_metadata?.full_name || '',
                    email: session.user.email 
                }));
            }
        });

        return () => authListener?.subscription.unsubscribe();
    }, [supabase]);

    useEffect(() => {
        if (urlCode && currentStep === 2 && !teamMode) {
            setTeamMode('join');
            setSearchQuery(urlCode);
            setFormData(prev => ({ ...prev, teamCode: urlCode }));
        }
    }, [urlCode, currentStep, teamMode]);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrorMessage('');
    };

    const validateStep1 = () => {
        if (!formData.name || !formData.phone || !formData.rollNo || !formData.section || !formData.branch || !formData.year) {
            setErrorMessage('Please fill in all personal details to continue.');
            return false;
        }
        return true;
    };

    const handleGoogleLogin = async () => {
        const origin = window.location.origin;
        const nextUrl = `/mpl/register${urlCode ? `?code=${urlCode}` : ''}`;
        
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`
            }
        });
    };

    const fetchTeams = async () => {
        setIsSearching(true);
        try {
            const res = await fetch('/api/mpl/search-teams');
            if (res.ok) {
                const data = await res.json();
                setAvailableTeams(data.teams || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        if (currentStep === 2) {
            fetchTeams();
        }
    }, [currentStep]);

    const handleSubmit = async (e) => {
        e?.preventDefault();
        
        if (teamMode === 'create' && !formData.teamName) {
            setErrorMessage('Please enter a Team Name.');
            return;
        }
        if (teamMode === 'join' && !formData.teamCode) {
            setErrorMessage('Please select a team to join.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        const endpoint = teamMode === 'create' ? '/api/mpl/create-team' : '/api/mpl/join-team';

        const payload = {
            ...formData,
            email: session?.user?.email || '',
            avatar_url: session?.user?.user_metadata?.avatar_url || ''
        };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            
            if (!res.ok) {
                setErrorMessage(data.error || 'Failed to process registration.');
                return;
            }

            if (teamMode === 'create') {
                setTeamCodeResult(data.teamCode);
                setTeamRoster([{ name: formData.name, rollNo: formData.rollNo, isLeader: true }]);
            } else {
                setTeamRoster(data.team_members || []);
            }
            setIsSuccess(true);
        } catch (err) {
            console.error(err);
            setErrorMessage('Network error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(teamMode === 'create' ? teamCodeResult : formData.teamCode);
        alert('Team Code copied to clipboard!');
    };

    const shareOnWhatsApp = () => {
        const code = teamMode === 'create' ? teamCodeResult : formData.teamCode;
        const name = teamMode === 'create' ? formData.teamName : (selectedTeamData?.teamName || 'our team');
        const origin = window.location.origin;
        const link = `${origin}/mpl/register?code=${code}`;
        
        const text = teamMode === 'create'
            ? `Hey! I've created a team for the Mathematics Premier League 2026. Join my team "${name}" using Team Code: ${code}. Click here to join directly: ${link}`
            : `Hey! I just joined team "${name}" for the Mathematics Premier League 2026! Join us using Team Code: ${code}. Click here to join directly: ${link}`;
            
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    const selectedTeamData = availableTeams.find(t => t.registrationId === formData.teamCode);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono animate-pulse">
                Checking Authentication...
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center py-20 px-4 relative overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/20 blur-[120px] pointer-events-none" />
                
                <div className="w-full max-w-md relative z-10 text-center">
                    <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-6">
                        MPL 2026 Registration
                    </span>
                    <h1 className="text-3xl font-extrabold text-white mb-4">Authentication Required</h1>
                    <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
                        To register for the Mathematics Premier League and manage your squad, please sign in with your Google account.
                    </p>
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>
                    <Link href="/events" className="mt-6 inline-block text-xs font-mono text-zinc-500 hover:text-white transition-colors uppercase tracking-widest">
                        Return to Events
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 relative overflow-hidden flex items-center justify-center py-20 px-4 font-sans">
            {/* Abstract Background */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

            <Link
                href="/events"
                className="fixed top-8 left-8 z-50 flex items-center gap-3 px-5 py-2.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full hover:bg-white/10 transition-all group pointer-events-auto"
            >
                <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-300 group-hover:text-white">Events</span>
            </Link>
            
            <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 50 }} className="pointer-events-auto">
                <UserProfileMenu 
                    avatarUrl={session.user.user_metadata?.avatar_url} 
                    email={session.user.email} 
                />
            </div>

            <div className="w-full max-w-3xl relative z-10">
                
                {/* Hero Header */}
                <div className="text-center mb-12">
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-6 shadow-2xl">
                            Mathematics Premier League 2026
                        </span>
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-500">
                            Tournament Registration
                        </h1>
                        <p className="text-zinc-400 text-sm max-w-lg mx-auto">
                            Complete your registration to secure your spot. You can form a new squad as a Team Lead or join an existing one.
                        </p>
                    </motion.div>
                </div>

                {/* Form Container */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-8 md:p-12">
                        {/* Stepper Header */}
                        {!isSuccess && (
                            <div className="mb-12">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {currentStep === 1 ? 'Player Profile' : 'Squad Assembly'}
                                        </h2>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {currentStep === 1 ? 'Enter your personal details.' : 'Create or join a team.'}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                        STEP {currentStep} OF 2
                                    </span>
                                </div>
                                <div className="flex gap-2 h-1.5">
                                    <div className={`flex-1 rounded-full transition-colors duration-500 ${currentStep >= 1 ? 'bg-white' : 'bg-white/10'}`} />
                                    <div className={`flex-1 rounded-full transition-colors duration-500 ${currentStep >= 2 ? 'bg-white' : 'bg-white/10'}`} />
                                </div>
                            </div>
                        )}

                        <AnimatePresence mode="wait">
                            {errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-8"
                                >
                                    <div className="p-4 bg-red-950/30 border border-red-500/20 rounded-xl text-red-200 text-sm flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                        {errorMessage}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!isSuccess ? (
                            <form onSubmit={e => e.preventDefault()}>
                                <AnimatePresence mode="wait">
                                    {/* STEP 1: PERSONAL DETAILS */}
                                    {currentStep === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4 }}
                                            className="space-y-6"
                                        >
                                                <PremiumInput
                                                    label="Full Name"
                                                    value={formData.name}
                                                    onChange={e => updateField('name', e.target.value)}
                                                    placeholder="Enter your full name"
                                                    variant="minimal"
                                                />
                                            
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <PremiumInput
                                                    label="Phone Number"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={e => updateField('phone', e.target.value)}
                                                    placeholder="Enter your phone number"
                                                    variant="minimal"
                                                />
                                                <PremiumInput
                                                    label="Roll Number"
                                                    value={formData.rollNo}
                                                    onChange={e => {
                                                        const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                                                        updateField('rollNo', value);
                                                    }}
                                                    maxLength={12}
                                                    inputMode="numeric"
                                                    placeholder="1601..."
                                                    className="font-mono"
                                                    variant="minimal"
                                                />
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-6">
                                                <PremiumInput
                                                    label="Section"
                                                    value={formData.section}
                                                    onChange={e => updateField('section', e.target.value)}
                                                    placeholder="e.g., A, B, C"
                                                    variant="minimal"
                                                />
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-white uppercase tracking-widest ml-1 block">Year of Study</label>
                                                    <select
                                                        value={formData.year}
                                                        onChange={e => updateField('year', e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-white/40 transition-colors"
                                                    >
                                                        <option value="1st" className="bg-zinc-900">1st Year</option>
                                                        <option value="2nd" className="bg-zinc-900">2nd Year</option>
                                                        <option value="3rd" className="bg-zinc-900">3rd Year</option>
                                                        <option value="4th" className="bg-zinc-900">4th Year</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <PremiumInput
                                                label="Branch"
                                                value={formData.branch}
                                                onChange={e => updateField('branch', e.target.value)}
                                                placeholder="CSE, AIML, AIDS..."
                                                variant="minimal"
                                            />

                                            <div className="mt-8 pt-6 border-t border-white/10">
                                                <label className="flex items-start gap-4 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center mt-1">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={formData.consent}
                                                            onChange={e => updateField('consent', e.target.checked)}
                                                            className="appearance-none w-5 h-5 border-2 border-white/20 rounded-sm bg-transparent checked:bg-white checked:border-white transition-all peer" 
                                                        />
                                                        <CheckCircle className="absolute w-3 h-3 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-white group-hover:text-zinc-200 transition-colors">Stay Updated</p>
                                                        <p className="text-xs text-zinc-500 leading-relaxed mt-1">I consent to receive emails regarding upcoming RMC events, newsletters, and tournament updates.</p>
                                                    </div>
                                                </label>
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* STEP 2: TEAM DETAILS */}
                                    {currentStep === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <div className="grid grid-cols-2 gap-4 mb-8">
                                                <button
                                                    type="button"
                                                    onClick={() => { setTeamMode('create'); setErrorMessage(''); }}
                                                    className={`p-6 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${
                                                        teamMode === 'create' 
                                                            ? 'bg-white/10 border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <Users className={`w-8 h-8 mb-3 ${teamMode === 'create' ? 'text-white' : 'text-zinc-500'}`} />
                                                    <span className="font-bold tracking-widest uppercase text-[10px] md:text-xs">Form New Squad</span>
                                                </button>
                                                
                                                <button
                                                    type="button"
                                                    onClick={() => { setTeamMode('join'); setErrorMessage(''); }}
                                                    className={`p-6 rounded-xl flex flex-col items-center justify-center text-center transition-all border ${
                                                        teamMode === 'join' 
                                                            ? 'bg-white/10 border-white text-white shadow-[0_0_30px_rgba(255,255,255,0.1)]' 
                                                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20 hover:bg-white/10'
                                                    }`}
                                                >
                                                    <UserPlus className={`w-8 h-8 mb-3 ${teamMode === 'join' ? 'text-white' : 'text-zinc-500'}`} />
                                                    <span className="font-bold tracking-widest uppercase text-[10px] md:text-xs">Join Existing</span>
                                                </button>
                                            </div>

                                            <AnimatePresence mode="wait">
                                                {teamMode === 'create' && (
                                                    <motion.div
                                                        key="create"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="p-6 bg-white/5 border border-white/10 rounded-xl"
                                                    >
                                                        <h4 className="text-sm font-bold text-white mb-1">Squad Name</h4>
                                                        <p className="text-xs text-zinc-400 mb-6">Choose a unique moniker for your team.</p>
                                                        <PremiumInput
                                                            value={formData.teamName}
                                                            onChange={e => updateField('teamName', e.target.value)}
                                                            placeholder="e.g. The Math Mavericks"
                                                            variant="minimal"
                                                        />
                                                    </motion.div>
                                                )}

                                                {teamMode === 'join' && (
                                                    <motion.div
                                                        key="join"
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -10 }}
                                                        className="p-6 bg-white/5 border border-white/10 rounded-xl relative"
                                                    >
                                                        {!formData.teamCode ? (
                                                            <>
                                                                <h4 className="text-sm font-bold text-white mb-1">Search Squad</h4>
                                                                <p className="text-xs text-zinc-400 mb-6">Enter the 6-digit invite code or search by name.</p>
                                                                
                                                                <div className="relative">
                                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                                                    <input
                                                                        type="text"
                                                                        value={searchQuery}
                                                                        onChange={(e) => {
                                                                            setSearchQuery(e.target.value);
                                                                            setShowTeamDropdown(true);
                                                                        }}
                                                                        onFocus={() => setShowTeamDropdown(true)}
                                                                        placeholder="Type Team Name or ID..."
                                                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-white/40 transition-colors placeholder:text-zinc-600"
                                                                        autoComplete="off"
                                                                    />
                                                                    {isSearching && (
                                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                                    )}
                                                                </div>

                                                                {/* Dropdown */}
                                                                {showTeamDropdown && searchQuery.length > 0 && (
                                                                    <div className="absolute z-50 left-6 right-6 mt-2 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-xl max-h-64 overflow-y-auto custom-scrollbar shadow-2xl">
                                                                        {availableTeams
                                                                            .filter(t => 
                                                                                t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                                                t.registrationId.toLowerCase().includes(searchQuery.toLowerCase())
                                                                            )
                                                                            .map(team => (
                                                                                <div 
                                                                                    key={team.registrationId}
                                                                                    onClick={() => {
                                                                                        updateField('teamCode', team.registrationId);
                                                                                        setSearchQuery('');
                                                                                        setShowTeamDropdown(false);
                                                                                    }}
                                                                                    className="group px-4 py-4 hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-white/5 last:border-0 transition-colors"
                                                                                >
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-zinc-200 group-hover:text-white mb-1">{team.teamName}</p>
                                                                                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">ID: {team.registrationId}</p>
                                                                                    </div>
                                                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors">
                                                                                        <ArrowRight className="w-4 h-4" />
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        {availableTeams.filter(t => 
                                                                            t.teamName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                                            t.registrationId.toLowerCase().includes(searchQuery.toLowerCase())
                                                                        ).length === 0 && (
                                                                            <div className="px-6 py-8 text-center">
                                                                                <p className="text-sm text-zinc-400 mb-1">No matching squads found.</p>
                                                                                <p className="text-xs text-zinc-600">Double check the invite code.</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <div className="relative overflow-hidden rounded-xl bg-white/10 border border-white/20 p-6">
                                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                                                
                                                                <div className="flex justify-between items-start relative z-10">
                                                                    <div>
                                                                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2">Target Squad Confirmed</span>
                                                                        <h3 className="text-xl font-bold text-white mb-1">{selectedTeamData?.teamName || 'Unknown Team'}</h3>
                                                                        <span className="text-xs font-mono text-zinc-400">Invite ID: {formData.teamCode}</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => updateField('teamCode', '')}
                                                                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white bg-black/20 backdrop-blur-sm"
                                                                        title="Change Team"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Footer Actions */}
                                <div className="mt-12 flex gap-4">
                                    {currentStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => { setCurrentStep(1); setErrorMessage(''); }}
                                            className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-bold tracking-widest uppercase"
                                        >
                                            Back
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (currentStep === 1) {
                                                if (validateStep1()) setCurrentStep(2);
                                            } else {
                                                handleSubmit();
                                            }
                                        }}
                                        disabled={isSubmitting || (currentStep === 2 && !teamMode)}
                                        className="flex-1 px-6 py-4 rounded-xl bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                    >
                                        {isSubmitting ? 'Authenticating...' : (currentStep === 1 ? 'Next Step' : 'Confirm Registration')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            // SUCCESS VIEW
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-8"
                            >
                                <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border bg-white/10 border-white/20">
                                    <CheckCircle className="w-12 h-12 text-white" />
                                </div>
                                
                                <h2 className="text-3xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                                    {teamMode === 'create' ? 'Squad Assembled!' : 'Access Granted!'}
                                </h2>
                                
                                <p className="text-zinc-400 mb-10 text-sm max-w-sm mx-auto leading-relaxed">
                                    {teamMode === 'create' 
                                        ? 'Your team is officially registered. Share your invite code with your teammates.' 
                                        : 'You have been successfully registered to the squad.'}
                                </p>
                                
                                {teamMode === 'create' && (
                                    <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 mb-10 relative group max-w-sm mx-auto">
                                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-4 block font-bold">Invite Code</span>
                                        <span className="text-5xl font-mono tracking-widest text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">{teamCodeResult}</span>
                                        <button 
                                            onClick={copyToClipboard}
                                            className="absolute top-4 right-4 p-2.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                                            title="Copy Code"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                {/* Team Roster */}
                                {teamRoster.length > 0 && (
                                    <div className="mb-10 text-left bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto">
                                        <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center justify-between">
                                            <span>Current Squad</span>
                                            <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full">{teamRoster.length}/10</span>
                                        </h3>
                                        <div className="space-y-3">
                                            {teamRoster.map((member, idx) => (
                                                <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                                    <div className="flex items-center gap-3">
                                                        {member.avatar_url ? (
                                                            <img src={member.avatar_url} alt={member.name} referrerPolicy="no-referrer" className="w-8 h-8 rounded-full border border-white/20" />
                                                        ) : (
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${member.isLeader ? 'bg-white text-black' : 'bg-white/10 text-zinc-300'}`}>
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                                                                {member.name}
                                                                {member.isLeader && <span className="text-[9px] bg-white text-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Leader</span>}
                                                            </p>
                                                            <p className="text-[10px] text-zinc-500 font-mono">{member.rollNo}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                    <button
                                        onClick={shareOnWhatsApp}
                                        className="flex items-center justify-center gap-3 px-8 py-4 bg-[#25D366] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#1ebd5a] transition-all shadow-[0_0_20px_rgba(37,211,102,0.3)] hover:shadow-[0_0_30px_rgba(37,211,102,0.4)]"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Share on WhatsApp
                                    </button>
                                    
                                    <Link
                                        href="/mpl/dashboard"
                                        className="inline-flex items-center justify-center px-8 py-4 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all text-xs font-bold tracking-widest uppercase"
                                    >
                                        Go to Dashboard
                                    </Link>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
