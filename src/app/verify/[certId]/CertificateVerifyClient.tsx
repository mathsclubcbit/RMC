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
              <InfoRow label="Roll Number" value={data.certificate.rollNumber || 'Not available'} />
              <InfoRow label="Date Issued" value={formatDate(data.certificate.dateIssued)} />
              <InfoRow label="Issued By" value={data.certificate.issuedBy} />
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
    <main className="min-h-screen bg-[#07111f] text-white flex items-center justify-center px-4 py-10 sm:py-16 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_35%)]" />
      <div className="relative w-full max-w-xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 shadow-xl backdrop-blur-xl">
            <img src="/full logo.png" alt="RMC" className="w-8 h-8 rounded-lg" />
            <span className="text-slate-200 text-sm font-semibold tracking-wide">Ramanujan Maths Club</span>
          </div>
        </div>

        <section className="bg-slate-900/75 border border-emerald-400/20 rounded-3xl overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent px-6 py-8 sm:px-10 text-center border-b border-emerald-400/15">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-400/15 border border-emerald-300/25 rounded-2xl mb-4 rotate-3">
              <svg
                className="w-9 h-9 text-emerald-300 -rotate-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-emerald-300 text-xs font-bold uppercase tracking-[0.24em] mb-2">Authenticity confirmed</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Verified Certificate</h1>
            <p className="text-slate-300 text-sm mt-3">This certificate is authentic and issued by RMC, CBIT.</p>
          </div>

          <div className="p-6 sm:p-8 space-y-3">
            <DetailCard label="Participant Name" value={cert.participantName} prominent />
            <DetailCard label="Event / Program" value={cert.eventName} />
            <DetailCard label="Issued By" value={cert.issuedBy} />
            <DetailCard label="Roll Number" value={cert.rollNumber || 'Not available'} mono />
          </div>

          <div className="bg-black/20 px-6 sm:px-8 py-5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-slate-500 text-[11px] uppercase tracking-wider">Certificate ID</p>
                <p className="text-teal-300 font-mono text-xs mt-1 break-all">{cert.certificateId}</p>
              </div>
              <a
                href={`/api/certificates/${cert.certificateId}/download`}
                className="inline-flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-teal-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </a>
            </div>
          </div>
        </section>

        {/* Verification Badge */}
        <div className="text-center mt-6">
          <p className="text-slate-500 text-xs">
            Verified on {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>
    </main>
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

function DetailCard({
  label,
  value,
  prominent = false,
  mono = false,
}: {
  label: string;
  value: string;
  prominent?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4 sm:px-5 sm:py-5">
      <p className="text-slate-400 text-xs font-semibold uppercase tracking-[0.16em]">{label}</p>
      <p className={`mt-2 break-words ${prominent ? 'text-white text-lg sm:text-xl font-bold' : mono ? 'text-teal-300 font-mono text-base' : 'text-slate-100 text-base font-medium'}`}>
        {value}
      </p>
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


