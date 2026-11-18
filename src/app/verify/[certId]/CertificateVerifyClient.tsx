'use client';

import { useEffect, useState } from 'react';
import type { VerifyCertificateResponse } from '@/types/certificate';

interface Props {
  certId: string;
}

export default function CertificateVerifyClient({ certId }: Props) {
  const [data, setData] = useState<VerifyCertificateResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verify() {
      try {
        const res = await fetch(`/api/certificates/verify/${certId}`);
        const json: VerifyCertificateResponse = await res.json();
        setData(json);
      } catch {
        setData({ verified: false, error: 'Network error. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
    verify();
  }, [certId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-300 text-lg">Verifying certificate...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/30 border border-red-500/50 rounded-2xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-400 mb-2">Verification Failed</h1>
          <p className="text-slate-300">Something went wrong. Please try again.</p>
        </div>
      </div>
    );
  }

  // ── REVOKED Certificate ──────────────────────────────────
  if (data.certificate && data.certificate.status === 'REVOKED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 rounded-full px-4 py-2 mb-4">
              <img src="/full logo.png" alt="RMC" className="w-6 h-6" />
              <span className="text-slate-300 text-sm font-medium">Ramanujan Maths Club</span>
            </div>
          </div>

          {/* Card */}
          <div className="bg-orange-900/20 border border-orange-500/40 rounded-2xl overflow-hidden">
            <div className="bg-orange-500/20 px-6 py-5 text-center border-b border-orange-500/30">
              <div className="text-5xl mb-2">⚠️</div>
              <h1 className="text-2xl font-bold text-orange-400">Certificate Revoked</h1>
              <p className="text-orange-300/80 text-sm mt-1">This certificate is no longer valid</p>
            </div>

            <div className="p-6 space-y-4">
              <InfoRow label="Certificate ID" value={data.certificate.certificateId} />
              <InfoRow label="Participant" value={data.certificate.participantName} />
              <InfoRow label="Event" value={data.certificate.eventName} />
              <InfoRow label="Date Issued" value={formatDate(data.certificate.dateIssued)} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── NOT FOUND ──────────────────────────────────────────────
  if (!data.verified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-slate-800/80 rounded-full px-4 py-2 mb-4">
              <img src="/full logo.png" alt="RMC" className="w-6 h-6" />
              <span className="text-slate-300 text-sm font-medium">Ramanujan Maths Club</span>
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-500/40 rounded-2xl overflow-hidden">
            <div className="bg-red-500/20 px-6 py-5 text-center border-b border-red-500/30">
              <div className="text-5xl mb-2">❌</div>
              <h1 className="text-2xl font-bold text-red-400">Not Verified</h1>
              <p className="text-red-300/80 text-sm mt-1">{data.error}</p>
            </div>

            <div className="p-6 text-center">
              <p className="text-slate-400 text-sm">
                Certificate ID: <span className="font-mono text-slate-300">{certId}</span>
              </p>
              <p className="text-slate-500 text-xs mt-3">
                If you believe this is an error, please contact RMC at{' '}
                <a href="mailto:mathsclub.cbit@gmail.com" className="text-teal-400 hover:underline">
                  mathsclub.cbit@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── VERIFIED ✅ ──────────────────────────────────────────────
  const cert = data.certificate!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-slate-800/80 rounded-full px-4 py-2 mb-4">
            <img src="/full logo.png" alt="RMC" className="w-6 h-6" />
            <span className="text-slate-300 text-sm font-medium">Ramanujan Maths Club</span>
          </div>
        </div>

        {/* Verified Card */}
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Green Verified Banner */}
          <div className="bg-gradient-to-r from-emerald-600/30 to-teal-600/30 px-6 py-5 text-center border-b border-emerald-500/30">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-3">
              <svg
                className="w-9 h-9 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-emerald-400">Verified Certificate</h1>
            <p className="text-emerald-300/70 text-sm mt-1">
              This certificate is authentic and issued by RMC, CBIT
            </p>
          </div>

          {/* Certificate Details */}
          <div className="p-6 space-y-4">
            <InfoRow label="Certificate ID" value={cert.certificateId} mono />
            <InfoRow label="Participant Name" value={cert.participantName} highlight />
            <InfoRow label="Event / Program" value={cert.eventName} />
            <InfoRow label="Date Issued" value={formatDate(cert.dateIssued)} />
            <InfoRow label="Issued By" value={cert.issuedBy} />

            {/* Dynamic Extra Fields */}
            {Object.entries(cert.extraFields).map(([key, value]) => (
              <InfoRow key={key} label={formatLabel(key)} value={value} />
            ))}
          </div>

          {/* Footer */}
          <div className="bg-slate-900/50 px-6 py-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-xs">
                Issued by Ramanujan Maths Club (RMC)
                <br />
                CBIT, Hyderabad
              </p>
              <a
                href={`/api/certificates/${cert.certificateId}/download`}
                className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </a>
            </div>
          </div>
        </div>

        {/* Verification Badge */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-xs">
            Verified on {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────

function InfoRow({
  label,
  value,
  highlight = false,
  mono = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-slate-400 text-sm shrink-0">{label}</span>
      <span
        className={`text-right text-sm ${
          highlight
            ? 'text-white font-semibold text-base'
            : mono
            ? 'text-teal-400 font-mono text-xs'
            : 'text-slate-200'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatLabel(key: string): string {
  // Convert camelCase or snake_case to Title Case
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

