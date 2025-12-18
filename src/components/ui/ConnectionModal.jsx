import React, { useState, useEffect } from 'react';
import { Server, Lock, Wifi, Eye, EyeOff, Save, X } from 'lucide-react';
import { useMqtt } from '../../context/MqttContext';

const ConnectionModal = ({ isOpen, onClose, forceOpen = false }) => {
  const { connect, connectionStatus, config } = useMqtt();
  
  const [formData, setFormData] = useState({
    host: 'd117b2b403d34e1cbc27488bb7782e37.s1.eu.hivemq.cloud',
    port: 8884,
    username: 'sussiniguanziroli',
    password: '',
    protocol: 'wss'
  });

  const [showPassword, setShowPassword] = useState(false);

  // Hook 1: Cargar configuración
  useEffect(() => {
    if (config) {
      setFormData(prev => ({ ...prev, ...config }));
    }
  }, [config]);

  // Hook 2: Auto-cerrar (MOVIDO ARRIBA para evitar el error "Rendered fewer hooks")
  useEffect(() => {
    if (forceOpen && connectionStatus === 'connected') {
      onClose();
    }
  }, [connectionStatus, forceOpen, onClose]);

  // --- EARLY RETURN ---
  // Ahora es seguro retornar null porque todos los hooks ya se declararon arriba
  if (!isOpen && !forceOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    connect(formData);
    // Si no es forzado, cerramos visualmente (la conexión sigue en background)
    if (!forceOpen) onClose(); 
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className={`p-3 rounded-xl ${connectionStatus === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Conexión MQTT</h2>
              <p className="text-xs text-slate-500">Configuración del Broker</p>
            </div>
          </div>
          {!forceOpen && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Host del Broker</label>
            <div className="relative">
              <Wifi className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type="text" 
                required
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                value={formData.host}
                onChange={e => setFormData({...formData, host: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Puerto (WSS)</label>
              <input 
                type="number" 
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                value={formData.port}
                onChange={e => setFormData({...formData, port: Number(e.target.value)})}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Protocolo</label>
              <select 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm"
                value={formData.protocol}
                onChange={e => setFormData({...formData, protocol: e.target.value})}
              >
                <option value="wss">WSS (Seguro)</option>
                <option value="ws">WS (Inseguro)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100"></div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Usuario</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Contraseña</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
              <input 
                type={showPassword ? "text" : "password"} 
                className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* Estado de conexión feedback */}
          {connectionStatus === 'connecting' && (
             <p className="text-xs text-blue-500 font-semibold animate-pulse text-center">Intentando conectar...</p>
          )}
          {connectionStatus === 'error' && (
             <p className="text-xs text-red-500 font-semibold text-center">Error al conectar. Verifica las credenciales.</p>
          )}

          <button 
            type="submit" 
            disabled={connectionStatus === 'connecting'}
            className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
          >
            <Save size={18} />
            {connectionStatus === 'connecting' ? 'Conectando...' : 'Guardar y Conectar'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ConnectionModal;