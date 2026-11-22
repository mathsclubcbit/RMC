// Certificate record field helpers shared by verification and downloads.

/**
 * Return the participant's real roll number from imported sheet fields.
 *
 * Older bulk imports can contain both `rollNo` (sometimes incorrectly mapped
 * to an internal UUID) and a human-facing `Roll number` column. Prefer the
 * explicit number column before falling back to the shorter aliases.
 */
export function getCertificateRollNumber(
  extraFields: Record<string, string> | undefined | null
): string {
  const entries = Object.entries(extraFields || {}).map(([key, value]) => ({
    key: key.trim(),
    normalizedKey: key.toLowerCase().replace(/[^a-z0-9]/g, ''),
    value: String(value ?? '').trim(),
  }));

  for (const preferredKey of ['rollnumber', 'rollno', 'roll']) {
    const match = entries.find(
      (entry) => entry.normalizedKey === preferredKey && entry.value
    );
    if (match) return match.value;
  }

  return '';
}
