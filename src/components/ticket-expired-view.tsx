"use client";

import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";

interface TicketExpiredViewProps {
    attendedAt: string;
    memberAttendance?: string;
}

export function TicketExpiredView({ attendedAt, memberAttendance }: TicketExpiredViewProps) {
    const attendanceList = memberAttendance
        ? memberAttendance
              .split(",")
              .map(entry => {
                  const [name, status] = entry.split(":");
                  return { name: name?.trim(), status: status?.trim() };
              })
              .filter(item => item.name)
        : [];

    return (
        <GlassCard className="p-8 w-full max-w-md border-amber-500/50 bg-black/60 shadow-[0_0_50px_-12px_rgba(245,158,11,0.2)]">
            <div className="flex justify-center mb-6">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500 blur-xl opacity-20 rounded-full" />
                    <AlertCircle className="h-16 w-16 text-amber-500 relative z-10" />
                </div>
            </div>

            <h1 className="text-2xl font-bold text-center text-amber-500 mb-2">TICKET EXPIRED</h1>
            <p className="text-sm text-muted-foreground text-center mb-8">
                This ticket has used at
                <br />
                <span className="text-white font-mono bg-white/10 px-2 py-1 rounded mt-1 inline-block">
                    {attendedAt}
                </span>
            </p>

            {attendanceList.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 mb-8 border border-white/10">
                    <h3 className="text-xs uppercase text-muted-foreground mb-3 font-semibold tracking-wider">
                        Attendance Record
                    </h3>
                    <div className="space-y-2">
                        {attendanceList.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">{item.name}</span>
                                <span
                                    className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                        item.status === "Present"
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-red-500/20 text-red-400"
                                    }`}
                                >
                                    {item.status || "Unknown"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Button className="w-full" variant="outline" asChild>
                <Link href="/admin/scan">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Scan Next Ticket
                </Link>
            </Button>
        </GlassCard>
    );
}
