import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";
import { jwtVerify } from "jose";
import { getSecret } from "@/lib/jwt";
import { unstable_noStore as noStore } from 'next/cache';

import { getRegistrationById } from "@/lib/google";
import { GlassCard } from "@/components/ui/glass-card";
import { SectionWrapper } from "@/components/ui/section-wrapper";
import { Button } from "@/components/ui/button";
import { AdminTicketManager } from "@/components/admin-ticket-manager";
import { TicketExpiredView } from "@/components/ticket-expired-view";

// Prevent Vercel from caching this page's auth state
export const dynamic = 'force-dynamic';

async function getCoordinatorEventId() {
    const cookieStore = await cookies();
    const token = cookieStore.get("coordinator_token")?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, getSecret());
        if (payload?.type !== 'coordinator' || !payload?.eventId) {
            return null;
        }
        return payload.eventId;
    } catch {
        return null;
    }
}

export default async function CoordinatorTicketPage({ params }) {
    noStore(); // Completely disable caching for auth
    const { id } = await params;
    const registrationId = decodeURIComponent(String(id || "")).trim();

    const coordinatorEventId = await getCoordinatorEventId();

    if (!coordinatorEventId) {
        redirect("/coordinator/login");
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ID;
    const ticketRow = spreadsheetId ? await getRegistrationById(spreadsheetId, registrationId) : null;

    if (!spreadsheetId || !ticketRow) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center min-h-screen">
                <GlassCard className="p-8 text-center max-w-md w-full border-red-500/50">
                    <div className="flex justify-center mb-6">
                        <XCircle className="h-20 w-20 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Invalid Ticket</h1>
                    <p className="text-muted-foreground mb-6">
                        This ticket ID ({registrationId}) could not be found.
                    </p>
                    <Button asChild>
                        <Link href="/coordinator/scan">Scan Another</Link>
                    </Button>
                </GlassCard>
            </div>
        );
    }

    // Verify this ticket belongs to the coordinator's event
    const ticketEventId = String(ticketRow.eventId || ticketRow['Event ID'] || "").trim();

    if (ticketEventId && ticketEventId !== coordinatorEventId) {
        return (
            <div className="container mx-auto px-4 py-20 flex justify-center items-center min-h-screen">
                <GlassCard className="p-8 text-center max-w-md w-full border-red-500/50">
                    <div className="flex justify-center mb-6">
                        <XCircle className="h-20 w-20 text-red-500" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Wrong Event</h1>
                    <p className="text-muted-foreground mb-4">
                        This ticket is for <strong>{ticketRow.eventName || "another event"}</strong>.
                    </p>
                    <p className="text-xs text-white/40 mb-6 bg-white/5 p-2 rounded">
                        Ticket Event ID: {ticketEventId}<br />
                        Your Event ID: {coordinatorEventId}
                    </p>
                    <Button asChild>
                        <Link href="/coordinator/scan">Scan Another</Link>
                    </Button>
                </GlassCard>
            </div>
        );
    }

    const teamMembers = (() => {
        try {
            return ticketRow.teamMembers ? JSON.parse(ticketRow.teamMembers) : [];
        } catch {
            return [];
        }
    })();

    const membersString = Array.isArray(teamMembers)
        ? teamMembers
            .map(m => {
                if (!m) return "";
                const name = m.name || m.fullName || m.memberName;
                const roll = m.rollNo || m.roll || m.rollNumber;
                if (name && roll) return `${name} (${roll})`;
                if (name) return String(name);
                return "";
            })
            .filter(Boolean)
            .join(", ")
        : "";

    const uiTicket = {
        id: ticketRow.registrationId,
        event: ticketRow.eventName,
        name: ticketRow.name,
        roll: ticketRow.rollNo,
        team: membersString ? "Team Entry" : "Independent Entry",
        members: membersString,
        timestamp: ticketRow.timestamp,
        attended: ticketRow.checkedInAt ? "Yes" : "No",
        attendedAt: ticketRow.checkedInAt,
        memberAttendance: ticketRow.memberAttendance,
    };

    return (
        <div className="container mx-auto px-4 py-20 flex justify-center items-center min-h-screen">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
            <SectionWrapper className="relative z-10 w-full max-w-md flex flex-col items-center">
                {uiTicket.attended === "Yes" ? (
                    <TicketExpiredView attendedAt={uiTicket.attendedAt} memberAttendance={uiTicket.memberAttendance} />
                ) : (
                    <AdminTicketManager ticket={uiTicket} />
                )}

                <div className="mt-8">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-white">
                        <Link href="/coordinator/scan">Return to Scanner</Link>
                    </Button>
                </div>
            </SectionWrapper>
        </div>
    );
}
