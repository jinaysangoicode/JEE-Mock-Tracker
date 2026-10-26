/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MockTestEntry,
  ViewFilter,
  TrendMetric,
  ExamType,
} from './types';
import { INITIAL_MOCK_TESTS } from './data/sampleData';
import { ScoreLineGraph } from './components/ScoreLineGraph';
import { MockTestsTable } from './components/MockTestsTable';
import { UploadReportModal } from './components/UploadReportModal';
import { EditTestModal } from './components/EditTestModal';
import { TestAnalysisModal } from './components/TestAnalysisModal';
import { DownloadAppModal } from './components/DownloadAppModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { downloadWebsiteSnapshot, downloadJsonData } from './utils/exportWebsite';
import { generateUniqueTestId, deduplicateTestIds } from './utils/id';
import {
  Upload,
  Plus,
  Download,
  Trash2,
  RefreshCw,
  Sun,
  Moon,
  Layers,
  Award,
  TrendingUp,
  AlertCircle,
  FileText,
  Percent,
  Hash,
  Database,
  ArrowRight,
} from 'lucide-react';

const STORAGE_KEY = 'jee_mock_tracker_tests_v1';
const THEME_KEY = 'jee_mock_tracker_theme_v1';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(THEME_KEY);
    return saved !== null ? saved === 'true' : true;
  });

  // Tests state with localStorage persistence
  const [tests, setTests] = useState<MockTestEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return deduplicateTestIds(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to load tests from localStorage', e);
    }
    return deduplicateTestIds(INITIAL_MOCK_TESTS);
  });

  // Sync tests to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
    } catch (e) {
      console.error('Failed to save tests to localStorage', e);
    }
  }, [tests]);

  // Sync theme
  useEffect(() => {
    localStorage.setItem(THEME_KEY, String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Active filter: 'ALL' | 'JEE_MAINS' | 'JEE_ADVANCED'
  const [activeFilter, setActiveFilter] = useState<ViewFilter>('ALL');

  // Trend Metric: 'ABSOLUTE' | 'PERCENTAGE'
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('ABSOLUTE');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [editingTest, setEditingTest] = useState<MockTestEntry | null>(null);
  const [inspectingTest, setInspectingTest] = useState<MockTestEntry | null>(null);

  // Download & Install App modal state
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);

  // Clear data confirmation modal
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);

  // Hidden file input for header direct report upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered tests preserving custom array order
  const filteredTests = useMemo(() => {
    if (activeFilter === 'ALL') return tests;
    return tests.filter((t) => t.examType === activeFilter);
  }, [tests, activeFilter]);

  // Statistics calculation for the current filtered view
  const stats = useMemo(() => {
    if (filteredTests.length === 0) {
      return {
        count: 0,
        avgScore: 0,
        highestScore: 0,
        avgPercentage: 0,
        avgPhysics: 0,
        avgChem: 0,
        avgMaths: 0,
        totalNegatives: 0,
        latestPercentile: 'N/A',
      };
    }

    const count = filteredTests.length;
    const totalMarksSum = filteredTests.reduce((acc, t) => acc + t.totalScore, 0);
    const avgScore = Math.round(totalMarksSum / count);
    const highestScore = Math.max(...filteredTests.map((t) => t.totalScore));

    const avgPercentage = Math.round(
      filteredTests.reduce((acc, t) => acc + (t.totalScore / (t.maxMarks || 1)) * 100, 0) / count
    );

    const avgPhysics = Math.round(filteredTests.reduce((acc, t) => acc + t.physics.marks, 0) / count);
    const avgChem = Math.round(filteredTests.reduce((acc, t) => acc + t.chemistry.marks, 0) / count);
    const avgMaths = Math.round(filteredTests.reduce((acc, t) => acc + t.maths.marks, 0) / count);

    const totalNegatives = filteredTests.reduce((acc, t) => acc + (t.negativeMarks || 0), 0);
    const latestTest = filteredTests[filteredTests.length - 1];

    return {
      count,
      avgScore,
      highestScore,
      avgPercentage,
      avgPhysics,
      avgChem,
      avgMaths,
      totalNegatives,
      latestPercentile: latestTest?.percentileEstimate || `${avgPercentage}%ile`,
    };
  }, [filteredTests]);

  // Reorder tests handler (updates both filtered and master list)
  const handleReorder = (newOrderedTests: MockTestEntry[]) => {
    if (activeFilter === 'ALL') {
      setTests(newOrderedTests);
    } else {
      // Merge reordered subset back with the untouched other exam type tests
      const otherTests = tests.filter((t) => t.examType !== activeFilter);
      setTests([...newOrderedTests, ...otherTests]);
    }
  };

  // Add single new mock test
  const handleSaveNewTest = (newTest: MockTestEntry) => {
    setTests((prev) => {
      let uniqueId = newTest.id;
      if (!uniqueId || prev.some((t) => t.id === uniqueId)) {
        uniqueId = generateUniqueTestId('mock');
      }
      const safeTest = { ...newTest, id: uniqueId };
      setInspectingTest(safeTest);
      return [...prev, safeTest];
    });
  };

  // Add multiple new mock tests from batch upload
  const handleSaveMultipleTests = (newTests: MockTestEntry[]) => {
    setTests((prev) => {
      const sanitized = newTests.map((t) => {
        let uniqueId = t.id;
        if (!uniqueId || prev.some((p) => p.id === uniqueId)) {
          uniqueId = generateUniqueTestId('mock');
        }
        return { ...t, id: uniqueId };
      });
      if (sanitized.length > 0) {
        setInspectingTest(sanitized[sanitized.length - 1]);
      }
      return [...prev, ...sanitized];
    });
  };

  // Update existing mock test
  const handleUpdateTest = (updatedTest: MockTestEntry) => {
    setTests((prev) => prev.map((t) => (t.id === updatedTest.id ? updatedTest : t)));
    if (inspectingTest && inspectingTest.id === updatedTest.id) {
      setInspectingTest(updatedTest);
    }
  };

  // Delete test
  const handleDeleteTest = (id: string) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
    if (inspectingTest && inspectingTest.id === id) {
      setInspectingTest(null);
    }
  };

  // Clear all data
  const handleClearAllData = () => {
    setTests([]);
    setIsClearConfirmOpen(false);
  };

  // Restore sample demo mocks
  const handleRestoreSampleData = () => {
    setTests(INITIAL_MOCK_TESTS);
    setIsClearConfirmOpen(false);
  };

  // Trigger file selection
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setPendingFiles(Array.from(files));
      setIsUploadModalOpen(true);
      // Reset input value so same files can be re-uploaded if needed
      e.target.value = '';
    }
  };

  // JSON Import handler
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            setTests(deduplicateTestIds(parsed));
            alert(`Successfully imported ${parsed.length} mock tests!`);
          } else {
            alert('Invalid JSON file format. Expected an array of tests.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.json,.txt"
        className="hidden"
      />
      <input
        type="file"
        id="json-import-input"
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* Top Bar Contract (1 line brand, nav items, primary CTA) */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Brand Zone */}
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
              JEE Mock Tracker
            </span>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 hidden md:inline">
              Mains &amp; Advanced Analytics
            </span>
          </div>

          {/* Nav / View Filter Controls (Center Zone) */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All Tests ({tests.length})
            </button>
            <button
              onClick={() => setActiveFilter('JEE_MAINS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'JEE_MAINS'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              JEE Mains ({tests.filter((t) => t.examType === 'JEE_MAINS').length})
            </button>
            <button
              onClick={() => setActiveFilter('JEE_ADVANCED')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'JEE_ADVANCED'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              JEE Advanced ({tests.filter((t) => t.examType === 'JEE_ADVANCED').length})
            </button>
          </div>

          {/* Action Zone: Theme, Download Snapshot, Upload Report */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Download / Install App */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              title="Download or install app (Desktop/Mobile PWA, Offline HTML, or JSON)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Download App</span>
            </button>

            {/* Upload New Report (Primary CTA) */}
            <button
              onClick={handleTriggerFileInput}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Report</span>
            </button>
          </div>
        </div>

        {/* Mobile Filter Tabs */}
        <div className="flex sm:hidden items-center justify-center gap-1 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
              activeFilter === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('JEE_MAINS')}
            className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
              activeFilter === 'JEE_MAINS'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Mains
          </button>
          <button
            onClick={() => setActiveFilter('JEE_ADVANCED')}
            className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${
              activeFilter === 'JEE_ADVANCED'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Advanced
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Workspace Toolbar & Metric Mode Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {activeFilter === 'ALL'
                ? 'JEE Overall Mock Performance'
                : activeFilter === 'JEE_MAINS'
                ? 'JEE Mains Mock Trajectory'
                : 'JEE Advanced Mock Trajectory'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Subject-wise score progression, negative mark leakage, and diagnostic reports
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Metric Mode Switcher (Absolute vs Percentage) */}
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 dark:bg-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setTrendMetric('ABSOLUTE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  trendMetric === 'ABSOLUTE'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="View Absolute Marks (e.g. 219/300)"
              >
                <Hash className="w-3 h-3 text-indigo-500" />
                <span>Absolute Marks</span>
              </button>
              <button
                onClick={() => setTrendMetric('PERCENTAGE')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  trendMetric === 'PERCENTAGE'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="View Percentage % (Normalizes variable max marks in Advanced)"
              >
                <Percent className="w-3 h-3 text-indigo-500" />
                <span>Percentage %</span>
              </button>
            </div>

            {/* Add Manual Score */}
            <button
              onClick={() => {
                setPendingFiles([]);
                setIsUploadModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-500" />
              <span>+ Add Score</span>
            </button>
          </div>
        </div>

        {/* 4-Column High Density Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 font-mono">
          {/* Tests Logged */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Mocks Completed</span>
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {stats.count}
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-0.5">
              {activeFilter === 'ALL' ? 'Mains + Advanced combined' : `${activeFilter.replace('_', ' ')} series`}
            </div>
          </div>

          {/* Average Score */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Average Score</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
              {stats.avgScore}
              <span className="text-xs font-normal text-slate-400 font-sans"> pts</span>
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-sans mt-0.5">
              {stats.avgPercentage}% average yield
            </div>
          </div>

          {/* Highest Score / Best Mock */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>Personal Best</span>
              <Award className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400 mt-1 tabular-nums">
              {stats.highestScore}
            </div>
            <div className="text-[11px] text-slate-500 font-sans mt-0.5 truncate">
              {stats.latestPercentile}
            </div>
          </div>

          {/* Subject Average Distribution */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 mb-1">
              Subject Mean Split
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-sky-600 dark:text-sky-400">P: {stats.avgPhysics}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-amber-600 dark:text-amber-400">C: {stats.avgChem}</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              <span className="text-emerald-600 dark:text-emerald-400">M: {stats.avgMaths}</span>
            </div>
            <div className="text-[11px] text-rose-500 font-sans mt-1">
              -{stats.totalNegatives} total negative marks lost
            </div>
          </div>
        </div>

        {/* Dynamic Line Graph Section */}
        <section>
          <ScoreLineGraph
            tests={filteredTests}
            metric={trendMetric}
            onSelectTest={(test) => setInspectingTest(test)}
            selectedTestId={inspectingTest?.id}
          />
        </section>

        {/* Drag & Drop Upload Quick Zone */}
        <section
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              setPendingFiles(Array.from(e.dataTransfer.files));
              setIsUploadModalOpen(true);
            }
          }}
          className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50/50 dark:hover:bg-slate-900 transition-colors"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-center sm:justify-start gap-1.5">
                  <span>Upload Single or Multiple Scorecards</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                    Batch Support
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Drag and drop multiple test PDFs or scorecard screenshots here, or click browse. The app will prompt for exam type &amp; subject max marks, parse each report, and plot them in the graph.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleTriggerFileInput}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
              >
                Browse Multiple Files
              </button>
            </div>
          </div>
        </section>

        {/* Mock Tests Data Table with Reorder & Actions */}
        <section>
          <MockTestsTable
            tests={filteredTests}
            onReorder={handleReorder}
            onEdit={(test) => setEditingTest(test)}
            onDelete={handleDeleteTest}
            onViewAnalysis={(test) => setInspectingTest(test)}
            selectedTestId={inspectingTest?.id}
          />
        </section>

        {/* Bottom Utility Bar: Clear Data, Download Website, JSON Backup & Restore */}
        <footer className="flex flex-wrap items-center justify-between gap-4 pt-6 pb-12 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span>JEE Progress Tracker</span>
            <span>·</span>
            <span className="font-mono tabular-nums">{tests.length} tests active in browser</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Download & Install App Modal */}
            <button
              onClick={() => setIsDownloadModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 transition-colors cursor-pointer font-semibold"
              title="Download app as PWA, standalone HTML, or export JSON"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Download &amp; Install Options</span>
            </button>

            {/* Download website snapshot in current state */}
            <button
              onClick={() => downloadWebsiteSnapshot(tests, activeFilter)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Download standalone HTML website containing all current mock data"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Download Website Snapshot (HTML)</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={() => downloadJsonData(tests)}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              title="Export raw JSON backup"
            >
              Export JSON
            </button>

            {/* Import JSON */}
            <label
              htmlFor="json-import-input"
              className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              title="Import JSON backup"
            >
              Import JSON
            </label>

            {/* Clear ALL data */}
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
              title="Clear all stored mock test data"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear ALL Data</span>
            </button>
          </div>
        </footer>
      </main>

      {/* Upload & Prompt Modal */}
      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setPendingFiles([]);
        }}
        onSaveTest={handleSaveNewTest}
        onSaveMultipleTests={handleSaveMultipleTests}
        pendingFiles={pendingFiles}
        defaultExamType={activeFilter === 'JEE_ADVANCED' ? 'JEE_ADVANCED' : 'JEE_MAINS'}
      />

      {/* Edit Test Entry Modal */}
      <EditTestModal
        isOpen={!!editingTest}
        onClose={() => setEditingTest(null)}
        onSave={handleUpdateTest}
        onDelete={handleDeleteTest}
        test={editingTest}
      />

      {/* Test Diagnostic Analysis Drawer / Modal */}
      <TestAnalysisModal
        test={inspectingTest}
        onClose={() => setInspectingTest(null)}
        onEdit={(test) => setEditingTest(test)}
      />

      {/* Download & Install App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        tests={tests}
        activeFilter={activeFilter}
      />

      {/* Clear All Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold">Clear All Mock Test Data?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              This will erase all {tests.length} mock test records and reset your scoreboards and line graphs. You can download a backup before doing so, or reload sample JEE mock data at any time.
            </p>
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleRestoreSampleData}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Reset to Sample Mocks
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAllData}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                >
                  Yes, Clear All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
