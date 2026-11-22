"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Award,
  QrCode,
  ExternalLink,
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileSpreadsheet,
  Search,
  Sparkles,
  UploadCloud,
  Layers,
  Check,
  Folder,
  Database,
  Sliders,
  Key,
  ShieldCheck,
} from "lucide-react";

// 10 Curated Colors for QR code & border
const QR_COLORS = [
  { name: "RMC Teal", hex: "#0D9488" },
  { name: "Navy Blue", hex: "#1E3A8A" },
  { name: "Royal Blue", hex: "#2563EB" },
  { name: "Classic Black", hex: "#000000" },
  { name: "Slate Gray", hex: "#334155" },
  { name: "Emerald Green", hex: "#047857" },
  { name: "Crimson Red", hex: "#991B1B" },
  { name: "Golden Bronze", hex: "#B45309" },
  { name: "Royal Purple", hex: "#581C87" },
  { name: "Rose / Pink", hex: "#BE185D" },
];

const QR_SIZES = [
  { id: "200", label: "Compact (200px)" },
  { id: "240", label: "Medium (240px)" },
  { id: "280", label: "Standard (280px) [Recommended]" },
  { id: "320", label: "Large (320px)" },
  { id: "360", label: "Extra Large (360px)" },
];

export default function AdminCertificatesClient({
  isDevPreview,
  defaultCertSheetId = "1RAoU3gcyjm-pmIVveZ5MPWLXxmB-7G2Es_TzKsJkCR4",
}) {
  const [activeTab, setActiveTab] = useState("sheet"); // "sheet" | "generate" | "verify"
  const [oauthStatus, setOauthStatus] = useState(null); // null | "success" | "error:..."

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("oauth") === "success") {
        setOauthStatus("success");
      } else if (params.get("oauth_error")) {
        setOauthStatus(`error:${params.get("oauth_error")}`);
      }
    }
  }, []);

  // ─────────────────────────────────────────────────────────────
  // TAB: BATCH SPREADSHEET GENERATION STATE
  // ─────────────────────────────────────────────────────────────
  const [sheetInput, setSheetInput] = useState(defaultCertSheetId);
  const [targetSheetInput, setTargetSheetInput] = useState("");
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);
  const [sheetError, setSheetError] = useState("");
  const [sheetData, setSheetData] = useState(null); // { availableTabs, activeTab, headers, sampleRows, totalRows }
  const [selectedTab, setSelectedTab] = useState("Sheet1");
  const [csvDataRows, setCsvDataRows] = useState(null); // Holds all parsed CSV participant rows

  // Column Mappings
  const [nameCol, setNameCol] = useState("");
  const [rollCol, setRollCol] = useState("");
  const [collegeCol, setCollegeCol] = useState("");
  const [emailCol, setEmailCol] = useState("");
  const [defaultCollege, setDefaultCollege] = useState("CBIT (A)");
  const [bulkEventName, setBulkEventName] = useState("Maths Premier League (MPL)");
  const [bulkEventDates, setBulkEventDates] = useState("25 September to 27 September 2026");

  // Typography & QR Styling
  const [fontStyle, setFontStyle] = useState("garet"); // "garet" | "playfair" | "cinzel" | "script" | "montserrat" | "georgia"
  const [canvaFontSize, setCanvaFontSize] = useState("22");
  const [qrColor, setQrColor] = useState("#0D9488");
  const [qrBorderColor, setQrBorderColor] = useState("#0D9488"); // hex or "none"
  const [qrSize, setQrSize] = useState("280"); // "200" | "240" | "280" | "320" | "360"

  // Bulk Generation Progress & Results
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkError, setBulkError] = useState("");
  const [isZipping, setIsZipping] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // TAB: SINGLE TEST GENERATION STATE
  // ─────────────────────────────────────────────────────────────
  const [templateId, setTemplateId] = useState("mpl-participation");
  const [participantName, setParticipantName] = useState("Adithya Vardhan Vemula");
  const [rollNo, setRollNo] = useState("160122733001");
  const [email, setEmail] = useState("adithya@example.com");
  const [eventName, setEventName] = useState("Maths Premier League (MPL)");
  const [college, setCollege] = useState("CBIT (A)");
  const [eventDates, setEventDates] = useState("25 September to 27 September 2026");

  const [isGenerating, setIsGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [genError, setGenError] = useState("");

  // ─────────────────────────────────────────────────────────────
  // TAB: VERIFY CHECKER STATE
  // ─────────────────────────────────────────────────────────────
  const [testCertId, setTestCertId] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifyError, setVerifyError] = useState("");

  // ─────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────

  // Fetch Google Sheet Details & Preview
  const handleFetchSheet = async (tabOverride) => {
    setIsFetchingSheet(true);
    setSheetError("");
    setBulkResults(null);
    setCsvDataRows(null);

    try {
      const res = await fetch("/api/certificates/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetIdOrUrl: sheetInput.trim(),
          tabName: tabOverride || selectedTab,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to load Google Sheet.");
      }

      setSheetData(data);
      setSelectedTab(data.activeTab);

      // Auto-assign suggestions
      if (data.suggestions) {
        if (data.suggestions.nameColumn) setNameCol(data.suggestions.nameColumn);
        if (data.suggestions.rollNoColumn) setRollCol(data.suggestions.rollNoColumn);
        if (data.suggestions.collegeColumn) setCollegeCol(data.suggestions.collegeColumn);
        if (data.suggestions.emailColumn) setEmailCol(data.suggestions.emailColumn);
      }
    } catch (err) {
      setSheetError(err.message || "Failed to load Google Sheet");
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Automatically write sample rows to Google Sheet if tab is empty
  const handleAutoSeed = async () => {
    setIsFetchingSheet(true);
    setSheetError("");
    try {
      const res = await fetch("/api/certificates/sheets/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetIdOrUrl: sheetInput.trim(),
          tabName: selectedTab,
        }),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || "Failed to seed sample participant rows");
      await handleFetchSheet(selectedTab);
    } catch (err) {
      setSheetError(err.message || "Failed to write rows automatically");
      setIsFetchingSheet(false);
    }
  };

  // Run Bulk Certificate Generation
  const handleRunBulk = async () => {
    if (!nameCol) {
      alert("Please select which column contains the Participant Name.");
      return;
    }

    setIsBulkGenerating(true);
    setBulkError("");
    setBulkResults(null);

    try {
      const isCsv = sheetData?.spreadsheetId === "Uploaded CSV" || (csvDataRows && csvDataRows.length > 0);
      const payload = {
        templateId: "mpl-participation",
        sheetIdOrUrl: isCsv ? undefined : sheetInput.trim(),
        targetSheetIdOrUrl: targetSheetInput.trim() || undefined,
        tabName: isCsv ? undefined : selectedTab,
        nameColumn: nameCol,
        rollNoColumn: rollCol,
        collegeColumn: collegeCol,
        emailColumn: emailCol,
        defaultCollege: defaultCollege.trim(),
        eventName: bulkEventName.trim(),
        eventDates: bulkEventDates.trim(),
        fontStyle,
        canvaFontSize,
        qrColor,
        qrBorderColor,
        qrBorderWidth: "4",
        qrSize,
        issuedBy: "Ramanujan Maths Club, CBIT",
        directParticipants: isCsv ? csvDataRows : undefined,
      };

      const res = await fetch("/api/certificates/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Bulk generation failed.");
      }

      setBulkResults(data);
    } catch (err) {
      setBulkError(err.message || "Bulk generation failed.");
    } finally {
      setIsBulkGenerating(false);
    }
  };

  // Download All Generated Certificates as a single ZIP
  const handleDownloadAllZip = async () => {
    if (!bulkResults?.results?.length) return;
    const certIds = bulkResults.results
      .filter((r) => r.status === "success" && r.certificateId)
      .map((r) => r.certificateId);

    if (certIds.length === 0) {
      alert("No successful certificates available to download.");
      return;
    }

    setIsZipping(true);
    try {
      const res = await fetch("/api/certificates/bulk-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certIds,
          zipName: `${bulkEventName.replace(/[^a-zA-Z0-9_-]/g, "_") || "MPL"}_Certificates_Batch.zip`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate ZIP archive on server.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${bulkEventName.replace(/[^a-zA-Z0-9_-]/g, "_") || "MPL"}_Certificates_Batch.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Error downloading ZIP: " + err.message);
    } finally {
      setIsZipping(false);
    }
  };

  // Handle Single Certificate Generation
  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenError("");
    setGenResult(null);

    try {
      const extraMap = {
        college: college.trim(),
        rollNo: rollNo.trim(),
        eventDates: eventDates.trim(),
      };

      const payload = {
        templateId,
        participantName: participantName.trim(),
        rollNo: rollNo.trim(),
        email: email.trim(),
        eventName: eventName.trim(),
        fontStyle,
        canvaFontSize,
        qrSize,
        qrColor,
        qrBorderColor,
        extraFields: {
          ...extraMap,
          fontStyle,
          canvaFontSize,
          qrSize,
          qrColor,
          qrBorderColor,
        },
        issuedBy: "Ramanujan Maths Club, CBIT",
      };

      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to generate certificate");
      }

      setGenResult(data);
      setTestCertId(data.certificateId);
    } catch (err) {
      setGenError(err.message || "Failed to generate certificate");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle CSV file upload directly from computer
  // Handle CSV file upload
  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) return;
        const lines = text.split(/\r\n|\n/).filter(Boolean);
        if (lines.length < 2) return;

        // Robust CSV line parser handling commas inside quotes
        const parseCsvLine = (line) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              result.push(current.trim().replace(/^"|"$/g, ""));
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^"|"$/g, ""));
          return result;
        };

        const headers = parseCsvLine(lines[0]);

        // Parse ALL rows for bulk generation
        const allRows = lines
          .slice(1)
          .map((line) => {
            const vals = parseCsvLine(line);
            const rowObj = {};
            headers.forEach((h, i) => {
              rowObj[h] = vals[i] || "";
            });
            return rowObj;
          })
          .filter((r) => Object.values(r).some((v) => Boolean(v && v.trim())));

        const sampleRows = allRows.slice(0, 15);

        setCsvDataRows(allRows);

        setSheetData({
          spreadsheetId: "Uploaded CSV",
          availableTabs: ["CSV File"],
          activeTab: "CSV File",
          headers,
          sampleRows,
          totalRows: allRows.length,
        });

        const nameGuess = headers.find((h) => /name/i.test(h)) || headers[0];
        setNameCol(nameGuess);
        const rollGuess = headers.find((h) => /roll|id|hall/i.test(h)) || "";
        setRollCol(rollGuess);
        const colGuess = headers.find((h) => /college|dept/i.test(h)) || "";
        setCollegeCol(colGuess);
        const emailGuess = headers.find((h) => /email|mail/i.test(h)) || "";
        setEmailCol(emailGuess);
      } catch (err) {
        alert("Failed to parse CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dev Mode Banner */}
      {isDevPreview && (
        <div className="mb-6 p-4 rounded-2xl border border-teal-500/30 bg-teal-500/10 flex items-center justify-between text-teal-300 text-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <span>
              <strong>Local Development Mode:</strong> Direct testing mode active.
            </span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-3 py-1 text-xs font-mono text-teal-400 mb-2">
            <Award className="w-3.5 h-3.5" />
            RMC Certificates Engine
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Certificates & Verification
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Generate certificates in bulk from your spreadsheet with custom RMC verification QR codes.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab("sheet")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "sheet"
                ? "bg-teal-500 text-black shadow-lg"
                : "text-white/70 hover:text-white"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Spreadsheet Batch (All)
          </button>
          <button
            onClick={() => setActiveTab("generate")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "generate"
                ? "bg-teal-500 text-black shadow-lg"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Award className="w-4 h-4" />
            Single Preview & Test
          </button>
          <button
            onClick={() => setActiveTab("verify")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "verify"
                ? "bg-teal-500 text-black shadow-lg"
                : "text-white/70 hover:text-white"
            }`}
          >
            <QrCode className="w-4 h-4" />
            Verify Checker
          </button>
        </div>
      </div>

      {/* OAuth Banner if redirected back */}
      {oauthStatus === "success" && (
        <div className="mb-6 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white block">Google Drive OAuth Connected Successfully!</span>
              <span className="text-white/60">Your personal 15 GB storage quota is now active for certificate image uploads.</span>
            </div>
          </div>
          <button
            onClick={() => setOauthStatus(null)}
            className="text-white/40 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {oauthStatus && oauthStatus.startsWith("error:") && (
        <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="font-semibold text-white block">OAuth Authorization Failed</span>
              <span className="text-white/60">{oauthStatus.replace("error:", "")}</span>
            </div>
          </div>
          <button
            onClick={() => setOauthStatus(null)}
            className="text-white/40 hover:text-white text-xs px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Cloud Storage & Database Info Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
              <Folder className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <span className="text-white/50 block font-mono uppercase">Google Drive Upload Destination</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-semibold text-white">Events / Certificates</span>
                <a
                  href="https://drive.google.com/drive/folders/1W-6plG-Bes3vjeDeIaWwoEKMYO8OYPeP"
                  target="_blank"
                  className="text-blue-400 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Open Drive Folder <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <span className="text-white/40 block text-[11px] mt-0.5 font-mono">
                Files saved as: <code className="text-teal-400">Name_RollNo.png</code>
              </span>
            </div>
          </div>

          <a
            href="/api/certificates/auth/login"
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-xs font-semibold border border-blue-500/30 transition-all shadow-sm"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Connect Drive OAuth</span>
          </a>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Database className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="text-white/50 block font-mono uppercase">Database Records Storage</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-semibold text-white">Tab: "Certificates"</span>
              <a
                href={`https://docs.google.com/spreadsheets/d/${defaultCertSheetId}/edit`}
                target="_blank"
                className="text-emerald-400 hover:underline inline-flex items-center gap-0.5 ml-1"
              >
                Open Sheet <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <span className="text-white/40 block text-[11px] mt-0.5">
              Every certificate ID, status, and verify count auto-logged
            </span>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: SPREADSHEET BATCH GENERATION                           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "sheet" && (
        <div className="space-y-8">
          {/* Top Panel: Connect Sheet */}
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl">
            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-teal-400" />
              1. Connect Participant Source Spreadsheet
            </h2>
            <p className="text-sm text-white/50 mb-6">
              Paste the Google Sheet link containing your participants, or upload a CSV file directly.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Google Sheet Link or Sheet ID (Defaults to dedicated certificates sheet)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sheetInput}
                    onChange={(e) => setSheetInput(e.target.value)}
                    placeholder={`https://docs.google.com/spreadsheets/d/${defaultCertSheetId}/edit or ID`}
                    className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-mono text-xs"
                  />
                  <button
                    onClick={() => handleFetchSheet()}
                    disabled={isFetchingSheet}
                    className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm transition flex items-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {isFetchingSheet ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Fetch Sheet
                  </button>
                </div>
              </div>

              {/* OR Upload CSV */}
              <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 flex flex-col justify-center">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  OR Upload CSV directly
                </label>
                <label className="cursor-pointer border border-dashed border-white/20 hover:border-teal-400/50 bg-white/[0.02] hover:bg-teal-500/5 rounded-xl px-4 py-2.5 text-xs text-white/70 flex items-center justify-center gap-2 transition">
                  <UploadCloud className="w-4 h-4 text-teal-400" />
                  <span>Choose .csv file</span>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {sheetError && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{sheetError}</span>
              </div>
            )}

            {sheetData && sheetData.totalRows === 0 && (
              <div className="mt-4 p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <span className="font-bold text-white text-sm block">Tab "{selectedTab}" has 0 participant rows!</span>
                    <p className="text-white/70">
                      You connected <code className="text-teal-300">{sheetInput}</code>, but tab <strong>"{selectedTab}"</strong> has no participant data rows.
                    </p>
                    <div className="pt-1 text-white/80 space-y-1">
                      <div>• Click the button on the right to <strong>auto-write 5 sample participants</strong> into this sheet!</div>
                      <div>• Or switch the tab above to <strong>Certificates</strong> if your participants are there.</div>
                      <div>• Or click <strong>"Choose .csv file"</strong> above to upload your participant CSV directly.</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAutoSeed}
                  disabled={isFetchingSheet}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shrink-0 flex items-center justify-center gap-1.5 transition shadow-lg disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>✨ Write Sample Rows Automatically</span>
                </button>
              </div>
            )}
          </div>

          {/* Middle Panel: Configure Columns & Preview Rows */}
          {sheetData && (
            <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-teal-400" />
                    2. Map Columns & Style Settings
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">
                    Found {sheetData.totalRows} participant rows. Configure columns and certificate styling.
                  </p>
                </div>

                {/* Tab selector if multiple tabs exist */}
                {sheetData.availableTabs && sheetData.availableTabs.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/50">Sheet Tab:</span>
                    <select
                      value={selectedTab}
                      onChange={(e) => {
                        setSelectedTab(e.target.value);
                        handleFetchSheet(e.target.value);
                      }}
                      className="bg-black/60 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                    >
                      {sheetData.availableTabs.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Column Mapping Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5">
                    Participant Name Column *
                  </label>
                  <select
                    value={nameCol}
                    onChange={(e) => setNameCol(e.target.value)}
                    className="w-full bg-black/60 border border-teal-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {sheetData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5">
                    Roll No Column (For File Naming)
                  </label>
                  <select
                    value={rollCol}
                    onChange={(e) => setRollCol(e.target.value)}
                    className="w-full bg-black/60 border border-teal-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- None (use Cert ID) --</option>
                    {sheetData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    College Column
                  </label>
                  <select
                    value={collegeCol}
                    onChange={(e) => setCollegeCol(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- Use Default ({defaultCollege}) --</option>
                    {sheetData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Email Column
                  </label>
                  <select
                    value={emailCol}
                    onChange={(e) => setEmailCol(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="">-- None / Skip --</option>
                    {sheetData.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Event Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Event Name on Certificate
                  </label>
                  <input
                    type="text"
                    value={bulkEventName}
                    onChange={(e) => setBulkEventName(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Event Dates
                  </label>
                  <input
                    type="text"
                    value={bulkEventDates}
                    onChange={(e) => setBulkEventDates(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Default College (if column empty)
                  </label>
                  <input
                    type="text"
                    value={defaultCollege}
                    onChange={(e) => setDefaultCollege(e.target.value)}
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Typography & QR Styling Controls */}
              <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5">
                    Font Family
                  </label>
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                    className="w-full bg-black/60 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="garet">Garet (Canva Match) ★</option>
                    <option value="playfair">Playfair Display (Luxury Serif)</option>
                    <option value="cinzel">Cinzel (Roman Inscribed)</option>
                    <option value="script">Great Vibes (Calligraphy Script)</option>
                    <option value="montserrat">Montserrat (Modern Clean)</option>
                    <option value="georgia">Georgia (Academic Serif)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Canva Font Size
                  </label>
                  <input
                    type="number"
                    value={canvaFontSize}
                    onChange={(e) => setCanvaFontSize(e.target.value)}
                    placeholder="22"
                    min="14"
                    max="36"
                    className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5">
                    QR Scanner Size
                  </label>
                  <select
                    value={qrSize}
                    onChange={(e) => setQrSize(e.target.value)}
                    className="w-full bg-black/60 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {QR_SIZES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: qrColor }}
                    />
                    QR Code Color (10 Curated)
                  </label>
                  <select
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-full bg-black/60 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    {QR_COLORS.map((c) => (
                      <option key={c.hex} value={c.hex}>
                        {c.name} ({c.hex})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: qrBorderColor === "none" ? "transparent" : qrBorderColor }}
                    />
                    QR Border Color
                  </label>
                  <select
                    value={qrBorderColor}
                    onChange={(e) => setQrBorderColor(e.target.value)}
                    className="w-full bg-black/60 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value={qrColor}>Same as QR Color ({qrColor})</option>
                    <option value="none">No Border</option>
                    {QR_COLORS.map((c) => (
                      <option key={c.hex} value={c.hex}>
                        {c.name} ({c.hex})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Destination Sheet Setting (Where to save Certificates) */}
              <div className="pt-4 border-t border-white/5">
                <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5 flex items-center justify-between">
                  <span>Destination Google Sheet ID / Link</span>
                  <span className="text-[10px] text-white/40 lowercase font-normal">
                    (defaults to dedicated certificates sheet)
                  </span>
                </label>
                <input
                  type="text"
                  value={targetSheetInput}
                  onChange={(e) => setTargetSheetInput(e.target.value)}
                  placeholder="Defaults to GOOGLE_CERTIFICATES_SHEET_ID (Certificates tab)"
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              {/* Data Rows Preview Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-white/40">
                    Live Data Preview (Showing first {sheetData.sampleRows.length} rows)
                  </h4>
                  <span className="text-[11px] text-teal-400 font-mono">
                    Total: {sheetData.totalRows} participants
                  </span>
                </div>
                <div className="overflow-x-auto rounded-xl border border-white/10 max-h-60 overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-white/10 text-white/70 font-mono sticky top-0">
                      <tr>
                        <th className="p-2.5">#</th>
                        {sheetData.headers.slice(0, 7).map((h) => (
                          <th key={h} className="p-2.5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 bg-black/30">
                      {sheetData.sampleRows.map((r, i) => (
                        <tr key={i} className="hover:bg-white/5">
                          <td className="p-2.5 text-white/30">{i + 1}</td>
                          {sheetData.headers.slice(0, 7).map((h) => (
                            <td key={h} className="p-2.5 text-white/80 font-mono truncate max-w-[180px]">
                              {r[h] || "-"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Button: Batch Generate All */}
              <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-white/50">
                  Clicking generate will render certificates for all {sheetData.totalRows} people as{" "}
                  <code className="text-teal-400 font-mono">Name_RollNo.png</code>, attach unique QR codes, and record them in the Certificates sheet.
                </div>
                <button
                  onClick={handleRunBulk}
                  disabled={isBulkGenerating || !nameCol || !sheetData?.totalRows}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {isBulkGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating {sheetData.totalRows} Certificates...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      ⚡ Generate All {sheetData.totalRows} Certificates
                    </>
                  )}
                </button>
              </div>

              {bulkError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}
            </div>
          )}

          {/* Results Table (After Bulk Generation Finishes) */}
          {bulkResults && (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-400">
                      Batch Generation Complete!
                    </h3>
                    <p className="text-xs text-emerald-200/70">
                      Successfully processed {bulkResults.successCount} of {bulkResults.totalProcessed} certificates.
                    </p>
                  </div>
                </div>

                {/* 1-Click Download All as ZIP */}
                <button
                  onClick={handleDownloadAllZip}
                  disabled={isZipping || bulkResults.successCount === 0}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-black font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  {isZipping ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Bundling All {bulkResults.successCount} into ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      📦 Download All as ZIP ({bulkResults.successCount} PNGs)
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-white/10 max-h-96 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-white/10 text-white/70 font-mono sticky top-0">
                    <tr>
                      <th className="p-2.5">Participant</th>
                      <th className="p-2.5">File Name (Name_RollNo)</th>
                      <th className="p-2.5">Verify Link</th>
                      <th className="p-2.5 text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 bg-black/30 font-mono">
                    {bulkResults.results.map((r, i) => (
                      <tr key={i} className="hover:bg-white/5">
                        <td className="p-2.5 text-white font-semibold">{r.name}</td>
                        <td className="p-2.5 text-teal-400 font-mono text-[11px]">{r.fileName}</td>
                        <td className="p-2.5">
                          <Link
                            href={r.verificationUrl}
                            target="_blank"
                            className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            Open Page <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                        <td className="p-2.5 text-right">
                          <a
                            href={r.downloadUrl}
                            download
                            className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
                          >
                            <Download className="w-3 h-3" /> PNG
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: SINGLE PREVIEW & TEST                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-6 bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-white/90">
              <Award className="w-5 h-5 text-teal-400" />
              Single Certificate Preview
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Template
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                >
                  <option value="mpl-participation">MPL - Certificate of Participation (mpl-participation)</option>
                </select>
              </div>

              {/* Typography & Canva Font Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5">
                    Typography / Font Style
                  </label>
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value)}
                    className="w-full bg-black/50 border border-teal-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value="garet">Garet (Official Canva Font) ★ Exact Match</option>
                    <option value="playfair">Playfair Display (Luxury Editorial Serif)</option>
                    <option value="cinzel">Cinzel (Classical Roman Inscribed)</option>
                    <option value="script">Great Vibes (Calligraphic Script Name)</option>
                    <option value="montserrat">Montserrat (Modern Clean Sans-Serif)</option>
                    <option value="georgia">Georgia (Classic Academic Serif)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Canva Font Size
                  </label>
                  <input
                    type="number"
                    value={canvaFontSize}
                    onChange={(e) => setCanvaFontSize(e.target.value)}
                    placeholder="22"
                    min="14"
                    max="36"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              {/* QR Scanner Size, QR Color & QR Border Color Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5">
                    QR Scanner Size
                  </label>
                  <select
                    value={qrSize}
                    onChange={(e) => setQrSize(e.target.value)}
                    className="w-full bg-black/50 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    {QR_SIZES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: qrColor }}
                    />
                    QR Code Color (10 Curated)
                  </label>
                  <select
                    value={qrColor}
                    onChange={(e) => setQrColor(e.target.value)}
                    className="w-full bg-black/50 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    {QR_COLORS.map((c) => (
                      <option key={c.hex} value={c.hex}>
                        {c.name} ({c.hex})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5 flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/30"
                      style={{ backgroundColor: qrBorderColor === "none" ? "transparent" : qrBorderColor }}
                    />
                    QR Border Color
                  </label>
                  <select
                    value={qrBorderColor}
                    onChange={(e) => setQrBorderColor(e.target.value)}
                    className="w-full bg-black/50 border border-teal-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-400"
                  >
                    <option value={qrColor}>Same as QR Color ({qrColor})</option>
                    <option value="none">No Border</option>
                    {QR_COLORS.map((c) => (
                      <option key={c.hex} value={c.hex}>
                        {c.name} ({c.hex})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Participant Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="e.g. Adithya Vardhan"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-teal-300 mb-1.5">
                    Roll Number (For File Naming: Name_RollNo)
                  </label>
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    placeholder="160122733001"
                    className="w-full bg-black/50 border border-teal-500/30 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    College / Institution
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="CBIT (A)"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Event Name
                  </label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Maths Premier League (MPL)"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@cbit.ac.in"
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-white/50 mb-1.5">
                  Event Dates / Held On
                </label>
                <input
                  type="text"
                  value={eventDates}
                  onChange={(e) => setEventDates(e.target.value)}
                  placeholder="25 September to 27 September 2026"
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              {genError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{genError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-black font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-teal-500/20 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Certificate & Styled QR...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Live Preview
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Output & Verification Hub */}
          <div className="lg:col-span-6 space-y-6">
            {genResult ? (
              <div className="bg-white/[0.03] border border-teal-500/30 rounded-3xl p-6 backdrop-blur-xl space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Certificate Ready!
                  </div>
                  <span className="font-mono text-xs text-teal-300 bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
                    {genResult.certificateId}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Link
                    href={`/verify/${genResult.certificateId}`}
                    target="_blank"
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition shadow-lg shadow-emerald-500/20"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Verify Webpage
                  </Link>

                  <a
                    href={`/api/certificates/${genResult.certificateId}/download`}
                    download
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/15 transition"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </a>
                </div>

                {/* Live Certificate Image Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-white/50">
                      Live Certificate Preview
                    </h3>
                    <span className="text-[11px] text-teal-400 font-mono">
                      File: {participantName.replace(/\s+/g, "_")}_{rollNo || "cert"}.png
                    </span>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-2xl relative aspect-[2000/1414]">
                    <img
                      src={`/api/certificates/${genResult.certificateId}/download?t=${Date.now()}`}
                      alt="Certificate Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[420px] rounded-3xl border border-dashed border-white/15 bg-white/[0.01] p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white/80">Ready to Generate</h3>
                <p className="text-sm text-white/40 max-w-sm mt-1">
                  Fill in participant details and click "Generate Live Preview" to test typography, QR colors, and bordered box styling.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 3: VERIFY CHECKER                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "verify" && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-teal-400" />
              Check Any Certificate Authenticity
            </h2>
            <p className="text-xs text-white/50 mb-6">
              Enter any Certificate ID (e.g. CERT-20261118-XXXX) to test the backend verification lookup.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!testCertId.trim()) return;
                setIsVerifying(true);
                setVerifyError("");
                setVerifyResult(null);
                try {
                  const res = await fetch(`/api/certificates/verify/${testCertId.trim()}`);
                  const data = await res.json();
                  if (!res.ok || !data.verified) {
                    setVerifyError(data.error || "Certificate could not be verified");
                  }
                  setVerifyResult(data);
                } catch (err) {
                  setVerifyError(err.message || "Network error verifying certificate");
                } finally {
                  setIsVerifying(false);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                required
                value={testCertId}
                onChange={(e) => setTestCertId(e.target.value)}
                placeholder="CERT-20261118-XXXX"
                className="flex-1 bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-teal-400"
              />
              <button
                type="submit"
                disabled={isVerifying}
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-black font-bold text-sm transition flex items-center gap-2"
              >
                {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Verify
              </button>
            </form>

            {verifyError && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifyResult && verifyResult.verified && (
              <div className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                    Verified Genuine Certificate
                  </div>
                  <Link
                    href={`/verify/${verifyResult.certificate.certificateId}`}
                    target="_blank"
                    className="text-xs font-mono text-teal-400 hover:underline flex items-center gap-1"
                  >
                    View Public Page <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-white/40 block">Recipient</span>
                    <span className="text-white font-semibold text-sm">
                      {verifyResult.certificate.participantName}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Event</span>
                    <span className="text-white font-semibold text-sm">
                      {verifyResult.certificate.eventName}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Status</span>
                    <span className="text-emerald-400 font-mono font-bold">
                      {verifyResult.certificate.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Date Issued</span>
                    <span className="text-white/80">
                      {new Date(verifyResult.certificate.dateIssued).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
