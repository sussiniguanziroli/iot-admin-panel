import React, { useState, useEffect, useRef } from 'react';
import { Power, ToggleLeft, Lock } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../features/mqtt/context/MqttContext';
import { usePermissions } from '../shared/hooks/usePermissions';

const switchStateStore = {};

const SwitchWidget = ({ id, title, topic, commandTopic }) => {
  const { can } = usePermissions();
  const [isOn, setIsOn] = useState(() => switchStateStore[id] || false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  const { subscribeToTopic, publishMessage, lastMessage } = useMqtt();

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
        if (payload.estado) {
          const newState = payload.estado === 'ON';
          setIsOn(newState);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
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
    if (!can.controlEquipment) {
      alert('⛔ You do not have permission to control equipment');
      return;
    }
    
    const command = isOn ? "PARADA" : "MARCHA";
    console.log(`[SwitchWidget] Click! Sending: ${command} to ${commandTopic}`);
    publishMessage(commandTopic, command);
  };

  return (
    <BaseWidget id={id} title={title} icon={ToggleLeft} lastUpdated={lastUpdated}>
      <div className="flex flex-col items-center justify-center py-6">
        <button
          onClick={toggle}
          disabled={!can.controlEquipment}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-4 relative ${
            isOn 
              ? 'bg-emerald-500 border-emerald-100 text-white shadow-emerald-200' 
              : 'bg-slate-50 border-slate-100 text-slate-300'
          } ${!can.controlEquipment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <Power size={36} />
          {!can.controlEquipment && (
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1 rounded-full">
              <Lock size={12} />
            </div>
          )}
        </button>
        <span className={`mt-3 text-sm font-bold tracking-wide ${isOn ? 'text-emerald-600' : 'text-slate-300'}`}>
          {isOn ? 'ON' : 'OFF'}
        </span>
        {!can.controlEquipment && (
          <span className="mt-2 text-xs text-orange-500 font-medium flex items-center gap-1">
            <Lock size={10} /> Read Only
          </span>
        )}
      </div>
    </BaseWidget>
  );
};

export default SwitchWidget;