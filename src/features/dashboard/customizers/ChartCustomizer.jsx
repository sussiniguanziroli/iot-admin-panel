// src/features/dashboard/customizers/ChartCustomizer.jsx

import React, { useState, useEffect } from 'react';
import { X, Save, TrendingUp, Palette, Activity, Code } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const ChartCustomizer = ({ isOpen, onClose, onSave, widget }) => {
  const [customConfig, setCustomConfig] = useState({
    gradient: {
      enabled: false,
      color: '#3b82f6'
    },
    lineStyle: {
      strokeWidth: 2,
      strokeDasharray: ''
    },
    displayOptions: {
      showBrush: true,
      showGrid: true,
      animationDuration: 300
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
      title: 'Save Chart Configuration?',
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">Chart styling will be applied.</p>
          <div class="bg-slate-50 p-3 rounded-lg mt-3 text-sm">
            <p><strong>Widget:</strong> ${widget.title}</p>
            <p class="text-xs text-slate-500 mt-1">Gradient: ${customConfig.gradient.enabled ? 'Enabled' : 'Disabled'}</p>
            <p class="text-xs text-slate-500">Line Width: ${customConfig.lineStyle.strokeWidth}px</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
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

  const PRESET_COLORS = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Orange', value: '#f59e0b' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Cyan', value: '#06b6d4' },
    { name: 'Emerald', value: '#059669' }
  ];

  const LINE_STYLES = [
    { name: 'Solid', value: '' },
    { name: 'Dashed', value: '5 5' },
    { name: 'Dotted', value: '1 3' },
    { name: 'Dash-Dot', value: '10 5 2 5' }
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Chart Widget Customizer</h2>
              <p className="text-blue-100 text-sm mt-1">Visual configuration for "{widget.title}"</p>
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
                <h3 className="font-bold text-slate-800 dark:text-white">Gradient Fill</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={customConfig.gradient.enabled}
                  onChange={(e) => setCustomConfig(prev => ({
                    ...prev,
                    gradient: { ...prev.gradient, enabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {customConfig.gradient.enabled && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  Gradient Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_COLORS.map(preset => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setCustomConfig(prev => ({
                        ...prev,
                        gradient: { ...prev.gradient, color: preset.value }
                      }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        customConfig.gradient.color === preset.value
                          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                      style={{ backgroundColor: preset.value + '20' }}
                    >
                      <div 
                        className="w-full h-6 rounded" 
                        style={{ backgroundColor: preset.value }}
                      />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                        {preset.name}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-blue-600 dark:text-blue-400" />
              Line Style
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  Line Width: {customConfig.lineStyle.strokeWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={customConfig.lineStyle.strokeWidth}
                  onChange={(e) => setCustomConfig(prev => ({
                    ...prev,
                    lineStyle: { ...prev.lineStyle, strokeWidth: parseInt(e.target.value) }
                  }))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                  Line Pattern
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {LINE_STYLES.map(style => (
                    <button
                      key={style.name}
                      type="button"
                      onClick={() => setCustomConfig(prev => ({
                        ...prev,
                        lineStyle: { ...prev.lineStyle, strokeDasharray: style.value }
                      }))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        customConfig.lineStyle.strokeDasharray === style.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <svg width="100%" height="20">
                        <line
                          x1="0"
                          y1="10"
                          x2="100%"
                          y2="10"
                          stroke={customConfig.gradient.color || '#3b82f6'}
                          strokeWidth="3"
                          strokeDasharray={style.value}
                        />
                      </svg>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-2">
                        {style.name}
                      </p>
                    </button>
                  ))}
                </div>
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
            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
          >
            <Save size={18} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartCustomizer;