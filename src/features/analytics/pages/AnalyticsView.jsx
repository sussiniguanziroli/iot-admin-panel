import React, { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, TrendingUp, Zap, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

// Datos Simulados para Gráficos (Mocks)
const MOCK_HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  consumo: Math.floor(Math.random() * (45 - 20) + 20), // 20-45 Amperes
  voltaje: Math.floor(Math.random() * (225 - 215) + 215), // 215-225 Volts
}));

const AnalyticsView = () => {
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);

  // Simulación de carga de datos
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const StatCard = ({ title, value, unit, trend, trendValue, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={24} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        <span className="text-slate-400 font-medium text-sm">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Análisis Histórico</h1>
          <p className="text-sm text-slate-500">Rendimiento energético y operativo de planta.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${
                timeRange === range 
                  ? 'bg-slate-800 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {range === '24h' ? 'Hoy' : range === '7d' ? 'Semana' : 'Mes'}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button 
            onClick={handleRefresh}
            className={`p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-all">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Consumo Total" 
          value="4,250" 
          unit="kWh" 
          icon={Zap} 
          color="bg-amber-100 text-amber-600"
          trend="up"
          trendValue="+12%"
        />
        <StatCard 
          title="Eficiencia Operativa" 
          value="94.2" 
          unit="%" 
          icon={TrendingUp} 
          color="bg-emerald-100 text-emerald-600"
          trend="up"
          trendValue="+2.1%"
        />
        <StatCard 
          title="Tiempo Activo" 
          value="18h 40m" 
          unit="" 
          icon={Clock} 
          color="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="Alertas Críticas" 
          value="2" 
          unit="Eventos" 
          icon={AlertTriangle} 
          color="bg-rose-100 text-rose-600"
          trend="down"
          trendValue="-50%"
        />
      </div>

      {/* GRÁFICO PRINCIPAL (BIG DATA PLACEHOLDER) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Zap size={18} className="text-amber-500" />
            Curva de Demanda Energética
          </h3>
          <div className="flex gap-4 text-xs font-bold">
            <span className="flex items-center gap-1 text-slate-500"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Consumo (A)</span>
            <span className="flex items-center gap-1 text-slate-500"><div className="w-3 h-3 rounded-full bg-purple-400"></div> Voltaje (V)</span>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_HOURLY_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConsumo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                yAxisId="left" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                domain={[200, 240]} 
                axisLine={false} 
                tickLine={false} 
                hide
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area 
                yAxisId="left"
                type="monotone" 
                dataKey="consumo" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorConsumo)" 
                name="Amperaje"
                animationDuration={1500}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="voltaje" 
                stroke="#a855f7" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="5 5"
                name="Voltaje"
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* EVENT LOG TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Registro de Eventos (Logs)</h3>
          <button className="text-sm text-blue-600 font-bold hover:underline">Ver Todo</button>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
            <tr>
              <th className="px-6 py-4">Hora</th>
              <th className="px-6 py-4">Dispositivo</th>
              <th className="px-6 py-4">Evento</th>
              <th className="px-6 py-4">Severidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3].map((_, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-500">14:3{i} PM</td>
                <td className="px-6 py-4 font-medium text-slate-700">Motor {4 + i}</td>
                <td className="px-6 py-4 text-slate-600">Arranque detectado (Corriente nominal)</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">INFO</span>
                </td>
              </tr>
            ))}
             <tr className="bg-rose-50/50 hover:bg-rose-50">
                <td className="px-6 py-4 text-rose-800 font-medium">10:15 AM</td>
                <td className="px-6 py-4 font-bold text-rose-900">Reconectador 101</td>
                <td className="px-6 py-4 text-rose-700">Falla de Fase detectada - Disparo Automático</td>
                <td className="px-6 py-4">
                  <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit">
                    <AlertTriangle size={10} /> CRÍTICO
                  </span>
                </td>
              </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AnalyticsView;