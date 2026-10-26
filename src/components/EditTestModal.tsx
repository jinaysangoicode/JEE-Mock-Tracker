import React, { useState, useEffect } from 'react';
import { ExamType, MockTestEntry } from '../types';
import { Edit3, X, Check, Trash2 } from 'lucide-react';

interface EditTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: MockTestEntry) => void;
  onDelete?: (id: string) => void;
  test: MockTestEntry | null;
}

export const EditTestModal: React.FC<EditTestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  test,
}) => {
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState<ExamType>('JEE_MAINS');
  const [date, setDate] = useState('');
  const [institute, setInstitute] = useState('');
  const [notes, setNotes] = useState('');

  // Scores
  const [physicsMarks, setPhysicsMarks] = useState<number>(0);
  const [physicsMax, setPhysicsMax] = useState<number>(100);

  const [chemMarks, setChemMarks] = useState<number>(0);
  const [chemMax, setChemMax] = useState<number>(100);

  const [mathsMarks, setMathsMarks] = useState<number>(0);
  const [mathsMax, setMathsMax] = useState<number>(100);

  const [negativeMarks, setNegativeMarks] = useState<number>(0);
  const [percentileEstimate, setPercentileEstimate] = useState<string>('');

  useEffect(() => {
    if (test) {
      setTitle(test.title);
      setExamType(test.examType);
      setDate(test.date);
      setInstitute(test.institute || '');
      setNotes(test.notes || '');

      setPhysicsMarks(test.physics.marks);
      setPhysicsMax(test.physics.maxMarks || 100);

      setChemMarks(test.chemistry.marks);
      setChemMax(test.chemistry.maxMarks || 100);

      setMathsMarks(test.maths.marks);
      setMathsMax(test.maths.maxMarks || 100);

      setNegativeMarks(test.negativeMarks || 0);
      setPercentileEstimate(test.percentileEstimate || '');
    }
  }, [test]);

  if (!isOpen || !test) return null;

  const totalScore = Number(physicsMarks) + Number(chemMarks) + Number(mathsMarks);
  const totalMax = Number(physicsMax) + Number(chemMax) + Number(mathsMax);
  const percentage = Math.round((totalScore / (totalMax || 1)) * 100);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedTest: MockTestEntry = {
      ...test,
      title: title.trim() || test.title,
      examType,
      date: date || test.date,
      institute: institute.trim() || undefined,
      notes: notes.trim() || undefined,
      physics: {
        ...test.physics,
        marks: Number(physicsMarks),
        maxMarks: Number(physicsMax),
      },
      chemistry: {
        ...test.chemistry,
        marks: Number(chemMarks),
        maxMarks: Number(chemMax),
      },
      maths: {
        ...test.maths,
        marks: Number(mathsMarks),
        maxMarks: Number(mathsMax),
      },
      totalScore,
      maxMarks: totalMax,
      negativeMarks: Number(negativeMarks) || 0,
      accuracy: Math.max(60, Math.min(100, percentage + 5)),
      percentileEstimate: percentileEstimate.trim() || test.percentileEstimate,
    };

    onSave(updatedTest);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <span className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Edit3 className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold">Edit Mock Test Entry</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update scores, subject maximum marks, and test details
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Title and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Test Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Type
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExamType('JEE_MAINS')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  examType === 'JEE_MAINS'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                JEE Mains
              </button>
              <button
                type="button"
                onClick={() => setExamType('JEE_ADVANCED')}
                className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  examType === 'JEE_ADVANCED'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                JEE Advanced
              </button>
            </div>
          </div>

          {/* Subject wise marks and maximums */}
          <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3 font-mono">
            <div className="text-xs font-sans font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Subject Marks &amp; Subject Maximums</span>
              <span className="text-indigo-600 dark:text-indigo-400">
                Total: {totalScore} / {totalMax} ({percentage}%)
              </span>
            </div>

            {/* Physics */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-sans text-sky-600 dark:text-sky-400 mb-1">
                  Physics Marks
                </label>
                <input
                  type="number"
                  value={physicsMarks}
                  onChange={(e) => setPhysicsMarks(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-sky-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-sans text-slate-500 mb-1">
                  Physics Max Marks
                </label>
                <input
                  type="number"
                  value={physicsMax}
                  onChange={(e) => setPhysicsMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            {/* Chemistry */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-sans text-amber-600 dark:text-amber-400 mb-1">
                  Chemistry Marks
                </label>
                <input
                  type="number"
                  value={chemMarks}
                  onChange={(e) => setChemMarks(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-sans text-slate-500 mb-1">
                  Chemistry Max Marks
                </label>
                <input
                  type="number"
                  value={chemMax}
                  onChange={(e) => setChemMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>

            {/* Mathematics */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-[11px] font-sans text-emerald-600 dark:text-emerald-400 mb-1">
                  Mathematics Marks
                </label>
                <input
                  type="number"
                  value={mathsMarks}
                  onChange={(e) => setMathsMarks(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-sans text-slate-500 mb-1">
                  Mathematics Max Marks
                </label>
                <input
                  type="number"
                  value={mathsMax}
                  onChange={(e) => setMathsMax(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>
          </div>

          {/* Negatives & Percentile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Negative Marks Lost
              </label>
              <input
                type="number"
                min="0"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Percentile / Rank Bracket
              </label>
              <input
                type="text"
                placeholder="e.g. 98.4%ile or AIR ~2500"
                value={percentileEstimate}
                onChange={(e) => setPercentileEstimate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Personal Remarks / Error Log Note
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Lost marks in Maths 3D geometry; Physics was solid."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete test "${test.title}"?`)) {
                    onDelete(test.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Entry</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
