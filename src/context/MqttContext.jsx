import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import mqtt from 'mqtt';

const MqttContext = createContext();

export const MqttProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [lastMessage, setLastMessage] = useState(null);
  const [config, setConfig] = useState(null);

  // Cargar configuración guardada al inicio
  useEffect(() => {
    const savedConfig = localStorage.getItem('mqtt_config');
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
  }, []);

  // Función para conectar (llamada desde el Modal o al inicio)
  const connect = useCallback((mqttConfig) => {
    if (!mqttConfig) return;

    setConnectionStatus('connecting');
    console.log('Intentando conectar a MQTT:', mqttConfig.host);

    const url = `${mqttConfig.protocol}://${mqttConfig.host}:${mqttConfig.port}/mqtt`;
    
    const options = {
      username: mqttConfig.username,
      password: mqttConfig.password,
      clientId: `solfrut_dash_${Math.random().toString(16).substring(2, 8)}`,
      keepalive: 60,
      clean: true,
      reconnectPeriod: 5000,
    };

    // Si ya existía un cliente, lo cerramos antes
    if (client) client.end();

    const mqttClient = mqtt.connect(url, options);

    mqttClient.on('connect', () => {
      console.log('✅ Conectado al Broker');
      setConnectionStatus('connected');
      // Guardar configuración exitosa
      localStorage.setItem('mqtt_config', JSON.stringify(mqttConfig));
      setConfig(mqttConfig);
    });

    mqttClient.on('error', (err) => {
      console.error('❌ Error MQTT:', err);
      setConnectionStatus('error');
    });

    mqttClient.on('offline', () => {
      setConnectionStatus('disconnected');
    });

    mqttClient.on('message', (topic, message) => {
      setLastMessage({ topic, payload: message.toString(), timestamp: new Date() });
    });

    setClient(mqttClient);
  }, [client]); // ✅ CORRECCIÓN: Agregamos 'client' a las dependencias

  const disconnect = () => {
    if (client) {
      client.end();
      setClient(null);
      setConnectionStatus('disconnected');
      localStorage.removeItem('mqtt_config');
      setConfig(null);
    }
  };

  // Auto-conectar si hay config guardada
  useEffect(() => {
    if (config && !client) {
      connect(config);
    }
  }, [config, connect, client]); // Agregué client por seguridad

  const subscribeToTopic = (topic) => {
    if (client?.connected) {
      client.subscribe(topic, (err) => {
        if (err) console.error(`Error suscribiendo a ${topic}:`, err);
      });
    }
  };

  const publishMessage = (topic, message) => {
    if (client?.connected) {
      client.publish(topic, message);
    }
  };

  return (
    <MqttContext.Provider value={{ 
      client, 
      connectionStatus, 
      lastMessage, 
      subscribeToTopic, 
      publishMessage,
      connect,      
      disconnect,   
      config        
    }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => useContext(MqttContext);