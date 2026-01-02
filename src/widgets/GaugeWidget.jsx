import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Gauge as GaugeIcon } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';

const gaugeDataStore = {};

const GaugeWidget = ({ id, title, topic, dataKey, min = 0, max = 100, onEdit }) => {
  const [value, setValue] = useState(() => gaugeDataStore[id] || 0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
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
        
        let extractedValue;
        
        if (payload[dataKey] !== undefined) {
          extractedValue = Number(payload[dataKey]);
        } else if (payload.value !== undefined) {
          extractedValue = Number(payload.value);
        }
        
        if (extractedValue !== undefined && !isNaN(extractedValue)) {
          setValue(extractedValue);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          gaugeDataStore[id] = extractedValue;
        }
      } catch (e) {
        const rawValue = lastMessage.payload.toString();
        if (!isNaN(rawValue)) {
          const numValue = parseFloat(rawValue);
          setValue(numValue);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          gaugeDataStore[id] = numValue;
        }
      }
    }
  }, [lastMessage, topic, dataKey, id]);

  const gaugeData = [{ value: value }, { value: Math.max(max - value, 0) }];

  return (
    <BaseWidget id={id} title={title} icon={GaugeIcon} lastUpdated={lastUpdated} onEdit={onEdit}>
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
              <Cell fill="#f1f5f9" className="dark:fill-slate-700" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 text-center mb-2">
          <span className="text-3xl font-bold text-slate-700 dark:text-white">{value.toFixed(1)}</span>
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