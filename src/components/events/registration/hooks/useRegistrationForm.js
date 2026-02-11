'use client';

import { useState, useCallback } from 'react';

/**
 * Custom hook for managing registration form state
 */
export function useRegistrationForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        rollNo: '',
        department: '',
        utrId: ''
    });

    const [screenshot, setScreenshot] = useState(null);
    const [pptFile, setPptFile] = useState(null);
    const [abstract, setAbstract] = useState('');
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const updateField = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const resetForm = useCallback(() => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            rollNo: '',
            department: '',
            utrId: ''
        });
        setScreenshot(null);
        setPptFile(null);
        setAbstract('');
        setSelectedTimeSlot('');
        setErrorMessage('');
    }, []);

    return {
        formData,
        setFormData,
        updateField,
        screenshot,
        setScreenshot,
        pptFile,
        setPptFile,
        abstract,
        setAbstract,
        selectedTimeSlot,
        setSelectedTimeSlot,
        errorMessage,
        setErrorMessage,
        resetForm
    };
}

export default useRegistrationForm;
