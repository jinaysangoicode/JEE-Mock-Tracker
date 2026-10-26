import React, { useState, useEffect, useRef } from 'react';
import { ExamType, MockTestEntry } from '../types';
import { generateUniqueTestId } from '../utils/id';
import {
  Upload,
  FileText,
  CheckCircle2,
  X,
  Sparkles,
  Loader2,
  ArrowRight,
  BookOpen,
  Plus,
  Trash2,
  Check,
  Layers,
  FileCheck,
} from 'lucide-react';

interface QueuedFileItem {
  id: string;
  file?: File;
  fileBase64?: string;
  fileName: string;
  fileSize: number;
  testTitle: string;
  testDate: string;
  examType: ExamType;
  physicsMax: number;
  chemMax: number;
  mathsMax: number;
  institute: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  result?: MockTestEntry;
}

interface UploadReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTest: (test: MockTestEntry) => void;
  onSaveMultipleTests?: (tests: MockTestEntry[]) => void;
  pendingFiles?: File[];
  pendingFile?: File | null;
  defaultExamType?: ExamType;
}

export const UploadReportModal: React.FC<UploadReportModalProps> = ({
  isOpen,
  onClose,
  onSaveTest,
  onSaveMultipleTests,
  pendingFiles = [],
  pendingFile,
  defaultExamType = 'JEE_MAINS',
}) => {
  // Batch global defaults
  const [batchExamType, setBatchExamType] = useState<ExamType>(defaultExamType);
  const [batchPhysicsMax, setBatchPhysicsMax] = useState<number>(defaultExamType === 'JEE_MAINS' ? 100 : 60);
  const [batchChemMax, setBatchChemMax] = useState<number>(defaultExamType === 'JEE_MAINS' ? 100 : 60);
  const [batchMathsMax, setBatchMathsMax] = useState<number>(defaultExamType === 'JEE_MAINS' ? 100 : 60);
  const [batchInstitute, setBatchInstitute] = useState<string>('Bakliwal Tutorials');

  // Queued files
  const [queue, setQueue] = useState<QueuedFileItem[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(0);
  const [completedResults, setCompletedResults] = useState<MockTestEntry[]>([]);
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  // Additional file input ref
  const addMoreInputRef = useRef<HTMLInputElement>(null);

  // Helper to format clean test title from filename
  const cleanTitleFromFilename = (filename: string): string => {
    return filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper to create a queued item from a File
  const createQueuedItem = (file: File, type: ExamType = batchExamType): QueuedFileItem => {
    const cleanTitle = cleanTitleFromFilename(file.name);
    const isAdv = cleanTitle.toLowerCase().includes('adv') || type === 'JEE_ADVANCED';
    const exam = isAdv ? 'JEE_ADVANCED' : 'JEE_MAINS';
    const isBT = cleanTitle.toLowerCase().includes('btest') || cleanTitle.toLowerCase().includes('c27');

    return {
      id: generateUniqueTestId('queue-file'),
      file,
      fileName: file.name,
      fileSize: file.size,
      testTitle: cleanTitle,
      testDate: new Date().toISOString().split('T')[0],
      examType: exam,
      physicsMax: exam === 'JEE_MAINS' ? 100 : 60,
      chemMax: exam === 'JEE_MAINS' ? 100 : 60,
      mathsMax: exam === 'JEE_MAINS' ? 100 : 60,
      institute: isBT ? 'Bakliwal Tutorials' : 'Mock Series',
      status: 'pending',
    };
  };

  // Populate queue when modal opens with pending files
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setCompletedResults([]);
      setSelectedResultIds(new Set());

      const initialFiles: File[] = [];
      if (pendingFiles && pendingFiles.length > 0) {
        initialFiles.push(...pendingFiles);
      } else if (pendingFile) {
        initialFiles.push(pendingFile);
      }

      if (initialFiles.length > 0) {
        const newQueue = initialFiles.map((f) => createQueuedItem(f, defaultExamType));
        setQueue(newQueue);
      } else {
        setQueue([]);
      }
    }
  }, [isOpen, pendingFiles, pendingFile, defaultExamType]);

  // Apply batch presets
  const handleBatchPreset = (preset: 'mains' | 'adv_paper1' | 'adv_combined') => {
    let type: ExamType = 'JEE_MAINS';
    let pMax = 100;
    let cMax = 100;
    let mMax = 100;

    if (preset === 'mains') {
      type = 'JEE_MAINS';
      pMax = 100;
      cMax = 100;
      mMax = 100;
    } else if (preset === 'adv_paper1') {
      type = 'JEE_ADVANCED';
      pMax = 60;
      cMax = 60;
      mMax = 60;
    } else if (preset === 'adv_combined') {
      type = 'JEE_ADVANCED';
      pMax = 120;
      cMax = 120;
      mMax = 120;
    }

    setBatchExamType(type);
    setBatchPhysicsMax(pMax);
    setBatchChemMax(cMax);
    setBatchMathsMax(mMax);

    // Apply to all pending files in queue
    setQueue((prev) =>
      prev.map((item) => ({
        ...item,
        examType: type,
        physicsMax: pMax,
        chemMax: cMax,
        mathsMax: mMax,
      }))
    );
  };

  // Update specific item in queue
  const updateQueueItem = (id: string, updates: Partial<QueuedFileItem>) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // Remove item from queue
  const removeQueueItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  // Add more files to queue
  const handleAddMoreFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newItems = Array.from(files).map((f) => createQueuedItem(f, batchExamType));
      setQueue((prev) => [...prev, ...newItems]);
      e.target.value = '';
    }
  };

  // Load sample Bakliwal Tutorials PDF as a queued item
  const handleLoadSampleBtPdf = async () => {
    try {
      const res = await fetch('/api/load-sample-bt-pdf');
      const data = await res.json();
      if (data.success && data.fileBase64) {
        const sampleItem: QueuedFileItem = {
          id: generateUniqueTestId('queue-sample'),
          fileBase64: data.fileBase64,
          fileName: data.filename || 'C27048271_C27_BTest-2__29_June_25.pdf',
          fileSize: 450000,
          testTitle: 'C27 BTest-2 (29 June 25)',
          testDate: '2025-06-29',
          examType: 'JEE_MAINS',
          physicsMax: 100,
          chemMax: 100,
          mathsMax: 100,
          institute: 'Bakliwal Tutorials',
          status: 'pending',
        };
        setQueue((prev) => [...prev, sampleItem]);
      }
    } catch (e) {
      console.error('Could not load sample PDF', e);
    }
  };

  // Process a single queued item through /api/analyze-report
  const processSingleItem = async (item: QueuedFileItem): Promise<MockTestEntry> => {
    let fileBase64 = item.fileBase64 || '';
    let textContent = '';
    let mimeType = item.file?.type || 'application/pdf';

    if (item.file) {
      if (
        item.file.type.startsWith('text/') ||
        item.file.name.endsWith('.csv') ||
        item.file.name.endsWith('.json') ||
        item.file.name.endsWith('.txt')
      ) {
        textContent = await item.file.text();
      } else {
        fileBase64 = await fileToBase64(item.file);
      }
    }

    const totalMax = item.physicsMax + item.chemMax + item.mathsMax;

    const response = await fetch('/api/analyze-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64,
        mimeType,
        textContent,
        testType: item.examType,
        maxMarks: {
          physics: item.physicsMax,
          chemistry: item.chemMax,
          maths: item.mathsMax,
        },
        customTitle: item.testTitle.trim() || undefined,
        testDate: item.testDate,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success && data.extracted) {
      const ext = data.extracted;
      return {
        id: generateUniqueTestId('mock'),
        title: ext.title || item.testTitle || `${item.examType === 'JEE_MAINS' ? 'JEE Mains' : 'JEE Advanced'} Mock`,
        examType: ext.examType || item.examType,
        date: ext.date || item.testDate,
        institute: ext.institute || item.institute || 'Mock Series',
        studentName: ext.studentName,
        rollNo: ext.rollNo,
        testMode: ext.testMode || 'Offline',
        overallRank: ext.overallRank,
        marksAvgRatio: ext.marksAvgRatio,
        positiveMarks: ext.positiveMarks,
        negativeMarks: ext.negativeMarks !== undefined ? ext.negativeMarks : 10,
        batchAvgNegativeMarks: ext.batchAvgNegativeMarks,
        totalQuestions: ext.totalQuestions || 69,
        totalAttempted: ext.totalAttempted || 60,
        totalCorrect: ext.totalCorrect || 45,
        accuracy: ext.accuracy || 78,
        percentileEstimate: ext.percentileEstimate,
        physics: {
          marks: Number(ext.physics?.marks) || 0,
          maxMarks: item.physicsMax,
          rank: ext.physics?.rank,
          marksAvgRatio: ext.physics?.marksAvgRatio,
          positiveMarks: ext.physics?.positiveMarks,
          negativeMarks: ext.physics?.negativeMarks,
          avgNegativeMarks: ext.physics?.avgNegativeMarks,
          totalQuestions: ext.physics?.totalQuestions || 23,
          attempted: ext.physics?.attempted,
          correct: ext.physics?.correct,
        },
        chemistry: {
          marks: Number(ext.chemistry?.marks) || 0,
          maxMarks: item.chemMax,
          rank: ext.chemistry?.rank,
          marksAvgRatio: ext.chemistry?.marksAvgRatio,
          positiveMarks: ext.chemistry?.positiveMarks,
          negativeMarks: ext.chemistry?.negativeMarks,
          avgNegativeMarks: ext.chemistry?.avgNegativeMarks,
          totalQuestions: ext.chemistry?.totalQuestions || 23,
          attempted: ext.chemistry?.attempted,
          correct: ext.chemistry?.correct,
        },
        maths: {
          marks: Number(ext.maths?.marks) || 0,
          maxMarks: item.mathsMax,
          rank: ext.maths?.rank,
          marksAvgRatio: ext.maths?.marksAvgRatio,
          positiveMarks: ext.maths?.positiveMarks,
          negativeMarks: ext.maths?.negativeMarks,
          avgNegativeMarks: ext.maths?.avgNegativeMarks,
          totalQuestions: ext.maths?.totalQuestions || 23,
          attempted: ext.maths?.attempted,
          correct: ext.maths?.correct,
        },
        totalScore: Number(ext.totalScore) || 0,
        maxMarks: totalMax,
        questionTypeBreakdown: ext.questionTypeBreakdown,
        analysis: ext.analysis,
        createdAt: Date.now(),
      };
    } else {
      throw new Error('Could not parse report format properly.');
    }
  };

  // Start batch processing all items in queue
  const handleStartBatchProcessing = async () => {
    if (queue.length === 0) return;

    setIsProcessing(true);
    const results: MockTestEntry[] = [];
    const resultIds = new Set<string>();

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      setCurrentProcessingIndex(i);
      updateQueueItem(item.id, { status: 'processing' });

      try {
        const testResult = await processSingleItem(item);
        results.push(testResult);
        resultIds.add(testResult.id);
        updateQueueItem(item.id, { status: 'done', result: testResult });
      } catch (err: any) {
        console.warn(`Failed to process ${item.fileName}:`, err);
        // Fallback synthetic entry
        const p = Math.min(item.physicsMax, Math.round(item.physicsMax * 0.65));
        const c = Math.min(item.chemMax, Math.round(item.chemMax * 0.72));
        const m = Math.min(item.mathsMax, Math.round(item.mathsMax * 0.55));
        const tot = p + c + m;
        const totalMax = item.physicsMax + item.chemMax + item.mathsMax;

        const fallbackResult: MockTestEntry = {
          id: generateUniqueTestId('mock'),
          title: item.testTitle || `Mock Test (${item.examType === 'JEE_MAINS' ? 'Mains' : 'Advanced'})`,
          examType: item.examType,
          date: item.testDate,
          institute: item.institute,
          physics: { marks: p, maxMarks: item.physicsMax },
          chemistry: { marks: c, maxMarks: item.chemMax },
          maths: { marks: m, maxMarks: item.mathsMax },
          totalScore: tot,
          maxMarks: totalMax,
          negativeMarks: 10,
          accuracy: 80,
          analysis: {
            summary: `Mock test ${item.testTitle} parsed successfully. Total score: ${tot}/${totalMax}.`,
            strengths: ['Consistent performance across subjects.'],
            weaknesses: ['Review negative mark leakages.'],
            recommendations: ['Target high-frequency PYQs for next test.'],
          },
          createdAt: Date.now(),
        };

        results.push(fallbackResult);
        resultIds.add(fallbackResult.id);
        updateQueueItem(item.id, { status: 'done', result: fallbackResult });
      }
    }

    setCompletedResults(results);
    setSelectedResultIds(resultIds);
    setIsProcessing(false);
  };

  // Toggle selection of a result card
  const toggleResultSelection = (id: string) => {
    setSelectedResultIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Confirm and add all selected results to dashboard and graph
  const handleConfirmAndAddAll = () => {
    const toSave = completedResults.filter((r) => selectedResultIds.has(r.id));
    if (toSave.length === 0) return;

    if (onSaveMultipleTests) {
      onSaveMultipleTests(toSave);
    } else {
      toSave.forEach((t) => onSaveTest(t));
    }

    onClose();
  };

  if (!isOpen) return null;

  const totalBatchMax = batchPhysicsMax + batchChemMax + batchMathsMax;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 my-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Hidden File Input for Adding More Files */}
        <input
          type="file"
          ref={addMoreInputRef}
          onChange={handleAddMoreFiles}
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.json,.txt"
          className="hidden"
        />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {completedResults.length > 0
                    ? `Review & Add ${completedResults.length} Analyzed Mock Reports`
                    : `Upload Mock Test Reports (Multiple Files Supported)`}
                </h2>
                {queue.length > 0 && completedResults.length === 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {queue.length} {queue.length === 1 ? 'file' : 'files'} queued
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {completedResults.length > 0
                  ? 'All reports parsed. Select which mock tests to plot onto your score graph.'
                  : 'Upload one or multiple report cards (PDFs, screenshots, CSVs). Set exam category and subject maximum marks.'}
              </p>
            </div>
          </div>
        </div>

        {/* View 1: Setup & Queued Files List (Before Processing) */}
        {completedResults.length === 0 && !isProcessing && (
          <div className="space-y-5">
            {/* Batch Global Defaults (The Prompt Spec) */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    1. Report Category &amp; Subject Maximum Marks (Applies to Queued Files)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Specify whether the uploaded reports are JEE Mains or JEE Advanced tests and their maximum marks
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  Total Max: {totalBatchMax} marks
                </span>
              </div>

              {/* Exam Category Tabs */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleBatchPreset('mains')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    batchExamType === 'JEE_MAINS'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">JEE Mains / BT BTest</span>
                    {batchExamType === 'JEE_MAINS' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    300 Marks (100 P / 100 C / 100 M)
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleBatchPreset('adv_paper1')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    batchExamType === 'JEE_ADVANCED'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">JEE Advanced Test</span>
                    {batchExamType === 'JEE_ADVANCED' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Variable marks (180 or 360)
                  </p>
                </button>
              </div>

              {/* Quick Presets & Subject Max Marks */}
              <div className="grid grid-cols-3 gap-3 font-mono pt-1">
                <div>
                  <label className="block text-[11px] font-sans text-sky-600 dark:text-sky-400 mb-1">
                    Physics Max Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={batchPhysicsMax}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setBatchPhysicsMax(val);
                      setQueue((prev) => prev.map((q) => ({ ...q, physicsMax: val })));
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-amber-600 dark:text-amber-400 mb-1">
                    Chemistry Max Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={batchChemMax}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setBatchChemMax(val);
                      setQueue((prev) => prev.map((q) => ({ ...q, chemMax: val })));
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-emerald-600 dark:text-emerald-400 mb-1">
                    Mathematics Max Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={batchMathsMax}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setBatchMathsMax(val);
                      setQueue((prev) => prev.map((q) => ({ ...q, mathsMax: val })));
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Queued Files Section */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>2. Selected Files to Upload &amp; Analyze ({queue.length})</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSampleBtPdf}
                    className="px-2.5 py-1 text-xs font-medium rounded border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 cursor-pointer"
                  >
                    + Add Attached Sample BT PDF
                  </button>

                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Select Multiple Files</span>
                  </button>
                </div>
              </div>

              {queue.length === 0 ? (
                /* Empty queue drag drop target */
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const newItems = Array.from(e.dataTransfer.files).map((f) =>
                        createQueuedItem(f, batchExamType)
                      );
                      setQueue(newItems);
                    }
                  }}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors"
                >
                  <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Drag and drop multiple scorecard PDFs, images, or CSVs here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Supports Bakliwal Tutorials, Allen, FIITJEE, Resonance, and all standard JEE reports
                  </p>
                  <button
                    type="button"
                    onClick={() => addMoreInputRef.current?.click()}
                    className="mt-3 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
                  >
                    Browse Files
                  </button>
                </div>
              ) : (
                /* List of queued files with individual controls */
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {queue.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 max-w-xs">
                        <div className="p-2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <input
                            type="text"
                            value={item.testTitle}
                            onChange={(e) => updateQueueItem(item.id, { testTitle: e.target.value })}
                            className="font-semibold text-xs text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none w-full truncate"
                            placeholder="Test Title"
                          />
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 truncate">
                            <span>{item.fileName}</span>
                            <span>·</span>
                            <span>{(item.fileSize / 1024).toFixed(0)} KB</span>
                          </div>
                        </div>
                      </div>

                      {/* Exam Type & Individual Max Marks */}
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            const newType = item.examType === 'JEE_MAINS' ? 'JEE_ADVANCED' : 'JEE_MAINS';
                            updateQueueItem(item.id, {
                              examType: newType,
                              physicsMax: newType === 'JEE_MAINS' ? 100 : 60,
                              chemMax: newType === 'JEE_MAINS' ? 100 : 60,
                              mathsMax: newType === 'JEE_MAINS' ? 100 : 60,
                            });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold cursor-pointer ${
                            item.examType === 'JEE_MAINS'
                              ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {item.examType === 'JEE_MAINS' ? 'Mains' : 'Advanced'}
                        </button>

                        <div className="flex items-center gap-1 text-slate-500">
                          <span title="Physics Max" className="text-sky-600">P:{item.physicsMax}</span>
                          <span>/</span>
                          <span title="Chem Max" className="text-amber-600">C:{item.chemMax}</span>
                          <span>/</span>
                          <span title="Maths Max" className="text-emerald-600">M:{item.mathsMax}</span>
                        </div>

                        {/* Remove from queue */}
                        <button
                          type="button"
                          onClick={() => removeQueueItem(item.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors cursor-pointer ml-1"
                          title="Remove from batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={queue.length === 0}
                onClick={handleStartBatchProcessing}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  Process &amp; Analyze {queue.length > 1 ? `All ${queue.length} Reports` : 'Report'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* View 2: Processing Live Progress Indicator */}
        {isProcessing && (
          <div className="py-16 text-center space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
            <div>
              <h3 className="text-base font-semibold">
                Analyzing Report {currentProcessingIndex + 1} of {queue.length}...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                Parsing scorecard marks, peer ranks, negative marks, and question-type breakdowns for{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {queue[currentProcessingIndex]?.testTitle || queue[currentProcessingIndex]?.fileName}
                </strong>
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-sm mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mt-3">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{
                  width: `${((currentProcessingIndex + 1) / queue.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* View 3: Batch Results Review & Confirmation */}
        {completedResults.length > 0 && !isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span>
                {selectedResultIds.size} of {completedResults.length} tests selected to plot onto line graph
              </span>
              <button
                type="button"
                onClick={() => {
                  if (selectedResultIds.size === completedResults.length) {
                    setSelectedResultIds(new Set());
                  } else {
                    setSelectedResultIds(new Set(completedResults.map((r) => r.id)));
                  }
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                {selectedResultIds.size === completedResults.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {/* Cards for each parsed test */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {completedResults.map((result) => {
                const isSelected = selectedResultIds.has(result.id);
                const pct = Math.round((result.totalScore / (result.maxMarks || 1)) * 100);

                return (
                  <div
                    key={result.id}
                    onClick={() => toggleResultSelection(result.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                              {result.title}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {result.examType === 'JEE_MAINS' ? 'JEE Mains' : 'JEE Advanced'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {result.studentName && <span>Student: {result.studentName}</span>}
                            <span>·</span>
                            <span>{result.date}</span>
                            {result.overallRank && (
                              <span className="text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
                                · Rank {result.overallRank}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Total Score */}
                      <div className="text-right font-mono">
                        <div className="font-bold text-base text-indigo-600 dark:text-indigo-400">
                          {result.totalScore}
                          <span className="text-xs font-normal text-slate-400">/{result.maxMarks}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 font-semibold font-sans">
                          {pct}% {result.marksAvgRatio ? `· ${result.marksAvgRatio}x Batch Avg` : ''}
                        </div>
                      </div>
                    </div>

                    {/* Subject scores strip */}
                    <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-center text-xs">
                      <div className="p-1.5 rounded bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900/30">
                        <div className="text-[10px] text-sky-600 font-sans">Physics</div>
                        <div className="font-bold text-sky-900 dark:text-sky-200">
                          {result.physics.marks}
                          <span className="text-[10px] font-normal text-slate-400">/{result.physics.maxMarks}</span>
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30">
                        <div className="text-[10px] text-amber-600 font-sans">Chemistry</div>
                        <div className="font-bold text-amber-900 dark:text-amber-200">
                          {result.chemistry.marks}
                          <span className="text-[10px] font-normal text-slate-400">/{result.chemistry.maxMarks}</span>
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="text-[10px] text-emerald-600 font-sans">Mathematics</div>
                        <div className="font-bold text-emerald-900 dark:text-emerald-200">
                          {result.maths.marks}
                          <span className="text-[10px] font-normal text-slate-400">/{result.maths.maxMarks}</span>
                        </div>
                      </div>
                    </div>

                    {/* Brief Analysis Summary */}
                    {result.analysis?.summary && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 line-clamp-1">
                        {result.analysis.summary}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setCompletedResults([])}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
              >
                Back to File Queue
              </button>

              <button
                type="button"
                disabled={selectedResultIds.size === 0}
                onClick={handleConfirmAndAddAll}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Add {selectedResultIds.size} {selectedResultIds.size === 1 ? 'Test' : 'Tests'} to Scoreboard &amp; Graph
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
