import React, { useState, useRef, useMemo, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import BaseWidget from './BaseWidget';
import ChartControls from '../features/dashboard/components/ChartControls';
import useHybridChartData from '../features/mqtt/hooks/useHybridChartData';
import useIsDark from '../shared/hooks/useIsDark';

const HEIGHT_MAP = {
    sm: '160px',
    md: '256px',
    lg: '384px',
    xl: '500px'
};

const DEFAULT_TIME_RANGE = 300;

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

const ChartWidget = ({
    id, title, topic, dataKey, color = '#3b82f6',
    customConfig, onEdit, onCustomize, height = 'md',
    payloadParsingMode, jsonPath, jsParserFunction, fallbackValue,
    machineId, unit = '',
}) => {
    const isDark = useIsDark();
    const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE);
    const [lastUpdated, setLastUpdated] = useState(null);

    const cfg = useMemo(() => {
        if (!customConfig) return { ...DEFAULT_CONFIG, color };
        try {
            const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
            return { ...DEFAULT_CONFIG, color, ...parsed };
        } catch {
            return { ...DEFAULT_CONFIG, color };
        }
    }, [customConfig, color]);

    const {
        points,
        isLoadingHistory,
        isLive,
        setIsLive,
        clipRange,
        setClipRange,
        saveSnapshot,
        getDisplayData,
        pointCount,
        liveCount,
        historicalCount,
        memoryBytes,
    } = useHybridChartData({
        widgetId: id,
        topic,
        dataKey,
        machineId,
        widgetTitle: title,
        unit,
        payloadParsingMode: payloadParsingMode || 'simple',
        jsonPath: jsonPath || '',
        jsParserFunction: jsParserFunction || '',
    });

    const displayData = useMemo(() => {
        const data = getDisplayData(timeRange);
        if (data.length > 0 && data[data.length - 1].source === 'l') {
            setLastUpdated(format(data[data.length - 1].time, 'HH:mm:ss'));
        }
        return data;
    }, [getDisplayData, timeRange]);

    const displayDataRef = useRef(displayData);
    displayDataRef.current = displayData;

    const gridColor = isDark ? '#1e293b' : '#f1f5f9';
    const axisLabelColor = isDark ? '#64748b' : '#94a3b8';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipBorder = isDark ? '#334155' : '#e2e8f0';
    const tooltipText = isDark ? '#f1f5f9' : '#1e293b';
    const tooltipSub = isDark ? '#94a3b8' : '#64748b';
    const sliderBg = isDark ? '#0f172a' : '#f8fafc';
    const sliderBorder = isDark ? '#334155' : '#e2e8f0';

    const lineTypeMap = { solid: 'solid', dashed: 'dashed', dotted: 'dotted' };

    const formatXAxis = useCallback((val) => {
        if (timeRange > 86400) return format(val, 'MM/dd HH:mm');
        if (timeRange > 3600) return format(val, 'HH:mm');
        return format(val, 'HH:mm:ss');
    }, [timeRange]);

    const option = useMemo(() => {
        const seriesData = displayData.map(p => [p.time, p.v !== undefined ? p.v : p.value]);

        return {
            backgroundColor: 'transparent',
            animation: false,
            grid: {
                top: 12,
                right: 12,
                bottom: cfg.showDataZoom ? 72 : 24,
                left: 52
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderWidth: 1,
                textStyle: { color: tooltipText, fontSize: 12 },
                formatter: (params) => {
                    const p = params[0];
                    if (!p) return '';
                    const time = format(new Date(p.value[0]), 'HH:mm:ss.SSS');
                    const val = typeof p.value[1] === 'number' ? p.value[1].toFixed(4) : p.value[1];
                    const src = displayData[p.dataIndex]?.source === 'l' ? '● Live' : '◆ Historical';
                    const srcColor = displayData[p.dataIndex]?.source === 'l' ? '#10b981' : '#60a5fa';
                    return `<div style="font-size:11px;color:${tooltipSub};margin-bottom:4px">${time}</div>
                            <div style="font-size:15px;font-weight:700;color:${cfg.color}">${val} <span style="font-size:11px;color:${tooltipSub}">${unit || ''}</span></div>
                            <div style="font-size:10px;color:${srcColor};margin-top:2px">${src}</div>`;
                },
                axisPointer: {
                    type: cfg.showCrosshair ? 'cross' : 'line',
                    lineStyle: { color: cfg.color, width: 1, type: 'dashed' },
                    crossStyle: { color: cfg.color, width: 1 }
                }
            },
            xAxis: {
                type: 'time',
                axisLine: { lineStyle: { color: sliderBorder } },
                axisTick: { lineStyle: { color: sliderBorder } },
                axisLabel: {
                    color: axisLabelColor,
                    fontSize: 10,
                    formatter: (val) => formatXAxis(val)
                },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: axisLabelColor,
                    fontSize: 10,
                    formatter: (val) => `${val}${unit ? ' ' + unit : ''}`
                },
                splitLine: { lineStyle: { color: gridColor, type: 'dashed' } }
            },
            dataZoom: cfg.showDataZoom ? [
                {
                    type: 'inside',
                    start: 0,
                    end: 100,
                    zoomOnMouseWheel: true,
                    moveOnMouseMove: true,
                    preventDefaultMouseMove: false
                },
                {
                    type: 'slider',
                    start: 0,
                    end: 100,
                    height: 24,
                    bottom: 8,
                    borderColor: sliderBorder,
                    backgroundColor: sliderBg,
                    fillerColor: `${cfg.color}22`,
                    handleStyle: { color: cfg.color, borderColor: cfg.color },
                    moveHandleStyle: { color: cfg.color },
                    selectedDataBackground: {
                        lineStyle: { color: cfg.color },
                        areaStyle: { color: cfg.color }
                    },
                    textStyle: { color: axisLabelColor, fontSize: 10 },
                    labelFormatter: (val) => format(new Date(val), 'HH:mm:ss')
                }
            ] : [],
            series: [
                {
                    type: 'line',
                    data: seriesData,
                    smooth: cfg.smooth,
                    symbol: cfg.symbolSize > 0 ? 'circle' : 'none',
                    symbolSize: cfg.symbolSize,
                    lineStyle: {
                        color: cfg.color,
                        width: cfg.lineWidth,
                        type: lineTypeMap[cfg.lineType] || 'solid'
                    },
                    areaStyle: cfg.areaFill ? {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: `${cfg.color}40` },
                                { offset: 1, color: `${cfg.color}05` }
                            ]
                        }
                    } : undefined,
                    emphasis: { disabled: true }
                }
            ]
        };
    }, [displayData, cfg, isDark, unit, formatXAxis, gridColor, axisLabelColor, tooltipBg, tooltipBorder, tooltipText, tooltipSub, sliderBg, sliderBorder]);

    const handleBrushChange = useCallback((params) => {
        const zoom = params.batch?.[0] ?? params;
        let startTime, endTime;
    
        if (zoom.startValue !== undefined && zoom.endValue !== undefined) {
            startTime = zoom.startValue;
            endTime = zoom.endValue;
        } else if (zoom.start !== undefined && zoom.end !== undefined) {
            const data = displayDataRef.current;
            if (data.length < 2) return;
            const startIdx = Math.floor((zoom.start / 100) * (data.length - 1));
            const endIdx = Math.ceil((zoom.end / 100) * (data.length - 1));
            startTime = data[startIdx]?.time;
            endTime = data[endIdx]?.time;
        }
    
        if (startTime !== undefined && endTime !== undefined && startTime !== endTime) {
            setClipRange({ startTime, endTime });
        }
    }, [setClipRange]);

    const onChartEvents = useMemo(() => ({
        'datazoom': handleBrushChange
    }), [handleBrushChange]);

    const handleSaveSnapshot = useCallback(async () => {
        const result = await Swal.fire({
            title: 'Save Snapshot',
            input: 'text',
            inputLabel: 'Snapshot name',
            inputPlaceholder: 'e.g. Motor 4 startup - 03/03/2026',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            inputValidator: (value) => {
                if (!value || !value.trim()) return 'Please enter a name';
            }
        });

        if (!result.isConfirmed) return;

        try {
            await saveSnapshot(result.value.trim());
            toast.success('Snapshot saved to library', { position: 'bottom-right', autoClose: 2000 });
            setClipRange(null);
        } catch (err) {
            console.error('[ChartWidget] Save snapshot error:', err);
            toast.error('Failed to save snapshot', { position: 'top-right', autoClose: 3000 });
        }
    }, [saveSnapshot, setClipRange]);

    const handleExport = useCallback(() => {
        if (displayData.length === 0) return;
        const csvContent = [
            ['Timestamp', 'Value', 'Source'],
            ...displayData.map(p => [
                format(p.time, 'yyyy-MM-dd HH:mm:ss'),
                p.value,
                p.source === 'h' ? 'historical' : 'live'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/\s+/g, '-')}-${format(Date.now(), 'yyyy-MM-dd-HHmmss')}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [displayData, title]);

    const chartHeight = HEIGHT_MAP[height] || HEIGHT_MAP.md;
    const memoryKB = Math.round(memoryBytes / 1024);

    return (
        <BaseWidget
            id={id}
            title={title}
            icon={TrendingUp}
            lastUpdated={lastUpdated}
            onEdit={onEdit}
            onCustomize={onCustomize}
        >
            <div className="space-y-3">
                <ChartControls
                    isLive={isLive}
                    onToggleLive={() => setIsLive(!isLive)}
                    timeRange={timeRange}
                    onTimeRangeChange={setTimeRange}
                    onExport={handleExport}
                    dataPoints={displayData.length}
                    clipRange={clipRange}
                    onSaveSnapshot={handleSaveSnapshot}
                    onClearClip={() => setClipRange(null)}
                    isCompact={true}
                />

                {isLoadingHistory ? (
                    <div style={{ height: chartHeight }} className="flex items-center justify-center">
                        <div className="text-center text-slate-400">
                            <Loader2 size={32} className="animate-spin mx-auto mb-2 text-blue-500" />
                            <p className="text-sm font-medium">Loading 7 days of history...</p>
                        </div>
                    </div>
                ) : displayData.length === 0 ? (
                    <div style={{ height: chartHeight }} className="flex items-center justify-center text-slate-400 dark:text-slate-600">
                        <div className="text-center">
                            <TrendingUp size={48} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm font-medium">
                                {pointCount === 0 ? 'Waiting for data...' : 'No data in selected range'}
                            </p>
                            <p className="text-xs mt-1 font-mono">{topic}</p>
                            {pointCount > 0 && (
                                <p className="text-xs text-blue-500 mt-2">{pointCount} points in buffer — try a wider range</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <ReactECharts
                        option={option}
                        style={{ height: chartHeight, width: '100%' }}
                        opts={{ renderer: 'canvas' }}
                        notMerge={false}
                        lazyUpdate={true}
                        onEvents={onChartEvents}
                    />
                )}

                {clipRange && (
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-2">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold text-center">
                            ✂️ Clip: {format(clipRange.startTime, 'HH:mm:ss')} → {format(clipRange.endTime, 'HH:mm:ss')} &nbsp;
                            ({points.filter(p => p.time >= clipRange.startTime && p.time <= clipRange.endTime).length} pts)
                        </p>
                    </div>
                )}

                {!isLive && (
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-2 text-center">
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                            ⏸️ Live paused — Click Play to resume
                        </p>
                    </div>
                )}

                <div className="flex justify-between text-[10px] text-slate-400">
                    <span>◆ {historicalCount} hist</span>
                    <span>● {liveCount} live</span>
                    <span>{memoryKB} KB</span>
                    <span>{displayData.length} shown</span>
                </div>
            </div>
        </BaseWidget>
    );
};

export default ChartWidget;