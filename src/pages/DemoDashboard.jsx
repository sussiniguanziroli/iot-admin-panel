import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Activity, Droplets, AlertCircle, CheckCircle, 
  Factory, Power, StopCircle, Gauge, Moon, Sun 
} from 'lucide-react';

// --- DEMO GAUGE WIDGET ---
const DemoGauge = ({ title, value, unit, min, max, color }) => {
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1) * 100;
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center relative overflow-hidden transition-colors">
        <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">{title}</h3>
        <div className="relative w-32 h-16 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-slate-100 dark:bg-slate-700 rounded-t-full"></div>
            <div 
                className="absolute top-0 left-0 w-full h-full rounded-t-full origin-bottom transition-transform duration-500 ease-out"
                style={{ 
                    backgroundColor: color,
                    transform: `rotate(${percentage * 1.8 - 180}deg)` 
                }}
            ></div>
        </div>
        <div className="text-2xl font-bold text-slate-800 dark:text-white mt-2">
            {value} <span className="text-sm text-slate-400">{unit}</span>
        </div>
    </div>
  );
};

// --- DEMO CHART WIDGET ---
const DemoChart = ({ title, data, color }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 col-span-1 md:col-span-2 transition-colors">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} /> {title}
            </h3>
            <span className="text-xs text-slate-400">Live 1s interval</span>
        </div>
        <div className="flex items-end gap-1 h-32 w-full">
            {data.map((val, i) => (
                <div 
                    key={i} 
                    className="flex-1 rounded-t-sm opacity-80 transition-all duration-300"
                    style={{ 
                        height: `${val}%`, 
                        backgroundColor: color 
                    }}
                ></div>
            ))}
        </div>
    </div>
);

