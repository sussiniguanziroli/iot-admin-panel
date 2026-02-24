import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const KpiCard = ({ title, value, unit, subtitle, color }) => {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        green: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">{title}</p>
            <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-slate-800 dark:text-white">
                    {value !== null && value !== undefined ? value : '—'}
                </span>
                {unit && <span className="text-sm font-medium text-slate-400">{unit}</span>}
            </div>
            {subtitle && (
                <p className={`text-xs font-medium mt-2 px-2 py-1 rounded-lg w-fit ${colors[color] || colors.blue}`}>
                    {subtitle}
                </p>
            )}
        </div>
    );
};

const KpiCards = ({ summary, meta, machines }) => {
    if (!summary || summary.length === 0) return null;

    const getMachineName = (machineId) => {
        const m = machines?.find(m => m.id === machineId);
        return m?.name || machineId;
    };

    const allAvgs = summary.map(s => s.avg).filter(v => v !== null);
    const globalAvg = allAvgs.length > 0 ? (allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length).toFixed(2) : null;

    const maxEntry = summary.reduce((prev, curr) => (curr.max > (prev?.max ?? -Infinity) ? curr : prev), null);
    const minEntry = summary.reduce((prev, curr) => (curr.min < (prev?.min ?? Infinity) ? curr : prev), null);
    const totalSamples = summary.reduce((sum, s) => sum + (s.samples || 0), 0);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
                title="Promedio Global"
                value={globalAvg}
                unit={meta?.dataKey}
                color="blue"
            />
            <KpiCard
                title="Pico Máximo"
                value={maxEntry?.max?.toFixed(2)}
                unit={meta?.dataKey}
                subtitle={maxEntry ? getMachineName(maxEntry.machine_id) : null}
                color="orange"
            />
            <KpiCard
                title="Pico Mínimo"
                value={minEntry?.min?.toFixed(2)}
                unit={meta?.dataKey}
                subtitle={minEntry ? getMachineName(minEntry.machine_id) : null}
                color="green"
            />
            <KpiCard
                title="Total Muestras"
                value={totalSamples.toLocaleString()}
                unit=""
                subtitle={`${meta?.granularity === 'HOUR' ? 'por hora' : 'por día'}`}
                color="purple"
            />
        </div>
    );
};

export default KpiCards;