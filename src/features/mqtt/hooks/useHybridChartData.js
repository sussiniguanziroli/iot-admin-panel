import { useState, useEffect, useRef, useCallback } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useMqtt } from '../context/MqttContext';
import { useDashboard } from '../../dashboard/context/DashboardContext';
import { parsePayload } from '../../../shared/utils/payloadParser';

const BYTES_PER_POINT = 28;
const BATCH_DROP_RATIO = 0.1;
const MAX_DISPLAY_POINTS = 2000;

const useHybridChartData = ({
  widgetId,
  topic,
  dataKey,
  machineId,
  widgetTitle,
  unit = '',
  maxPoints = 50000,
  payloadParsingMode = 'simple',
  jsonPath = '',
  jsParserFunction = '',
}) => {
  const { viewedTenantId, activeLocation, machines } = useDashboard();
  const { subscribeToTopic, lastMessage } = useMqtt();

  const [points, setPoints] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isLive, setIsLive] = useState(true);
  const [clipRange, setClipRange] = useState(null);

  const hasSubscribed = useRef(false);

  const locationId = activeLocation?.id;
  const locationName = activeLocation?.name || '';
  const machineName = machines.find(m => m.id === machineId)?.name || '';

  useEffect(() => {
    if (!viewedTenantId || !locationId || !topic || !dataKey) {
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    setPoints([]);
    hasSubscribed.current = false;

    const load = async () => {
      try {
        const fn = httpsCallable(getFunctions(), 'getChartHistory');
        const result = await fn({ tenantId: viewedTenantId, locationId, topic, dataKey, days: 7 });
        const rows = result.data?.rows || [];
        const historicalPoints = rows.map(row => ({
          time: new Date(row.timestamp).getTime(),
          value: Number(row.value),
          source: 'h',
        }));
        setPoints(historicalPoints);
      } catch (err) {
        console.error('[useHybridChartData] History load failed:', err);
        setPoints([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    load();
  }, [viewedTenantId, locationId, topic, dataKey]);

  useEffect(() => {
    if (!hasSubscribed.current && topic) {
      subscribeToTopic(topic);
      hasSubscribed.current = true;
    }
  }, [topic, subscribeToTopic]);

  useEffect(() => {
    if (!lastMessage || lastMessage.topic !== topic || !isLive) return;

    try {
      const value = parsePayload(lastMessage.payload, {
        payloadParsingMode,
        dataKey,
        jsonPath,
        jsParserFunction,
        fallbackValue: null,
      });

      if (value === null || value === undefined || isNaN(Number(value))) return;

      const ts = lastMessage.timestamp.getTime();
      const newPoint = { time: ts, value: Number(value), source: 'l' };

      setPoints(prev => {
        const next = [...prev, newPoint];
        if (next.length <= maxPoints) return next;

        const dropCount = Math.max(1, Math.floor(maxPoints * BATCH_DROP_RATIO));

        if (!clipRange) {
          return next.slice(dropCount);
        }

        let dropped = 0;
        const result = [];
        for (let i = 0; i < next.length; i++) {
          const p = next[i];
          const isProtected = p.time >= clipRange.startTime && p.time <= clipRange.endTime;
          if (!isProtected && dropped < dropCount) {
            dropped++;
            continue;
          }
          result.push(p);
        }
        return result;
      });
    } catch (e) {
      console.error('[useHybridChartData] MQTT parse error:', e);
    }
  }, [lastMessage, topic, dataKey, isLive, maxPoints, clipRange, payloadParsingMode, jsonPath, jsParserFunction]);

  const getDisplayData = useCallback((timeRangeSeconds) => {
    const cutoff = Date.now() - timeRangeSeconds * 1000;
    const filtered = points.filter(p => p.time >= cutoff);
    if (filtered.length <= MAX_DISPLAY_POINTS) return filtered;
    const step = Math.ceil(filtered.length / MAX_DISPLAY_POINTS);
    return filtered.filter((_, i) => i % step === 0 || i === filtered.length - 1);
  }, [points]);

  const saveSnapshot = useCallback(async (name) => {
    if (!clipRange || !viewedTenantId) throw new Error('No clip range or tenant');

    const clippedPoints = points.filter(
      p => p.time >= clipRange.startTime && p.time <= clipRange.endTime
    );

    if (clippedPoints.length === 0) throw new Error('No points in selected range');

    const snapshotData = {
      name,
      locationId,
      locationName,
      machineId: machineId || '',
      machineName,
      widgetId,
      widgetTitle,
      topic,
      dataKey,
      unit,
      createdAt: new Date().toISOString(),
      startTimestamp: new Date(clipRange.startTime).toISOString(),
      endTimestamp: new Date(clipRange.endTime).toISOString(),
      pointCount: clippedPoints.length,
      points: clippedPoints.map(p => ({ t: p.time, v: p.value, s: p.source })),
    };

    const ref = await addDoc(
      collection(db, 'tenants', viewedTenantId, 'snapshots'),
      snapshotData
    );

    return { id: ref.id, ...snapshotData };
  }, [clipRange, points, viewedTenantId, locationId, locationName, machineId, machineName, widgetId, widgetTitle, topic, dataKey, unit]);

  return {
    points,
    isLoadingHistory,
    isLive,
    setIsLive,
    clipRange,
    setClipRange,
    saveSnapshot,
    getDisplayData,
    pointCount: points.length,
    liveCount: points.filter(p => p.source === 'l').length,
    historicalCount: points.filter(p => p.source === 'h').length,
    memoryBytes: points.length * BYTES_PER_POINT,
  };
};

export default useHybridChartData;