// --- DEMO METRIC WIDGET ---
const DemoMetric = ({ title, value, unit, icon: Icon, colorClass }) => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${colorClass}`}>
                <Icon size={18}/>
            </div>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">{title}</span>
        </div>
        <div className="text-3xl font-bold text-slate-800 dark:text-white">
            {value} <span className="text-sm text-slate-400">{unit}</span>
        </div>
    </div>
);

const DemoDashboard = () => {
  const navigate = useNavigate();
  const [activeMachine, setActiveMachine] = useState('line_1');
  const [isDark, setIsDark] = useState(false);

  // Theme Init
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      setIsDark(true);
    }
  };
  
  // -- MACHINES STATE --
  const [machines, setMachines] = useState({
    line_1: {
        name: 'Bottling Line A',
        isRunning: true,
        metrics: { temp: 65, speed: 1200, power: 45, chart: Array(20).fill(50) }
    },
    line_2: {
        name: 'Packaging Unit',
        isRunning: false,
        metrics: { pressure: 2.4, count: 8500, vibration: 0.5, chart: Array(20).fill(30) }
    },
    oven_1: {
        name: 'Industrial Oven',
        isRunning: true,
        metrics: { temp: 210, gasFlow: 12.5, fanSpeed: 100, chart: Array(20).fill(80) }
    }
  });

  // -- SIMULATOR ENGINE --
  useEffect(() => {
    const interval = setInterval(() => {
      setMachines(prevMachines => {
        const nextState = { ...prevMachines };
        
        Object.keys(nextState).forEach(key => {
            const m = nextState[key];
            if (!m.isRunning) return; // Don't simulate if stopped

            // Simulation Logic varies by machine type just for fun
            if (key === 'line_1') {
                const newTemp = (m.metrics.temp + (Math.random() - 0.5) * 2);
                m.metrics.temp = parseFloat(Math.min(Math.max(newTemp, 50), 90).toFixed(1));
                m.metrics.speed = Math.floor(Math.min(Math.max(m.metrics.speed + (Math.random() - 0.5) * 50, 0), 2000));
                m.metrics.chart = [...m.metrics.chart.slice(1), Math.random() * 100];
            } else if (key === 'line_2') {
                m.metrics.pressure = parseFloat((m.metrics.pressure + (Math.random() - 0.5) * 0.1).toFixed(2));
                m.metrics.count += Math.floor(Math.random() * 5);
                m.metrics.chart = [...m.metrics.chart.slice(1), Math.random() * 60];
            } else {
                m.metrics.temp = parseFloat((m.metrics.temp + (Math.random() - 0.5) * 5).toFixed(1));
                m.metrics.gasFlow = parseFloat((m.metrics.gasFlow + (Math.random() - 0.5) * 0.5).toFixed(1));
                m.metrics.chart = [...m.metrics.chart.slice(1), Math.random() * 80 + 20];
            }
        });
        return nextState;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMachine = () => {
    setMachines(prev => ({
        ...prev,
        [activeMachine]: {
            ...prev[activeMachine],
            isRunning: !prev[activeMachine].isRunning
        }
    }));
  };

  const currentData = machines[activeMachine];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* HEADER */}
      <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">Interactive Demo</div>
                <div className="text-lg font-bold">Fortunato.ctech Simulation</div>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="hidden sm:flex items-center gap-3 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold text-green-400">SYSTEM SIMULATED</span>
            </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR */}
        <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col transition-colors">
            <div className="p-6">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Select Machine</h2>
                <div className="space-y-2">
                    {Object.keys(machines).map(key => (
                        <button 
                            key={key}
                            onClick={() => setActiveMachine(key)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-bold transition-all ${
                                activeMachine === key 
                                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800 shadow-sm' 
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                        >
                            <Factory size={18} />
                            {machines[key].name}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="mt-auto p-6 border-t border-slate-100 dark:border-slate-800">
                <div className="bg-blue-600 rounded-xl p-4 text-white text-center shadow-lg shadow-blue-900/20">
                    <p className="text-sm font-bold mb-2">Ready to go live?</p>
                    <button onClick={() => navigate('/login')} className="w-full bg-white text-blue-600 py-2 rounded-lg text-xs font-bold hover:bg-blue-50 transition-colors">
                        Create Account
                    </button>
                </div>
            </div>
        </div>

        {/* MAIN DASHBOARD CONTENT */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
            <div className="max-w-5xl mx-auto">
                
                {/* MACHINE HEADER & CONTROLS */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                            {currentData.name}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            ID: <span className="font-mono">{activeMachine.toUpperCase()}</span>
                        </p>
                    </div>
                    
                    <button 
                        onClick={toggleMachine}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${
                            currentData.isRunning 
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                        }`}
                    >
                        {currentData.isRunning ? <StopCircle size={20}/> : <Power size={20}/>}
                        {currentData.isRunning ? 'STOP MACHINE' : 'START MACHINE'}
                    </button>
                </div>

                {/* GRID LAYOUT - DYNAMIC CONTENT PER MACHINE */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    {/* STATUS CARD (Common to all) */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between transition-colors">
                        <div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Operational Status</div>
                            <div className={`font-bold text-lg flex items-center gap-2 ${currentData.isRunning ? 'text-green-500' : 'text-slate-400'}`}>
                                <CheckCircle size={20}/> {currentData.isRunning ? 'RUNNING' : 'STOPPED'}
                            </div>
                        </div>
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${currentData.isRunning ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 animate-pulse' : 'bg-slate-100 text-slate-400 dark:bg-slate-700'}`}>
                            <Activity size={24} />
                        </div>
                    </div>

                    {/* --- WIDGETS FOR LINE 1 (BOTTLING) --- */}
                    {activeMachine === 'line_1' && (
                        <>
                            <DemoGauge 
                                title="Motor Temperature" 
                                value={currentData.metrics.temp} unit="°C" min={0} max={100} 
                                color={currentData.metrics.temp > 80 ? '#ef4444' : '#f59e0b'} 
                            />
                            <DemoGauge 
                                title="Line Speed" 
                                value={currentData.metrics.speed} unit="rpm" min={0} max={2000} 
                                color="#3b82f6" 
                            />
                            <DemoChart title="Power Consumption Load" data={currentData.metrics.chart} color="#6366f1" />
                        </>
                    )}

                    {/* --- WIDGETS FOR LINE 2 (PACKAGING) --- */}
                    {activeMachine === 'line_2' && (
                        <>
                            <DemoMetric 
                                title="Hydraulic Pressure" value={currentData.metrics.pressure} unit="Bar" 
                                icon={Droplets} colorClass="bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400" 
                            />
                            <DemoMetric 
                                title="Total Processed" value={currentData.metrics.count} unit="Units" 
                                icon={CheckCircle} colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" 
                            />
                            <DemoChart title="Vibration Analysis" data={currentData.metrics.chart} color="#d946ef" />
                        </>
                    )}

                    {/* --- WIDGETS FOR OVEN 1 --- */}
                    {activeMachine === 'oven_1' && (
                        <>
                            <DemoGauge 
                                title="Internal Temp" value={currentData.metrics.temp} unit="°C" min={0} max={300} 
                                color="#ef4444" 
                            />
                            <DemoMetric 
                                title="Gas Flow Rate" value={currentData.metrics.gasFlow} unit="m³/h" 
                                icon={Gauge} colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" 
                            />
                            <DemoChart title="Thermal Consistency" data={currentData.metrics.chart} color="#f97316" />
                        </>
                    )}

                    {/* ALERT CARD (Common) */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group transition-colors">
                        <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertCircle size={80} />
                        </div>
                        <div className="relative z-10">
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Active Alerts</div>
                            <div className="text-slate-800 dark:text-white font-bold text-lg">0 Faults</div>
                            <div className="text-xs text-slate-400 mt-1">System healthy. No maintenance required.</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default DemoDashboard;