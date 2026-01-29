"use client";

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

export default function NotificationManager({ className = "" }) {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [permission, setPermission] = useState('default');
    const [modal, setModal] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "info"
    });

    const checkSubscription = async () => {
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            checkSubscription();
        }
    }, []);

    async function subscribe() {
        try {
            const permissionResult = await Notification.requestPermission();
            setPermission(permissionResult);

            if (permissionResult !== 'granted') return;

            const registration = await navigator.serviceWorker.ready;

            // Public Key from Env (Must be exposed via NEXT_PUBLIC)
            // Ideally we fetch this from API to avoid hardcoding build-time env if dynamic
            // But usually NEXT_PUBLIC_VAPID_PUBLIC_KEY is fine.
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

            const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            // Send to backend
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription }),
            });

            setIsSubscribed(true);
            setModal({
                isOpen: true,
                title: "Success! 🔔",
                message: "You have been successfully subscribed to RMC notifications.",
                type: "success"
            });
        } catch (error) {
            console.error('Subscription failed', error);
            setModal({
                isOpen: true,
                title: "Subscription Failed",
                message: "Failed to subscribe: " + error.message,
                type: "error"
            });
        }
    }

    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    if (permission === 'denied') {
        return (
            <button className={`p-2 text-red-500/50 hover:text-red-500 transition-colors ${className}`} title="Notifications Blocked">
                <BellOff className="w-5 h-5" />
            </button>
        );
    }

    if (isSubscribed) return null;

    return (
        <button
            onClick={subscribe}
            className={`
                group relative flex items-center gap-2 p-2 md:pl-4 md:pr-5 md:py-2 rounded-full transition-all duration-500
                text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 hover:text-teal-300
                border border-teal-500/20 hover:border-teal-500/50
                shadow-[0_0_0_1px_rgba(45,212,191,0.1)] hover:shadow-[0_0_15px_rgba(45,212,191,0.4)]
                ${className}
            `}
            title="Enable Notifications"
        >
            {/* Ping Animation */}
            <span className="absolute inset-0 rounded-full border border-teal-500/30 opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300 pointer-events-none" />

            {/* Bell Icon */}
            <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />

            {/* Text Label - Hidden on Mobile */}
            <span className="hidden md:block text-xs font-bold uppercase tracking-widest font-mono whitespace-nowrap">
                Get Updates
            </span>

            {/* Status Dot */}
            <span className="absolute top-2 right-2.5 md:top-2 md:right-2 w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_5px_rgba(45,212,191,0.8)] animate-pulse" />

            <ConfirmationModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={() => setModal({ ...modal, isOpen: false })}
                title={modal.title}
                message={modal.message}
                type={modal.type}
                isToast={modal.type === "success" || modal.type === "info"}
                duration={3000}
            />
        </button>
    );
}
