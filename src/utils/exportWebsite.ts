import { MockTestEntry } from '../types';

/**
 * Downloads a standalone, single-file HTML snapshot of the website
 * in the exact state it is at that moment.
 */
export function downloadWebsiteSnapshot(tests: MockTestEntry[], activeFilter: string = 'ALL') {
  const serializedTests = JSON.stringify(tests, null, 2);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JEE Mock Progress Tracker - Snapshot (${dateFormatted})</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-4 sm:p-8">
  <div class="max-w-6xl mx-auto space-y-6">
    <!-- Top Header -->
    <header class="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-lg">
      <div>
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-indigo-500"></span>
          <h1 class="text-xl font-bold tracking-tight">JEE Mock Progress Tracker</h1>
          <span class="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded font-mono">Offline Snapshot</span>
        </div>
        <p class="text-xs text-slate-400 mt-1">
          Archived on ${dateFormatted} · Total Mock Tests Logged: <strong class="text-white">${tests.length}</strong>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="window.print()" class="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 hover:bg-slate-600 text-white cursor-pointer transition">
          Print / Save PDF
        </button>
        <button onclick="downloadJsonBackup()" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer transition">
          Export JSON
        </button>
      </div>
    </header>

    <!-- Filter Segmented Tabs -->
    <div class="flex items-center gap-2 p-1.5 rounded-xl bg-slate-800 border border-slate-700 max-w-md">
      <button onclick="filterView('ALL')" id="tab-ALL" class="flex-1 py-1.5 text-xs font-medium rounded-lg transition bg-indigo-600 text-white">All Tests</button>
      <button onclick="filterView('JEE_MAINS')" id="tab-JEE_MAINS" class="flex-1 py-1.5 text-xs font-medium rounded-lg transition text-slate-300 hover:text-white">JEE Mains</button>
      <button onclick="filterView('JEE_ADVANCED')" id="tab-JEE_ADVANCED" class="flex-1 py-1.5 text-xs font-medium rounded-lg transition text-slate-300 hover:text-white">JEE Advanced</button>
    </div>

    <!-- Summary Metrics -->
    <div id="metrics-container" class="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
      <!-- Injected dynamically -->
    </div>

    <!-- SVG Line Chart Container -->
    <div class="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-lg space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-sm font-bold text-white">Subject-wise & Total Score Trajectory</h2>
          <p class="text-xs text-slate-400">Interactive SVG Line Graph</p>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Total</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-sky-400"></span> Physics</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Chemistry</span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Maths</span>
        </div>
      </div>
      <div id="chart-mount" class="overflow-x-auto">
        <!-- SVG will be rendered here -->
      </div>
    </div>

    <!-- Table of Tests -->
    <div class="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-lg overflow-x-auto">
      <h3 class="text-sm font-bold text-white mb-3">All Mock Test Records</h3>
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="border-b border-slate-700 text-slate-400">
            <th class="py-2.5 px-3">#</th>
            <th class="py-2.5 px-3">Test Title</th>
            <th class="py-2.5 px-3">Exam</th>
            <th class="py-2.5 px-3">Date</th>
            <th class="py-2.5 px-3 text-right">Physics</th>
            <th class="py-2.5 px-3 text-right">Chemistry</th>
            <th class="py-2.5 px-3 text-right">Maths</th>
            <th class="py-2.5 px-3 text-right">Total Score</th>
            <th class="py-2.5 px-3 text-center">Acc / Neg</th>
          </tr>
        </thead>
        <tbody id="table-mount" class="divide-y divide-slate-700/60 font-mono">
          <!-- Injected rows -->
        </tbody>
      </table>
    </div>
  </div>

  <script>
    const INITIAL_DATA = ${serializedTests};
    let currentFilter = '${activeFilter}';

    function downloadJsonBackup() {
      const blob = new Blob([JSON.stringify(INITIAL_DATA, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jee_mock_tests_backup.json';
      a.click();
    }

    function filterView(filter) {
      currentFilter = filter;
      ['ALL', 'JEE_MAINS', 'JEE_ADVANCED'].forEach(f => {
        const el = document.getElementById('tab-' + f);
        if (el) {
          if (f === filter) {
            el.className = 'flex-1 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white';
          } else {
            el.className = 'flex-1 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:text-white';
          }
        }
      });
      render();
    }

    function render() {
      const filtered = INITIAL_DATA.filter(t => currentFilter === 'ALL' || t.examType === currentFilter);
      renderMetrics(filtered);
      renderChart(filtered);
      renderTable(filtered);
    }

    function renderMetrics(data) {
      const container = document.getElementById('metrics-container');
      if (!data.length) {
        container.innerHTML = '<div class="col-span-4 p-4 text-center text-slate-400">No mock tests found for this filter</div>';
        return;
      }
      const count = data.length;
      const avgScore = Math.round(data.reduce((a, b) => a + b.totalScore, 0) / count);
      const highest = Math.max(...data.map(d => d.totalScore));
      const avgPct = Math.round(data.reduce((a, b) => a + ((b.totalScore / (b.maxMarks || 1)) * 100), 0) / count);

      container.innerHTML = \`
        <div class="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
          <div class="text-[11px] font-sans text-slate-400">Tests Logged</div>
          <div class="text-xl font-bold text-white mt-1">\${count}</div>
          <div class="text-[11px] text-indigo-400 font-sans">\${currentFilter}</div>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
          <div class="text-[11px] font-sans text-slate-400">Average Score</div>
          <div class="text-xl font-bold text-white mt-1">\${avgScore}</div>
          <div class="text-[11px] text-emerald-400 font-sans">\${avgPct}% Average</div>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
          <div class="text-[11px] font-sans text-slate-400">Personal Best</div>
          <div class="text-xl font-bold text-indigo-400 mt-1">\${highest}</div>
          <div class="text-[11px] text-slate-400 font-sans">Top Score</div>
        </div>
        <div class="p-3.5 rounded-xl bg-slate-800 border border-slate-700">
          <div class="text-[11px] font-sans text-slate-400">Status</div>
          <div class="text-xl font-bold text-emerald-400 mt-1">Active</div>
          <div class="text-[11px] text-slate-400 font-sans">Prep Tracked</div>
        </div>
      \`;
    }

    function renderTable(data) {
      const container = document.getElementById('table-mount');
      if (!data.length) {
        container.innerHTML = '<tr><td colspan="9" class="p-4 text-center text-slate-400">No mock tests available</td></tr>';
        return;
      }
      container.innerHTML = data.map((t, idx) => \`
        <tr class="hover:bg-slate-700/30">
          <td class="py-2.5 px-3 text-slate-400">#\${idx + 1}</td>
          <td class="py-2.5 px-3 font-sans font-medium text-white">
            <div>\${t.title}</div>
            \${t.studentName ? \`<div class="text-[10px] text-slate-400">\${t.studentName} \${t.rollNo ? '· ' + t.rollNo : ''}</div>\` : ''}
          </td>
          <td class="py-2.5 px-3 font-sans text-slate-300">
            <div>\${t.examType === 'JEE_MAINS' ? 'Mains' : 'Advanced'}</div>
            \${t.institute ? \`<div class="text-[10px] text-slate-400">\${t.institute}</div>\` : ''}
          </td>
          <td class="py-2.5 px-3 text-slate-400">\${t.date}</td>
          <td class="py-2.5 px-3 text-right text-sky-400 font-bold">\${t.physics.marks}/\${t.physics.maxMarks}</td>
          <td class="py-2.5 px-3 text-right text-amber-400 font-bold">\${t.chemistry.marks}/\${t.chemistry.maxMarks}</td>
          <td class="py-2.5 px-3 text-right text-emerald-400 font-bold">\${t.maths.marks}/\${t.maths.maxMarks}</td>
          <td class="py-2.5 px-3 text-right text-indigo-300 font-bold">
            <div>\${t.totalScore}/\${t.maxMarks}</div>
            \${t.overallRank ? \`<div class="text-[10px] text-indigo-400">Rank \${t.overallRank} \${t.marksAvgRatio ? '(' + t.marksAvgRatio + 'x Avg)' : ''}</div>\` : ''}
          </td>
          <td class="py-2.5 px-3 text-center text-slate-400">\${t.accuracy || '-'}% / -\${t.negativeMarks || 0}</td>
        </tr>
      \`).join('');
    }

    function renderChart(data) {
      const mount = document.getElementById('chart-mount');
      if (!data.length) {
        mount.innerHTML = '<div class="py-12 text-center text-slate-400">No tests to chart</div>';
        return;
      }

      const w = 920;
      const h = 340;
      const pad = { top: 20, right: 30, bottom: 40, left: 50 };
      const gw = w - pad.left - pad.right;
      const gh = h - pad.top - pad.bottom;

      const highest = Math.max(...data.map(d => Math.max(d.totalScore, d.maxMarks || 300)));
      const maxY = Math.ceil(Math.max(highest, 120) / 50) * 50;

      const n = data.length;
      const xStep = n > 1 ? gw / (n - 1) : gw / 2;

      const pts = data.map((t, idx) => ({
        x: n > 1 ? pad.left + idx * xStep : pad.left + gw / 2,
        totalY: pad.top + gh - (t.totalScore / maxY) * gh,
        pY: pad.top + gh - (t.physics.marks / maxY) * gh,
        cY: pad.top + gh - (t.chemistry.marks / maxY) * gh,
        mY: pad.top + gh - (t.maths.marks / maxY) * gh,
        test: t,
        idx
      }));

      function getPath(key) {
        return pts.reduce((acc, curr, i) => {
          if (i === 0) return 'M ' + curr.x + ' ' + curr[key];
          const prev = pts[i - 1];
          const cx = prev.x + (curr.x - prev.x) / 2;
          return acc + ' C ' + cx + ' ' + prev[key] + ', ' + cx + ' ' + curr[key] + ', ' + curr.x + ' ' + curr[key];
        }, '');
      }

      const svg = \`
        <svg viewBox="0 0 \${w} \${h}" class="w-full h-auto min-w-[600px]">
          <!-- Grid lines -->
          \${[0, 1, 2, 3, 4].map(i => {
            const val = Math.round((maxY / 4) * i);
            const y = pad.top + gh - (val / maxY) * gh;
            return \`
              <line x1="\${pad.left}" y1="\${y}" x2="\${w - pad.right}" y2="\${y}" stroke="#334155" stroke-dasharray="3 3"/>
              <text x="\${pad.left - 8}" y="\${y + 4}" fill="#64748B" font-size="10" text-anchor="end" font-family="monospace">\${val}</text>
            \`;
          }).join('')}

          <!-- Lines -->
          <path d="\${getPath('mY')}" fill="none" stroke="#10B981" stroke-width="2"/>
          <path d="\${getPath('cY')}" fill="none" stroke="#F59E0B" stroke-width="2"/>
          <path d="\${getPath('pY')}" fill="none" stroke="#0EA5E9" stroke-width="2"/>
          <path d="\${getPath('totalY')}" fill="none" stroke="#6366F1" stroke-width="3"/>

          <!-- Points -->
          \${pts.map(p => \`
            <g>
              <line x1="\${p.x}" y1="\${pad.top + gh}" x2="\${p.x}" y2="\${pad.top + gh + 5}" stroke="#475569"/>
              <text x="\${p.x}" y="\${pad.top + gh + 18}" fill="#94A3B8" font-size="10" text-anchor="middle" font-family="monospace">#\${p.idx + 1}</text>
              <circle cx="\${p.x}" cy="\${p.mY}" r="3" fill="#10B981" stroke="#fff" stroke-width="1"/>
              <circle cx="\${p.x}" cy="\${p.cY}" r="3" fill="#F59E0B" stroke="#fff" stroke-width="1"/>
              <circle cx="\${p.x}" cy="\${p.pY}" r="3" fill="#0EA5E9" stroke="#fff" stroke-width="1"/>
              <circle cx="\${p.x}" cy="\${p.totalY}" r="4.5" fill="#6366F1" stroke="#fff" stroke-width="1.5"/>
            </g>
          \`).join('')}
        </svg>
      \`;

      mount.innerHTML = svg;
    }

    // Initial render
    render();
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jee-mock-tracker-snapshot-${timestamp}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a clean JSON file containing all mock tests.
 */
export function downloadJsonData(tests: MockTestEntry[]) {
  const blob = new Blob([JSON.stringify(tests, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jee_mock_tests_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
