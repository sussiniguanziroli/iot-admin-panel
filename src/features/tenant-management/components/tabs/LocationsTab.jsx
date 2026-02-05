import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase/config';
import { usePermissions } from '../../../../shared/hooks/usePermissions';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import Swal from 'sweetalert2';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    MapPin, Plus, Trash2, Save, Wifi, Globe, Building2,
    X, Check, AlertCircle, Lock, TrendingUp, Eye, Crosshair
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

const MapClickHandler = ({ onMapClick, canEdit }) => {
    useMapEvents({
        click(e) {
            if (canEdit) onMapClick(e.latlng);
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
    const { can } = usePermissions();
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('info');
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
        backend_port: 8883,
        backend_protocol: 'mqtts'
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

    const focusLocation = (loc) => {
        setMapCenter([loc.lat || -34.6037, loc.lng || -58.3816]);
        setMapZoom(15);
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
            backend_port: loc.mqtt_config?.backend_port || 8883,
            backend_protocol: loc.mqtt_config?.backend_protocol || 'mqtts'
        });
        setMapCenter([loc.lat || -34.6037, loc.lng || -58.3816]);
        setMapZoom(15);
        setIsModalOpen(true);
        setActiveTab('info');
    };

    const createNewLocation = () => {
        if (!canAddLocation()) {
            Swal.fire({
                icon: 'warning',
                title: 'Location Limit Reached',
                text: `Your current plan allows ${tenantLimits.maxLocations} location(s). Upgrade your plan to add more sites.`,
                confirmButtonColor: '#3b82f6'
            });
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
            password: '',
            backend_port: 8883,
            backend_protocol: 'mqtts'
        });
        setMapCenter([-34.6037, -58.3816]);
        setMapZoom(13);
        setIsModalOpen(true);
        setActiveTab('info');
    };

    const handleMapClick = (latlng) => {
        if (isModalOpen && can.manageLocations) {
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
            updatedAt: new Date().toISOString()
        };

        if (can.configureMqtt) {
            payload.mqtt_config = {
                host: locationForm.host,
                port: Number(locationForm.port),
                protocol: locationForm.protocol,
                username: locationForm.username,
                password: locationForm.password,
                backend_port: Number(locationForm.backend_port),
                backend_protocol: locationForm.backend_protocol
            };
        } else {
            payload.mqtt_config = selectedLocation?.mqtt_config || {};
        }

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
            setIsModalOpen(false);
            
            Swal.fire({
                icon: 'success',
                title: 'Location Saved!',
                text: `${locationForm.name} has been saved successfully.`,
                timer: 2000,
                showConfirmButton: false
            });
        } catch (e) {
            console.error(e);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to save location. Please try again.',
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const handleDeleteLocation = async () => {
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Delete Location?',
            text: `Are you sure you want to delete "${selectedLocation.name}"? This action cannot be undone.`,
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

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
            setIsModalOpen(false);
            setSelectedLocation(null);

            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Location has been deleted.',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (e) {
            console.error(e);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to delete location.',
                confirmButtonColor: '#3b82f6'
            });
        }
    };

    const usagePercentage = getUsagePercentage();
    const isNearLimit = usagePercentage >= 80 && tenantLimits?.maxLocations !== 999;

    return (
        <div className="space-y-6">
            {tenantLimits && tenantUsage && (
                <div className={`rounded-xl border-2 p-4 ${isNearLimit
                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isNearLimit ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
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
                                <p className={`text-2xl font-bold ${isNearLimit ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`}>
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
                                        usagePercentage >= 80 ? 'bg-orange-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <MapPin size={20} className="text-blue-600" />
                            Locations
                        </h3>
                        <button
                            onClick={createNewLocation}
                            disabled={!canAddLocation() || !can.manageLocations}
                            className={`p-2 rounded-lg transition-colors ${canAddLocation() && can.manageLocations
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                            title={canAddLocation() ? 'Add Location' : 'Location limit reached'}
                        >
                            {canAddLocation() && can.manageLocations ? <Plus size={18} /> : <Lock size={18} />}
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {locations.map(loc => (
                            <div
                                key={loc.id}
                                className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 transition-all hover:shadow-md"
                            >
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">
                                            {loc.name}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                            {loc.address || 'No address set'}
                                        </p>
                                        <div className="flex items-center gap-1 mt-2">
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
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => focusLocation(loc)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs font-bold"
                                    >
                                        <Crosshair size={14} />
                                        Focus
                                    </button>
                                    <button
                                        onClick={() => selectLocation(loc)}
                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs font-bold"
                                    >
                                        <Eye size={14} />
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                        {locations.length === 0 && (
                            <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                                <MapPin size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">No locations yet</p>
                                {canAddLocation() && can.manageLocations ? (
                                    <button
                                        onClick={createNewLocation}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-bold"
                                    >
                                        Create your first site
                                    </button>
                                ) : (
                                    <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                                        <Lock size={12} />
                                        {!can.manageLocations ? 'No permission' : 'Upgrade plan to add locations'}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 h-[600px] rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                    <MapContainer
                        center={mapCenter}
                        zoom={mapZoom}
                        scrollWheelZoom={true}
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onMapClick={handleMapClick} canEdit={can.manageLocations && isModalOpen} />
                        <MapController center={mapCenter} zoom={mapZoom} />

                        {locations.map(loc => (
                            <Marker
                                key={loc.id}
                                position={[loc.lat || -34.6037, loc.lng || -58.3816]}
                                eventHandlers={{ click: () => selectLocation(loc) }}
                            >
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-bold text-sm">{loc.name}</p>
                                        <p className="text-xs text-slate-500">{loc.address || 'No address'}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {isModalOpen && (
                            <Marker position={[locationForm.lat, locationForm.lng]} />
                        )}
                    </MapContainer>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-5000 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                        
                        <div className="flex-shrink-0 px-6 py-5 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
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
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>

                            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <button
                                    onClick={() => setActiveTab('info')}
                                    className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'info'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Globe size={14} /> General
                                </button>
                                <button
                                    onClick={() => setActiveTab('mqtt')}
                                    className={`flex-1 px-4 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'mqtt'
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                >
                                    <Wifi size={14} /> Connectivity
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSaveLocation} className="flex-1 overflow-y-auto p-6 space-y-5">
                            {activeTab === 'info' && (
                                <>
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                            Site Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!can.manageLocations}
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                            disabled={!can.manageLocations}
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-800 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                    {can.manageLocations 
                                                        ? 'Click anywhere on the map to update the location pin'
                                                        : 'Coordinates are set by administrators'}
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

                            {activeTab === 'mqtt' && (
                                <>
                                    {!can.configureMqtt && (
                                        <div className="bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-4">
                                            <div className="flex items-start gap-3">
                                                <Lock size={20} className="text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-bold text-orange-900 dark:text-orange-100">
                                                        MQTT Configuration Restricted
                                                    </p>
                                                    <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                                                        Only Super Admins can modify broker connectivity settings
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

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
                                                    {can.configureMqtt ? 'Configure broker settings' : 'View current configuration'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 block">
                                            Broker Host
                                        </label>
                                        <input
                                            type="text"
                                            disabled={!can.configureMqtt}
                                            className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:bg-slate-800 dark:text-white outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                disabled={!can.configureMqtt}
                                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:bg-slate-800 dark:text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
                                                disabled={!can.configureMqtt}
                                                className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm dark:bg-slate-800 dark:text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={locationForm.password}
                                                onChange={e => setLocationForm({ ...locationForm, password: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-6 mb-2 flex items-center gap-2">
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Frontend Config (React)</span>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900">
                                        <div>
                                            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">
                                                Frontend Port (WSS)
                                            </label>
                                            <input
                                                type="number"
                                                disabled={!can.configureMqtt}
                                                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={locationForm.port}
                                                onChange={e => setLocationForm({ ...locationForm, port: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-blue-600 uppercase mb-1 block">
                                                Protocol
                                            </label>
                                            <select
                                                disabled={!can.configureMqtt}
                                                className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={locationForm.protocol}
                                                onChange={e => setLocationForm({ ...locationForm, protocol: e.target.value })}
                                            >
                                                <option value="wss">WSS (Secure)</option>
                                                <option value="ws">WS (Insecure)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4 mb-2 flex items-center gap-2">
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Backend Config (Ingestor)</span>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900">
                                        <div>
                                            <label className="text-[10px] font-bold text-purple-600 uppercase mb-1 block">
                                                Backend Port (TCP)
                                            </label>
                                            <input
                                                type="number"
                                                disabled={!can.configureMqtt}
                                                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                value={locationForm.backend_port}
                                                onChange={e => setLocationForm({ ...locationForm, backend_port: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-purple-600 uppercase mb-1 block">
                                                Protocol
                                            </label>
                                            <select
                                                disabled={!can.configureMqtt}
                                                className="w-full px-3 py-2 border border-purple-200 dark:border-purple-800 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
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

                        <div className="flex-shrink-0 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            {selectedLocation?.id !== 'NEW' && can.manageLocations && (
                                <button
                                    onClick={handleDeleteLocation}
                                    className="flex items-center gap-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-bold text-sm transition-colors px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </button>
                            )}
                            {(!can.manageLocations || selectedLocation?.id === 'NEW') && <div></div>}

                            {can.manageLocations && (
                                <button
                                    type="submit"
                                    onClick={handleSaveLocation}
                                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all"
                                >
                                    <Save size={18} />
                                    Save Changes
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationsTab;