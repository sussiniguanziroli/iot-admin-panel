import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';
import { useDashboard } from '../../src/features/dashboard/context/DashboardContext';
import { parsePayload } from '../shared/utils/payloadParser';

const HEIGHT_MAP = { sm: 'h-40', md: 'h-64', lg: 'h-96', xl: 'h-[500px]' };

const ChartWidget = ({ 
  id, title, topic, dataKey, color = '#0ea5e9', height = 'md', min, max, 
  customConfig, onEdit, onCustomize,
  payloadParsingMode, jsonPath, jsParserFunction, fallbackValue
}) => {
  const { getWidgetData, setWidgetData } = useDashboard();
  const [history, setHistory] = useState(() => getWidgetData('chart', id) || []);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  const [advConfig, setAdvConfig] = useState({});

  useEffect(() => {
      if (customConfig) {
        try {
          const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
          setAdvConfig(parsed);
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
    if (lastMessage && lastMessage.topic === topic) {
      try {
        let val = parsePayload(lastMessage.payload, {
          payloadParsingMode: payloadParsingMode || 'simple',
          dataKey: dataKey || 'value',
          jsonPath: jsonPath || '',
          jsParserFunction: jsParserFunction || '',
          fallbackValue: null
        });

        if (val !== null && val !== undefined && !isNaN(val)) {
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastUpdated(new Date().toLocaleTimeString());
          
          setHistory(prev => {
            const limit = advConfig?.dataRetention?.maxPoints || (height === 'lg' || height === 'xl' ? 100 : 50);
            const newHistory = [...prev, { time: timeStr, value: Number(val) }];
            const trimmedHistory = newHistory.length > limit ? newHistory.slice(-limit) : newHistory;
            setWidgetData('chart', id, trimmedHistory);
            return trimmedHistory;
          });
        }
      } catch (e) {
        console.error('[ChartWidget] Error parsing payload:', e);
      }
    }
  }, [lastMessage, topic, dataKey, height, id, advConfig, payloadParsingMode, jsonPath, jsParserFunction, fallbackValue, setWidgetData]);

  const yDomain = [
    min !== undefined && min !== '' ? Number(min) : 'auto', 
    max !== undefined && max !== '' ? Number(max) : 'auto'
  ];

  const strokeColor = advConfig?.gradientColors?.enabled ? advConfig.gradientColors.topColor : color;
  const strokeWidth = advConfig?.lineStyle?.strokeWidth || 2;
  const curveType = advConfig?.lineStyle?.type || 'monotone';

  return (
    <BaseWidget 
      id={id} 
      title={title} 
      icon={Activity} 
      lastUpdated={lastUpdated} 
      onEdit={onEdit} 
      onCustomize={onCustomize}
    >
      <div className={`w-full ${HEIGHT_MAP[height] || HEIGHT_MAP.md} mt-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id={`color-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={advConfig?.gradientColors?.opacity || 0.3}/>
                <stop offset="95%" stopColor={advConfig?.gradientColors?.bottomColor || strokeColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-700" />
            <XAxis dataKey="time" hide={!advConfig?.axisConfig?.xAxis?.show} />
            <YAxis 
              domain={yDomain} 
              tick={{fontSize: 10, fill: '#94a3b8'}} 
              width={30} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => val.toFixed(0)}
              hide={advConfig?.axisConfig?.yAxis?.show === false}
            />
            <Tooltip 
              contentStyle={{
                borderRadius: '8px', 
                border: 'none', 
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                backgroundColor: 'white'
              }}
              labelStyle={{ color: '#334155' }}
            />
            <Area 
              type={curveType}
              dataKey="value" 
              stroke={strokeColor} 
              strokeWidth={strokeWidth} 
              fillOpacity={1} 
              fill={`url(#color-${id})`} 
              dot={advConfig?.lineStyle?.dots}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </BaseWidget>
  );
};

export default ChartWidget;