"use client";

import { useEffect, useState } from "react";

type ErrorWithDigest = Error & { digest?: string };

export default function GlobalError({
  error,
  reset,
}: {
  error: ErrorWithDigest;
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    console.error("[AmazeCC global app error]", error);
    setTimestamp(new Date().toISOString());
  }, [error]);

  const copyReport = async () => {
    const report = {
      message: error?.message || "Unknown global exception",
      stack: error?.stack || "No stack trace",
      digest: error?.digest || "none",
      timestamp,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 midnight:bg-black text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
        <main className="w-full max-w-2xl bg-white/60 dark:bg-slate-900/60 midnight:bg-white/[0.03] backdrop-blur-2xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">AmazeCC Critical Error Inspector</p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">A critical app error occurred</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              The app shell failed to render. Copy the report below and send it to development support for root-cause analysis.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={reset}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md cursor-pointer"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-white/80 dark:bg-slate-800/80 midnight:bg-white/[0.06] hover:bg-white dark:hover:bg-slate-700 midnight:hover:bg-white/[0.10] text-gray-700 dark:text-gray-200 midnight:text-gray-100 border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 transition-colors cursor-pointer"
            >
              Reload page
            </button>
            <button
              onClick={copyReport}
              className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 hover:bg-gray-100 dark:hover:bg-slate-800 midnight:hover:bg-white/[0.06] text-gray-700 dark:text-gray-200 midnight:text-gray-100 transition-colors cursor-pointer"
            >
              {copied ? "Copied!" : "Copy report"}
            </button>
          </div>

          <div className="border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 rounded-xl p-5 bg-white/40 dark:bg-slate-950/40 midnight:bg-black/40 backdrop-blur-md space-y-3 text-sm">
            <div>
              <span className="font-semibold text-gray-500 dark:text-gray-400">Message:</span>{" "}
              <span className="font-mono text-xs break-all">{error?.message || "Unknown global exception"}</span>
            </div>
            {error?.digest && (
              <div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">Digest:</span>{" "}
                <span className="font-mono text-xs">{error.digest}</span>
              </div>
            )}
            {timestamp && (
              <div>
                <span className="font-semibold text-gray-500 dark:text-gray-400">Timestamp:</span>{" "}
                <span className="font-mono text-xs">{timestamp}</span>
              </div>
            )}
          </div>

          {error?.stack && (
            <div className="space-y-2">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stack Trace</h2>
              <pre className="max-h-60 overflow-auto whitespace-pre-wrap rounded-xl border border-gray-200/50 dark:border-gray-700/50 midnight:border-white/10 bg-gray-50 dark:bg-black midnight:bg-black/80 p-4 text-[11px] font-mono leading-relaxed text-red-600 dark:text-red-400">
                {error.stack}
              </pre>
            </div>
          )}
        </main>
      </body>
    </html>
  );
}
