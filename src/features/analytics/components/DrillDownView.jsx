import React, { useMemo } from 'react';
import KpiCards from './KpiCards';
import TimeSeriesChart from './TimeSeriesChart';
import StepChart from './StepChart';
import { useDashboard } from '../../dashboard/context/DashboardContext';

const BOOLEAN_TYPES = ['switch'];
const BOOLEAN_KEYS = ['estado', 'state', 'sobrecorriente', 'sobretension', 'bajatension', 'desequilibrio'];

const DrillDownView = ({ timeSeries, summary, meta, machines }) => {
    const { widgets } = useDashboard();

    const isBoolean = useMemo(() => {
        if (!meta?.dataKey) return false;
        if (BOOLEAN_KEYS.includes(meta.dataKey.toLowerCase())) return true;
        const widget = widgets.find(w => w.dataKey === meta.dataKey);
        return widget ? BOOLEAN_TYPES.includes(widget.type) : false;
    }, [meta, widgets]);

    return (
        <div className="space-y-6">
            <KpiCards summary={summary} meta={meta} machines={machines} />
            {isBoolean
                ? <StepChart timeSeries={timeSeries} meta={meta} machines={machines} />
                : <TimeSeriesChart timeSeries={timeSeries} meta={meta} machines={machines} />
            }
        </div>
    );
};

export default DrillDownView;