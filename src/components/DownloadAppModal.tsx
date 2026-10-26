import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Laptop,
  Globe,
  FileCode2,
  Database,
  CheckCircle2,
  Copy,
  ExternalLink,
  Share2,
  Sparkles,
} from 'lucide-react';
import { MockTestEntry } from '../types';
import { downloadWebsiteSnapshot, downloadJsonData } from '../utils/exportWebsite';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  tests: MockTestEntry[];
  activeFilter: string;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  tests,
  activeFilter,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'pwa' | 'html' | 'data' | 'source'>('pwa');
  const [copiedCode, setCopiedCode] = useState(false);
  const [hasDownloadedHtml, setHasDownloadedHtml] = useState(false);
  const [hasDownloadedJson, setHasDownloadedJson] = useState(false);

  if (!isOpen) return null;

  const handleCopyGitCommands = () => {
    const commands = `git clone <repository-url>
cd jee-mock-tracker
npm install
npm run dev`;
    navigator.clipboard.writeText(commands);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadHtml = () => {
    downloadWebsiteSnapshot(tests, activeFilter);
    setHasDownloadedHtml(true);
    setTimeout(() => setHasDownloadedHtml(false), 3000);
  };

  const handleDownloadJson = () => {
    downloadJsonData(tests);
    setHasDownloadedJson(true);
    setTimeout(() => setHasDownloadedJson(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Download & Install App
                {isInstalled && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Installed
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose how you want to use JEE Mock Progress Tracker
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-3 gap-2 overflow-x-auto bg-slate-50/30 dark:bg-slate-900/40">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'pwa'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Install as App (Desktop/Mobile)</span>
          </button>

          <button
            onClick={() => setActiveTab('html')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'html'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Offline HTML File</span>
          </button>

          <button
            onClick={() => setActiveTab('data')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'data'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Export Data (JSON)</span>
          </button>

          <button
            onClick={() => setActiveTab('source')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'source'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            <span>Source Code / Local</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* TAB 1: Progressive Web App (PWA) */}
          {activeTab === 'pwa' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Instant Native Experience</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Install to Windows, Mac, Android, or iPhone
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                    Opens in its own standalone window without browser address bars, works offline, and keeps your mock tests synced.
                  </p>
                </div>

                {isInstallable ? (
                  <button
                    onClick={install}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install Now</span>
                  </button>
                ) : isInstalled ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>App already installed!</span>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    Use browser steps below
                  </div>
                )}
              </div>

              {/* Step-by-step instructions per platform */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Desktop Chrome / Edge */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Laptop className="w-4 h-4 text-indigo-500" />
                    <span>Chrome / Edge</span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
                    <li>Look at the right side of the URL address bar.</li>
                    <li>Click the <strong>Install App</strong> icon (🖥️ or ⊕).</li>
                    <li>Or click <strong>Menu (⋮) → Save and share → Install app</strong>.</li>
                  </ol>
                </div>

                {/* Android Chrome */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Smartphone className="w-4 h-4 text-emerald-500" />
                    <span>Android</span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
                    <li>Tap the <strong>three dots menu (⋮)</strong> at top right.</li>
                    <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
                    <li>Launch anytime from your phone's app drawer!</li>
                  </ol>
                </div>

                {/* iOS Safari */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                    <Share2 className="w-4 h-4 text-sky-500" />
                    <span>iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal pl-4">
                    <li>Open this page in <strong>Safari</strong>.</li>
                    <li>Tap the <strong>Share</strong> button (box with arrow ↑).</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Offline HTML File */}
          {activeTab === 'html' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Standalone Single-File Web App (.html)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Downloads an all-in-one HTML document containing all {tests.length} tests currently logged, complete with the interactive trajectory chart, subject filters, and data tables.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Zero Setup
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">Why download this?</div>
                  <ul className="list-disc pl-4 space-y-1 text-slate-500 dark:text-slate-400">
                    <li>Double-click the file on any computer or phone to open it immediately.</li>
                    <li>Works 100% offline without Node.js, servers, or internet.</li>
                    <li>Share with parents, mentors, or archive permanently.</li>
                  </ul>
                </div>

                <button
                  onClick={handleDownloadHtml}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer"
                >
                  {hasDownloadedHtml ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Snapshot Downloaded Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download HTML Snapshot Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Data Backup (JSON) */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Mock Test Database Backup (.json)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Export your raw test records (questions, marks, accuracy, negative marks, exam dates, percentiles) so you can transfer them to another device or restore them anytime.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    onClick={handleDownloadJson}
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    {hasDownloadedJson ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span>JSON Downloaded!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Export All Data (.json)</span>
                      </>
                    )}
                  </button>

                  <label
                    htmlFor="json-import-input"
                    className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
                  >
                    <Database className="w-4 h-4" />
                    <span>Restore From JSON</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Source Code & Local Development */}
          {activeTab === 'source' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Run the Full-Stack App on Your Machine
                  </h3>
                  <button
                    onClick={handleCopyGitCommands}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {copiedCode ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Commands</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  You can run the React + Vite + Express app locally with Node.js 18+:
                </p>

                <div className="bg-slate-950 text-slate-200 font-mono text-xs p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <div className="text-slate-500"># 1. Install dependencies</div>
                  <div>npm install</div>
                  <div className="text-slate-500 pt-2"># 2. Add your Gemini API key (optional for OCR parsing)</div>
                  <div>export GEMINI_API_KEY="your-key-here"</div>
                  <div className="text-slate-500 pt-2"># 3. Start local development server</div>
                  <div>npm run dev</div>
                  <div className="text-slate-500 pt-2"># App will run at: http://localhost:3000</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Active Tests in Memory: <strong className="text-slate-700 dark:text-slate-300">{tests.length}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
