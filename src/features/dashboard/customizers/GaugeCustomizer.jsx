import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, Gauge as GaugeIcon, Plus, Trash2, Code, Palette } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const GaugeCustomizer = ({ isOpen, onClose, onSave, widget }) => {
    const [customConfig, setCustomConfig] = useState({
        colorZones: {
            enabled: false,
            zones: []
        },
        needleStyle: {
            type: 'modern',
            color: '#334155',
            width: 3
        },
        markers: {
            enabled: true,
            count: 5,
            showLabels: true
        },
        animation: {
            enabled: true,
            duration: 800,
            easing: 'ease-out'
        },
        thresholds: {
            enabled: false,
            values: []
        },
        dataTransformation: {
            enabled: false,
            formula: 'value',
            multiplier: 1,
            offset: 0
        }
    });

    useEffect(() => {
        if (widget?.customConfig) {
            try {
                const parsed = typeof widget.customConfig === 'string'
                    ? JSON.parse(widget.customConfig)
                    : widget.customConfig;
                setCustomConfig({ ...customConfig, ...parsed });
            } catch (e) {
                console.error('Error parsing customConfig:', e);
            }
        }
    }, [widget]);

    if (!isOpen) return null;

    const handleSave = async () => {
        const result = await Swal.fire({
            title: 'Save Gauge Configuration?',
            html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">Advanced gauge settings will be applied.</p>
          <div class="bg-slate-50 p-3 rounded-lg mt-3 text-sm">
            <p><strong>Widget:</strong> ${widget.title}</p>
            <p class="text-xs text-slate-500 mt-1">Color zones: ${customConfig.colorZones.enabled ? customConfig.colorZones.zones.length + ' zones' : 'Disabled'}</p>
            <p class="text-xs text-slate-500">Needle style: ${customConfig.needleStyle.type}</p>
          </div>
        </div>
      `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0ea5e9',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Save Configuration',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                onSave({ ...widget, customConfig: JSON.stringify(customConfig) });
                toast.success('Gauge configuration saved!', {
                    position: 'bottom-right',
                    autoClose: 2000
                });
                onClose();
            } catch (error) {
                console.error('Error saving customConfig:', error);
                toast.error('Failed to save configuration', { position: 'top-right' });
            }
        }
    };

    const handleClose = async () => {
        const result = await Swal.fire({
            title: 'Discard Changes?',
            text: 'Any unsaved changes will be lost.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, discard',
            cancelButtonText: 'Keep Editing',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            onClose();
        }
    };

    const addColorZone = () => {
        setCustomConfig(prev => ({
            ...prev,
            colorZones: {
                ...prev.colorZones,
                zones: [
                    ...prev.colorZones.zones,
                    { min: 0, max: 33, color: '#10b981', label: 'Normal' }
                ]
            }
        }));
    };

    const removeColorZone = (index) => {
        setCustomConfig(prev => ({
            ...prev,
            colorZones: {
                ...prev.colorZones,
                zones: prev.colorZones.zones.filter((_, i) => i !== index)
            }
        }));
    };

    const updateColorZone = (index, field, value) => {
        setCustomConfig(prev => ({
            ...prev,
            colorZones: {
                ...prev.colorZones,
                zones: prev.colorZones.zones.map((zone, i) =>
                    i === index ? { ...zone, [field]: value } : zone
                )
            }
        }));
    };

    const addThreshold = () => {
        setCustomConfig(prev => ({
            ...prev,
            thresholds: {
                ...prev.thresholds,
                values: [
                    ...prev.thresholds.values,
                    { value: 50, label: 'Warning', showLine: true, lineColor: '#f59e0b' }
                ]
            }
        }));
    };

    const removeThreshold = (index) => {
        setCustomConfig(prev => ({
            ...prev,
            thresholds: {
                ...prev.thresholds,
                values: prev.thresholds.values.filter((_, i) => i !== index)
            }
        }));
    };

    const updateThreshold = (index, field, value) => {
        setCustomConfig(prev => ({
            ...prev,
            thresholds: {
                ...prev.thresholds,
                values: prev.thresholds.values.map((threshold, i) =>
                    i === index ? { ...threshold, [field]: value } : threshold
                )
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <GaugeIcon size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Gauge Widget Customizer</h2>
                            <p className="text-blue-100 text-sm mt-1">Advanced configuration for "{widget.title}"</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors p-2">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Palette size={20} className="text-blue-600 dark:text-blue-400" />
                                <h3 className="font-bold text-slate-800 dark:text-white">Color Zones</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customConfig.colorZones.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        colorZones: { ...prev.colorZones, enabled: e.target.checked }
                                    }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {customConfig.colorZones.enabled && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Define color ranges based on value thresholds</p>
                                {customConfig.colorZones.zones.map((zone, index) => (
                                    <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={zone.label}
                                                onChange={(e) => updateColorZone(index, 'label', e.target.value)}
                                                placeholder="Zone label"
                                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <input
                                                type="color"
                                                value={zone.color}
                                                onChange={(e) => updateColorZone(index, 'color', e.target.value)}
                                                className="w-12 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeColorZone(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Min Value</label>
                                                <input
                                                    type="number"
                                                    value={zone.min}
                                                    onChange={(e) => updateColorZone(index, 'min', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Max Value</label>
                                                <input
                                                    type="number"
                                                    value={zone.max}
                                                    onChange={(e) => updateColorZone(index, 'max', parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addColorZone}
                                    className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Add Color Zone
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Sliders size={20} className="text-blue-600 dark:text-blue-400" />
                            Needle Style
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Needle Type
                                </label>
                                <select
                                    value={customConfig.needleStyle.type}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        needleStyle: { ...prev.needleStyle, type: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="modern">Modern</option>
                                    <option value="classic">Classic</option>
                                    <option value="arrow">Arrow</option>
                                    <option value="thin">Thin Line</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Needle Color
                                </label>
                                <input
                                    type="color"
                                    value={customConfig.needleStyle.color}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        needleStyle: { ...prev.needleStyle, color: e.target.value }
                                    }))}
                                    className="w-full h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Needle Width
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={customConfig.needleStyle.width}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        needleStyle: { ...prev.needleStyle, width: parseInt(e.target.value) }
                                    }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Markers & Labels</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.markers.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        markers: { ...prev.markers, enabled: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Show Scale Markers</label>
                            </div>

                            {customConfig.markers.enabled && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Number of Markers
                                        </label>
                                        <input
                                            type="number"
                                            min="2"
                                            max="20"
                                            value={customConfig.markers.count}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                markers: { ...prev.markers, count: parseInt(e.target.value) }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={customConfig.markers.showLabels}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                markers: { ...prev.markers, showLabels: e.target.checked }
                                            }))}
                                            className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">Show Marker Labels</label>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white">Threshold Lines</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customConfig.thresholds.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        thresholds: { ...prev.thresholds, enabled: e.target.checked }
                                    }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {customConfig.thresholds.enabled && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Add visual threshold markers on the gauge</p>
                                {customConfig.thresholds.values.map((threshold, index) => (
                                    <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={threshold.label}
                                                onChange={(e) => updateThreshold(index, 'label', e.target.value)}
                                                placeholder="Threshold label"
                                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <input
                                                type="number"
                                                value={threshold.value}
                                                onChange={(e) => updateThreshold(index, 'value', parseFloat(e.target.value))}
                                                placeholder="Value"
                                                className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <input
                                                type="color"
                                                value={threshold.lineColor}
                                                onChange={(e) => updateThreshold(index, 'lineColor', e.target.value)}
                                                className="w-12 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeThreshold(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={threshold.showLine}
                                                onChange={(e) => updateThreshold(index, 'showLine', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                            />
                                            <label className="text-xs text-slate-600 dark:text-slate-400">Show threshold line</label>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addThreshold}
                                    className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Add Threshold
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Animation Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.animation.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        animation: { ...prev.animation, enabled: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Enable Animations</label>
                            </div>

                            {customConfig.animation.enabled && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Duration (ms)
                                        </label>
                                        <input
                                            type="number"
                                            min="100"
                                            max="3000"
                                            step="100"
                                            value={customConfig.animation.duration}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                animation: { ...prev.animation, duration: parseInt(e.target.value) }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Easing
                                        </label>
                                        <select
                                            value={customConfig.animation.easing}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                animation: { ...prev.animation, easing: e.target.value }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="ease">Ease</option>
                                            <option value="ease-in">Ease In</option>
                                            <option value="ease-out">Ease Out</option>
                                            <option value="ease-in-out">Ease In Out</option>
                                            <option value="linear">Linear</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white">Data Transformation</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customConfig.dataTransformation.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        dataTransformation: { ...prev.dataTransformation, enabled: e.target.checked }
                                    }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {customConfig.dataTransformation.enabled && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Multiplier
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={customConfig.dataTransformation.multiplier}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                dataTransformation: { ...prev.dataTransformation, multiplier: parseFloat(e.target.value) }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Offset
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={customConfig.dataTransformation.offset}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                dataTransformation: { ...prev.dataTransformation, offset: parseFloat(e.target.value) }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Custom Formula (JavaScript)
                                    </label>
                                    <input
                                        type="text"
                                        value={customConfig.dataTransformation.formula}
                                        onChange={(e) => setCustomConfig(prev => ({
                                            ...prev,
                                            dataTransformation: { ...prev.dataTransformation, formula: e.target.value }
                                        }))}
                                        placeholder="e.g., value * 2 + 10"
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <p className="text-xs text-slate-500 mt-1">Use "value" as the variable</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <details className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl">
                        <summary className="px-4 py-3 cursor-pointer font-bold text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors rounded-xl">
                            <Code size={16} />
                            Raw JSON Override
                        </summary>
                        <div className="p-4 pt-2">
                            <textarea
                                value={JSON.stringify(customConfig, null, 2)}
                                onChange={(e) => {
                                    try {
                                        setCustomConfig(JSON.parse(e.target.value));
                                    } catch (err) { }
                                }}
                                rows={10}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-orange-200 dark:border-orange-900/30 rounded-lg text-xs font-mono focus:ring-2 focus:ring-orange-500 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                    </details>

                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                    <button
                        type="button"
                        onClick={handleClose} className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                    >
                        <Save size={18} />
                        Save Advanced Config
                    </button>
                </div>
            </div>
        </div>
    );
};
export default GaugeCustomizer;