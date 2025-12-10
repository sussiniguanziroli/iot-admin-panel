import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Zap, Clock, Box, Droplets, Thermometer, Activity } from 'lucide-react';
import BaseWidget from './BaseWidget';

// Mapa de iconos para elegir
const ICON_MAP = {
  zap: Zap,
  clock: Clock,
  box: Box,
  droplets: Droplets,
  thermometer: Thermometer,
  activity: Activity
};

const MetricWidget = ({ id, title, topic, dataKey, unit = '', color = 'blue', iconKey = 'activity' }) => {
  const [value, setValue] = useState('--');

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');
    client.on('connect', () => client.subscribe(topic));
    
    client.on('message', (t, msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        if (payload[dataKey] !== undefined) {
          setValue(payload[dataKey]);
        }
      } catch (e) {}
    });

    return () => client.end();
  }, [topic, dataKey]);

  const Icon = ICON_MAP[iconKey] || Activity;

  // Mapa de colores para Tailwind
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-rose-50 text-rose-600',
  };

  return (
    <BaseWidget id={id} title={title}>
      <div className="flex items-center justify-between h-full py-2">
        <div>
          <div className="text-4xl font-bold text-slate-700 tracking-tight">
            {value} <span className="text-lg text-slate-400 font-medium ml-1">{unit}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Key: {dataKey}
          </p>
        </div>
        
        <div className={`p-4 rounded-2xl ${colorClasses[color] || colorClasses.blue}`}>
          <Icon size={32} />
        </div>
      </div>
    </BaseWidget>
  );
};

export default MetricWidget;