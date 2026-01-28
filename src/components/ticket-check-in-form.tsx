"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Users } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { markAttendanceAction } from "@/app/admin/actions";
import ConfirmationModal from "@/components/ui/ConfirmationModal";

interface TicketCheckInFormProps {
    ticket: {
        id: string;
        name: string;
        roll: string;
        team: string;
        members: string;
    };
}

export function TicketCheckInForm({ ticket }: TicketCheckInFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "confirm" as "confirm" | "success" | "error" | "info"
    });

    const leadEntry = `${ticket.name} (${ticket.roll})`;
    const membersList = ticket.members
        ? ticket.members
            .split(",")
            .map(m => m.trim())
            .filter(Boolean)
        : [];

    const allMembers = [leadEntry, ...membersList];

    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(allMembers));

    const toggleMember = (member: string) => {
        const next = new Set(selectedMembers);
        if (next.has(member)) next.delete(member);
        else next.add(member);
        setSelectedMembers(next);
    };

    const handleCheckIn = async () => {
        setIsSubmitting(true);
        try {
            const attendanceStatus = allMembers
                .map(member => `${member}:${selectedMembers.has(member) ? "Present" : "Absent"}`)
                .join(", ");

            const result = await markAttendanceAction(ticket.id, attendanceStatus);

            if (result?.error) {
                setModal({
                    isOpen: true,
                    title: "Check-in Error",
                    message: result.error,
                    type: "error"
                });
            } else {
                router.refresh();
            }
        } catch (error: any) {
            console.error("Check-in failed", error);
            setModal({
                isOpen: true,
                title: "System Error",
                message: "Failed to mark attendance. Please try again.",
                type: "error"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <GlassCard className="p-8 w-full max-w-md border-primary/20 bg-black/60 shadow-[0_0_50px_-12px_rgba(124,58,237,0.2)]">
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary blur-xl opacity-20 rounded-full" />
                    <Users className="h-16 w-16 text-primary relative z-10" />
                </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">Check In</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
                Select members present for {ticket.team || "Independent Entry"}
            </p>

            <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {allMembers.map((member, idx) => {
                    const isSelected = selectedMembers.has(member);
                    return (
                        <div
                            key={idx}
                            onClick={() => toggleMember(member)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 ${isSelected
                                    ? "bg-primary/20 border-primary/50 shadow-[inset_0_0_10px_rgba(124,58,237,0.1)]"
                                    : "bg-white/5 border-white/10 hover:bg-white/10"
                                }`}
                        >
                            <span
                                className={`text-sm ${isSelected
                                        ? "text-primary-foreground font-medium"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                {member}
                            </span>
                            <div
                                className={`h-5 w-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-primary border-primary" : "border-white/20"
                                    }`}
                            >
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Button className="w-full" size="lg" onClick={handleCheckIn} disabled={isSubmitting}>
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    "Confirm Attendance"
                )}
            </Button>

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                confirmText="Dismiss"
            />
        </GlassCard >
    );
}
