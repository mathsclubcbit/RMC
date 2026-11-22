import { headers } from "next/headers";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import ParticipantContestPlayClient from "./ParticipantContestPlayClient";

export const dynamic = 'force-dynamic';

export default async function ParticipantContestPlayPage({ params }) {
    const eventId = (await params).eventId;
    const contestId = (await params).contestId;
    
    // Server-side mobile detection (Bypasses client-side caching)
    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    const isMobileUA = /android|ipad|playbook|silk|Mobile|iP(hone|od|ad)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(userAgent);
    
    if (isMobileUA) {
        return (
            <div className="min-h-[100dvh] bg-black flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <AlertTriangle className="w-10 h-10" />
                </div>
                <h1 className="text-3xl font-bold mb-4 text-white">Desktop Required</h1>
                <p className="text-white/60 max-w-md mx-auto mb-8">
                    To maintain fairness and ensure the anti-cheat system functions correctly, this contest can only be taken on a Desktop or Laptop computer.
                </p>
                <Link href={`/placement-series/${eventId}/contests`} className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-bold transition-all">
                    Back to Contests
                </Link>
            </div>
        );
    }
    
    return <ParticipantContestPlayClient eventId={eventId} contestId={contestId} />;
}
