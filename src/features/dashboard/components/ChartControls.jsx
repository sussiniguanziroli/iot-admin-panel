import React from 'react';
import { Play, Pause, Download, Scissors, X } from 'lucide-react';

const TIME_RANGES = [
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
  { label: '30m', value: 1800 },
  { label: '1h', value: 3600 },
  { label: '6h', value: 21600 },
  { label: '24h', value: 86400 },
  { label: '3d', value: 259200 },
  { label: '7d', value: 604800 },
];

const ChartControls = ({
  isLive,
  onToggleLive,
  timeRange,
  onTimeRangeChange,
  onExport,
  dataPoints,
  clipRange,
  onSaveSnapshot,
  onClearClip,
  isCompact = false,
}) => {
  if (isCompact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={onToggleLive}
          className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
            isLive
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
          }`}
          title={isLive ? 'Pause live updates' : 'Resume live updates'}
        >
          {isLive ? <Pause size={14} /> : <Play size={14} />}
        </button>

        {TIME_RANGES.map(range => (
          <button
            key={range.value}
            onClick={() => onTimeRangeChange(range.value)}
            className={`px-2 py-1 text-[10px] font-bold rounded transition-all flex-shrink-0 ${
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
          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Export CSV"
        >
          <Download size={14} />
        </button>

        {clipRange && (
          <>
            <button
              onClick={onSaveSnapshot}
              className="flex items-center gap-1 px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition-colors flex-shrink-0"
              title="Save snapshot"
            >
              <Scissors size={12} />
              Save
            </button>
            <button
              onClick={onClearClip}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          </>
        )}
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
                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            {isLive ? <Pause size={16} /> : <Play size={16} />}
            {isLive ? 'Live' : 'Paused'}
          </button>

          {clipRange && (
            <button
              onClick={onSaveSnapshot}
              className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors shadow-lg shadow-blue-500/30"
            >
              <Scissors size={16} />
              Save Snapshot
            </button>
          )}

          {clipRange && (
            <button
              onClick={onClearClip}
              className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
              title="Clear clip selection"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={onExport}
          disabled={dataPoints === 0}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Range:
        </span>
        {TIME_RANGES.map(range => (
          <button
            key={range.value}
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
        <span>Showing: <strong className="text-slate-700 dark:text-slate-300">{dataPoints}</strong> pts</span>
        <span className={`font-semibold ${isLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
          {isLive ? '● Live' : '○ Paused'}
        </span>
      </div>
    </div>
  );
};

export default ChartControls;
