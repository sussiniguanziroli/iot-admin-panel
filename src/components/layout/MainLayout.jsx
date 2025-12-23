import React, { useState, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Menu, X, LayoutDashboard, BarChart2, Users, Edit3, Check, 
  Wifi, WifiOff, Settings, LogOut, Download, Upload, User, Building2 
} from 'lucide-react';
import { useDashboard } from '../../context/DashboardContext';
import { useMqtt } from '../../context/MqttContext';
import { useAuth } from '../../context/AuthContext';
import ConnectionModal from '../ui/ConnectionModal';

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMqttModalOpen, setIsMqttModalOpen] = useState(false);
  
  // Ref for file input (Import Profile)
  const fileInputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  const { isEditMode, toggleEditMode, machines, widgets, loadProfile } = useDashboard();
  const { connectionStatus, disconnect } = useMqtt();
  const { userProfile, logout, hasPermission } = useAuth();

  // --- EXPORT LOGIC ---
  const handleExport = () => {
    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      tenantId: userProfile?.tenantId,
      machines: machines,
      widgets: widgets
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `solfrut-perfil-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsSettingsOpen(false);
  };

  // --- IMPORT LOGIC ---
  const handleImportClick = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        loadProfile(parsedData);
        setIsSettingsOpen(false);
      } catch (err) {
        alert("❌ The file is not a valid JSON");
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = null; 
  };

  // --- MENU CONFIGURATION ---
  const menuItems = [
    { 
      path: '/app/dashboard', 
      label: 'Tablero Principal', 
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      path: '/app/analytics', 
      label: 'Estadísticas', 
      icon: <BarChart2 size={20} /> 
    },
    { 
      path: '/app/users', 
      label: 'Usuarios', 
      icon: <Users size={20} />, 
      restricted: true 
    },
    { 
      path: '/app/tenants', 
      label: 'Tenants (Big Brother)', 
      icon: <Building2 size={20} />, 
      superAdminOnly: true 
    },
  ];

  const handleLogout = () => {
    disconnect();
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans transition-colors duration-200">
      
      {/* --- HIDDEN GLOBAL INPUT --- */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json" 
        className="hidden" 
        style={{ display: 'none' }}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1e293b] dark:bg-slate-950 text-white transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static`}>
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">IoT</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-wider">SOLFRUT</span>
              <span className="text-[10px] text-slate-400 uppercase">{userProfile?.role?.replace('_', ' ') || 'Guest'}</span>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            // 1. Regular Admin Restriction
            if (item.restricted && !hasPermission('admin')) return null;
            
            // 2. Super Admin Restriction (Big Brother)
            if (item.superAdminOnly && userProfile?.role !== 'super_admin') return null;

            const isActive = location.pathname.includes(item.path);
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.icon} <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
           <button onClick={handleLogout} className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-4 py-2">
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
           </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm z-40 relative transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><Menu size={24} /></button>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 hidden sm:block">
               {menuItems.find(i => location.pathname.includes(i.path))?.label || (location.pathname.includes('profile') ? 'Mi Perfil' : 'Panel')}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            
            {/* CONNECTION STATUS - UPDATED LOGIC */}
            {/* Only Admins/Super Admins can click to open manual connection settings */}
            {hasPermission('admin') ? (
                <button 
                  onClick={() => setIsMqttModalOpen(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:opacity-80 
                  ${connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                    'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800'}`}
                >
                  {connectionStatus === 'connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                  <span className="hidden sm:inline">
                    {connectionStatus === 'connected' ? 'ONLINE' : connectionStatus === 'connecting' ? 'CONECTANDO' : 'OFFLINE'}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                </button>
            ) : (
                /* READ-ONLY Status for Tenants/Operators */
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border 
                    ${connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 
                    'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                    <div className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    {connectionStatus === 'connected' ? 'SYSTEM ONLINE' : 'CONNECTING...'}
                </div>
            )}

            {/* Edit Mode Button */}
            {location.pathname.includes('dashboard') && hasPermission('admin') && (
              <button onClick={toggleEditMode} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all ${isEditMode ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-400 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}>
                {isEditMode ? <Check size={18} /> : <Edit3 size={18} />} <span className="hidden sm:inline">{isEditMode ? 'Finalizar' : 'Editar'}</span>
              </button>
            )}
            
            {/* Settings Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isSettingsOpen ? 'bg-slate-200 text-slate-800 dark:bg-slate-600 dark:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'}`}
                >
                    <Settings size={20} />
                </button>

                {isSettingsOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)} />
                        
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right z-20">
                            <div className="px-4 py-3 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Configuración</p>
                                <p className="text-xs text-slate-400">Gestión de Cuenta</p>
                            </div>
                            
                            <div className="p-2 space-y-1">
                                <button 
                                  onClick={() => { navigate('/app/profile'); setIsSettingsOpen(false); }} 
                                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors text-left"
                                >
                                    <User size={16} /> Mi Perfil
                                </button>
                                
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>

                                <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors text-left">
                                    <Download size={16} /> Exportar Perfil
                                </button>

                                <button onClick={handleImportClick} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors text-left">
                                    <Upload size={16} /> Importar Perfil
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-900 relative z-0 transition-colors duration-200">
          <Outlet /> 
        </main>
      </div>
      
      {/* MQTT Modal */}
      <ConnectionModal isOpen={isMqttModalOpen} onClose={() => setIsMqttModalOpen(false)} />

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default MainLayout;