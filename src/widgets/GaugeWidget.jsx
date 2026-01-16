import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Gauge as GaugeIcon } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';
import { parsePayload } from '../shared/utils/payloadParser';

const gaugeDataStore = {};

const GaugeWidget = ({ 
  id, title, topic, dataKey, min = 0, max = 100, 
  customConfig, onEdit, onCustomize,
  payloadParsingMode, jsonPath, jsParserFunction, fallbackValue
}) => {
  const [value, setValue] = useState(() => gaugeDataStore[id] || 0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  const [advConfig, setAdvConfig] = useState({});

  useEffect(() => {
    if (customConfig) {
      try {
        const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
        setAdvConfig(parsed);
      } catch(e) {
        console.error('[GaugeWidget] Error parsing customConfig:', e);
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
          fallbackValue: null
        });

        if (extractedValue === null || extractedValue === undefined || extractedValue === '--') {
          try {
            const payload = JSON.parse(lastMessage.payload);
            if (payload[dataKey] !== undefined) {
              extractedValue = Number(payload[dataKey]);
            } else if (payload.value !== undefined) {
              extractedValue = Number(payload.value);
            }
          } catch (e) {
            const rawValue = lastMessage.payload.toString();
            if (!isNaN(rawValue)) {
              extractedValue = parseFloat(rawValue);
            }
          }
        }
        
        if (extractedValue !== null && extractedValue !== undefined && !isNaN(extractedValue)) {
          extractedValue = Number(extractedValue);

          if (advConfig?.dataTransformation?.enabled) {
            const { multiplier = 1, offset = 0 } = advConfig.dataTransformation;
            extractedValue = (extractedValue * multiplier) + offset;
          }

          setValue(extractedValue);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          gaugeDataStore[id] = extractedValue;
        }
      } catch (e) {
        console.error('[GaugeWidget] Error parsing payload:', e);
      }
    }
  }, [lastMessage, topic, dataKey, id, advConfig, payloadParsingMode, jsonPath, jsParserFunction, fallbackValue]);

  const determineColor = (val) => {
      if (advConfig?.colorZones?.enabled && advConfig.colorZones.zones) {
          const match = advConfig.colorZones.zones.find(z => val >= z.min && val <= z.max);
          if (match) return match.color;
      }
      return '#0ea5e9';
  };

  const currentColor = determineColor(value);
  const gaugeData = [{ value: value }, { value: Math.max(max - value, 0) }];

  return (
    <BaseWidget 
      id={id} 
      title={title} 
      icon={GaugeIcon} 
      lastUpdated={lastUpdated} 
      onEdit={onEdit} 
      onCustomize={onCustomize}
    >
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
              <Cell fill={currentColor} />
              <Cell fill="#f1f5f9" className="dark:fill-slate-700" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 text-center mb-2">
          <span className="text-3xl font-bold text-slate-700 dark:text-white" style={{ color: currentColor }}>
            {value.toFixed(1)}
          </span>
          {advConfig?.markers?.showLabels && (
             <p className="text-[10px] text-slate-400">{title}</p>
          )}
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