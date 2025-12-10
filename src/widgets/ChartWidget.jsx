import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react'; // Icono de Gráfico
import BaseWidget from './BaseWidget';

const HEIGHT_MAP = { sm: 'h-40', md: 'h-64', lg: 'h-96', xl: 'h-[500px]' };

const ChartWidget = ({ id, title, topic, dataKey, color = '#0ea5e9', height = 'md', min, max }) => {
  const [history, setHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');
    client.on('connect', () => client.subscribe(topic));
    
    client.on('message', (t, msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        const val = payload[dataKey];
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (val !== undefined) {
          setLastUpdated(new Date().toLocaleTimeString());
          setHistory(prev => {
            const nuevo = [...prev, { time: timeStr, value: Number(val) }];
            const limit = height === 'lg' || height === 'xl' ? 100 : 50;
            return nuevo.length > limit ? nuevo.slice(1) : nuevo;
          });
        }
      } catch (e) {}
    });

    return () => client.end();
  }, [topic, dataKey, height]);

  const yDomain = [
    min !== undefined && min !== '' ? Number(min) : 'auto', 
    max !== undefined && max !== '' ? Number(max) : 'auto'
  ];

  return (
    <BaseWidget id={id} title={title} icon={Activity} lastUpdated={lastUpdated}>
      <div className={`w-full ${HEIGHT_MAP[height] || HEIGHT_MAP.md} mt-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history}>
            <defs>
              <linearGradient id={`color-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="time" hide />
            <YAxis 
              domain={yDomain} 
              tick={{fontSize: 10, fill: '#94a3b8'}} 
              width={30} 
              axisLine={false} 
              tickLine={false} 
              tickFormatter={(val) => val.toFixed(0)}
            />
            <Tooltip 
              contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={2} 
              fillOpacity={1} 
              fill={`url(#color-${id})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </BaseWidget>
  );
};

export default ChartWidget;