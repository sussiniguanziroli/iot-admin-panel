import React, { useState, useEffect, useRef } from 'react';
import { Power, ToggleLeft, Lock } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../../src/features/mqtt/context/MqttContext';
import { usePermissions } from '../shared/hooks/usePermissions';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const switchStateStore = {};

// 1. AGREGAMOS dataKey A LOS PROPS PARA SABER QUÉ LEER (relay1)
const SwitchWidget = ({ id, title, topic, commandTopic, dataKey = 'relay1', onEdit }) => {
  const { can } = usePermissions();
  const [isOn, setIsOn] = useState(() => switchStateStore[id] || false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  
  const { subscribeToTopic, publishMessage, lastMessage } = useMqtt();

 useEffect(() => {
    if (topic) {
      subscribeToTopic(topic);
    }
  }, [topic, subscribeToTopic]);

  useEffect(() => {
    if (lastMessage && lastMessage.topic === topic) {
      try {
        const payload = JSON.parse(lastMessage.payload);
        
        // 1. Buscamos la key que configuraste en el modal (será "status")
        let serverValue = payload[dataKey]; 
        
        // 2. Si no la encuentra, buscamos "value" o "estado" por las dudas
        if (serverValue === undefined) serverValue = payload.value || payload.estado;

        if (serverValue !== undefined) {
          // 3. Normalizamos el valor para entender ON, OFF, 1, 0, true, false
          const valString = String(serverValue).toUpperCase();
          const newState = (
              valString === 'ON' || 
              valString === '1' || 
              valString === 'TRUE' ||
              valString === 'HIGH'  // A veces mandan HIGH
          );
          
          setIsOn(newState);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          switchStateStore[id] = newState;
        }
      } catch (e) {
        // Fallback para sistemas viejos que mandan texto plano
        const rawState = lastMessage.payload.toString().toUpperCase();
        if (rawState === 'ON' || rawState === 'MARCHA' || rawState === '1') {
          setIsOn(true);
          switchStateStore[id] = true;
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
        } else if (rawState === 'OFF' || rawState === 'PARADA' || rawState === '0') {
          setIsOn(false);
          switchStateStore[id] = false;
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
        }
      }
    }
  }, [lastMessage, topic, id, dataKey]);

  const toggle = async () => {
    if (!can.controlEquipment) {
      toast.error('No tienes permisos', { position: 'top-right' });
      return;
    }

    // El manual dice: enviar "ON" o "OFF" (Texto plano)
    const targetValue = isOn ? "OFF" : "ON"; 
    
    // Alerta visual para ti
    const result = await Swal.fire({
      title: `¿${targetValue === 'ON' ? 'ENCENDER' : 'APAGAR'}?`,
      text: `Enviando orden a: .../in/r1`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: isOn ? '#ef4444' : '#10b981',
      confirmButtonText: 'Sí, ejecutar'
    });

    if (result.isConfirmed) {
      try {
        // Publicamos el texto directo al topic configurado (.../in/r1)
        publishMessage(commandTopic, targetValue);
        
        toast.success(`Orden enviada: ${targetValue}`);
      } catch (error) {
        console.error(error);
        toast.error('Error al enviar');
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
          {isOn ? 'ENCENDIDO' : 'APAGADO'}
        </span>
        {!can.controlEquipment && (
          <span className="mt-2 text-xs text-orange-500 dark:text-orange-400 font-medium flex items-center gap-1">
            <Lock size={10} /> Solo Lectura
          </span>
        )}
      </div>
    </BaseWidget>
  );
};

export default SwitchWidget;