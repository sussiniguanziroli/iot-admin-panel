import React, { useMemo } from 'react';
import {
    ResponsiveContainer, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const formatBucket = (bucket, granularity) => {
    if (!bucket) return '';
    const d = new Date(bucket);
    if (granularity === 'HOUR') {
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

const booleanToStep = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
        const v = value.toUpperCase();
        if (v === 'TRUE' || v === 'ON' || v === 'CLOSED' || v === '1') return 1;
        if (v === 'FALSE' || v === 'OFF' || v === 'OPEN' || v === '0') return 0;
    }
    return value > 0.5 ? 1 : 0;
};

const CustomTooltip = ({ active, payload, label, meta }) => {
    if (!active || !payload || !payload.length) return null;
    const val = payload[0]?.value;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-lg text-xs">
            <p className="text-slate-400 mb-1">{formatBucket(label, meta?.granularity)}</p>
            <p className="font-bold text-slate-700 dark:text-white">
                {val === 1 ? '🟢 ON / CLOSED' : '🔴 OFF / OPEN'}
            </p>
        </div>
    );
};

const StepChart = ({ timeSeries, meta, machines }) => {
    const getMachineName = (machineId) => {
        const m = machines?.find(m => m.id === machineId);
        return m?.name || machineId;
    };

    const { chartData, machineId } = useMemo(() => {
        if (!timeSeries || timeSeries.length === 0) return { chartData: [], machineId: null };

        const id = timeSeries[0]?.machine_id;

        const data = timeSeries
            .filter(r => r.machine_id === id)
            .sort((a, b) => new Date(a.bucket) - new Date(b.bucket))
            .map(r => ({
                bucket: r.bucket,
                state: booleanToStep(r.avg)
            }));

        return { chartData: data, machineId: id };
    }, [timeSeries]);

    if (chartData.length === 0) return null;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                    Estado — <span className="text-blue-600">{getMachineName(machineId)}</span>
                </h3>
                <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ON</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> OFF</span>
                </div>
            </div>

            <div className="h-[160px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="bucket"
                            tickFormatter={v => formatBucket(v, meta?.granularity)}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            dy={8}
                        />
                        <YAxis
                            domain={[0, 1]}
                            ticks={[0, 1]}
                            tickFormatter={v => v === 1 ? 'ON' : 'OFF'}
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 11 }}
                            width={36}
                        />
                        <Tooltip content={<CustomTooltip meta={meta} />} />
                        <Line
                            type="stepAfter"
                            dataKey="state"
                            stroke="#3b82f6"
                            strokeWidth={2.5}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default StepChart;