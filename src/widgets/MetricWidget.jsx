import React, { useState, useEffect, useRef } from 'react';
import { Zap, Clock, Box, Droplets, Thermometer, Activity } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';
import { parsePayload } from '../shared/utils/payloadParser';

const ICON_MAP = {
  zap: Zap,
  clock: Clock,
  box: Box,
  droplets: Droplets,
  thermometer: Thermometer,
  activity: Activity
};

const metricDataStore = {};

const MetricWidget = ({ 
  id, title, topic, dataKey, unit = '', color = 'blue', iconKey = 'activity', 
  customConfig, onEdit, onCustomize,
  payloadParsingMode, jsonPath, jsParserFunction, fallbackValue
}) => {
  const [value, setValue] = useState(() => metricDataStore[id] || '--');
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  const [advConfig, setAdvConfig] = useState({});

  useEffect(() => {
      if (customConfig) {
        try {
          const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
          setAdvConfig(parsed);
        } catch(e) {
          console.error('[MetricWidget] Error parsing customConfig:', e);
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
        let extractedValue = parsePayload(lastMessage.payload, {
          payloadParsingMode: payloadParsingMode || 'simple',
          dataKey: dataKey || 'value',
          jsonPath: jsonPath || '',
          jsParserFunction: jsParserFunction || '',
          fallbackValue: fallbackValue || '--'
        });

        if (extractedValue === '--' || extractedValue === null || extractedValue === undefined) {
          try {
            const payload = JSON.parse(lastMessage.payload);
            if (payload.value !== undefined) {
              extractedValue = payload.value;
              if (dataKey === 'value' && (extractedValue === 0 || extractedValue === 1)) {
                extractedValue = extractedValue === 1 ? 'ON' : 'OFF';
              }
            }
          } catch (e) {
            extractedValue = lastMessage.payload.toString();
          }
        }

        if (advConfig?.dataTransformation?.enabled && typeof extractedValue === 'number') {
            const { multiplier = 1, offset = 0, decimals = 2, prefix = '', suffix = '' } = advConfig.dataTransformation;
            extractedValue = ((extractedValue * multiplier) + offset).toFixed(decimals);
        }
        
        setValue(extractedValue);
        setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
        metricDataStore[id] = extractedValue;
      } catch (e) {
        console.error('[MetricWidget] Error processing message:', e);
        const rawValue = lastMessage.payload.toString();
        setValue(rawValue);
        setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
      }
    }
  }, [lastMessage, topic, dataKey, payloadParsingMode, jsonPath, jsParserFunction, fallbackValue, id, advConfig]);

  const Icon = ICON_MAP[iconKey] || Activity;

  let displayColor = color;
  
  if (advConfig?.conditionalFormatting?.enabled && typeof value === 'number') {
      const rule = advConfig.conditionalFormatting.rules.find(r => {
          switch(r.condition) {
              case '>': return value > r.value;
              case '<': return value < r.value;
              case '>=': return value >= r.value;
              case '<=': return value <= r.value;
              case '===': return value === r.value;
              case '!==': return value !== r.value;
              default: return false;
          }
      });
      if (rule) {
          displayColor = rule.color;
      }
  }

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    red: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <BaseWidget 
      id={id} 
      title={title} 
      lastUpdated={lastUpdated} 
      onEdit={onEdit} 
      onCustomize={onCustomize}
    >
      <div className="flex items-center justify-between h-full py-2">
        <div>
          <div className="text-4xl font-bold text-slate-700 dark:text-white tracking-tight">
             {advConfig?.dataTransformation?.prefix || ''}
             {value} 
             {advConfig?.dataTransformation?.suffix || ''}
             <span className="text-lg text-slate-400 font-medium ml-1">{unit}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            {topic.split('/').pop()}
          </p>
        </div>
        
        <div className={`p-4 rounded-2xl ${colorClasses[displayColor] || colorClasses.blue}`}>
          <Icon size={32} />
        </div>
      </div>
    </BaseWidget>
  );
};

export default MetricWidget;