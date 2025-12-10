import { useState, useEffect } from 'react';
import mqtt from 'mqtt';

const MqttComponent = () => {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('Conectando...');

  useEffect(() => {
    // Conectamos al puerto WEBSOCKETS (9001)
    const client = mqtt.connect('ws://localhost:9001');

    client.on('connect', () => {
      setStatus('Conectado 🟢');
      // Nos suscribimos al mismo tema que Python
      client.subscribe('laboratorio/temperatura');
    });

    client.on('message', (topic, message) => {
      // Viene como Buffer, lo pasamos a texto y luego a objeto
      const valor = JSON.parse(message.toString());
      
      setMessages(prev => [{
        temp: valor.temp,
        hum: valor.hum,
        hora: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10)); // Guardamos solo los ultimos 10
    });

    return () => client.end(); // Limpieza al cerrar
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>Monitor IoT</h2>
      <h3>Estado: {status}</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ 
            background: '#f0f0f0', 
            padding: '10px', 
            borderRadius: '8px',
            borderLeft: '5px solid #007bff'
          }}>
            <strong style={{ fontSize: '1.5em' }}>{msg.temp}°C</strong>
            <div>Humedad: {msg.hum}%</div>
            <small>{msg.hora}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MqttComponent;