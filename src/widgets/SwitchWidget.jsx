import React, { useState, useEffect, useRef } from 'react';
import { Power, ToggleLeft, Lock } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';
import { usePermissions } from '../shared/hooks/usePermissions';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const switchStateStore = {};

const SwitchWidget = ({ id, title, topic, commandTopic, onEdit }) => {
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

  const toggle = async () => {
    if (!can.controlEquipment) {
      toast.error('You do not have permission to control equipment', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return;
    }
    
    const command = isOn ? "PARADA" : "MARCHA";
    const actionText = isOn ? "stop" : "start";
    
    const result = await Swal.fire({
      title: `${actionText.toUpperCase()} Equipment?`,
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">You are about to <strong>${actionText}</strong> this equipment.</p>
          <div class="bg-slate-50 p-3 rounded-lg mt-3 text-sm">
            <p class="font-mono text-slate-500">Command: <strong class="text-slate-900">${command}</strong></p>
            <p class="font-mono text-slate-500">Topic: <strong class="text-slate-900">${commandTopic}</strong></p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isOn ? '#ef4444' : '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, ${actionText}!`,
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        console.log(`[SwitchWidget] Sending: ${command} to ${commandTopic}`);
        publishMessage(commandTopic, command);
        
        toast.success(`Command sent: ${command}`, {
          position: 'bottom-right',
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        });
      } catch (error) {
        console.error('Error sending command:', error);
        toast.error('Failed to send command', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    }
  };

  return (
    <BaseWidget id={id} title={title} icon={ToggleLeft} lastUpdated={lastUpdated} onEdit={onEdit}>
      <div className="flex flex-col items-center justify-center py-6">
        <button
          onClick={toggle}
          disabled={!can.controlEquipment}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-4 relative ${
            isOn 
              ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900 text-white shadow-emerald-200 dark:shadow-emerald-900/50' 
              : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600'
          } ${!can.controlEquipment ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <Power size={36} />
          {!can.controlEquipment && (
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1 rounded-full">
              <Lock size={12} />
            </div>
          )}
        </button>
        <span className={`mt-3 text-sm font-bold tracking-wide ${
          isOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
        }`}>
          {isOn ? 'ON' : 'OFF'}
        </span>
        {!can.controlEquipment && (
          <span className="mt-2 text-xs text-orange-500 dark:text-orange-400 font-medium flex items-center gap-1">
            <Lock size={10} /> Read Only
          </span>
        )}
      </div>
    </BaseWidget>
  );
};

export default SwitchWidget;