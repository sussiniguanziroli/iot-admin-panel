import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import ReactECharts from 'echarts-for-react';
import { format } from 'date-fns';
import { BookMarked, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const SnapshotChart = ({ points, unit }) => {
    const option = useMemo(() => {
        const data = points.map(p => [p.t, p.v]);

        return {
            backgroundColor: 'transparent',
            animation: false,
            grid: {
                top: 16,
                right: 16,
                bottom: 80,
                left: 56
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                borderWidth: 1,
                textStyle: { color: '#f1f5f9', fontSize: 12 },
                formatter: (params) => {
                    const p = params[0];
                    const time = format(new Date(p.value[0]), 'HH:mm:ss.SSS');
                    const val = typeof p.value[1] === 'number' ? p.value[1].toFixed(4) : p.value[1];
                    return `<div style="font-size:11px;color:#94a3b8;margin-bottom:4px">${time}</div>
                            <div style="font-size:14px;font-weight:700;color:#60a5fa">${val} <span style="font-size:11px;color:#94a3b8">${unit || ''}</span></div>`;
                },
                axisPointer: {
                    type: 'cross',
                    lineStyle: { color: '#3b82f6', width: 1, type: 'dashed' },
                    crossStyle: { color: '#3b82f6', width: 1 }
                }
            },
            xAxis: {
                type: 'time',
                axisLine: { lineStyle: { color: '#334155' } },
                axisTick: { lineStyle: { color: '#334155' } },
                axisLabel: {
                    color: '#64748b',
                    fontSize: 10,
                    formatter: (val) => format(new Date(val), 'HH:mm:ss')
                },
                splitLine: { show: false }
            },
            yAxis: {
                type: 'value',
                axisLine: { show: false },
                axisTick: { show: false },
                axisLabel: {
                    color: '#64748b',
                    fontSize: 10,
                    formatter: (val) => `${val}${unit ? ' ' + unit : ''}`
                },
                splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } }
            },
            dataZoom: [
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
                    borderColor: '#334155',
                    backgroundColor: '#0f172a',
                    fillerColor: 'rgba(59,130,246,0.15)',
                    handleStyle: { color: '#3b82f6', borderColor: '#3b82f6' },
                    moveHandleStyle: { color: '#3b82f6' },
                    selectedDataBackground: {
                        lineStyle: { color: '#3b82f6' },
                        areaStyle: { color: '#3b82f6' }
                    },
                    textStyle: { color: '#64748b', fontSize: 10 },
                    labelFormatter: (val) => format(new Date(val), 'HH:mm:ss')
                }
            ],
            series: [
                {
                    type: 'line',
                    data,
                    smooth: false,
                    symbol: 'none',
                    lineStyle: { color: '#3b82f6', width: 2 },
                    areaStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: 'rgba(59,130,246,0.25)' },
                                { offset: 1, color: 'rgba(59,130,246,0.02)' }
                            ]
                        }
                    }
                }
            ]
        };
    }, [points, unit]);

    return (
        <div className="mt-4 bg-slate-900 rounded-xl p-2">
            <ReactECharts
                option={option}
                style={{ height: '280px', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                notMerge={true}
            />
        </div>
    );
};

const SnapshotCard = ({ snapshot, onDelete }) => {
    const [expanded, setExpanded] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        const result = await Swal.fire({
            title: 'Eliminar snapshot?',
            text: snapshot.name,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
        });
        if (result.isConfirmed) onDelete(snapshot.id);
    };

    const duration = snapshot.startTimestamp && snapshot.endTimestamp
        ? Math.round((new Date(snapshot.endTimestamp) - new Date(snapshot.startTimestamp)) / 1000)
        : null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                        <BookMarked size={16} className="text-blue-500" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{snapshot.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {snapshot.machineName} · {snapshot.widgetTitle} · {snapshot.dataKey}
                            {snapshot.unit ? ` (${snapshot.unit})` : ''}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            {snapshot.pointCount?.toLocaleString()} pts
                        </span>
                        {duration !== null && (
                            <span className="text-[10px] text-slate-400">{duration}s</span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 hidden md:block">
                        {snapshot.createdAt ? format(new Date(snapshot.createdAt), 'dd/MM/yy HH:mm') : ''}
                    </span>
                    <button
                        onClick={handleDelete}
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        <Trash2 size={15} />
                    </button>
                    {expanded
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />
                    }
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                        <span><strong className="text-slate-700 dark:text-slate-300">Planta:</strong> {snapshot.locationName}</span>
                        <span><strong className="text-slate-700 dark:text-slate-300">Desde:</strong> {snapshot.startTimestamp ? format(new Date(snapshot.startTimestamp), 'dd/MM/yy HH:mm:ss') : '—'}</span>
                        <span><strong className="text-slate-700 dark:text-slate-300">Hasta:</strong> {snapshot.endTimestamp ? format(new Date(snapshot.endTimestamp), 'dd/MM/yy HH:mm:ss') : '—'}</span>
                        <span><strong className="text-slate-700 dark:text-slate-300">Topic:</strong> <code className="font-mono">{snapshot.topic}</code></span>
                    </div>
                    {snapshot.points && snapshot.points.length > 0 && (
                        <SnapshotChart points={snapshot.points} unit={snapshot.unit} />
                    )}
                </div>
            )}
        </div>
    );
};

const SnapshotsLibrary = ({ tenantId }) => {
    const [snapshots, setSnapshots] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!tenantId) return;

        setLoading(true);
        setSnapshots([]);

        const run = async () => {
            try {
                const q = query(
                    collection(db, 'tenants', tenantId, 'snapshots'),
                    orderBy('createdAt', 'desc')
                );
                const snap = await getDocs(q);
                setSnapshots(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error('[SnapshotsLibrary] Load error:', e);
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [tenantId]);

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'tenants', tenantId, 'snapshots', id));
            setSnapshots(prev => prev.filter(s => s.id !== id));
            toast.success('Snapshot eliminado', { position: 'bottom-right', autoClose: 2000 });
        } catch (e) {
            console.error('[SnapshotsLibrary] Delete error:', e);
            toast.error('Error al eliminar', { position: 'top-right', autoClose: 3000 });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-sm text-slate-400 font-medium">Cargando snapshots...</p>
                </div>
            </div>
        );
    }

    if (snapshots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
                    <BookMarked size={32} className="text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Sin snapshots</h3>
                <p className="text-slate-400 text-sm mt-2 text-center max-w-sm">
                    Seleccioná un rango en el chart del dashboard y guardalo con el botón ✂️ Save.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''} guardado{snapshots.length !== 1 ? 's' : ''}
                </p>
            </div>
            {snapshots.map(s => (
                <SnapshotCard key={s.id} snapshot={s} onDelete={handleDelete} />
            ))}
        </div>
    );
};

export default SnapshotsLibrary;