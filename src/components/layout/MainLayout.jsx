import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, LayoutDashboard, BarChart2, Users, Edit3, Check, Wifi, WifiOff, Settings, Download, Upload, FileJson } from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import mqtt from 'mqtt';

const MainLayout = ({ children, activeTab, setActiveTab }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Menu desplegable
  const fileInputRef = useRef(null); // Referencia al input oculto

  const { isEditMode, toggleEditMode, machines, widgets, loadProfile } = useDashboard();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = mqtt.connect('ws://localhost:9001', { reconnectPeriod: 5000 });
    client.on('connect', () => setIsConnected(true));
    client.on('offline', () => setIsConnected(false));
    client.on('close', () => setIsConnected(false));
    return () => client.end();
  }, []);

  // --- LOGICA DE EXPORTACION ---
  const handleExport = () => {
    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      machines: machines,
      widgets: widgets
    };
    
    // Crear el archivo blob y descargarlo
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `iot-profile-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsSettingsOpen(false);
  };

  // --- LOGICA DE IMPORTACION ---
  const handleImportClick = () => {
    fileInputRef.current.click(); // Disparar el input oculto
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        loadProfile(parsedData); // Llamamos al contexto
        setIsSettingsOpen(false);
      } catch (err) {
        alert("El archivo no es un JSON válido");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // Resetear input
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tablero Principal', icon: <LayoutDashboard size={20} /> },
    { id: 'analytics', label: 'Estadísticas', icon: <BarChart2 size={20} /> },
    { id: 'users', label: 'Usuarios', icon: <Users size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">IoT</div>
            <span className="text-xl font-bold tracking-wider">ADMIN</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon} <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu size={24} /></button>
            <h2 className="text-lg font-semibold text-slate-700 hidden sm:block">{menuItems.find(i => i.id === activeTab)?.label}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* STATUS */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${isConnected ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="hidden sm:inline">{isConnected ? 'ONLINE' : 'DESCONECTADO'}</span>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
            </div>

            {/* EDIT MODE */}
            {activeTab === 'dashboard' && (
              <button onClick={toggleEditMode} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isEditMode ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {isEditMode ? <Check size={18} /> : <Edit3 size={18} />} <span className="hidden sm:inline">{isEditMode ? 'Finalizar' : 'Editar'}</span>
              </button>
            )}
            
            {/* --- MENU CONFIGURACIÓN (DROPDOWN) --- */}
            <div className="relative">
              <button 
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isSettingsOpen ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                <Settings size={20} />
              </button>

              {/* DROPDOWN MENU */}
              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
                    <p className="text-sm font-bold text-slate-700">Configuración</p>
                    <p className="text-xs text-slate-400">Gestión de Perfiles</p>
                  </div>
                  
                  <div className="p-2">
                    <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors text-left">
                      <Download size={16} /> Exportar Perfil JSON
                    </button>

                    <button onClick={handleImportClick} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors text-left">
                      <Upload size={16} /> Importar Perfil JSON
                    </button>
                    
                    {/* Input oculto para cargar archivo */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".json" 
                      className="hidden" 
                    />
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 relative">
          {children}
        </main>

        {/* Backdrop transparente para cerrar el dropdown si clickeas afuera */}
        {isSettingsOpen && <div className="fixed inset-0 z-30" onClick={() => setIsSettingsOpen(false)} />}
      </div>
      
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default MainLayout;