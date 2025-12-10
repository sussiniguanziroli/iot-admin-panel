import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardIoT = () => {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState('Desconectado');
  const [isConnected, setIsConnected] = useState(false);
  const [currentData, setCurrentData] = useState({ temp: 0, hum: 0 });
  const [history, setHistory] = useState([]);
  const [fanStatus, setFanStatus] = useState(false);

  useEffect(() => {
    const mqttClient = mqtt.connect('ws://localhost:9001', {
      keepalive: 30,
      reconnectPeriod: 1000,
    });

    mqttClient.on('connect', () => {
      setStatus('Conectado');
      setIsConnected(true);
      mqttClient.subscribe('laboratorio/temperatura');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        setCurrentData(payload);

        setHistory((prev) => {
          const newData = [...prev, { time: timeStr, ...payload }];
          if (newData.length > 20) return newData.slice(1);
          return newData;
        });
      } catch (error) {
        console.error(error);
      }
    });

    mqttClient.on('close', () => {
      setStatus('Desconectado');
      setIsConnected(false);
    });

    mqttClient.on('error', (err) => {
      console.error('Error de conexión:', err);
      mqttClient.end();
    });

    setClient(mqttClient);

    return () => {
      if (mqttClient) mqttClient.end();
    };
  }, []);

  const toggleFan = () => {
    if (client && isConnected) {
      const newStatus = !fanStatus;
      setFanStatus(newStatus);
      const command = newStatus ? 'ENCENDER_VENTILADOR' : 'APAGAR_VENTILADOR';
      client.publish('laboratorio/comandos', command);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏭</span>
          <h1 className="text-2xl font-bold text-slate-800">Control de Planta</h1>
        </div>
        <div className={`px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transition-colors ${isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
          {status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Tarjeta Temperatura */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-rose-500 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-slate-500 font-medium mb-1">Temperatura</p>
              <h2 className="text-5xl font-bold text-slate-800">{currentData.temp}°C</h2>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">🌡️</span>
            </div>
          </div>
        </div>

        {/* Tarjeta Humedad */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-cyan-500 relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <p className="text-slate-500 font-medium mb-1">Humedad</p>
              <h2 className="text-5xl font-bold text-slate-800">{currentData.hum}%</h2>
            </div>
            <div className="p-3 bg-cyan-50 rounded-lg group-hover:scale-110 transition-transform">
              <span className="text-2xl">💧</span>
            </div>
          </div>
        </div>

        {/* PANEL DE CONTROL (NUEVO) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-violet-500 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 font-medium mb-1">Ventilación</p>
              <h2 className="text-2xl font-bold text-slate-800">{fanStatus ? 'ACTIVO' : 'INACTIVO'}</h2>
            </div>
            <div className={`p-3 rounded-lg transition-colors ${fanStatus ? 'bg-green-100' : 'bg-slate-100'}`}>
              <span className={`text-2xl block ${fanStatus ? 'animate-spin' : ''}`}>☢️</span>
            </div>
          </div>
          
          <button 
            onClick={toggleFan}
            disabled={!isConnected}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 ${
              !isConnected ? 'bg-slate-300 cursor-not-allowed' :
              fanStatus ? 'bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-200'
            }`}
          >
            {fanStatus ? 'APAGAR SISTEMA' : 'INICIAR SISTEMA'}
          </button>
        </div>

      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm h-96 w-full border border-slate-100">
        <h3 className="text-lg font-semibold text-slate-700 mb-6">Métricas en Tiempo Real</h3>
        <div className="h-full w-full pb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                tick={{fontSize: 12}} 
                tickLine={false}
                axisLine={false} 
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{fontSize: 12}} 
                tickLine={false} 
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Line 
                type="monotone" 
                dataKey="temp" 
                stroke="#f43f5e" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
              <Line 
                type="monotone" 
                dataKey="hum" 
                stroke="#06b6d4" 
                strokeWidth={3} 
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};

export default DashboardIoT;