import React, { useState, useEffect, useRef } from 'react';
import { Power, ToggleLeft, Lock } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';
import { usePermissions } from '../shared/hooks/usePermissions';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const switchStateStore = {};

const SwitchWidget = ({ 
  id, title, topic, commandTopic, dataKey = 'relay1', 
  commandFormat = 'text', onCommand = 'ON', offCommand = 'OFF', 
  onPayloadJSON, offPayloadJSON, customConfig, onEdit, onCustomize 
}) => {
  const { can } = usePermissions();
  const [isOn, setIsOn] = useState(() => switchStateStore[id] || false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  // Parsear config avanzada si existe para lógica UI
  const [advancedSettings, setAdvancedSettings] = useState({});

  useEffect(() => {
    if (customConfig) {
      try {
        const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
        setAdvancedSettings(parsed);
      } catch(e) { console.error("Error parsing advanced config", e); }
    }
  }, [customConfig]);
  
  const { subscribeToTopic, publishMessage, lastMessage } = useMqtt();

  useEffect(() => {
    if (topic && !hasSubscribed.current) {
      subscribeToTopic(topic);
      hasSubscribed.current = true;
    }
  }, [topic, subscribeToTopic]);

  useEffect(() => {
    if (lastMessage && lastMessage.topic === topic) {
      try {
        const payload = JSON.parse(lastMessage.payload);
        
        let serverValue = payload[dataKey]; 
        
        if (serverValue === undefined) {
          serverValue = payload.value || payload.estado || payload.status;
        }

        if (serverValue !== undefined) {
          const valString = String(serverValue).toUpperCase();
          const newState = (
            valString === 'ON' || 
            valString === '1' || 
            valString === 'TRUE' ||
            valString === 'HIGH' ||
            valString === 'MARCHA'
          );
          
          setIsOn(newState);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          switchStateStore[id] = newState;
        }
      } catch (e) {
        const rawState = lastMessage.payload.toString().toUpperCase();
        if (rawState === 'ON' || rawState === 'MARCHA' || rawState === '1' || rawState === 'TRUE') {
          setIsOn(true);
          switchStateStore[id] = true;
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
        } else if (rawState === 'OFF' || rawState === 'PARADA' || rawState === '0' || rawState === 'FALSE') {
          setIsOn(false);
          switchStateStore[id] = false;
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
        }
      }
    }
  }, [lastMessage, topic, id, dataKey]);

  const toggle = async () => {
    if (!can.controlEquipment) {
      toast.error('You do not have permission to control equipment', {
        position: 'top-right',
        autoClose: 3000
      });
      return;
    }

    // Check Interlocks (from advanced settings)
    if (advancedSettings?.interlocks?.enabled && !isOn) {
       // Aquí iría lógica compleja de interbloqueos si tuvieras acceso al estado global
       // Por ahora es un placeholder para cuando conectes el estado global de máquinas
    }

    // Check Confirmation Mode
    if (advancedSettings?.confirmationMode?.enabled) {
       // Podrías cambiar el tipo de alerta basado en esto
    }

    let payload;
    let payloadDescription;

    if (commandFormat === 'json') {
      payload = isOn ? offPayloadJSON : onPayloadJSON;
      payloadDescription = JSON.stringify(payload);
    } else if (commandFormat === 'number') {
      payload = isOn ? offCommand : onCommand;
      payloadDescription = payload;
    } else {
      payload = isOn ? offCommand : onCommand;
      payloadDescription = payload;
    }

    const actionText = isOn ? 'TURN OFF' : 'TURN ON';
    
    const result = await Swal.fire({
      title: `${actionText}?`,
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">You are about to <strong>${actionText.toLowerCase()}</strong> this equipment.</p>
          <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mt-3 text-sm space-y-1">
            <p class="font-mono text-xs"><strong>Topic:</strong> ${commandTopic}</p>
            <p class="font-mono text-xs"><strong>Payload:</strong> <code class="bg-slate-200 dark:bg-slate-900 px-1 py-0.5 rounded">${payloadDescription}</code></p>
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isOn ? '#ef4444' : '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, ${actionText.toLowerCase()}!`,
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const messageToSend = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
        
        console.log(`[SwitchWidget] Publishing to: ${commandTopic}`);
        console.log(`[SwitchWidget] Payload:`, messageToSend);
        
        publishMessage(commandTopic, messageToSend);
        
        // Feedback visual inmediato si está configurado
        if (advancedSettings?.feedback?.visualFeedback) {
             // Podrías forzar un estado optimista aquí si quisieras
        }

        toast.success(`Command sent: ${payloadDescription}`, {
          position: 'bottom-right',
          autoClose: 2000
        });
      } catch (error) {
        console.error('Error sending command:', error);
        toast.error('Failed to send command', { position: 'top-right' });
      }
    }
  };

  return (
    <BaseWidget 
      id={id} 
      title={title} 
      icon={ToggleLeft} 
      lastUpdated={lastUpdated} 
      onEdit={onEdit} 
      onCustomize={onCustomize}
    >
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
        
        {/* State Tracking Display (from Advanced Config) */}
        {advancedSettings?.stateTracking?.enabled && advancedSettings?.stateTracking?.showLastChanged && lastUpdated && (
           <span className="text-[10px] text-slate-400 mt-1">Changed: {lastUpdated}</span>
        )}

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