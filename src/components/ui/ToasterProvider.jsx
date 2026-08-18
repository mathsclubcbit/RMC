"use client";

import { Toaster } from 'react-hot-toast';

export default function ToasterProvider() {
    return (
        <Toaster
            position="bottom-right"
            toastOptions={{
                style: {
                    background: '#1e293b',
                    color: '#fff',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                },
                success: {
                    iconTheme: {
                        primary: '#14b8a6',
                        secondary: '#fff',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                    },
                },
            }}
        />
    );
}
