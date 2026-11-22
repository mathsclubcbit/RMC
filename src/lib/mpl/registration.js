export function isMplRegistrationClosed(payload) {
    if (!payload) return false;
    if (payload.registrationClosed === true) return true;

    return String(payload.status || '').toLowerCase().includes('closed');
}