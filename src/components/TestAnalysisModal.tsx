import React from 'react';
import { MockTestEntry } from '../types';
import { X, CheckCircle, AlertTriangle, ArrowRight, BookOpen, Edit2, User, Trophy, BarChart3 } from 'lucide-react';

interface TestAnalysisModalProps {
  test: MockTestEntry | null;
  onClose: () => void;
  onEdit?: (test: MockTestEntry) => void;
}

export const TestAnalysisModal: React.FC<TestAnalysisModalProps> = ({
  test,
  onClose,
  onEdit,
}) => {
  if (!test) return null;

  const totalPct = Math.round((test.totalScore / (test.maxMarks || 1)) * 100);
  const pPct = Math.round((test.physics.marks / (test.physics.maxMarks || 1)) * 100);
  const cPct = Math.round((test.chemistry.marks / (test.chemistry.maxMarks || 1)) * 100);
  const mPct = Math.round((test.maths.marks / (test.maths.maxMarks || 1)) * 100);

  const isBT = test.institute?.toLowerCase().includes('bakliwal') || !!test.rollNo;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold truncate max-w-md">{test.title}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {test.examType === 'JEE_MAINS' ? 'JEE Mains' : 'JEE Advanced'}
                </span>
                {test.institute && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    {test.institute}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                {test.studentName && (
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>{test.studentName}</span>
                  </span>
                )}
                {test.rollNo && <span>Roll: <strong className="font-mono">{test.rollNo}</strong></span>}
                <span>Date: <span className="font-mono">{test.date}</span></span>
                {test.testMode && <span>Mode: {test.testMode}</span>}
                {test.overallRank && (
                  <span className="flex items-center gap-1 font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Rank: {test.overallRank}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bakliwal Tutorials Style MARKS ANALYSIS Table */}
        <div className="mb-5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/40 p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200">
            <span>Marks Analysis Breakdown</span>
            {test.marksAvgRatio && (
              <span className="text-indigo-600 dark:text-indigo-400 font-mono">
                Performance: {test.marksAvgRatio}x Batch Average
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 text-[10px]">
                  <th className="py-1.5 px-2 font-sans">Subject</th>
                  <th className="py-1.5 px-2 text-right">Marks</th>
                  <th className="py-1.5 px-2 text-right">Rank</th>
                  <th className="py-1.5 px-2 text-right font-sans">Marks/Avg</th>
                  <th className="py-1.5 px-2 text-right font-sans">+ve Marks</th>
                  <th className="py-1.5 px-2 text-right font-sans">-ve Marks</th>
                  <th className="py-1.5 px-2 text-right font-sans">Avg -ve</th>
                  <th className="py-1.5 px-2 text-center font-sans">Questions</th>
                  <th className="py-1.5 px-2 text-center font-sans">Attempted</th>
                  <th className="py-1.5 px-2 text-center font-sans">Correct</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                {/* Physics */}
                <tr>
                  <td className="py-2 px-2 font-sans font-medium text-sky-600 dark:text-sky-400">Physics</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-slate-100">{test.physics.marks}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{test.physics.rank || '-'}</td>
                  <td className="py-2 px-2 text-right text-sky-600">{test.physics.marksAvgRatio ? `${test.physics.marksAvgRatio}x` : `${pPct}%`}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{test.physics.positiveMarks || '-'}</td>
                  <td className="py-2 px-2 text-right text-rose-500 font-bold">-{test.physics.negativeMarks || 0}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{test.physics.avgNegativeMarks || '-'}</td>
                  <td className="py-2 px-2 text-center text-slate-500">{test.physics.totalQuestions || 23}</td>
                  <td className="py-2 px-2 text-center text-slate-500">{test.physics.attempted || '-'}</td>
                  <td className="py-2 px-2 text-center text-emerald-600 font-semibold">{test.physics.correct || '-'}</td>
                </tr>

                {/* Chemistry */}
                <tr>
                  <td className="py-2 px-2 font-sans font-medium text-amber-600 dark:text-amber-400">Chemistry</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-slate-100">{test.chemistry.marks}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{test.chemistry.rank || '-'}</td>
                  <td className="py-2 px-2 text-right text-amber-600 font-bold">{test.chemistry.marksAvgRatio ? `${test.chemistry.marksAvgRatio}x` : `${cPct}%`}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{test.chemistry.positiveMarks || '-'}</td>
                  <td className="py-2 px-2 text-right text-rose-500 font-bold">-{test.chemistry.negativeMarks || 0}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{test.chemistry.avgNegativeMarks || '-'}</td>
                  <td className="py-2 px-2 text-center text-slate-500">{test.chemistry.totalQuestions || 23}</td>
                  <td className="py-2 px-2 text-center text-slate-500">{test.chemistry.attempted || '-'}</td>
                  <td className="py-2 px-2 text-center text-emerald-600 font-semibold">{test.chemistry.correct || '-'}</td>
                </tr>

                {/* Mathematics */}
                <tr>
                  <td className="py-2 px-2 font-sans font-medium text-emerald-600 dark:text-emerald-400">Mathematics</td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900 dark:text-slate-100">{test.maths.marks}</td>
                  <td className="py-2 px-2 text-right text-slate-500">{test.maths.rank || '-'}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{test.maths.marksAvgRatio ? `${test.maths.marksAvgRatio}x` : `${mPct}%`}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{test.maths.positiveMarks || '-'}</td>
                  <td className="py-2 px-2 text-right text-rose-500 font-bold">-{test.maths.negativeMarks || 0}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{test.maths.avgNegativeMarks || '-'}</td>
                  <td className="py-2 px-2 text-center text-slate-500">{test.maths.totalQuestions || 23}</td>
                  <td className="py-2 px-2 text-center text-slate-500">{test.maths.attempted || '-'}</td>
                  <td className="py-2 px-2 text-center text-emerald-600 font-semibold">{test.maths.correct || '-'}</td>
                </tr>

                {/* Total Row */}
                <tr className="bg-slate-100/80 dark:bg-slate-800/80 font-bold">
                  <td className="py-2 px-2 font-sans text-indigo-600 dark:text-indigo-400">Total</td>
                  <td className="py-2 px-2 text-right text-indigo-600 dark:text-indigo-400 text-sm">{test.totalScore}</td>
                  <td className="py-2 px-2 text-right text-indigo-600">{test.overallRank || '-'}</td>
                  <td className="py-2 px-2 text-right text-indigo-600">{test.marksAvgRatio ? `${test.marksAvgRatio}x` : `${totalPct}%`}</td>
                  <td className="py-2 px-2 text-right text-emerald-600">{test.positiveMarks || '-'}</td>
                  <td className="py-2 px-2 text-right text-rose-500 text-sm">-{test.negativeMarks || 0}</td>
                  <td className="py-2 px-2 text-right text-slate-400">{test.batchAvgNegativeMarks || '-'}</td>
                  <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300">{test.totalQuestions || 69}</td>
                  <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-300">{test.totalAttempted || '-'}</td>
                  <td className="py-2 px-2 text-center text-emerald-600">{test.totalCorrect || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Question Type Stats (Single Correct vs Single Digit Integer vs Double Digit Integer) */}
        {test.questionTypeBreakdown && test.questionTypeBreakdown.length > 0 && (
          <div className="mb-5 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Question Type Accuracy Report (BT Format)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {test.questionTypeBreakdown.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {item.typeName}
                  </span>
                  <div className="space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-sky-600 dark:text-sky-400">Physics:</span>
                      <span className="text-emerald-600 font-bold">{item.physicsCorrectPct}% Correct</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-600 dark:text-amber-400">Chemistry:</span>
                      <span className="text-emerald-600 font-bold">{item.chemistryCorrectPct}% Correct</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-600 dark:text-emerald-400">Maths:</span>
                      <span className="text-emerald-600 font-bold">{item.mathsCorrectPct}% Correct</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Body */}
        {test.analysis ? (
          <div className="space-y-3.5">
            {/* Summary */}
            <div className="p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300 block mb-1">
                Diagnostic Overview &amp; Batch Benchmark
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {test.analysis.summary}
              </p>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Key Subject Strengths</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  {test.analysis.strengths.map((str, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-1.5 font-semibold text-rose-600 dark:text-rose-400 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Negative Marks &amp; Traps</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  {test.analysis.weaknesses.map((w, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">!</span>
                      <span>{w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Recommendations */}
            <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                <ArrowRight className="w-4 h-4" />
                <span>Actionable Recommendations for Next Test</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
                {test.analysis.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-indigo-500 font-bold">→</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-center text-xs text-slate-500">
            No detailed diagnostic report attached.
          </div>
        )}

        {/* Notes */}
        {test.notes && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-xs">
            <span className="font-semibold text-amber-800 dark:text-amber-300 block mb-1">
              Personal Test Notes
            </span>
            <p className="text-slate-700 dark:text-slate-300">{test.notes}</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-slate-100 dark:border-slate-800">
          {onEdit ? (
            <button
              onClick={() => {
                onClose();
                onEdit(test);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Entry</span>
            </button>
          ) : <div />}

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
