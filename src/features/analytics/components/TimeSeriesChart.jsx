import React, { useMemo } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
];

const formatBucket = (bucket, granularity) => {
    if (!bucket) return '';
    const d = new Date(bucket);
    if (granularity === 'HOUR') {
        return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
};

const TimeSeriesChart = ({ timeSeries, meta, machines, multiLine = false }) => {
    const getMachineName = (machineId) => {
        const m = machines?.find(m => m.id === machineId);
        return m?.name || machineId;
    };

    const { chartData, machineIds } = useMemo(() => {
        if (!timeSeries || timeSeries.length === 0) return { chartData: [], machineIds: [] };

        const ids = [...new Set(timeSeries.map(r => r.machine_id))];

        const buckets = {};
        timeSeries.forEach(row => {
            const key = row.bucket;
            if (!buckets[key]) buckets[key] = { bucket: key };
            buckets[key][row.machine_id] = row.avg;
        });

        const data = Object.values(buckets).sort((a, b) => new Date(a.bucket) - new Date(b.bucket));

        return { chartData: data, machineIds: ids };
    }, [timeSeries]);

    if (chartData.length === 0) return null;

    const isSingleMachine = machineIds.length === 1;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                    Evolución temporal — <span className="text-blue-600">{meta?.dataKey}</span>
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-lg">
                    {meta?.granularity === 'HOUR' ? 'por hora' : 'por día'}
                </span>
            </div>

            <div className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    {isSingleMachine ? (
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
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
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />
                            <Tooltip
                                labelFormatter={v => formatBucket(v, meta?.granularity)}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area
                                type="monotone"
                                dataKey={machineIds[0]}
                                name={getMachineName(machineIds[0])}
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                fill="url(#colorAvg)"
                                dot={false}
                            />
                        </AreaChart>
                    ) : (
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
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11 }}
                            />
                            <Tooltip
                                labelFormatter={v => formatBucket(v, meta?.granularity)}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend
                                formatter={value => getMachineName(value)}
                                wrapperStyle={{ fontSize: '12px' }}
                            />
                            {machineIds.map((id, i) => (
                                <Line
                                    key={id}
                                    type="monotone"
                                    dataKey={id}
                                    name={id}
                                    stroke={COLORS[i % COLORS.length]}
                                    strokeWidth={2}
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TimeSeriesChart;