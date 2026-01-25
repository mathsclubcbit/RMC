"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Helper to convert VAPID key
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

export function usePushNotifications() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState('default');

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            // Check current permission
            setPermission(Notification.permission);

            // Check if already subscribed
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(subscription => {
                    if (subscription) setIsSubscribed(true);
                    setLoading(false);
                });
            });
        } else {
            setLoading(false);
        }
    }, []);

    const subscribeToNotifications = async () => {
        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.register('/sw.js');
            const permission = await Notification.requestPermission();
            setPermission(permission);

            if (permission === 'granted') {
                const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                if (!vapidKey) throw new Error("VAPID Public Key missing");

                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidKey)
                });

                // Send to backend
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await fetch('/api/notifications/subscribe', {
                        method: 'POST',
                        body: JSON.stringify({ subscription, userId: user.id }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                }

                setIsSubscribed(true);
                alert("✅ Notifications Enabled!");
            }
        } catch (error) {
            console.error("Subscription failed:", error);
            alert("Failed to subscribe: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return { isSubscribed, subscribeToNotifications, loading, permission };
}
