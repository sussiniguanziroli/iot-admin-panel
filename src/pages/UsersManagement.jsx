import React, { useState } from 'react';
import { Plus, Search, MoreVertical, Shield, User, Eye, Trash2, Edit2, CheckCircle, XCircle, Mail } from 'lucide-react';

// Datos simulados iniciales (Mock Data)
const MOCK_USERS = [
  { id: 1, name: 'Patricio Sussini', email: 'admin@solfrut.com', role: 'admin', status: 'active', lastLogin: 'Hace 2 min' },
  { id: 2, name: 'Operador Planta 1', email: 'operador1@solfrut.com', role: 'operador', status: 'active', lastLogin: 'Hace 4 horas' },
  { id: 3, name: 'Gerente Visualizador', email: 'gerencia@solfrut.com', role: 'visualizador', status: 'active', lastLogin: 'Ayer' },
  { id: 4, name: 'Empleado Ex', email: 'baja@solfrut.com', role: 'operador', status: 'inactive', lastLogin: 'Hace 20 días' },
];

const UsersManagement = () => {
  const [users, setUsers] = useState(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'operador' });

  // Filtrado simple
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id) => {
    if (confirm('¿Seguro que deseas eliminar este usuario?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    const id = Date.now();
    setUsers([...users, { ...newUser, id, status: 'active', lastLogin: 'Nunca' }]);
    setIsModalOpen(false);
    setNewUser({ name: '', email: '', role: 'operador' });
  };

  // Componente de Badge para Roles
  const RoleBadge = ({ role }) => {
    const styles = {
      admin: 'bg-purple-100 text-purple-700 border-purple-200',
      operador: 'bg-blue-100 text-blue-700 border-blue-200',
      visualizador: 'bg-slate-100 text-slate-600 border-slate-200'
    };
    
    const icons = {
      admin: <Shield size={12} className="mr-1" />,
      operador: <User size={12} className="mr-1" />,
      visualizador: <Eye size={12} className="mr-1" />
    };

    return (
      <span className={`flex items-center w-fit px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize ${styles[role] || styles.visualizador}`}>
        {icons[role]} {role}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      
      {/* Header de la Sección */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500">Administra el acceso y roles del personal de planta.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center gap-3">
        <Search className="text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nombre o email..." 
          className="flex-1 outline-none text-sm text-slate-700 placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
              <th className="p-4">Usuario</th>
              <th className="p-4">Rol</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Último Acceso</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-700 text-sm">{user.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Mail size={10} /> {user.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="p-4">
                  {user.status === 'active' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold border border-emerald-100">
                      <CheckCircle size={12} /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-1 rounded-md text-xs font-bold border border-slate-200">
                      <XCircle size={12} /> Inactivo
                    </span>
                  )}
                </td>
                <td className="p-4 text-sm text-slate-500">
                  {user.lastLogin}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            No se encontraron usuarios que coincidan con la búsqueda.
          </div>
        )}
      </div>

      {/* Modal Agregar Usuario Simple */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95">
            <h2 className="text-xl font-bold mb-4">Nuevo Usuario</h2>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre Completo</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg" 
                  value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Corporativo</label>
                <input required type="email" className="w-full px-3 py-2 border rounded-lg" 
                  value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rol de Acceso</label>
                <select className="w-full px-3 py-2 border rounded-lg bg-white"
                  value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="operador">Operador (Control + Ver)</option>
                  <option value="visualizador">Visualizador (Solo Ver)</option>
                  <option value="admin">Administrador (Total)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  * El Admin puede gestionar usuarios y dispositivos.
                </p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-bold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">Crear Usuario</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UsersManagement;