// src/features/dashboard/components/ChartControls.jsx

import React from 'react';
import { Play, Pause, Download, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

const TIME_RANGES = [
  { label: '1m', value: 60, key: '1min' },
  { label: '5m', value: 300, key: '5min' },
  { label: '15m', value: 900, key: '15min' },
  { label: '30m', value: 1800, key: '30min' },
  { label: '1h', value: 3600, key: '1hr' },
  { label: '6h', value: 21600, key: '6hr' },
  { label: '24h', value: 86400, key: '24hr' }
];

const ChartControls = ({
  isLive,
  onToggleLive,
  timeRange,
  onTimeRangeChange,
  onExport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  dataPoints,
  isCompact = false
}) => {
  
  if (isCompact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={onToggleLive}
          className={`p-1.5 rounded-lg transition-all ${
            isLive 
              ? 'bg-emerald-500 text-white shadow-sm' 
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
          }`}
          title={isLive ? 'Pause updates' : 'Resume live updates'}
        >
          {isLive ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {TIME_RANGES.map(range => (
          <button
            key={range.key}
            onClick={() => onTimeRangeChange(range.value)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-all ${
              timeRange === range.value
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {range.label}
          </button>
        ))}

        <button
          onClick={onExport}
          disabled={dataPoints === 0}
          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export CSV"
        >
          <Download size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleLive}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold text-sm transition-all ${
              isLive 
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            {isLive ? <Pause size={16} /> : <Play size={16} />}
            {isLive ? 'Live' : 'Paused'}
          </button>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={onZoomIn}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={onZoomOut}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={onResetZoom}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <button
          onClick={onExport}
          disabled={dataPoints === 0}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Time Range:
        </span>
        {TIME_RANGES.map(range => (
          <button
            key={range.key}
            onClick={() => onTimeRangeChange(range.value)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              timeRange === range.value
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
        <span>Data Points: <strong className="text-slate-700 dark:text-slate-300">{dataPoints}</strong></span>
        <span className={`font-semibold ${isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
          {isLive ? '● Live Updates' : '○ Paused'}
        </span>
      </div>
    </div>
  );
};

export default ChartControls;