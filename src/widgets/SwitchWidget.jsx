import React, { useState, useEffect, useRef } from 'react';
import { Power, ToggleLeft } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../context/MqttContext';

// ✅ STORE DATA OUTSIDE COMPONENT
const switchStateStore = {};

const SwitchWidget = ({ id, title, topic, commandTopic }) => {
  // ✅ Initialize from store if exists
  const [isOn, setIsOn] = useState(() => switchStateStore[id] || false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  const { subscribeToTopic, publishMessage, lastMessage } = useMqtt();

  // ✅ Subscribe only once
  useEffect(() => {
    if (!hasSubscribed.current) {
      subscribeToTopic(topic);
      hasSubscribed.current = true;
    }
  }, [topic, subscribeToTopic]);

  // ✅ Listen and persist
  useEffect(() => {
    if (lastMessage && lastMessage.topic === topic) {
      try {
        const payload = JSON.parse(lastMessage.payload);
        if (payload.estado) {
          const newState = payload.estado === 'ON';
          setIsOn(newState);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          
          // ✅ Save to persistent store
          switchStateStore[id] = newState;
        }
      } catch (e) {
        const rawState = lastMessage.payload.toString().toUpperCase();
        if (rawState === 'ON' || rawState === 'MARCHA') {
          setIsOn(true);
          switchStateStore[id] = true;
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
        } else if (rawState === 'OFF' || rawState === 'PARADA') {
          setIsOn(false);
          switchStateStore[id] = false;
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
        }
      }
    }
  }, [lastMessage, topic, id]);

  const toggle = () => {
    const command = isOn ? "PARADA" : "MARCHA";
    console.log(`[SwitchWidget] Click! Enviando: ${command} para ${commandTopic}`);
    publishMessage(commandTopic, command);
  };

  return (
    <BaseWidget id={id} title={title} icon={ToggleLeft} lastUpdated={lastUpdated}>
      <div className="flex flex-col items-center justify-center py-6">
        <button
          onClick={toggle}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-4 ${
            isOn 
              ? 'bg-emerald-500 border-emerald-100 text-white shadow-emerald-200' 
              : 'bg-slate-50 border-slate-100 text-slate-300'
          }`}
        >
          <Power size={36} />
        </button>
        <span className={`mt-3 text-sm font-bold tracking-wide ${isOn ? 'text-emerald-600' : 'text-slate-300'}`}>
          {isOn ? 'ENCENDIDO' : 'APAGADO'}
        </span>
      </div>
    </BaseWidget>
  );
};

export default SwitchWidget;