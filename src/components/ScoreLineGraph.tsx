import React, { useState, useMemo, useRef } from 'react';
import { MockTestEntry, TrendMetric } from '../types';
import { Eye, EyeOff, Target, TrendingUp, Info } from 'lucide-react';

interface ScoreLineGraphProps {
  tests: MockTestEntry[];
  metric: TrendMetric;
  onSelectTest?: (test: MockTestEntry) => void;
  selectedTestId?: string | null;
}

interface VisibleSeries {
  total: boolean;
  physics: boolean;
  chemistry: boolean;
  maths: boolean;
  benchmark: boolean;
}

export const ScoreLineGraph: React.FC<ScoreLineGraphProps> = ({
  tests,
  metric,
  onSelectTest,
  selectedTestId,
}) => {
  const [visibleSeries, setVisibleSeries] = useState<VisibleSeries>({
    total: true,
    physics: true,
    chemistry: true,
    maths: true,
    benchmark: true,
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleSeries = (key: keyof VisibleSeries) => {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Dimensions
  const width = 960;
  const height = 380;
  const padding = { top: 30, right: 35, bottom: 50, left: 55 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Compute points and scales
  const chartData = useMemo(() => {
    if (!tests || tests.length === 0) return null;

    // Determine max Y value
    let maxY = 100;
    if (metric === 'PERCENTAGE') {
      maxY = 100;
    } else {
      const highest = Math.max(
        ...tests.map((t) => Math.max(t.totalScore, t.maxMarks || 300))
      );
      // Round to neat upper bound
      maxY = Math.ceil(Math.max(highest, 120) / 50) * 50;
    }

    const n = tests.length;
    const xStep = n > 1 ? graphWidth / (n - 1) : graphWidth / 2;

    const points = tests.map((test, index) => {
      const x = n > 1 ? padding.left + index * xStep : padding.left + graphWidth / 2;

      const totalVal = metric === 'PERCENTAGE'
        ? (test.totalScore / (test.maxMarks || 1)) * 100
        : test.totalScore;

      const pVal = metric === 'PERCENTAGE'
        ? (test.physics.marks / (test.physics.maxMarks || 1)) * 100
        : test.physics.marks;

      const cVal = metric === 'PERCENTAGE'
        ? (test.chemistry.marks / (test.chemistry.maxMarks || 1)) * 100
        : test.chemistry.marks;

      const mVal = metric === 'PERCENTAGE'
        ? (test.maths.marks / (test.maths.maxMarks || 1)) * 100
        : test.maths.marks;

      const totalY = padding.top + graphHeight - (Math.max(0, totalVal) / maxY) * graphHeight;
      const pY = padding.top + graphHeight - (Math.max(0, pVal) / maxY) * graphHeight;
      const cY = padding.top + graphHeight - (Math.max(0, cVal) / maxY) * graphHeight;
      const mY = padding.top + graphHeight - (Math.max(0, mVal) / maxY) * graphHeight;

      return {
        test,
        index,
        x,
        values: {
          total: totalVal,
          physics: pVal,
          chemistry: cVal,
          maths: mVal,
        },
        coords: {
          totalY,
          pY,
          cY,
          mY,
        },
      };
    });

    return { points, maxY };
  }, [tests, metric, graphWidth, graphHeight]);

  if (!chartData || tests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 text-center">
        <Info className="w-10 h-10 text-slate-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No mock tests to graph yet</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
          Upload a test report or add mock scores above to generate dynamic subject-wise and total trend lines.
        </p>
      </div>
    );
  }

  const { points, maxY } = chartData;

  // Generate SVG path strings
  const generatePath = (key: 'totalY' | 'pY' | 'cY' | 'mY') => {
    if (points.length === 1) {
      return `M ${points[0].x - 10} ${points[0].coords[key]} L ${points[0].x + 10} ${points[0].coords[key]}`;
    }
    return points.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.coords[key]}`;
      // Cubic Bézier smoothing
      const prev = points[idx - 1];
      const cx1 = prev.x + (curr.x - prev.x) / 2;
      const cy1 = prev.coords[key];
      const cx2 = prev.x + (curr.x - prev.x) / 2;
      const cy2 = curr.coords[key];
      return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.coords[key]}`;
    }, '');
  };

  const totalPath = generatePath('totalY');
  const physicsPath = generatePath('pY');
  const chemPath = generatePath('cY');
  const mathsPath = generatePath('mY');

  // Area under total line
  const totalAreaPath = points.length > 1
    ? `${totalPath} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`
    : '';

  // Benchmark reference line: 70% or 200 marks for mains, 55% for advanced
  const benchmarkVal = metric === 'PERCENTAGE' ? 65 : 180;
  const benchmarkY = padding.top + graphHeight - (benchmarkVal / maxY) * graphHeight;

  // Y-axis ticks
  const yTicksCount = 5;
  const yTicks = Array.from({ length: yTicksCount + 1 }, (_, i) => {
    const val = Math.round((maxY / yTicksCount) * i);
    const y = padding.top + graphHeight - (val / maxY) * graphHeight;
    return { val, y };
  });

  const activeHover = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      {/* Chart Top Controls & Legends */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Mock Score Trajectory ({metric === 'PERCENTAGE' ? 'Percentage %' : 'Absolute Marks'})
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hover over any test point for deep subject breakdown and error analysis
          </p>
        </div>

        {/* Legend series toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Total */}
          <button
            onClick={() => toggleSeries('total')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              visibleSeries.total
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-medium'
                : 'text-slate-400 dark:text-slate-500 line-through'
            }`}
            title="Toggle Total Score Line"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 inline-block" />
            <span>Total Score</span>
          </button>

          {/* Physics */}
          <button
            onClick={() => toggleSeries('physics')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              visibleSeries.physics
                ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 font-medium'
                : 'text-slate-400 dark:text-slate-500 line-through'
            }`}
            title="Toggle Physics Line"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
            <span>Physics</span>
          </button>

          {/* Chemistry */}
          <button
            onClick={() => toggleSeries('chemistry')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              visibleSeries.chemistry
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-medium'
                : 'text-slate-400 dark:text-slate-500 line-through'
            }`}
            title="Toggle Chemistry Line"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Chemistry</span>
          </button>

          {/* Mathematics */}
          <button
            onClick={() => toggleSeries('maths')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              visibleSeries.maths
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-medium'
                : 'text-slate-400 dark:text-slate-500 line-through'
            }`}
            title="Toggle Mathematics Line"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Mathematics</span>
          </button>

          {/* Benchmark line */}
          <button
            onClick={() => toggleSeries('benchmark')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
              visibleSeries.benchmark
                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                : 'text-slate-400 dark:text-slate-600 line-through'
            }`}
            title="Toggle Target Benchmark Reference"
          >
            <Target className="w-3 h-3 text-slate-500" />
            <span>Target ({metric === 'PERCENTAGE' ? '65%' : '180'})</span>
          </button>
        </div>
      </div>

      {/* Responsive SVG Graph Area */}
      <div
        ref={containerRef}
        className="relative w-full overflow-x-auto select-none mt-2 pt-2"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[620px] overflow-visible"
        >
          <defs>
            <linearGradient id="totalScoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6366F1" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map(({ val, y }) => (
            <g key={val}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/80"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500"
              >
                {metric === 'PERCENTAGE' ? `${val}%` : val}
              </text>
            </g>
          ))}

          {/* Benchmark Target Line */}
          {visibleSeries.benchmark && (
            <g>
              <line
                x1={padding.left}
                y1={benchmarkY}
                x2={width - padding.right}
                y2={benchmarkY}
                stroke="#94A3B8"
                strokeWidth="1.5"
                strokeDasharray="6 4"
                opacity="0.75"
              />
              <text
                x={width - padding.right + 4}
                y={benchmarkY + 3}
                className="text-[10px] font-mono fill-slate-400 dark:fill-slate-500"
              >
                Target
              </text>
            </g>
          )}

          {/* Total Area Fill */}
          {visibleSeries.total && totalAreaPath && (
            <path d={totalAreaPath} fill="url(#totalScoreGradient)" />
          )}

          {/* Lines */}
          {visibleSeries.maths && (
            <path
              d={mathsPath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {visibleSeries.chemistry && (
            <path
              d={chemPath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {visibleSeries.physics && (
            <path
              d={physicsPath}
              fill="none"
              stroke="#0EA5E9"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-300"
            />
          )}

          {visibleSeries.total && (
            <path
              d={totalPath}
              fill="none"
              stroke="#6366F1"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              className="transition-all duration-300"
            />
          )}

          {/* Interactive Hover Columns & Markers */}
          {points.map((pt, idx) => {
            const isHovered = hoverIndex === idx;
            const isSelected = selectedTestId === pt.test.id;

            return (
              <g
                key={`${pt.test.id}-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(idx)}
                onClick={() => onSelectTest?.(pt.test)}
              >
                {/* Vertical hover crosshair guide */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={padding.top}
                    x2={pt.x}
                    y2={padding.top + graphHeight}
                    stroke="#6366F1"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-70"
                  />
                )}

                {/* Invisible wide capture area */}
                <rect
                  x={pt.x - 22}
                  y={padding.top}
                  width="44"
                  height={graphHeight}
                  fill="transparent"
                />

                {/* X-axis tick & label */}
                <line
                  x1={pt.x}
                  y1={padding.top + graphHeight}
                  x2={pt.x}
                  y2={padding.top + graphHeight + 6}
                  stroke="currentColor"
                  className="text-slate-300 dark:text-slate-700"
                />
                <text
                  x={pt.x}
                  y={padding.top + graphHeight + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-mono tabular-nums transition-colors ${
                    isHovered || isSelected
                      ? 'fill-indigo-600 dark:fill-indigo-400 font-semibold'
                      : 'fill-slate-500 dark:fill-slate-400'
                  }`}
                >
                  #{idx + 1}
                </text>
                <text
                  x={pt.x}
                  y={padding.top + graphHeight + 34}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 dark:fill-slate-500 truncate max-w-[60px]"
                >
                  {pt.test.date ? pt.test.date.slice(5) : ''}
                </text>

                {/* Subject dots */}
                {visibleSeries.maths && (
                  <circle
                    cx={pt.x}
                    cy={pt.coords.mY}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#10B981"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                )}

                {visibleSeries.chemistry && (
                  <circle
                    cx={pt.x}
                    cy={pt.coords.cY}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#F59E0B"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                )}

                {visibleSeries.physics && (
                  <circle
                    cx={pt.x}
                    cy={pt.coords.pY}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#0EA5E9"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="transition-all"
                  />
                )}

                {visibleSeries.total && (
                  <circle
                    cx={pt.x}
                    cy={pt.coords.totalY}
                    r={isHovered || isSelected ? 7 : 5}
                    fill="#6366F1"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeHover && (
          <div
            className="absolute z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(activeHover.x / width) * 100}%`,
              top: `${Math.max(20, activeHover.coords.totalY - 14)}px`,
            }}
          >
            <div className="bg-slate-900/95 text-white dark:bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 shadow-xl w-64 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-700/60 mb-2">
                <span className="font-semibold truncate pr-2 text-slate-100">
                  {activeHover.test.title}
                </span>
                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                  {activeHover.test.date}
                </span>
              </div>

              {/* Score summary */}
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-slate-300 font-medium">Total Score:</span>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono tabular-nums text-indigo-400">
                    {activeHover.test.totalScore}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    /{activeHover.test.maxMarks} (
                    {Math.round((activeHover.test.totalScore / (activeHover.test.maxMarks || 1)) * 100)}%)
                  </span>
                </div>
              </div>

              {/* Subject scores grid */}
              <div className="grid grid-cols-3 gap-1.5 pt-1.5 border-t border-slate-800 text-center font-mono">
                <div className="bg-slate-800/60 rounded px-1 py-1">
                  <div className="text-[9px] text-sky-400 font-sans">Physics</div>
                  <div className="font-bold tabular-nums text-slate-100">
                    {activeHover.test.physics.marks}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    /{activeHover.test.physics.maxMarks}
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded px-1 py-1">
                  <div className="text-[9px] text-amber-400 font-sans">Chem</div>
                  <div className="font-bold tabular-nums text-slate-100">
                    {activeHover.test.chemistry.marks}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    /{activeHover.test.chemistry.maxMarks}
                  </div>
                </div>
                <div className="bg-slate-800/60 rounded px-1 py-1">
                  <div className="text-[9px] text-emerald-400 font-sans">Maths</div>
                  <div className="font-bold tabular-nums text-slate-100">
                    {activeHover.test.maths.marks}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    /{activeHover.test.maths.maxMarks}
                  </div>
                </div>
              </div>

              {/* Accuracy & Negatives info */}
              {(activeHover.test.negativeMarks !== undefined || activeHover.test.accuracy !== undefined) && (
                <div className="flex items-center justify-between text-[10px] text-slate-300 mt-2 pt-1.5 border-t border-slate-800">
                  {activeHover.test.negativeMarks !== undefined && (
                    <span>Lost: <strong className="text-rose-400 font-mono">-{activeHover.test.negativeMarks}</strong> neg marks</span>
                  )}
                  {activeHover.test.accuracy !== undefined && (
                    <span>Accuracy: <strong className="text-emerald-400 font-mono">{activeHover.test.accuracy}%</strong></span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
