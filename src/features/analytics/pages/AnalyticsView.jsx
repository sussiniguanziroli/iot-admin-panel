import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { BarChart2, ChevronDown, Search, Building2 } from 'lucide-react';
import { useAuth } from '../../auth/context/AuthContext';
import { useAnalytics } from '../../../shared/hooks/useAnalytics';
import GlobalView from '../components/GlobalView';
import DrillDownView from '../components/DrillDownView';

const TIME_RANGES = [
    { value: '24h', label: 'Hoy' },
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
    { value: 'custom', label: 'Custom' }
];

const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
            <BarChart2 size={32} className="text-slate-400" />
        </div>
        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Sin datos todavía</h3>
        <p className="text-slate-400 text-sm mt-2 text-center max-w-sm">
            {message || 'Seleccioná una planta, máquina y métrica, luego presioná Consultar.'}
        </p>
    </div>
);

const AnalyticsView = () => {
    const { userProfile } = useAuth();
    const { timeSeries, summary, meta, loading, error, fetch } = useAnalytics();

    const isSuperAdmin = userProfile?.role === 'super_admin';

    const [hasQueried, setHasQueried] = useState(false);

    const [allTenants, setAllTenants] = useState([]);
    const [selectedTenantId, setSelectedTenantId] = useState('');

    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');

    const [locationMachines, setLocationMachines] = useState([]);
    const [locationWidgets, setLocationWidgets] = useState([]);

    const [selectedMachine, setSelectedMachine] = useState('all');
    const [selectedDataKey, setSelectedDataKey] = useState('');
    const [timeRange, setTimeRange] = useState('24h');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [loadingTenants, setLoadingTenants] = useState(false);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        if (isSuperAdmin) {
            const fetchTenants = async () => {
                setLoadingTenants(true);
                try {
                    const snap = await getDocs(collection(db, 'tenants'));
                    const list = snap.docs.map(d => ({ id: d.id, name: d.data().name }));
                    setAllTenants(list);
                    if (list.length > 0) setSelectedTenantId(list[0].id);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoadingTenants(false);
                }
            };
            fetchTenants();
        } else {
            if (userProfile?.tenantId) {
                setSelectedTenantId(userProfile.tenantId);
            }
        }
    }, [isSuperAdmin, userProfile]);

    useEffect(() => {
        if (!selectedTenantId) return;
        const fetchLocations = async () => {
            setLoadingLocations(true);
            setSelectedLocation('');
            setLocationMachines([]);
            setLocationWidgets([]);
            setSelectedMachine('all');
            setSelectedDataKey('');
            try {
                const snap = await getDocs(collection(db, 'tenants', selectedTenantId, 'locations'));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                setLocations(list);
                if (list.length > 0) setSelectedLocation(list[0].id);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingLocations(false);
            }
        };
        fetchLocations();
    }, [selectedTenantId]);

    useEffect(() => {
        if (!selectedLocation || !selectedTenantId) return;
        const fetchLocationData = async () => {
            setLoadingLocation(true);
            setSelectedMachine('all');
            setSelectedDataKey('');
            try {
                const snap = await getDoc(doc(db, 'tenants', selectedTenantId, 'locations', selectedLocation));
                if (snap.exists()) {
                    const layout = snap.data().layout || {};
                    setLocationMachines(layout.machines || []);
                    setLocationWidgets(layout.widgets || []);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingLocation(false);
            }
        };
        fetchLocationData();
    }, [selectedLocation, selectedTenantId]);

    useEffect(() => {
        setSelectedDataKey('');
    }, [selectedMachine]);

    const availableDataKeys = useMemo(() => {
        if (!locationWidgets.length) return [];
        const relevantWidgets = selectedMachine === 'all'
            ? locationWidgets
            : locationWidgets.filter(w => w.machineId === selectedMachine);
        const seen = new Set();
        const keys = [];
        relevantWidgets.forEach(w => {
            if (w.dataKey && !seen.has(w.dataKey)) {
                seen.add(w.dataKey);
                keys.push({
                    dataKey: w.dataKey,
                    label: w.title || w.dataKey,
                    unit: w.unit || '',
                    type: w.type
                });
            }
        });
        return keys;
    }, [locationWidgets, selectedMachine]);

    const handleSearch = () => {
        if (!selectedDataKey || !selectedTenantId) return;
        setHasQueried(true);
        fetch({
            tenantId: selectedTenantId,
            locationId: selectedLocation || null,
            machineId: selectedMachine,
            dataKey: selectedDataKey,
            timeRange,
            dateFrom: timeRange === 'custom' ? dateFrom : null,
            dateTo: timeRange === 'custom' ? dateTo : null
        });
    };

    const isSearchDisabled = !selectedDataKey || loading || loadingLocation || loadingLocations ||
        (timeRange === 'custom' && (!dateFrom || !dateTo));
    const isDrillDown = meta?.machineId && meta.machineId !== 'all';
    const hasData = timeSeries.length > 0 || summary.length > 0;

    const selectedTenantName = allTenants.find(t => t.id === selectedTenantId)?.name || '';

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Análisis Histórico</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Consultá tendencias y estadísticas desde BigQuery.</p>
            </div>

            {isSuperAdmin && (
                <div className="bg-slate-800 text-white rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-2 bg-indigo-500 rounded-lg">
                        <Building2 size={20} />
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Empresa:</span>
                        <div className="relative">
                            <select
                                value={selectedTenantId}
                                onChange={e => setSelectedTenantId(e.target.value)}
                                disabled={loadingTenants}
                                className="appearance-none bg-slate-900 border border-slate-600 text-white pl-3 pr-8 py-1.5 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {allTenants.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={13} className="absolute right-2 top-2.5 pointer-events-none text-slate-400" />
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                <div className="flex flex-wrap gap-4 items-end">

                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Planta</label>
                        <div className="relative">
                            <select
                                value={selectedLocation}
                                onChange={e => setSelectedLocation(e.target.value)}
                                disabled={loadingLocations || locations.length === 0}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {locations.length === 0 && <option value="">Sin plantas</option>}
                                {locations.map(l => (
                                    <option key={l.id} value={l.id}>{l.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-3 pointer-events-none text-slate-400" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Máquina</label>
                        <div className="relative">
                            <select
                                value={selectedMachine}
                                onChange={e => setSelectedMachine(e.target.value)}
                                disabled={loadingLocation || locationMachines.length === 0}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="all">Todas</option>
                                {locationMachines.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-3 pointer-events-none text-slate-400" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Métrica</label>
                        <div className="relative">
                            <select
                                value={selectedDataKey}
                                onChange={e => setSelectedDataKey(e.target.value)}
                                disabled={availableDataKeys.length === 0 || loadingLocation}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                <option value="">Seleccionar métrica</option>
                                {availableDataKeys.map(k => (
                                    <option key={k.dataKey} value={k.dataKey}>
                                        {k.label}{k.unit ? ` (${k.unit})` : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-3 pointer-events-none text-slate-400" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Período</label>
                        <div className="flex gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl p-1">
                            {TIME_RANGES.map(r => (
                                <button
                                    key={r.value}
                                    onClick={() => setTimeRange(r.value)}
                                    className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-all ${
                                        timeRange === r.value
                                            ? 'bg-slate-800 dark:bg-blue-600 text-white shadow'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {timeRange === 'custom' && (
                        <div className="flex items-end gap-2">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Desde</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={e => setDateFrom(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Hasta</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={e => setDateTo(e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleSearch}
                        disabled={isSearchDisabled}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 text-white font-bold rounded-xl transition-all shadow-sm disabled:cursor-not-allowed"
                    >
                        {loading
                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <Search size={16} />
                        }
                        Consultar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 rounded-2xl px-5 py-4 text-sm font-medium">
                    {error}
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-24">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Consultando BigQuery...</p>
                    </div>
                </div>
            )}

            {!loading && hasData && (
                isDrillDown
                    ? <DrillDownView timeSeries={timeSeries} summary={summary} meta={meta} machines={locationMachines} />
                    : <GlobalView timeSeries={timeSeries} summary={summary} meta={meta} machines={locationMachines} />
            )}

            {!loading && !hasData && hasQueried && !error && <EmptyState />}
            {!loading && !hasQueried && <EmptyState />}

        </div>
    );
};

export default AnalyticsView;