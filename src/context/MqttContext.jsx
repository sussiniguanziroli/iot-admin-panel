import React, { createContext, useContext, useEffect, useState } from 'react';
import mqtt from 'mqtt';

const MqttContext = createContext();

// --- CONFIGURAÇÃO HIVEMQ CLOUD ---
const MQTT_CONFIG = {
  host: 'd117b2b403d34e1cbc27488bb7782e37.s1.eu.hivemq.cloud', 
  port: 8884,
  protocol: 'wss',
  username: 'sussiniguanziroli', 
  password: 'SolFrut2025', 
};

export const MqttProvider = ({ children }) => {
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);

  useEffect(() => {
    console.log('Iniciando conexão ao HiveMQ Cloud...');
    
    // Construção correta da URL para HiveMQ Cloud
    const url = `${MQTT_CONFIG.protocol}://${MQTT_CONFIG.host}:${MQTT_CONFIG.port}/mqtt`;
    
    const options = {
      username: MQTT_CONFIG.username,
      password: MQTT_CONFIG.password,
      clientId: `react_dash_${Math.random().toString(16).substring(2, 8)}`,
      keepalive: 60,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30 * 1000,
      rejectUnauthorized: false, 
    };

    console.log(`Conectando a: ${url}`);
    
    const mqttClient = mqtt.connect(url, options);

    mqttClient.on('connect', () => {
      console.log('✅ Conectado ao HiveMQ Cloud');
      setIsConnected(true);
    });

    mqttClient.on('error', (err) => {
      console.error('❌ Erro MQTT:', err);
      setIsConnected(false);
    });

    mqttClient.on('close', () => {
      console.log('⚠️ Conexão fechada (tentando reconectar...)');
      setIsConnected(false);
    });

    mqttClient.on('offline', () => {
      console.log('🔌 Cliente offline');
      setIsConnected(false);
    });

    // Escuta global de mensagens
    mqttClient.on('message', (topic, message) => {
      setLastMessage({ topic, payload: message.toString(), timestamp: new Date() });
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) {
        console.log('Desconectando cliente...');
        mqttClient.end();
      }
    };
  }, []);

  // Função auxiliar para se inscrever a partir de componentes
  const subscribeToTopic = (topic) => {
    if (client && client.connected) {
      client.subscribe(topic, (err) => {
        if (!err) console.log(`Inscrito em: ${topic}`);
        else console.error(`Erro ao se inscrever em ${topic}:`, err);
      });
    } else {
        console.warn(`Não foi possível se inscrever em ${topic}: Cliente desconectado`);
    }
  };

  // Função auxiliar para publicar (COM LOGS DE DEBUG)
  const publishMessage = (topic, message) => {
    if (client && client.connected) {
      console.log(`[MQTT OUT] Publicando em [${topic}]: ${message}`);
      client.publish(topic, message, (err) => {
        if (err) console.error("Erro ao publicar:", err);
      });
    } else {
        console.warn(`Não foi possível publicar em ${topic}: Cliente desconectado`);
    }
  };

  return (
    <MqttContext.Provider value={{ client, isConnected, lastMessage, subscribeToTopic, publishMessage }}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqtt = () => useContext(MqttContext);