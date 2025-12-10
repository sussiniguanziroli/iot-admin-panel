import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip 
} from 'recharts';

const DashboardBomba = () => {
  // Estados
  const [client, setClient] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Datos de la máquina
  const [data, setData] = useState({ estado: 'OFF', amperes: 0.00 });
  const [history, setHistory] = useState([]);
  
  // Estado para el botón (visual inmediato)
  const [switchState, setSwitchState] = useState(false);

  // Configuración del Gauge (Medidor)
  const MAX_AMP = 20; // Escala máxima del gráfico
  const gaugeData = [
    { name: 'val', value: data.amperes },
    { name: 'rest', value: Math.max(MAX_AMP - data.amperes, 0) }
  ];
  const gaugeColors = ['#0ea5e9', '#e5e7eb']; // Cyan y Gris

  useEffect(() => {
    // Conexión al Broker
    const mqttClient = mqtt.connect('ws://localhost:9001', {
      keepalive: 30,
      reconnectPeriod: 2000
    });

    mqttClient.on('connect', () => {
      setIsConnected(true);
      console.log('Conectado al Broker MQTT');
      mqttClient.subscribe('bombeo/santa_isabel/telemetria');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const hora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        setData(payload);
        setSwitchState(payload.estado === 'ON');

        // Actualizar histórico (últimos 30 puntos)
        setHistory(prev => {
          const nuevo = [...prev, { time: hora, amperes: payload.amperes }];
          return nuevo.length > 30 ? nuevo.slice(1) : nuevo;
        });

      } catch (e) {
        console.error('Error parseando JSON:', e);
      }
    });

    mqttClient.on('close', () => setIsConnected(false));
    setClient(mqttClient);

    return () => mqttClient.end();
  }, []);

  // Función para enviar comandos
  const toggleMotor = () => {
    if (client) {
      const orden = switchState ? "PARADA" : "MARCHA";
      client.publish('bombeo/santa_isabel/comandos', orden);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans text-slate-700">
      
      {/* HEADER DE LA APP */}
      <div className="max-w-6xl mx-auto mb-6 bg-[#1e293b] text-white p-4 rounded-xl shadow-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💧</span>
          <div>
            <h1 className="text-xl font-bold tracking-wide">Estación Santa Isabel</h1>
            <p className="text-xs text-slate-400">Panel de Control de Bombeo</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
          {isConnected ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>

      {/* GRILLA DE TARJETAS RESPONSIVA */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* --- TARJETA 1: BOTÓN (Replica Ubidots) --- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-between min-h-[300px]">
          <div className="w-full text-left border-b border-slate-100 pb-2 mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Marcha / Parada</h3>
            <p className="text-xs text-slate-400">Control Manual</p>
          </div>
          
          <button 
            onClick={toggleMotor}
            className={`w-32 h-32 rounded-full shadow-xl transition-all duration-300 transform active:scale-95 flex items-center justify-center border-4 ${
              switchState 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 border-green-100 shadow-green-200' 
              : 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-100'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          <span className={`font-bold text-lg mt-4 ${switchState ? 'text-green-600' : 'text-slate-400'}`}>
            {switchState ? 'ENCENDIDO' : 'APAGADO'}
          </span>
        </div>

        {/* --- TARJETA 2: ESTADO (Luz Piloto) --- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-between min-h-[300px]">
          <div className="w-full text-left border-b border-slate-100 pb-2 mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Estado Motor</h3>
            <p className="text-xs text-slate-400">Monitoreo en Vivo</p>
          </div>

          <div className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-500 ${
            data.estado === 'ON' ? 'bg-green-500 shadow-2xl shadow-green-200' : 'bg-red-500 shadow-xl shadow-red-200'
          }`}>
             {/* Brillo interno simulado */}
             <div className="absolute inset-2 rounded-full border-2 border-white/20"></div>
             <span className="text-white font-bold text-xl tracking-wider">
                {data.estado}
             </span>
          </div>

          <div className="text-center mt-2">
            <p className="text-slate-500 text-sm">Último reporte:</p>
            <p className="font-mono text-xs text-slate-400">{new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        {/* --- TARJETA 3: GAUGE (Consumo Actual) --- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-between min-h-[300px]">
          <div className="w-full text-left border-b border-slate-100 pb-2 mb-4">
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Consumo (Amp)</h3>
            <p className="text-xs text-slate-400">Carga Eléctrica</p>
          </div>

          <div className="relative w-full h-48 flex items-end justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={data.amperes > 18 ? '#ef4444' : '#0ea5e9'} /> {/* Rojo si pasa 18A */}
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute bottom-0 text-center mb-4">
               <span className="text-4xl font-bold text-slate-700">{data.amperes}</span>
               <span className="text-sm text-slate-400 font-medium ml-1">A</span>
            </div>
          </div>

          <div className="w-full flex justify-between text-xs text-slate-400 px-8 mt-[-20px]">
            <span>0A</span>
            <span>{MAX_AMP}A</span>
          </div>
        </div>

        {/* --- TARJETA 4: GRÁFICO DE HISTORIA (Ocupa todo el ancho en PC) --- */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 md:col-span-2 lg:col-span-3">
          <div className="w-full text-left border-b border-slate-100 pb-2 mb-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase">Curva de Consumo</h3>
            <p className="text-xs text-slate-400">Histórico de Amperaje (Últimos 30 seg)</p>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" hide={true} />
                <YAxis domain={[0, MAX_AMP]} tick={{fontSize: 12, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line 
                  type="monotone" 
                  dataKey="amperes" 
                  stroke="#0ea5e9" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{r: 6}}
                  fill="url(#colorAmp)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardBomba;