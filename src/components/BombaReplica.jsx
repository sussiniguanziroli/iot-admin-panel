import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// Icono de Power (SVG simple)
const PowerIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" />
  </svg>
);

const BombaReplica = () => {
  const [client, setClient] = useState(null);
  const [data, setData] = useState({ estado: 'OFF', amperes: 0.00 });
  
  // Estado local para control inmediato visual
  const [isSwitchOn, setIsSwitchOn] = useState(false);

  useEffect(() => {
    const mqttClient = mqtt.connect('ws://localhost:9001', {
      keepalive: 30, 
      reconnectPeriod: 1000 
    });

    mqttClient.on('connect', () => {
      console.log('Conectado al broker');
      mqttClient.subscribe('bombeo/santa_isabel/telemetria');
    });

    mqttClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setData(payload);
        // Sincronizamos el switch visual con el estado real que reporta la máquina
        setIsSwitchOn(payload.estado === 'ON');
      } catch (e) {
        console.error(e);
      }
    });

    setClient(mqttClient);
    return () => mqttClient.end();
  }, []);

  const toggleMarcha = () => {
    if (!client) return;
    const comando = !isSwitchOn ? "MARCHA" : "PARADA";
    client.publish('bombeo/santa_isabel/comandos', comando);
    // Nota: El estado visual 'isSwitchOn' se actualizará cuando llegue la confirmación por MQTT
  };

  // Datos para el gráfico de Gauge (Amperes)
  // Valor máximo del gráfico: 10 Amperes (ajustable)
  const MAX_AMP = 10; 
  const gaugeData = [
    { name: 'value', value: data.amperes },
    { name: 'rest', value: MAX_AMP - data.amperes }
  ];
  // Colores del Gauge: Gris claro fondo, Cyan para el valor
  const gaugeColors = ['#06b6d4', '#e5e7eb'];

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-8 px-4 font-sans">
      {/* Contenedor tipo Móvil (ancho limitado) */}
      <div className="w-full max-w-sm space-y-4">

        {/* --- HEADER --- */}
        <div className="bg-[#1e3a8a] text-white p-4 rounded-t-lg shadow-sm flex justify-between items-center">
          <h1 className="text-lg font-light">bombeo</h1>
          <span className="text-xs opacity-70">En línea</span>
        </div>

        {/* --- TARJETA 1: BOTÓN MARCHA/PARADA --- */}
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-gray-500 text-sm self-start mb-4">boton Marcha/parada</h2>
          
          <div className="text-center mb-4">
            <span className="text-gray-400 text-xs block">o75</span>
            <span className="text-gray-600 text-sm font-medium">(bombeo Santa Isabel)</span>
          </div>

          <button 
            onClick={toggleMarcha}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-inner ${
              isSwitchOn 
                ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-green-200' 
                : 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-gray-200'
            }`}
          >
            <PowerIcon className="w-16 h-16 drop-shadow-md" />
          </button>

          <span className="mt-4 text-gray-500 font-medium">{isSwitchOn ? 'On' : 'Off'}</span>
        </div>

        {/* --- TARJETA 2: ESTADO (Luz Piloto) --- */}
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-gray-500 text-sm self-start mb-4">ESTADO</h2>
          
          <div className="text-center mb-6">
            <span className="text-gray-500 text-sm block">MOTOR 1</span>
            <span className="text-gray-400 text-xs font-light">(bombeo Santa Isabel)</span>
          </div>

          {/* El círculo rojo/verde */}
          <div 
            className={`w-40 h-40 rounded-full shadow-lg transition-colors duration-500 ${
              data.estado === 'ON' ? 'bg-[#22c55e]' : 'bg-[#dc2626]'
            }`}
          >
            {/* Efecto de brillo/sombra simulado con css (opcional) */}
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-black/20 to-transparent"></div>
          </div>

          <span className="mt-4 text-gray-600 font-bold">{data.estado === 'ON' ? 'Running' : 'Off'}</span>
        </div>

        {/* --- TARJETA 3: CONSUMO (Gauge) --- */}
        <div className="bg-white rounded-lg p-6 shadow-sm flex flex-col items-center">
          <h2 className="text-gray-500 text-sm self-start mb-2">Consumo(Amp)</h2>
          
          <div className="w-full h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gaugeData}
                  cx="50%"
                  cy="100%" // Centro abajo para hacer medio circulo
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                >
                  {gaugeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={gaugeColors[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Texto en el centro del gauge */}
            <div className="absolute bottom-0 left-0 w-full text-center mb-2">
              <span className="text-3xl font-bold text-[#06b6d4] block">
                {data.amperes.toFixed(2)}
              </span>
              <span className="text-gray-400 text-sm uppercase">A</span>
            </div>
            
            <div className="absolute bottom-[-25px] w-full flex justify-between px-8 text-xs text-gray-400">
              <span>0</span>
              <span>{MAX_AMP}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BombaReplica;