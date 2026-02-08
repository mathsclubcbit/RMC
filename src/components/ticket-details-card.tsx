import React from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface TicketDetailsCardProps {
    ticket: {
        id: string;
        name: string;
        roll: string;
        event: string;
        team: string;
        members: string;
        timestamp: string;
    };
    actionButton?: React.ReactNode;
}

export function TicketDetailsCard({ ticket, actionButton }: TicketDetailsCardProps) {
    const membersList = ticket.members
        ? ticket.members
            .split(",")
            .map(m => m.trim())
            .filter(Boolean)
        : [];

    return (
        <GlassCard className="p-8 text-center border-green-500/50 shadow-[0_0_50px_-12px_rgba(34,197,94,0.2)] w-full">
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-green-500 blur-xl opacity-20 rounded-full" />
                    <BadgeCheck className="h-24 w-24 text-green-500 relative z-10" />
                </div>
            </div>

            <h1 className="text-2xl font-bold text-green-400 mb-1">VERIFIED TICKET</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-8">{ticket.id}</p>

            <div className="space-y-4 text-left bg-white/5 p-6 rounded-lg mb-8">
                <div>
                    <p className="text-xs text-muted-foreground uppercase">Participant</p>
                    <p className="text-xl font-bold">{ticket.name}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase">Roll Number</p>
                    <p className="text-lg">{ticket.roll}</p>
                </div>
                <div className="h-px bg-white/10 my-2" />
                <div>
                    <p className="text-xs text-muted-foreground uppercase">Event</p>
                    <p className="text-lg font-medium text-primary">{ticket.event}</p>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground uppercase">Team</p>
                    <p className="text-lg">{ticket.team}</p>
                </div>

                {membersList.length > 0 && (
                    <>
                        <div className="h-px bg-white/10 my-2" />
                        <div>
                            <p className="text-xs text-muted-foreground uppercase mb-1">Team Members</p>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                {membersList.map((member, i) => (
                                    <li key={i}>• {member}</li>
                                ))}
                            </ul>
                        </div>
                    </>
                )}
            </div>

            <p className="text-xs text-muted-foreground mb-6">
                Registered on {new Date(ticket.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>

            {actionButton ? (
                actionButton
            ) : (
                <Button className="w-full" asChild>
                    <Link href="/">Back to Event</Link>
                </Button>
            )}
        </GlassCard>
    );
}
