"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * Camera Permission States
 * - idle: Initial state, no permission request made yet
 * - requesting: Currently requesting permission
 * - granted: Permission granted, camera can be used
 * - denied: User explicitly denied permission
 * - not-supported: Camera API not available (no HTTPS, no camera, etc.)
 */

export function useCameraPermission() {
    const [permissionState, setPermissionState] = useState("idle");
    const [error, setError] = useState(null);

    // Check if camera API is supported
    const isSupported = typeof window !== "undefined" &&
        !!navigator?.mediaDevices?.getUserMedia &&
        window.isSecureContext;

    // Check initial permission state on mount
    useEffect(() => {
        if (!isSupported) {
            setPermissionState("not-supported");
            setError("Camera access requires HTTPS or localhost");
            return;
        }

        // Try to query existing permission state (if browser supports it)
        if (navigator.permissions?.query) {
            navigator.permissions.query({ name: "camera" })
                .then(result => {
                    if (result.state === "granted") {
                        setPermissionState("granted");
                    } else if (result.state === "denied") {
                        setPermissionState("denied");
                        setError("Camera permission was previously denied");
                    }
                    // If "prompt", we stay in "idle" state
                })
                .catch(() => {
                    // Some browsers don't support querying camera permission
                    // Stay in idle state
                });
        }
    }, [isSupported]);

    const requestPermission = useCallback(async () => {
        if (!isSupported) {
            setPermissionState("not-supported");
            setError("Camera access requires HTTPS or localhost");
            return false;
        }

        setPermissionState("requesting");
        setError(null);

        try {
            // Request camera access - this triggers the browser permission prompt
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });

            // Permission granted! Stop the stream immediately (we just needed permission)
            stream.getTracks().forEach(track => track.stop());

            setPermissionState("granted");
            return true;
        } catch (err) {
            console.error("Camera permission error:", err);

            if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
                setPermissionState("denied");
                setError("Camera access was denied. Please enable it in your browser settings.");
            } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
                setPermissionState("not-supported");
                setError("No camera found on this device.");
            } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
                setPermissionState("denied");
                setError("Camera is in use by another application. Please close other apps using the camera.");
            } else if (err.name === "OverconstrainedError") {
                setPermissionState("denied");
                setError("Camera constraints could not be satisfied.");
            } else {
                setPermissionState("denied");
                setError("Failed to access camera. Please check your device settings.");
            }

            return false;
        }
    }, [isSupported]);

    const reset = useCallback(() => {
        setPermissionState("idle");
        setError(null);
    }, []);

    return {
        permissionState,
        error,
        isSupported,
        requestPermission,
        reset,
        isGranted: permissionState === "granted",
        isDenied: permissionState === "denied",
        isRequesting: permissionState === "requesting",
    };
}
