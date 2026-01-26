import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    MapPin, Plus, Trash2, Save, Wifi, Globe, Building2,
    ChevronLeft, ChevronRight, X, Check, AlertCircle, Lock, TrendingUp
} from 'lucide-react';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
};

const MapController = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const LocationsTab = ({ tenantId }) => {
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isListCollapsed, setIsListCollapsed] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState('info');
    const [mapCenter, setMapCenter] = useState([-34.6037, -58.3816]);
    const [mapZoom, setMapZoom] = useState(13);
    const [tenantLimits, setTenantLimits] = useState(null);
    const [tenantUsage, setTenantUsage] = useState(null);

    const [locationForm, setLocationForm] = useState({
        name: '',
        id: '',
        address: '',
        lat: -34.6037,
        lng: -58.3816,
        host: '',
        port: 8884,
        protocol: 'wss',
        username: '',
        password: '',
        backend_port: 8883,      // Default HiveMQ seguro
        backend_protocol: 'mqtts' // Default HiveMQ seguro
    });

    useEffect(() => {
        fetchTenantData();
        fetchLocations();
    }, [tenantId]);

    const fetchTenantData = async () => {
        try {
            const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
            if (tenantDoc.exists()) {
                const data = tenantDoc.data();
                setTenantLimits(data.limits);
                setTenantUsage(data.usage);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLocations = async () => {
        try {
            const locRef = collection(db, 'tenants', tenantId, 'locations');
            const snapshot = await getDocs(locRef);
            const locs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setLocations(locs);
        } catch (e) {
            console.error(e);
        }
    };

    const canAddLocation = () => {
        if (!tenantLimits || !tenantUsage) return false;
        return tenantUsage.locations < tenantLimits.maxLocations;
    };

    const getRemainingLocations = () => {
        if (!tenantLimits || !tenantUsage) return 0;
        return tenantLimits.maxLocations - tenantUsage.locations;
    };

    const getUsagePercentage = () => {
        if (!tenantLimits || !tenantUsage) return 0;
        if (tenantLimits.maxLocations === 999) return 0;
        return (tenantUsage.locations / tenantLimits.maxLocations) * 100;
    };

    const selectLocation = (loc) => {
        setSelectedLocation(loc);
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
            password: loc.mqtt_config?.password || '',
            // --- CARGAR DATOS BACKEND ---
            // Si no existen (porque es viejo), usamos defaults inteligentes
            backend_port: loc.mqtt_config?.backend_port || 8883,
            backend_protocol: loc.mqtt_config?.backend_protocol || 'mqtts'
        });
        setMapCenter([loc.lat || -34.6037, loc.lng || -58.3816]);
        setMapZoom(15);
        setIsPanelOpen(true);
        setActiveSubTab('info');
    };

    const createNewLocation = () => {
        if (!canAddLocation()) {
            alert(`⚠️ Location Limit Reached\n\nYour current plan allows ${tenantLimits.maxLocations} location(s).\nUpgrade your plan to add more sites.`);
            return;
        }

        setSelectedLocation({ id: 'NEW' });
        setLocationForm({
            name: 'New Site',
            id: '',
            address: '',
            lat: -34.6037,
            lng: -58.3816,
            host: 'broker.hivemq.com',
            port: 8884,
            protocol: 'wss',
            username: '',
            password: ''
        });
        setMapCenter([-34.6037, -58.3816]);
        setMapZoom(13);
        setIsPanelOpen(true);
        setActiveSubTab('info');
    };

    const handleMapClick = (latlng) => {
        if (isPanelOpen) {
            setLocationForm(prev => ({ ...prev, lat: latlng.lat, lng: latlng.lng }));
        }
    };

    const handleSaveLocation = async (e) => {
        e.preventDefault();
        const locId = (selectedLocation?.id === 'NEW' || !selectedLocation?.id)
            ? (locationForm.id || `loc-${Date.now()}`)
            : selectedLocation.id;

        const payload = {
            name: locationForm.name,
            address: locationForm.address,
            lat: locationForm.lat,
            lng: locationForm.lng,
            mqtt_config: {
                // CONFIGURACIÓN FRONTEND (React)
                host: locationForm.host,
                port: Number(locationForm.port),
                protocol: locationForm.protocol,
                username: locationForm.username,
                password: locationForm.password,

                // CONFIGURACIÓN BACKEND (Node.js Ingestor)
                // Aquí guardamos la "Instrucción" para el servidor
                backend_port: Number(locationForm.backend_port),
                backend_protocol: locationForm.backend_protocol
            },
            updatedAt: new Date().toISOString()
        };

        if (selectedLocation?.id === 'NEW') {
            payload.createdAt = new Date().toISOString();
            payload.layout = { machines: [], widgets: [] };
        }

        try {
            await setDoc(doc(db, 'tenants', tenantId, 'locations', locId), payload, { merge: true });

            if (selectedLocation?.id === 'NEW') {
                await setDoc(doc(db, 'tenants', tenantId), {
                    usage: {
                        ...tenantUsage,
                        locations: (tenantUsage?.locations || 0) + 1
                    }
                }, { merge: true });
            }

            await fetchLocations();
            await fetchTenantData();
            setIsPanelOpen(false);
            alert('✅ Location Saved!');
        } catch (e) {
            console.error(e);
            alert('Error saving location');
        }
    };

    const handleDeleteLocation = async () => {
        if (!window.confirm('Delete this location?')) return;
        try {
            await deleteDoc(doc(db, 'tenants', tenantId, 'locations', selectedLocation.id));

            await setDoc(doc(db, 'tenants', tenantId), {
                usage: {
                    ...tenantUsage,
                    locations: Math.max(0, (tenantUsage?.locations || 0) - 1)
                }
            }, { merge: true });

            await fetchLocations();
            await fetchTenantData();
            setIsPanelOpen(false);
            setSelectedLocation(null);
        } catch (e) {
            console.error(e);
        }
    };

    const closePanelAndReset = () => {
        setIsPanelOpen(false);
        setSelectedLocation(null);
        setMapZoom(13);
    };

    const usagePercentage = getUsagePercentage();
    const isNearLimit = usagePercentage >= 80 && tenantLimits?.maxLocations !== 999;

    return (
        <div className="space-y-4">
            {tenantLimits && tenantUsage && (
                <div className={`rounded-xl border-2 p-4 ${isNearLimit
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isNearLimit ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                                }`}>
                                <TrendingUp size={20} className={isNearLimit ? 'text-orange-600' : 'text-blue-600'} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">
                                    Location Usage
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                    {tenantUsage.locations} of {tenantLimits.maxLocations === 999 ? '∞' : tenantLimits.maxLocations} locations used
                                </p>
                            </div>
                        </div>
                        {tenantLimits.maxLocations !== 999 && (
                            <div className="text-right">
                                <p className={`text-2xl font-bold ${isNearLimit ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {getRemainingLocations()}
                                </p>
                                <p className="text-xs text-slate-500">remaining</p>
                            </div>
                        )}
                    </div>
                    {tenantLimits.maxLocations !== 999 && (
                        <div className="mt-3">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${usagePercentage >= 90 ? 'bg-red-500' :
                                        usagePercentage >= 80 ? 'bg-orange-500' :
                                            'bg-blue-500'
                                        }`}
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="relative h-[calc(100vh-400px)] rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-2xl">

                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                    className="z-0"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapClickHandler onMapClick={handleMapClick} />
                    <MapController center={mapCenter} zoom={mapZoom} />

                    {locations.map(loc => (
                        <Marker
                            key={loc.id}
                            position={[loc.lat || -34.6037, loc.lng || -58.3816]}
                            eventHandlers={{
                                click: () => selectLocation(loc)
                            }}
                        >
                            <Popup>
                                <div className="text-center">
                                    <p className="font-bold text-sm">{loc.name}</p>
                                    <p className="text-xs text-slate-500">{loc.address || 'No address'}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}

                    {isPanelOpen && (
                        <Marker position={[locationForm.lat, locationForm.lng]} />
                    )}
                </MapContainer>

                <div
                    className={`absolute top-4 left-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 transition-all duration-300 z-10 ${isListCollapsed ? 'w-14' : 'w-80'
                        }`}
                    style={{ maxHeight: 'calc(100% - 32px)' }}
                >
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-t-2xl">
                        {!isListCollapsed && (
                            <>
                                <div className="flex items-center gap-2">
                                    <MapPin size={20} className="text-blue-600" />
                                    <h3 className="font-bold text-slate-800 dark:text-white">Sites</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={createNewLocation}
                                        disabled={!canAddLocation()}
                                        className={`p-1.5 rounded-lg transition-colors ${canAddLocation()
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                            }`}
                                        title={canAddLocation() ? 'Add Location' : 'Location limit reached'}
                                    >
                                        {canAddLocation() ? <Plus size={16} /> : <Lock size={16} />}
                                    </button>
                                    <button
                                        onClick={() => setIsListCollapsed(true)}
                                        className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft size={16} className="text-slate-600 dark:text-slate-400" />
                                    </button>
                                </div>
                            </>
                        )}
                        {isListCollapsed && (
                            <button
                                onClick={() => setIsListCollapsed(false)}
                                className="w-full flex justify-center p-1"
                            >
                                <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                            </button>
                        )}
                    </div>

                    {!isListCollapsed && (
                        <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100% - 73px)' }}>
                            {locations.map(loc => (
                                <button
                                    key={loc.id}
                                    onClick={() => selectLocation(loc)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all group hover:shadow-md ${selectedLocation?.id === loc.id
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-bold text-sm truncate ${selectedLocation?.id === loc.id
                                                ? 'text-blue-700 dark:text-blue-300'
                                                : 'text-slate-800 dark:text-slate-200'
                                                }`}>
                                                {loc.name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                {loc.address || 'No address set'}
                                            </p>
                                            <div className="flex items-center gap-1 mt-1">
                                                {loc.mqtt_config?.host ? (
                                                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-bold flex items-center gap-1">
                                                        <Wifi size={10} /> Connected
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full font-bold flex items-center gap-1">
                                                        <AlertCircle size={10} /> No Broker
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {selectedLocation?.id === loc.id && (
                                            <div className="ml-2 flex-shrink-0">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                            {locations.length === 0 && (
                                <div className="text-center py-12">
                                    <MapPin size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No locations yet</p>
                                    {canAddLocation() ? (
                                        <button
                                            onClick={createNewLocation}
                                            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-bold"
                                        >
                                            Create your first site
                                        </button>
                                    ) : (
                                        <p className="mt-4 text-xs text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                                            <Lock size={12} />
                                            Upgrade plan to add locations
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div
                    className={`absolute top-0 right-0 h-full bg-white dark:bg-slate-900 shadow-2xl border-l-2 border-slate-200 dark:border-slate-700 transition-all duration-300 z-20 flex flex-col ${isPanelOpen ? 'w-[450px]' : 'w-0'
                        }`}
                    style={{ overflow: isPanelOpen ? 'visible' : 'hidden' }}
                >
                    {isPanelOpen && (
                        <>
                            <div className="flex-shrink-0 px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-600 shadow-sm">
                                            <Building2 size={22} className="text-blue-600" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                                                {selectedLocation?.id === 'NEW' ? 'New Location' : locationForm.name}
                                            </h2>
                                            <p className="text-xs text-slate-400 font-mono">
                                                {selectedLocation?.id === 'NEW' ? 'Creating...' : locationForm.id}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={closePanelAndReset}
                                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>

                                <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <button
                                        onClick={() => setActiveSubTab('info')}
                                        className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeSubTab === 'info'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Globe size={14} /> General
                                    </button>
                                    <button
                                        onClick={() => setActiveSubTab('mqtt')}
                                        className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeSubTab === 'mqtt'
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        <Wifi size={14} /> Connectivity
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <form id="location-form" onSubmit={handleSaveLocation} className="space-y-5">
                                    {activeSubTab === 'info' && (
                                        <>
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                                    Site Name
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all"
                                                    value={locationForm.name}
                                                    onChange={e => setLocationForm({ ...locationForm, name: e.target.value })}
                                                    placeholder="e.g. Main Factory"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                                    Physical Address
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all"
                                                    value={locationForm.address}
                                                    onChange={e => setLocationForm({ ...locationForm, address: e.target.value })}
                                                    placeholder="e.g. Av. Corrientes 1234, Buenos Aires"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                                    Location ID
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-500 font-mono text-sm"
                                                    value={locationForm.id}
                                                    onChange={e => setLocationForm({ ...locationForm, id: e.target.value })}
                                                    readOnly={selectedLocation?.id !== 'NEW'}
                                                    placeholder="Auto-generated if empty"
                                                />
                                            </div>

                                            <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <MapPin size={18} className="text-blue-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                                                            Map Coordinates
                                                        </p>
                                                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                                            Click anywhere on the map to update the location pin
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">
                                                            Latitude
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg text-sm bg-white dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300"
                                                            value={locationForm.lat}
                                                            readOnly
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block mb-1">
                                                            Longitude
                                                        </label>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg text-sm bg-white dark:bg-slate-800 font-mono text-slate-700 dark:text-slate-300"
                                                            value={locationForm.lng}
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {activeSubTab === 'mqtt' && (
                                        <>
                                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-xl p-5 mb-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                        <Wifi size={24} className="text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-emerald-900 dark:text-emerald-100">
                                                            MQTT Connection
                                                        </h3>
                                                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                                                            Define how both App and Server connect
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* --- CREDENCIALES COMUNES --- */}
                                            <div>
                                                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                                    Broker Host
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:bg-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all"
                                                    value={locationForm.host}
                                                    onChange={e => setLocationForm({ ...locationForm, host: e.target.value })}
                                                    placeholder="e.g. broker.hivemq.com"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                                        Username
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:bg-slate-800 dark:text-white outline-none"
                                                        value={locationForm.username}
                                                        onChange={e => setLocationForm({ ...locationForm, username: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                                        Password
                                                    </label>
                                                    <input
                                                        type="password"
                                                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:bg-slate-800 dark:text-white outline-none"
                                                        value={locationForm.password}
                                                        onChange={e => setLocationForm({ ...locationForm, password: e.target.value })}
                                                    />
                                                </div>
                                            </div>

                                            {/* --- SEPARADOR FRONTEND --- */}
                                            <div className="mt-6 mb-2 flex items-center gap-2">
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Frontend Config (React)</span>
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                                <div>
                                                    <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">
                                                        Frontend Port (WSS)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-mono"
                                                        value={locationForm.port}
                                                        onChange={e => setLocationForm({ ...locationForm, port: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">
                                                        Protocol
                                                    </label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm font-mono"
                                                        value={locationForm.protocol}
                                                        onChange={e => setLocationForm({ ...locationForm, protocol: e.target.value })}
                                                    >
                                                        <option value="wss">WSS (Secure)</option>
                                                        <option value="ws">WS (Insecure)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* --- SEPARADOR BACKEND (LO NUEVO) --- */}
                                            <div className="mt-4 mb-2 flex items-center gap-2">
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Backend Config (Ingestor)</span>
                                                <div className="h-px bg-slate-200 flex-1"></div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                                                <div>
                                                    <label className="text-[10px] font-bold text-purple-600 uppercase mb-1 block">
                                                        Backend Port (TCP)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        required
                                                        className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm font-mono"
                                                        value={locationForm.backend_port}
                                                        onChange={e => setLocationForm({ ...locationForm, backend_port: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-purple-600 uppercase mb-1 block">
                                                        Protocol
                                                    </label>
                                                    <select
                                                        className="w-full px-3 py-2 border border-purple-200 rounded-lg text-sm font-mono"
                                                        value={locationForm.backend_protocol}
                                                        onChange={e => setLocationForm({ ...locationForm, backend_protocol: e.target.value })}
                                                    >
                                                        <option value="mqtts">MQTTS (Secure TCP)</option>
                                                        <option value="mqtt">MQTT (TCP)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </div>

                            <div className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                {selectedLocation?.id !== 'NEW' && (
                                    <button
                                        onClick={handleDeleteLocation}
                                        className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-sm transition-colors px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                )}
                                {selectedLocation?.id === 'NEW' && <div></div>}

                                <button
                                    type="submit"
                                    form="location-form"
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
export default LocationsTab;