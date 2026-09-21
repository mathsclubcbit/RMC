'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserProfileMenu({ avatarUrl, email }) {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        router.push('/mpl/register');
        router.refresh();
    };

    return (
        <div className="relative" onMouseLeave={() => setIsOpen(false)}>
            <button
                onMouseEnter={() => setIsOpen(true)}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden hover:border-white/40 transition-all focus:outline-none"
            >
                {avatarUrl && !imageError ? (
                    <img 
                        src={avatarUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <User className="w-5 h-5 text-zinc-400" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50"
                    >
                        <div className="p-3 border-b border-white/10">
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest truncate">{email || 'Logged In'}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={isLoading}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium text-zinc-300 text-left disabled:opacity-50"
                        >
                            <LogOut className="w-4 h-4" />
                            {isLoading ? 'Signing Out...' : 'Sign Out'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
