import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useDashboard } from '../context/DashboardContext';
import { 
  Building2, ArrowLeft, Save, UserPlus, Trash2, Crown, Mail, Eye, 
  Activity, MapPin, Wifi, Plus, Server, Edit3, Globe, Layers 
} from 'lucide-react';

// --- LEAFLET MAP IMPORTS ---
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet icon not loading in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- MAP HELPER COMPONENT ---
const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
};

const TenantDetails = () => {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const { switchTenant } = useDashboard();
  
  const [tenant, setTenant] = useState(null);
  const [tenantUsers, setTenantUsers] = useState([]);
  const [tenantLocations, setTenantLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // --- LOCATION MANAGER STATE ---
  const [selectedLocationId, setSelectedLocationId] = useState(null); 
  const [locationForm, setLocationForm] = useState({
    name: '', id: '', address: '', lat: -34.6037, lng: -58.3816, 
    host: '', port: 8884, protocol: 'wss', username: '', password: ''
  });
  const [locSubTab, setLocSubTab] = useState('info'); 

  // Overview & User Forms
  const [overviewForm, setOverviewForm] = useState({ name: '', plan: 'basic', status: 'active', maxDevices: 10, contactEmail: '' });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', name: '', role: 'operator' });

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const tenantSnap = await getDoc(doc(db, "tenants", tenantId));
        if (tenantSnap.exists()) {
          const data = tenantSnap.data();
          setTenant({ id: tenantSnap.id, ...data });
          setOverviewForm({
            name: data.name || '', plan: data.plan || 'basic', status: data.status || 'active',
            maxDevices: data.maxDevices || 10, contactEmail: data.contactEmail || ''
          });
        } else {
          navigate('/app/tenants');
          return;
        }

        const qUsers = query(collection(db, "users"), where("tenantId", "==", tenantId));
        const userSnaps = await getDocs(qUsers);
        setTenantUsers(userSnaps.docs.map(d => ({ id: d.id, ...d.data() })));

        const locRef = collection(db, "tenants", tenantId, "locations");
        const locSnaps = await getDocs(locRef);
        const locs = locSnaps.docs.map(d => ({ id: d.id, ...d.data() }));
        setTenantLocations(locs);
        
        if(locs.length > 0) selectLocation(locs[0]);

      } catch (e) { console.error("Error fetching details:", e); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, [tenantId, navigate]);

  // --- HELPER: Select a Location ---
  const selectLocation = (loc) => {
      setSelectedLocationId(loc.id);
      setLocationForm({
          name: loc.name,
          id: loc.id,
          address: loc.address || '',
          lat: loc.lat || -34.6037,
          lng: loc.lng || -58.3816,
          host: loc.mqtt_config?.host || '',
          port: loc.mqtt_config?.port || 8884,
          protocol: loc.mqtt_config?.protocol || 'wss',
          username: loc.mqtt_config?.username || '',
          password: loc.mqtt_config?.password || ''
      });
      setLocSubTab('info');
  };

  const createNewLocation = () => {
      setSelectedLocationId('NEW');
      setLocationForm({
          name: 'New Site', id: '', address: '', lat: -34.6037, lng: -58.3816,
          host: 'broker.hivemq.com', port: 8884, protocol: 'wss', username: '', password: ''
      });
      setLocSubTab('info');
  };

  // --- ACTIONS ---
  const handleSaveLocation = async (e) => {
    e.preventDefault();
    const locId = (selectedLocationId === 'NEW' || !selectedLocationId) 
        ? (locationForm.id || `loc-${Date.now()}`) 
        : selectedLocationId;
    
    const payload = {
        name: locationForm.name,
        address: locationForm.address,
        lat: locationForm.lat,
        lng: locationForm.lng,
        mqtt_config: {
            host: locationForm.host,
            port: Number(locationForm.port),
            protocol: locationForm.protocol,
            username: locationForm.username,
            password: locationForm.password
        },
        updatedAt: new Date().toISOString()
    };

    if (selectedLocationId === 'NEW') {
        payload.createdAt = new Date().toISOString();
        payload.layout = { machines: [], widgets: [] };
    }

    try {
        await setDoc(doc(db, "tenants", tenantId, "locations", locId), payload, { merge: true });
        
        const newLocObj = { id: locId, ...payload };
        
        if (selectedLocationId === 'NEW') {
            setTenantLocations([...tenantLocations, newLocObj]);
            setSelectedLocationId(locId); 
        } else {
            setTenantLocations(tenantLocations.map(l => l.id === locId ? newLocObj : l));
        }
        alert("✅ Location Saved!");
    } catch (e) { console.error(e); alert("Error saving location"); }
  };

  const handleDeleteLocation = async (locId) => {
    if(!window.confirm("Delete this location?")) return;
    try {
        await deleteDoc(doc(db, "tenants", tenantId, "locations", locId));
        const newLocs = tenantLocations.filter(l => l.id !== locId);
        setTenantLocations(newLocs);
        if(newLocs.length > 0) selectLocation(newLocs[0]);
        else createNewLocation();
    } catch (e) { console.error(e); }
  };

  const handleUpdateOverview = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "tenants", tenantId), { ...overviewForm, updatedAt: new Date().toISOString() });
      setTenant(prev => ({ ...prev, ...overviewForm }));
      alert("✅ Configuration Updated");
    } catch (e) { console.error(e); alert("Failed to update"); }
  };

  const handleImpersonate = () => { switchTenant(tenantId); navigate('/app/dashboard'); };
  
  const handleAddUser = async (e) => {
    e.preventDefault();
    const uid = newUser.email; 
    try {
      await setDoc(doc(db, "users", uid), {
        ...newUser, tenantId: tenantId, createdAt: new Date().toISOString()
      });
      setTenantUsers([...tenantUsers, { id: uid, ...newUser, tenantId }]);
      setIsUserModalOpen(false);
      setNewUser({ email: '', name: '', role: 'operator' });
    } catch (e) { console.error(e); }
  };

  const handleRemoveUser = async (userId) => {
    if(!window.confirm("Revoke access for this user?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      setTenantUsers(tenantUsers.filter(u => u.id !== userId));
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-10 text-center">Loading Configuration...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/app/tenants')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <ArrowLeft size={20} className="text-slate-500" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Building2 className="text-blue-600" />
                    {tenant.name}
                </h1>
                <p className="text-slate-500 text-sm font-mono">ID: {tenant.id}</p>
            </div>
        </div>
        <button onClick={handleImpersonate} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
            <Eye size={18} /> <span className="hidden sm:inline">View Dashboard</span>
        </button>
      </div>

      {/* MAIN TABS */}
      <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700 mb-6">
        {['overview', 'locations', 'users'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} 
                className={`pb-3 text-sm font-bold border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                {tab === 'locations' ? `Locations (${tenantLocations.length})` : tab}
            </button>
        ))}
      </div>

      {/* ======================= TAB: LOCATIONS (MASTER-DETAIL) ======================= */}
      {activeTab === 'locations' && (
        <div className="flex flex-col md:flex-row gap-6 h-[700px]">
            
            {/* LEFT SIDEBAR: LIST */}
            <div className="w-full md:w-1/4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <span className="font-bold text-slate-700 dark:text-slate-200">Sites</span>
                    <button onClick={createNewLocation} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Plus size={16}/></button>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {tenantLocations.map(loc => (
                        <button 
                            key={loc.id} 
                            onClick={() => selectLocation(loc)}
                            className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${
                                selectedLocationId === loc.id 
                                ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div>
                                <div className={`font-bold text-sm ${selectedLocationId === loc.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{loc.name}</div>
                                <div className="text-xs text-slate-400 truncate">{loc.address || 'No Address'}</div>
                            </div>
                            {selectedLocationId === loc.id && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                        </button>
                    ))}
                    {tenantLocations.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No locations found.</div>}
                </div>
            </div>

            {/* RIGHT PANEL: EDITOR */}
            <div className="w-full md:w-3/4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                {/* Editor Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 shadow-sm">
                            <Building2 size={20} className="text-slate-500" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                                {selectedLocationId === 'NEW' ? 'New Location' : locationForm.name}
                            </h2>
                            <p className="text-xs text-slate-400 font-mono">{selectedLocationId === 'NEW' ? 'Creating...' : locationForm.id}</p>
                        </div>
                    </div>
                    
                    {/* Inner Tabs */}
                    <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                        <button 
                            onClick={() => setLocSubTab('info')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${locSubTab === 'info' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Globe size={14}/> General & Map
                        </button>
                        <button 
                            onClick={() => setLocSubTab('mqtt')}
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-2 ${locSubTab === 'mqtt' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Wifi size={14}/> Connectivity
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form id="loc-form" onSubmit={handleSaveLocation} className="space-y-6">
                        
                        {/* --- SUBTAB: INFO & MAP --- */}
                        {locSubTab === 'info' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Site Name</label>
                                        <input type="text" required className="w-full mt-1 px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={locationForm.name} onChange={e => setLocationForm({...locationForm, name: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Physical Address</label>
                                        <input type="text" className="w-full mt-1 px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                            value={locationForm.address} onChange={e => setLocationForm({...locationForm, address: e.target.value})} placeholder="e.g. Av. Corrientes 1234" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Location ID</label>
                                        <input type="text" className="w-full mt-1 px-3 py-2 border rounded bg-slate-50 dark:bg-slate-900 text-slate-500 font-mono text-xs"
                                            value={locationForm.id} onChange={e => setLocationForm({...locationForm, id: e.target.value})} 
                                            readOnly={selectedLocationId !== 'NEW'} placeholder="Auto-generated if empty" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Lat</label>
                                            <input type="number" step="any" className="w-full px-2 py-1 border rounded text-sm bg-slate-50" value={locationForm.lat} readOnly />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Lng</label>
                                            <input type="number" step="any" className="w-full px-2 py-1 border rounded text-sm bg-slate-50" value={locationForm.lng} readOnly />
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-500 flex items-center gap-1"><MapPin size={12}/> Click on map to update coordinates</p>
                                </div>

                                <div className="h-[300px] lg:h-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
                                    <MapContainer center={[locationForm.lat, locationForm.lng]} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <LocationMarker position={[locationForm.lat, locationForm.lng]} setPosition={(pos) => setLocationForm({...locationForm, lat: pos.lat, lng: pos.lng})} />
                                    </MapContainer>
                                </div>
                            </div>
                        )}

                        {/* --- SUBTAB: MQTT --- */}
                        {locSubTab === 'mqtt' && (
                            <div className="max-w-lg mx-auto space-y-6 pt-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700 text-center">
                                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Wifi size={24} />
                                    </div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">MQTT Broker Configuration</h3>
                                    <p className="text-sm text-slate-500">Define the connectivity gateway for this specific site.</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase">Broker Host</label>
                                    <input type="text" required className="w-full mt-1 px-3 py-2 border rounded font-mono text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                        value={locationForm.host} onChange={e => setLocationForm({...locationForm, host: e.target.value})} placeholder="e.g. broker.hivemq.com" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Port</label>
                                        <input type="number" required className="w-full mt-1 px-3 py-2 border rounded font-mono text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            value={locationForm.port} onChange={e => setLocationForm({...locationForm, port: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Protocol</label>
                                        <select className="w-full mt-1 px-3 py-2 border rounded font-mono text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            value={locationForm.protocol} onChange={e => setLocationForm({...locationForm, protocol: e.target.value})}>
                                            <option value="wss">WSS (Secure WebSocket)</option>
                                            <option value="ws">WS (Insecure)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
                                        <input type="text" className="w-full mt-1 px-3 py-2 border rounded font-mono text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            value={locationForm.username} onChange={e => setLocationForm({...locationForm, username: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                                        <input type="password" className="w-full mt-1 px-3 py-2 border rounded font-mono text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                                            value={locationForm.password} onChange={e => setLocationForm({...locationForm, password: e.target.value})} />
                                    </div>
                                </div>
                            </div>
                        )}

                    </form>
                </div>

                {/* Editor Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    {selectedLocationId !== 'NEW' ? (
                        <button onClick={() => handleDeleteLocation(selectedLocationId)} className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1">
                            <Trash2 size={16}/> Delete Site
                        </button>
                    ) : <div></div>}
                    
                    <button type="submit" form="loc-form" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm">
                        <Save size={18} /> Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- TAB: OVERVIEW --- */}
      {activeTab === 'overview' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="font-bold text-lg mb-4 dark:text-white">Tenant Overview</h2>
            <form onSubmit={handleUpdateOverview} className="grid grid-cols-2 gap-4">
               <div><label className="text-xs font-bold text-slate-500 uppercase">Name</label><input className="w-full border p-2 rounded dark:bg-slate-700 dark:text-white" value={overviewForm.name} onChange={e=>setOverviewForm({...overviewForm, name:e.target.value})} /></div>
               <div className="col-span-2 text-right"><button className="bg-blue-600 text-white px-4 py-2 rounded font-bold">Save Overview</button></div>
            </form>
        </div>
      )}

      {/* --- TAB: USERS (RESTORED STYLES) --- */}
      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center bg-blue-50 dark:bg-slate-800/50 p-4 rounded-xl border border-blue-100 dark:border-slate-700">
                <div>
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Staff Management</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Create accounts for {tenant.name} employees.</p>
                </div>
                <button onClick={() => setIsUserModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm">
                    <UserPlus size={18} /> Add User
                </button>
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">User</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Role</th>
                            <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {tenantUsers.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-800 dark:text-white">{u.name}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12}/> {u.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
                                        u.role === 'admin' 
                                        ? 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300' 
                                        : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button 
                                        onClick={() => handleRemoveUser(u.id)} 
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Revoke Access"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {tenantUsers.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-12 text-center text-slate-400">
                                    No users found in directory.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- USER MODAL (RESTORED STYLES) --- */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Grant Access</h3>
                    <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                </div>
                
                <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Full Name</label>
                        <input 
                            type="text" 
                            required 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all"
                            value={newUser.name} 
                            onChange={e => setNewUser({...newUser, name: e.target.value})} 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all"
                            value={newUser.email} 
                            onChange={e => setNewUser({...newUser, email: e.target.value})} 
                        />
                    </div>
                    <div>
                         <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Role Permission</label>
                         <select 
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700 dark:border-slate-600 dark:text-white transition-all"
                            value={newUser.role} 
                            onChange={e => setNewUser({...newUser, role: e.target.value})}
                        >
                            <option value="operator">Operator (Read Only)</option>
                            <option value="admin">Admin (Full Control)</option>
                        </select>
                    </div>
                    
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700 mt-6">
                        <button 
                            type="button" 
                            onClick={() => setIsUserModalOpen(false)} 
                            className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-200 dark:shadow-none transition-all"
                        >
                            Create User
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

export default TenantDetails;