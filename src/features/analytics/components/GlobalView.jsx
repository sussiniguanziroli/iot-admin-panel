import React from 'react';
import KpiCards from './KpiCards';
import TimeSeriesChart from './TimeSeriesChart';
import ComparisonBarChart from './ComparisonBarChart';

const GlobalView = ({ timeSeries, summary, meta, machines }) => {
    return (
        <div className="space-y-6">
            <KpiCards summary={summary} meta={meta} machines={machines} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <ComparisonBarChart summary={summary} meta={meta} machines={machines} />
                <TimeSeriesChart timeSeries={timeSeries} meta={meta} machines={machines} multiLine />
            </div>
        </div>
    );
};

export default GlobalView;