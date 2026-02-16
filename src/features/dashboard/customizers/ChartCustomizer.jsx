import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, TrendingUp, Code } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ChartCustomizer = ({ isOpen, onClose, onSave, widget }) => {
    const [customConfig, setCustomConfig] = useState({
        lineStyle: {
            type: 'monotone',
            strokeWidth: 2,
            dots: false
        },
        gradientColors: {
            enabled: true,
            topColor: '#0ea5e9',
            bottomColor: '#0ea5e9',
            opacity: 0.3
        },
        axisConfig: {
            xAxis: {
                show: false
            },
            yAxis: {
                show: true,
                gridLines: true
            }
        },
        dataRetention: {
            maxPoints: 50,
            timeWindow: 3600
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
                console.error('[ChartCustomizer] Error parsing customConfig:', e);
            }
        }
    }, [widget]);

    if (!isOpen) return null;

    const handleSave = async () => {
        const result = await Swal.fire({
            title: 'Save Chart Configuration?',
            html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">Advanced chart settings will be applied.</p>
          <div class="bg-slate-50 p-3 rounded-lg mt-3 text-sm">
            <p><strong>Widget:</strong> ${widget.title}</p>
            <p class="text-xs text-slate-500 mt-1">Line style: ${customConfig.lineStyle.type}</p>
            <p class="text-xs text-slate-500">Max points: ${customConfig.dataRetention.maxPoints}</p>
          </div>
        </div>
      `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f97316',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Save Configuration',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                onSave({ ...widget, customConfig: JSON.stringify(customConfig) });
                toast.success('Chart configuration saved!', {
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

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

                <div className="bg-gradient-to-r from-orange-600 to-red-600 px-6 py-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Chart Widget Customizer</h2>
                            <p className="text-orange-100 text-sm mt-1">Advanced configuration for "{widget.title}"</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors p-2">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Sliders size={20} className="text-orange-600 dark:text-orange-400" />
                            Line Style
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Curve Type
                                </label>
                                <select
                                    value={customConfig.lineStyle.type}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        lineStyle: { ...prev.lineStyle, type: e.target.value }
                                    }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                >
                                    <option value="monotone">Smooth (Monotone)</option>
                                    <option value="linear">Linear</option>
                                    <option value="step">Step</option>
                                    <option value="stepBefore">Step Before</option>
                                    <option value="stepAfter">Step After</option>
                                    <option value="basis">Basis (Curved)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Stroke Width
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={customConfig.lineStyle.strokeWidth}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        lineStyle: { ...prev.lineStyle, strokeWidth: parseInt(e.target.value) }
                                    }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.lineStyle.dots}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        lineStyle: { ...prev.lineStyle, dots: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-orange-600 bg-slate-100 border-slate-300 rounded focus:ring-orange-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Show Data Points</label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Gradient Colors</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="checkbox"
                                    checked={customConfig.gradientColors.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        gradientColors: { ...prev.gradientColors, enabled: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-orange-600 bg-slate-100 border-slate-300 rounded focus:ring-orange-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Enable Gradient Fill</label>
                            </div>

                            {customConfig.gradientColors.enabled && (
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Top Color
                                        </label>
                                        <input
                                            type="color"
                                            value={customConfig.gradientColors.topColor}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                gradientColors: { ...prev.gradientColors, topColor: e.target.value }
                                            }))}
                                            className="w-full h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Bottom Color
                                        </label>
                                        <input
                                            type="color"
                                            value={customConfig.gradientColors.bottomColor}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                gradientColors: { ...prev.gradientColors, bottomColor: e.target.value }
                                            }))}
                                            className="w-full h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Opacity
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={customConfig.gradientColors.opacity}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                gradientColors: { ...prev.gradientColors, opacity: parseFloat(e.target.value) }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Axis Configuration</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Y-Axis</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={customConfig.axisConfig.yAxis.show}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                axisConfig: {
                                                    ...prev.axisConfig,
                                                    yAxis: { ...prev.axisConfig.yAxis, show: e.target.checked }
                                                }
                                            }))}
                                            className="w-4 h-4 text-orange-600 bg-slate-100 border-slate-300 rounded focus:ring-orange-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">Show Y-Axis</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={customConfig.axisConfig.yAxis.gridLines}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                axisConfig: {
                                                    ...prev.axisConfig,
                                                    yAxis: { ...prev.axisConfig.yAxis, gridLines: e.target.checked }
                                                }
                                            }))}
                                            className="w-4 h-4 text-orange-600 bg-slate-100 border-slate-300 rounded focus:ring-orange-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">Grid Lines</label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">X-Axis</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={customConfig.axisConfig.xAxis.show}
                                        onChange={(e) => setCustomConfig(prev => ({
                                            ...prev,
                                            axisConfig: {
                                                ...prev.axisConfig,
                                                xAxis: { ...prev.axisConfig.xAxis, show: e.target.checked }
                                            }
                                        }))}
                                        className="w-4 h-4 text-orange-600 bg-slate-100 border-slate-300 rounded focus:ring-orange-500"
                                    />
                                    <label className="text-sm text-slate-700 dark:text-slate-300">Show X-Axis</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Data Retention</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Max Data Points
                                </label>
                                <input
                                    type="number"
                                    min="10"
                                    max="1000"
                                    value={customConfig.dataRetention.maxPoints}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        dataRetention: { ...prev.dataRetention, maxPoints: parseInt(e.target.value) }
                                    }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Maximum number of points to display</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                    Time Window (seconds)
                                </label>
                                <input
                                    type="number"
                                    min="60"
                                    max="86400"
                                    value={customConfig.dataRetention.timeWindow}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        dataRetention: { ...prev.dataRetention, timeWindow: parseInt(e.target.value) }
                                    }))}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                                />
                                <p className="text-xs text-slate-500 mt-1">Auto-remove data older than this</p>
                            </div>
                        </div>
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
                        onClick={handleClose}
                        className="flex-1 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 transition-all"
                    >
                        <Save size={18} />
                        Save Advanced Config
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartCustomizer;