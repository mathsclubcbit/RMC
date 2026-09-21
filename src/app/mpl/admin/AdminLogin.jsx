'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowRight } from 'lucide-react';
import { loginToMplAdmin } from './actions';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await loginToMplAdmin(password);
            if (res.success) {
                router.refresh();
            } else {
                setError(res.error);
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center py-20 px-4 relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

            <div className="w-full max-w-md relative z-10 text-center bg-black/60 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/20">
                    <Shield className="w-8 h-8 text-teal-400" />
                </div>
                
                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Access Restricted</h1>
                <p className="text-xs text-zinc-400 mb-8 leading-relaxed font-mono uppercase tracking-widest">
                    MPL Organiser Authentication
                </p>

                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Master Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-teal-500/50 focus:bg-white/10 transition-all font-mono"
                        />
                        {error && <p className="text-red-400 text-xs mt-2 font-mono">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Verifying...' : 'Authenticate'}
                        {!isLoading && <ArrowRight className="w-4 h-4" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
