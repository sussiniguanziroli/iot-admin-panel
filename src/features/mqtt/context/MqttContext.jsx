import React, { createContext, useContext, useState, useCallback } from 'react';
import mqtt from 'mqtt';

const MqttContext = createContext();

export const MqttProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  
  const [activeConfig, setActiveConfig] = useState(null);

  const connectToBroker = useCallback((mqttConfig) => {
    if (!mqttConfig || !mqttConfig.host) {
        console.warn("⚠️ Cannot connect: Missing MQTT Config");
        return;
    }

    if (activeConfig && 
        activeConfig.host === mqttConfig.host && 
        activeConfig.username === mqttConfig.username) {
        return; 
    }

    console.log(`🔌 Switching Broker: Connecting to ${mqttConfig.host}...`);
    setConnectionStatus('connecting');

    if (client) {
        console.log("Disconnecting previous client...");
        client.end(true); 
    }

    const url = `${mqttConfig.protocol}://${mqttConfig.host}:${mqttConfig.port}/mqtt`;
    const options = {
      username: mqttConfig.username,
      password: mqttConfig.password,
      clientId: `solfrut_${Math.random().toString(16).substring(2, 8)}`,
      keepalive: 60,
      clean: true,
      reconnectPeriod: 5000,
    };

    const newClient = mqtt.connect(url, options);

    newClient.on('connect', () => {
      console.log('✅ Connected to Broker:', mqttConfig.host);
      setConnectionStatus('connected');
      setActiveConfig(mqttConfig);
    });

    newClient.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
      setConnectionStatus('error');
    });

    newClient.on('offline', () => {
      setConnectionStatus('disconnected');
    });

    newClient.on('message', (topic, message) => {
      setLastMessage({ topic, payload: message.toString(), timestamp: new Date() });
    });

    setClient(newClient);

  }, [client, activeConfig]);

  const disconnect = useCallback(() => {
    if (client) {
      client.end();
      setClient(null);
      setConnectionStatus('disconnected');
      setActiveConfig(null);
    }
  }, [client]);

  const subscribeToTopic = (topic) => {
    if (client?.connected) {
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error subscribing to ${topic}:`, err);
        } else {
          console.log(`✅ Subscribed to: ${topic}`);
        }
      });
    } else {
      console.warn('⚠️ Cannot subscribe: Client not connected');
    }
  };

  const unsubscribeFromTopic = (topic) => {
    if (client?.connected) {
      client.unsubscribe(topic, (err) => {
        if (err) {
          console.error(`Error unsubscribing from ${topic}:`, err);
        } else {
          console.log(`✅ Unsubscribed from: ${topic}`);
        }
      });
    }
  };

  const publishMessage = (topic, message) => {
    if (client?.connected) {
      client.publish(topic, message);
      console.log(`📤 Published to ${topic}:`, message);
    } else {
      console.warn('⚠️ Cannot publish: Client not connected');
    }
  };

  return (
    <MqttContext.Provider value={{ 
      client, 
      connectionStatus, 
      lastMessage, 
      subscribeToTopic,
      unsubscribeFromTopic,
      publishMessage,
      connectToBroker,
      disconnect,   
      activeConfig        
    }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => useContext(MqttContext);