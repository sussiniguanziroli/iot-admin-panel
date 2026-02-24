import { useState, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const queryTelemetryFn = httpsCallable(functions, 'queryTelemetry');

export const useAnalytics = () => {
    const [timeSeries, setTimeSeries] = useState([]);
    const [summary, setSummary] = useState([]);
    const [meta, setMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetch = useCallback(async (filters) => {
        const { tenantId, locationId, machineId, dataKey, timeRange, dateFrom, dateTo } = filters;

        if (!tenantId || !dataKey) return;

        setLoading(true);
        setError(null);

        try {
            const result = await queryTelemetryFn({
                tenantId,
                locationId: locationId || null,
                machineId: machineId || 'all',
                dataKey,
                timeRange,
                dateFrom: dateFrom || null,
                dateTo: dateTo || null
            });

            setTimeSeries(result.data.timeSeries || []);
            setSummary(result.data.summary || []);
            setMeta(result.data.meta || null);
        } catch (err) {
            setError(err.message || 'Error consultando BigQuery');
            setTimeSeries([]);
            setSummary([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const clear = useCallback(() => {
        setTimeSeries([]);
        setSummary([]);
        setMeta(null);
        setError(null);
    }, []);

    return { timeSeries, summary, meta, loading, error, fetch, clear };
};