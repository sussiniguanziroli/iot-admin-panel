import React, { useState, useEffect, useRef } from 'react';
import { Zap, Clock, Box, Droplets, Thermometer, Activity } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';

const ICON_MAP = {
  zap: Zap,
  clock: Clock,
  box: Box,
  droplets: Droplets,
  thermometer: Thermometer,
  activity: Activity
};

const metricDataStore = {};

const MetricWidget = ({ id, title, topic, dataKey, unit = '', color = 'blue', iconKey = 'activity', onEdit }) => {
  const [value, setValue] = useState(() => metricDataStore[id] || '--');
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
          extractedValue = payload[dataKey];
        } else if (payload.value !== undefined) {
          extractedValue = payload.value;
          
          if (dataKey === 'value' && (extractedValue === 0 || extractedValue === 1)) {
            extractedValue = extractedValue === 1 ? 'ON' : 'OFF';
          }
        }
        
        if (extractedValue !== undefined) {
          setValue(extractedValue);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          metricDataStore[id] = extractedValue;
        }
      } catch (e) {
        const rawValue = lastMessage.payload.toString();
        if (rawValue === '0' || rawValue === '1') {
          const parsedValue = rawValue === '1' ? 'ON' : 'OFF';
          setValue(parsedValue);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          metricDataStore[id] = parsedValue;
        } else if (!isNaN(rawValue)) {
          setValue(parseFloat(rawValue));
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          metricDataStore[id] = parseFloat(rawValue);
        }
      }
    }
  }, [lastMessage, topic, dataKey, id]);

  const Icon = ICON_MAP[iconKey] || Activity;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <BaseWidget id={id} title={title} lastUpdated={lastUpdated} onEdit={onEdit}>
      <div className="flex items-center justify-between h-full py-2">
        <div>
          <div className="text-4xl font-bold text-slate-700 dark:text-white tracking-tight">
            {value} <span className="text-lg text-slate-400 font-medium ml-1">{unit}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            {topic.split('/').pop()}
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