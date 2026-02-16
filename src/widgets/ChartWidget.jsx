import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import BaseWidget from './BaseWidget';
import ChartControls from '../features/dashboard/components/ChartControls';
import { useMqtt } from '../features/mqtt/context/MqttContext';
import { useDashboard } from '../features/dashboard/context/DashboardContext';
import { parsePayload } from '../shared/utils/payloadParser';

const MAX_DATA_POINTS = 1000;

const HEIGHT_MAP = {
  sm: 'h-40',
  md: 'h-64',
  lg: 'h-96',
  xl: 'h-[500px]'
};

const ChartWidget = ({ 
  id, title, topic, dataKey, color = '#3b82f6', 
  customConfig, onEdit, onCustomize, height = 'md',
  payloadParsingMode, jsonPath, jsParserFunction, fallbackValue
}) => {
  const { getChartData, addChartPoint } = useDashboard();
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState(300);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  const [advConfig, setAdvConfig] = useState({
    gradient: { enabled: false, color: '#3b82f6' },
    lineStyle: { strokeWidth: 2, strokeDasharray: '' }
  });

  useEffect(() => {
    if (customConfig) {
      try {
        const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
        setAdvConfig({ ...advConfig, ...parsed });
      } catch(e) {
        console.error('[ChartWidget] Error parsing customConfig:', e);
      }
    }
  }, [customConfig]);

  const { subscribeToTopic, lastMessage } = useMqtt();

  useEffect(() => {
    if (!hasSubscribed.current) {
      subscribeToTopic(topic);
      hasSubscribed.current = true;
    }
  }, [topic, subscribeToTopic]);

  useEffect(() => {
    if (lastMessage && lastMessage.topic === topic && isLive) {
      try {
        const value = parsePayload(lastMessage.payload, {
          payloadParsingMode: payloadParsingMode || 'simple',
          dataKey: dataKey || 'value',
          jsonPath: jsonPath || '',
          jsParserFunction: jsParserFunction || '',
          fallbackValue: 0
        });

        if (value !== null && value !== undefined && !isNaN(value)) {
          const timestamp = lastMessage.timestamp.getTime();
          const newPoint = { 
            time: timestamp,
            value: Number(value),
            label: format(timestamp, 'HH:mm:ss')
          };

          addChartPoint(id, newPoint);
          setLastUpdated(format(timestamp, 'HH:mm:ss'));
        }
      } catch (e) {
        console.error('[ChartWidget] Error processing message:', e);
      }
    }
  }, [lastMessage, topic, dataKey, isLive, id, addChartPoint, payloadParsingMode, jsonPath, jsParserFunction, fallbackValue]);

  const allData = getChartData(id);
  
  const filteredData = React.useMemo(() => {
    const cutoffTime = Date.now() - (timeRange * 1000);
    return allData.filter(point => point.time >= cutoffTime);
  }, [allData, timeRange]);

  const handleToggleLive = () => {
    setIsLive(!isLive);
  };

  const handleTimeRangeChange = (seconds) => {
    console.log('[ChartWidget] Time range changed to:', seconds, 'seconds');
    setTimeRange(seconds);
  };

  const handleExport = () => {
    if (filteredData.length === 0) return;

    const csvContent = [
      ['Timestamp', 'Value'],
      ...filteredData.map(point => [
        format(point.time, 'yyyy-MM-dd HH:mm:ss'),
        point.value
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
  };

  const handleZoomIn = () => {
    const currentRange = timeRange;
    const newRange = Math.max(60, Math.floor(currentRange / 2));
    console.log('[ChartWidget] Zoom in:', currentRange, '→', newRange);
    handleTimeRangeChange(newRange);
  };

  const handleZoomOut = () => {
    const currentRange = timeRange;
    const newRange = Math.min(86400, currentRange * 2);
    console.log('[ChartWidget] Zoom out:', currentRange, '→', newRange);
    handleTimeRangeChange(newRange);
  };

  const handleResetZoom = () => {
    console.log('[ChartWidget] Reset zoom');
    handleTimeRangeChange(300);
  };

  const gradientColor = advConfig?.gradient?.color || color;
  const strokeWidth = advConfig?.lineStyle?.strokeWidth || 2;
  const strokeDasharray = advConfig?.lineStyle?.strokeDasharray || '';

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            {format(payload[0].payload.time, 'HH:mm:ss')}
          </p>
          <p className="text-lg font-bold" style={{ color: gradientColor }}>
            {payload[0].value.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  const chartHeightClass = HEIGHT_MAP[height] || HEIGHT_MAP.md;

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
          onToggleLive={handleToggleLive}
          timeRange={timeRange}
          onTimeRangeChange={handleTimeRangeChange}
          onExport={handleExport}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          dataPoints={filteredData.length}
          isCompact={true}
        />

        <div className={chartHeightClass}>
          {filteredData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">
                  {allData.length === 0 ? 'Waiting for data...' : `No data in ${timeRange}s range`}
                </p>
                <p className="text-xs mt-1">Topic: {topic}</p>
                {allData.length > 0 && (
                  <p className="text-xs text-blue-500 mt-2">
                    {allData.length} points in buffer - try increasing time range
                  </p>
                )}
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={filteredData}
                margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
              >
                {advConfig?.gradient?.enabled && (
                  <defs>
                    <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={gradientColor} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={gradientColor} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                )}
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#e2e8f0" 
                  className="dark:stroke-slate-700"
                  vertical={false}
                />
                
                <XAxis 
                  dataKey="label"
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={gradientColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  fill={advConfig?.gradient?.enabled ? `url(#gradient-${id})` : 'none'}
                  dot={false}
                  animationDuration={300}
                  isAnimationActive={isLive}
                />

                {filteredData.length > 20 && (
                  <Brush 
                    dataKey="label" 
                    height={20} 
                    stroke={gradientColor}
                    fill="#f8fafc"
                    className="dark:fill-slate-900"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {!isLive && filteredData.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-2 text-center">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
              ⏸️ Updates paused - Click Play to resume live data
            </p>
          </div>
        )}

        <div className="flex justify-between text-[10px] text-slate-400">
          <span>Buffer: {allData.length} pts</span>
          <span>Showing: {filteredData.length} pts</span>
          <span>Range: {timeRange}s</span>
        </div>
      </div>
    </BaseWidget>
  );
};

export default ChartWidget;