"use client";

import { useState } from "react";
import { ArrowLeft, UserCheck } from "lucide-react";

import { TicketCheckInForm } from "@/components/ticket-check-in-form";
import { TicketDetailsCard } from "@/components/ticket-details-card";
import { Button } from "@/components/ui/button";

interface AdminTicketManagerProps {
    ticket: any;
}

export function AdminTicketManager({ ticket }: AdminTicketManagerProps) {
    const [mode, setMode] = useState<"verify" | "checkin">("verify");

    if (mode === "checkin") {
        return (
            <div className="w-full max-w-md">
                <div className="mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("verify")}
                        className="text-muted-foreground"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Verification
                    </Button>
                </div>
                <TicketCheckInForm ticket={ticket} />
            </div>
        );
    }

    return (
        <TicketDetailsCard
            ticket={ticket}
            actionButton={
                <Button className="w-full h-12 text-lg font-bold" onClick={() => setMode("checkin")}>
                    <UserCheck className="mr-2 h-5 w-5" />
                    Proceed to Check In
                </Button>
            }
        />
    );
}
