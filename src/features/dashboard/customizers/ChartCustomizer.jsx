import React, { useState, useEffect } from 'react';
import { X, Save, TrendingUp, Palette, Activity, Code } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import ReactECharts from 'echarts-for-react';
import useIsDark from '../../../shared/hooks/useIsDark';

const DEFAULT_CONFIG = {
    color: '#3b82f6',
    lineWidth: 2,
    lineType: 'solid',
    smooth: false,
    areaFill: true,
    showDataZoom: true,
    showCrosshair: true,
    symbolSize: 0
};

const PRESET_COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Lime', value: '#84cc16' }
];

const LINE_TYPES = [
    { name: 'Solid', value: 'solid' },
    { name: 'Dashed', value: 'dashed' },
    { name: 'Dotted', value: 'dotted' }
];

const PREVIEW_DATA = Array.from({ length: 60 }, (_, i) => [
    Date.now() - (60 - i) * 5000,
    40 + Math.sin(i * 0.3) * 15 + Math.random() * 5
]);

const ChartCustomizer = ({ isOpen, onClose, onSave, widget }) => {
    const isDark = useIsDark();
    const [cfg, setCfg] = useState(DEFAULT_CONFIG);

    useEffect(() => {
        if (widget?.customConfig) {
            try {
                const parsed = typeof widget.customConfig === 'string'
                    ? JSON.parse(widget.customConfig)
                    : widget.customConfig;
                setCfg({ ...DEFAULT_CONFIG, ...parsed });
            } catch {
                setCfg(DEFAULT_CONFIG);
            }
        } else {
            setCfg(DEFAULT_CONFIG);
        }
    }, [widget]);

    if (!isOpen) return null;

    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const axisColor = isDark ? '#64748b' : '#94a3b8';
    const sliderBg = isDark ? '#0f172a' : '#f8fafc';
    const sliderBorder = isDark ? '#334155' : '#e2e8f0';

    const previewOption = {
        backgroundColor: 'transparent',
        animation: false,
        grid: { top: 8, right: 8, bottom: cfg.showDataZoom ? 60 : 20, left: 44 },
        tooltip: { trigger: 'axis', axisPointer: { type: cfg.showCrosshair ? 'cross' : 'line', lineStyle: { color: cfg.color, type: 'dashed' } } },
        xAxis: {
            type: 'time',
            axisLine: { lineStyle: { color: sliderBorder } },
            axisTick: { show: false },
            axisLabel: { color: axisColor, fontSize: 9 },
            splitLine: { show: false }
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: axisColor, fontSize: 9 },
            splitLine: { lineStyle: { color: gridColor, type: 'dashed' } }
        },
        dataZoom: cfg.showDataZoom ? [
            { type: 'inside', start: 0, end: 100 },
            {
                type: 'slider', start: 0, end: 100, height: 20, bottom: 4,
                borderColor: sliderBorder, backgroundColor: sliderBg,
                fillerColor: `${cfg.color}22`,
                handleStyle: { color: cfg.color, borderColor: cfg.color },
                textStyle: { color: axisColor, fontSize: 9 }
            }
        ] : [],
        series: [{
            type: 'line',
            data: PREVIEW_DATA,
            smooth: cfg.smooth,
            symbol: cfg.symbolSize > 0 ? 'circle' : 'none',
            symbolSize: cfg.symbolSize,
            lineStyle: { color: cfg.color, width: cfg.lineWidth, type: cfg.lineType },
            areaStyle: cfg.areaFill ? {
                color: {
                    type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                    colorStops: [
                        { offset: 0, color: `${cfg.color}40` },
                        { offset: 1, color: `${cfg.color}05` }
                    ]
                }
            } : undefined
        }]
    };

    const set = (key, value) => setCfg(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        const result = await Swal.fire({
            title: 'Save Chart Configuration?',
            html: `<div class="text-left text-sm text-slate-600"><p><strong>Widget:</strong> ${widget.title}</p></div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                onSave({ ...widget, customConfig: JSON.stringify(cfg) });
                toast.success('Chart configuration saved!', { position: 'bottom-right', autoClose: 2000 });
                onClose();
            } catch {
                toast.error('Failed to save configuration', { position: 'top-right' });
            }
        }
    };

    const handleClose = async () => {
        const result = await Swal.fire({
            title: 'Discard Changes?',
            text: 'Any unsaved changes will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, discard',
            cancelButtonText: 'Keep Editing',
            reverseButtons: true
        });
        if (result.isConfirmed) onClose();
    };

    const Toggle = ({ label, value, onChange }) => (
        <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl">
                            <TrendingUp size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Chart Customizer</h2>
                            <p className="text-blue-100 text-xs mt-0.5">"{widget.title}"</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white/80 hover:text-white p-2">
                        <X size={22} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">

                    <div className="bg-slate-900 rounded-xl p-2">
                        <ReactECharts
                            option={previewOption}
                            style={{ height: '200px', width: '100%' }}
                            opts={{ renderer: 'canvas' }}
                            notMerge={false}
                            lazyUpdate={true}
                        />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Palette size={18} className="text-blue-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Color</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {PRESET_COLORS.map(preset => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => set('color', preset.value)}
                                    className={`p-3 rounded-xl border-2 transition-all ${
                                        cfg.color === preset.value
                                            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                    }`}
                                    style={{ backgroundColor: preset.value + '15' }}
                                >
                                    <div className="w-full h-5 rounded-lg" style={{ backgroundColor: preset.value }} />
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1.5">{preset.name}</p>
                                </button>
                            ))}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Custom color</label>
                            <div className="flex items-center gap-3 mt-1.5">
                                <input
                                    type="color"
                                    value={cfg.color}
                                    onChange={e => set('color', e.target.value)}
                                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 dark:border-slate-700 bg-transparent"
                                />
                                <input
                                    type="text"
                                    value={cfg.color}
                                    onChange={e => set('color', e.target.value)}
                                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <Activity size={18} className="text-blue-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Line</h3>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Width — {cfg.lineWidth}px
                            </label>
                            <input
                                type="range" min="1" max="6" step="1"
                                value={cfg.lineWidth}
                                onChange={e => set('lineWidth', parseInt(e.target.value))}
                                className="w-full h-2 mt-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Type</label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {LINE_TYPES.map(lt => (
                                    <button
                                        key={lt.value}
                                        type="button"
                                        onClick={() => set('lineType', lt.value)}
                                        className={`p-3 rounded-xl border-2 transition-all ${
                                            cfg.lineType === lt.value
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                        }`}
                                    >
                                        <svg width="100%" height="16">
                                            <line
                                                x1="4" y1="8" x2="96%" y2="8"
                                                stroke={cfg.color}
                                                strokeWidth="2.5"
                                                strokeDasharray={lt.value === 'dashed' ? '6 4' : lt.value === 'dotted' ? '2 4' : '0'}
                                            />
                                        </svg>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1">{lt.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                Data points — {cfg.symbolSize === 0 ? 'Hidden' : `${cfg.symbolSize}px`}
                            </label>
                            <input
                                type="range" min="0" max="8" step="1"
                                value={cfg.symbolSize}
                                onChange={e => set('symbolSize', parseInt(e.target.value))}
                                className="w-full h-2 mt-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-white text-sm">Display</h3>
                        <Toggle label="Area fill" value={cfg.areaFill} onChange={v => set('areaFill', v)} />
                        <Toggle label="Smooth line" value={cfg.smooth} onChange={v => set('smooth', v)} />
                        <Toggle label="Data zoom slider" value={cfg.showDataZoom} onChange={v => set('showDataZoom', v)} />
                        <Toggle label="Crosshair" value={cfg.showCrosshair} onChange={v => set('showCrosshair', v)} />
                    </div>

                    <details className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl">
                        <summary className="px-4 py-3 cursor-pointer font-bold text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors rounded-xl">
                            <Code size={16} />
                            Raw JSON
                        </summary>
                        <div className="p-4 pt-2">
                            <textarea
                                value={JSON.stringify(cfg, null, 2)}
                                onChange={(e) => {
                                    try { setCfg(JSON.parse(e.target.value)); } catch {}
                                }}
                                rows={10}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/30 rounded-lg text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                    </details>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 p-5 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                    >
                        <Save size={18} />
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartCustomizer;