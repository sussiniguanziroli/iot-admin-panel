import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Zap } from 'lucide-react'; // <--- EL RAYITO
import BaseWidget from './BaseWidget';

const GaugeWidget = ({ id, title, topic, dataKey, min = 0, max = 100 }) => {
  const [value, setValue] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null); // Estado para la hora

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001');
    client.on('connect', () => client.subscribe(topic));

    client.on('message', (t, message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload[dataKey] !== undefined) {
          setValue(Number(payload[dataKey]));
          // Actualizamos la hora
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (e) {}
    });

    return () => client.end();
  }, [topic, dataKey]);

  const gaugeData = [{ value: value }, { value: Math.max(max - value, 0) }];

  return (
    <BaseWidget id={id} title={title} icon={Zap} lastUpdated={lastUpdated}>
      <div className="relative h-40 flex items-end justify-center mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={gaugeData}
              cx="50%" cy="100%"
              startAngle={180} endAngle={0}
              innerRadius={60} outerRadius={90}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill="#0ea5e9" />
              <Cell fill="#f1f5f9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 text-center mb-2">
          <span className="text-3xl font-bold text-slate-700">{value}</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-slate-400 px-4 mt-2">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </BaseWidget>
  );
};

export default GaugeWidget;