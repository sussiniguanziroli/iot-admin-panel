import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { Power, ToggleLeft } from 'lucide-react'; // Icono de Switch
import BaseWidget from './BaseWidget';

const SwitchWidget = ({ id, title, topic, commandTopic }) => {
  const [client, setClient] = useState(null);
  const [isOn, setIsOn] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const mqttClient = mqtt.connect('ws://localhost:9001');
    mqttClient.on('connect', () => mqttClient.subscribe(topic));

    mqttClient.on('message', (t, message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (payload.estado) {
          setIsOn(payload.estado === 'ON');
          setLastUpdated(new Date().toLocaleTimeString());
        }
      } catch (e) {}
    });

    setClient(mqttClient);
    return () => mqttClient.end();
  }, [topic]);

  const toggle = () => {
    if (client) {
      const cmd = isOn ? "PARADA" : "MARCHA";
      client.publish(commandTopic, cmd);
    }
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