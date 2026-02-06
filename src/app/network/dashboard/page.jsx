"use client";

import { useState, useEffect } from "react";
import NetworkSidebar from "@/components/network/Sidebar";
// import DashboardClient from "@/components/network/DashboardClient";

export default function DashboardPage() {
    return (
        <div className="flex h-full text-white">
            <NetworkSidebar />
        </div>
    );
}
