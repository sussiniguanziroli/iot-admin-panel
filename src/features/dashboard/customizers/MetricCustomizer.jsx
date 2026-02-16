import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, Calculator, Palette, Code } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const MetricCustomizer = ({ isOpen, onClose, onSave, widget }) => {
  const [customConfig, setCustomConfig] = useState({
    dataTransformation: {
      enabled: false,
      multiplier: 1,
      offset: 0,
      decimals: 2,
      prefix: '',
      suffix: ''
    },
    conditionalFormatting: {
      enabled: false,
      rules: []
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
      title: 'Save Advanced Configuration?',
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">Advanced settings will be applied to this widget.</p>
          <div class="bg-slate-50 p-3 rounded-lg mt-3 text-sm">
            <p><strong>Widget:</strong> ${widget.title}</p>
            <p class="text-xs text-slate-500 mt-1">Data transformation: ${customConfig.dataTransformation.enabled ? 'Enabled' : 'Disabled'}</p>
            <p class="text-xs text-slate-500">Conditional formatting: ${customConfig.conditionalFormatting.enabled ? customConfig.conditionalFormatting.rules.length + ' rules' : 'Disabled'}</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#8b5cf6',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Save Configuration',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        onSave({ ...widget, customConfig: JSON.stringify(customConfig) });
        toast.success('Advanced configuration saved!', {
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

  const addConditionalRule = () => {
    setCustomConfig(prev => ({
      ...prev,
      conditionalFormatting: {
        ...prev.conditionalFormatting,
        rules: [
          ...prev.conditionalFormatting.rules,
          { condition: '>', value: 0, color: 'red' }
        ]
      }
    }));
  };

  const removeConditionalRule = (index) => {
    setCustomConfig(prev => ({
      ...prev,
      conditionalFormatting: {
        ...prev.conditionalFormatting,
        rules: prev.conditionalFormatting.rules.filter((_, i) => i !== index)
      }
    }));
  };

  const updateConditionalRule = (index, field, value) => {
    setCustomConfig(prev => ({
      ...prev,
      conditionalFormatting: {
        ...prev.conditionalFormatting,
        rules: prev.conditionalFormatting.rules.map((rule, i) => 
          i === index ? { ...rule, [field]: value } : rule
        )
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sliders size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Metric Widget Customizer</h2>
              <p className="text-purple-100 text-sm mt-1">Advanced configuration for "{widget.title}"</p>
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
                <Calculator size={20} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white">Data Transformation</h3>
              </div>
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
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
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
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
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
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Decimals
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={customConfig.dataTransformation.decimals}
                      onChange={(e) => setCustomConfig(prev => ({
                        ...prev,
                        dataTransformation: { ...prev.dataTransformation, decimals: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Prefix
                    </label>
                    <input
                      type="text"
                      value={customConfig.dataTransformation.prefix}
                      onChange={(e) => setCustomConfig(prev => ({
                        ...prev,
                        dataTransformation: { ...prev.dataTransformation, prefix: e.target.value }
                      }))}
                      placeholder="$"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Suffix
                    </label>
                    <input
                      type="text"
                      value={customConfig.dataTransformation.suffix}
                      onChange={(e) => setCustomConfig(prev => ({
                        ...prev,
                        dataTransformation: { ...prev.dataTransformation, suffix: e.target.value }
                      }))}
                      placeholder="kWh"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/30 p-3 rounded-lg">
                  <p className="text-xs text-purple-700 dark:text-purple-400">
                    <strong>Formula:</strong> <code className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded">(value × multiplier + offset).toFixed(decimals)</code>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette size={20} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white">Conditional Formatting</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={customConfig.conditionalFormatting.enabled}
                  onChange={(e) => setCustomConfig(prev => ({
                    ...prev,
                    conditionalFormatting: { ...prev.conditionalFormatting, enabled: e.target.checked }
                  }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {customConfig.conditionalFormatting.enabled && (
              <div className="space-y-3">
                {customConfig.conditionalFormatting.rules.map((rule, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500">IF value</span>
                    <select
                      value={rule.condition}
                      onChange={(e) => updateConditionalRule(index, 'condition', e.target.value)}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value=">">{'>'}</option>
                      <option value=">=">{'≥'}</option>
                      <option value="<">{'<'}</option>
                      <option value="<=">{'≤'}</option>
                      <option value="===">{'='}</option>
                      <option value="!==">{'≠'}</option>
                    </select>
                    <input
                      type="number"
                      value={rule.value}
                      onChange={(e) => updateConditionalRule(index, 'value', parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">THEN color:</span>
                    <select
                      value={rule.color}
                      onChange={(e) => updateConditionalRule(index, 'color', e.target.value)}
                      className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    >
                      <option value="red">Red</option>
                      <option value="orange">Orange</option>
                      <option value="yellow">Yellow</option>
                      <option value="green">Green</option>
                      <option value="blue">Blue</option>
                      <option value="purple">Purple</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeConditionalRule(index)}
                      className="ml-auto p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addConditionalRule}
                  className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-500 hover:border-purple-400 hover:text-purple-600 transition-colors"
                >
                  + Add Rule
                </button>
              </div>
            )}
          </div>

          <details className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl">
            <summary className="px-4 py-3 cursor-pointer font-bold text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors rounded-xl">
              <Code size={16} />
              Raw JSON Override
              <span className="ml-auto text-xs font-normal opacity-70">For expert users</span>
            </summary>
            <div className="p-4 pt-2">
              <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                Edit the raw JSON configuration directly. Changes here override all UI settings.
              </p>
              <textarea
                value={JSON.stringify(customConfig, null, 2)}
                onChange={(e) => {
                  try {
                    setCustomConfig(JSON.parse(e.target.value));
                  } catch (err) {}
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
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 transition-all"
          >
            <Save size={18} />
            Save Advanced Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default MetricCustomizer;