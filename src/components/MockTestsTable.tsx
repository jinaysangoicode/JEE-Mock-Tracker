import React from 'react';
import { MockTestEntry } from '../types';
import {
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  FileSearch,
  Calendar,
  Award,
} from 'lucide-react';

interface MockTestsTableProps {
  tests: MockTestEntry[];
  onReorder: (tests: MockTestEntry[]) => void;
  onEdit: (test: MockTestEntry) => void;
  onDelete: (id: string) => void;
  onViewAnalysis: (test: MockTestEntry) => void;
  selectedTestId?: string | null;
}

export const MockTestsTable: React.FC<MockTestsTableProps> = ({
  tests,
  onReorder,
  onEdit,
  onDelete,
  onViewAnalysis,
  selectedTestId,
}) => {
  // Move test up in list
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newTests = [...tests];
    const temp = newTests[index];
    newTests[index] = newTests[index - 1];
    newTests[index - 1] = temp;
    onReorder(newTests);
  };

  // Move test down in list
  const handleMoveDown = (index: number) => {
    if (index >= tests.length - 1) return;
    const newTests = [...tests];
    const temp = newTests[index];
    newTests[index] = newTests[index + 1];
    newTests[index + 1] = temp;
    onReorder(newTests);
  };

  // Sort helpers
  const handleSortByDate = (ascending: boolean) => {
    const sorted = [...tests].sort((a, b) => {
      const d1 = new Date(a.date).getTime();
      const d2 = new Date(b.date).getTime();
      return ascending ? d1 - d2 : d2 - d1;
    });
    onReorder(sorted);
  };

  const handleSortByScore = () => {
    const sorted = [...tests].sort((a, b) => {
      const pctA = a.totalScore / (a.maxMarks || 1);
      const pctB = b.totalScore / (b.maxMarks || 1);
      return pctB - pctA;
    });
    onReorder(sorted);
  };

  if (tests.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/40 p-6">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          No mock tests logged for this view
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Upload a test report card or click "+ Add Score" to track your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Table header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Mock Test Entries &amp; Sequence Order
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reordering tests moves their order in the score line graph above
          </p>
        </div>

        {/* Quick sequence sort actions */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 text-[11px]">Reorder:</span>
          <button
            onClick={() => handleSortByDate(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Sort Oldest to Newest"
          >
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Date (Oldest)</span>
          </button>
          <button
            onClick={() => handleSortByDate(false)}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Sort Newest to Oldest"
          >
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>Date (Newest)</span>
          </button>
          <button
            onClick={handleSortByScore}
            className="flex items-center gap-1 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Sort by Score Percentage"
          >
            <Award className="w-3 h-3 text-indigo-500" />
            <span>Highest Score</span>
          </button>
        </div>
      </div>

      {/* High-density table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-medium">
              <th className="py-2.5 px-3 w-16 text-center">Graph #</th>
              <th className="py-2.5 px-3">Test Name &amp; Student</th>
              <th className="py-2.5 px-3">Exam / Provider</th>
              <th className="py-2.5 px-3 text-right">Physics</th>
              <th className="py-2.5 px-3 text-right">Chemistry</th>
              <th className="py-2.5 px-3 text-right">Mathematics</th>
              <th className="py-2.5 px-3 text-right font-semibold">Total Score</th>
              <th className="py-2.5 px-3 text-center">Rank &amp; Peer Avg</th>
              <th className="py-2.5 px-3 text-center">Accuracy / Neg</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {tests.map((test, idx) => {
              const isSelected = selectedTestId === test.id;
              const totalPct = Math.round((test.totalScore / (test.maxMarks || 1)) * 100);

              return (
                <tr
                  key={`${test.id}-${idx}`}
                  className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                    isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Sequence Order & Reorder Arrows */}
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400 w-5">
                        #{idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveUp(idx)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-400 p-0.5 cursor-pointer"
                          title="Move Up in Graph"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={idx === tests.length - 1}
                          onClick={() => handleMoveDown(idx)}
                          className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-400 p-0.5 cursor-pointer"
                          title="Move Down in Graph"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Title & Student Info */}
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-xs">
                      {test.title}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono tabular-nums">{test.date}</span>
                      {test.studentName && (
                        <>
                          <span>·</span>
                          <span className="text-slate-600 dark:text-slate-300 font-medium">{test.studentName}</span>
                        </>
                      )}
                      {test.rollNo && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-[10px] text-slate-400">{test.rollNo}</span>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Exam Type & Provider */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {test.examType === 'JEE_MAINS' ? 'JEE Mains' : 'JEE Advanced'}
                    </div>
                    {test.institute && (
                      <div className="text-[10px] text-slate-400 font-sans">
                        {test.institute}
                      </div>
                    )}
                  </td>

                  {/* Physics */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-sky-600 dark:text-sky-400">
                      {test.physics.marks}
                    </span>
                    <span className="text-[10px] text-slate-400">/{test.physics.maxMarks}</span>
                    {test.physics.rank && (
                      <div className="text-[9px] text-slate-400">Rank {test.physics.rank}</div>
                    )}
                  </td>

                  {/* Chemistry */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                      {test.chemistry.marks}
                    </span>
                    <span className="text-[10px] text-slate-400">/{test.chemistry.maxMarks}</span>
                    {test.chemistry.rank && (
                      <div className="text-[9px] text-slate-400">Rank {test.chemistry.rank}</div>
                    )}
                  </td>

                  {/* Mathematics */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {test.maths.marks}
                    </span>
                    <span className="text-[10px] text-slate-400">/{test.maths.maxMarks}</span>
                    {test.maths.rank && (
                      <div className="text-[9px] text-slate-400">Rank {test.maths.rank}</div>
                    )}
                  </td>

                  {/* Total Score */}
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums whitespace-nowrap">
                    <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400">
                      {test.totalScore}
                      <span className="text-xs font-normal text-slate-400">/{test.maxMarks}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-sans">
                      {totalPct}% marks
                    </div>
                  </td>

                  {/* Rank & Peer Average */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono">
                    {test.overallRank ? (
                      <div>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          Rank {test.overallRank}
                        </span>
                        {test.marksAvgRatio && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                            {test.marksAvgRatio}x Batch Avg
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  {/* Accuracy & Negative Marks */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                      {test.accuracy ? `${test.accuracy}% acc` : '-'}
                    </div>
                    {test.negativeMarks !== undefined && test.negativeMarks > 0 && (
                      <div className="text-[10px] font-mono text-rose-500 font-semibold">
                        -{test.negativeMarks} neg marks
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {/* Analysis button */}
                      <button
                        onClick={() => onViewAnalysis(test)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer"
                        title="View Detailed Bakliwal Tutorials Analysis"
                      >
                        <FileSearch className="w-4 h-4" />
                      </button>

                      {/* Edit button */}
                      <button
                        onClick={() => onEdit(test)}
                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
                        title="Edit Entry"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => {
                          if (confirm(`Delete test "${test.title}"?`)) {
                            onDelete(test.id);
                          }
                        }}
                        className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
