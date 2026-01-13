import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';

const HEIGHT_MAP = { sm: 'h-40', md: 'h-64', lg: 'h-96', xl: 'h-[500px]' };
const chartDataStore = {};

const ChartWidget = ({ id, title, topic, dataKey, color = '#0ea5e9', height = 'md', min, max, customConfig, onEdit, onCustomize }) => {
  const [history, setHistory] = useState(() => chartDataStore[id] || []);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  // Advanced Config
  const [advConfig, setAdvConfig] = useState({});

  useEffect(() => {
      if (customConfig) {
        try {
          const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
          setAdvConfig(parsed);
        } catch(e) {}
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
        const payload = JSON.parse(lastMessage.payload);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let val;
        
        if (payload[dataKey] !== undefined) {
          val = payload[dataKey];
        } else if (payload.value !== undefined) {
          val = payload.value;
        }

        if (val !== undefined) {
          setLastUpdated(new Date().toLocaleTimeString());
          
          setHistory(prev => {
            const limit = advConfig?.dataRetention?.maxPoints || (height === 'lg' || height === 'xl' ? 100 : 50);
            const newHistory = [...prev, { time: timeStr, value: Number(val) }];
            const trimmedHistory = newHistory.length > limit ? newHistory.slice(-limit) : newHistory;
            chartDataStore[id] = trimmedHistory;
            return trimmedHistory;
          });
        }
      } catch (e) {
        console.error('Error parsing in ChartWidget:', e);
      }
    }
  }, [lastMessage, topic, dataKey, height, id, advConfig]);

  const yDomain = [
    min !== undefined && min !== '' ? Number(min) : 'auto', 
    max !== undefined && max !== '' ? Number(max) : 'auto'
  ];

  // Estilos avanzados
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