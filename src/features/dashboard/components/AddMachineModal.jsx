import React, { useState, useEffect } from 'react';
import { X, Gauge, Power, Save, Hash, LineChart as IconChart, Layout, Zap, Activity, Box, Droplets, Thermometer, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const WIDGET_TYPES = [
  { id: 'gauge', label: 'Gauge', icon: Gauge, color: 'blue' },
  { id: 'metric', label: 'Metric', icon: Hash, color: 'purple' },
  { id: 'chart', label: 'Chart', icon: IconChart, color: 'orange' },
  { id: 'switch', label: 'Switch', icon: Power, color: 'emerald' }
];

const ICON_OPTIONS = [
  { value: 'zap', label: 'Lightning', icon: Zap },
  { value: 'activity', label: 'Activity', icon: Activity },
  { value: 'box', label: 'Box', icon: Box },
  { value: 'droplets', label: 'Droplets', icon: Droplets },
  { value: 'thermometer', label: 'Thermometer', icon: Thermometer }
];

const COLOR_PRESETS = [
  { value: 'blue', label: 'Blue', hex: '#3b82f6' },
  { value: 'green', label: 'Green', hex: '#10b981' },
  { value: 'orange', label: 'Orange', hex: '#f97316' },
  { value: 'purple', label: 'Purple', hex: '#a855f7' },
  { value: 'red', label: 'Red', hex: '#ef4444' }
];

const HEIGHT_OPTIONS = [
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' }
];

const AddWidgetModal = ({ isOpen, onClose, onSave, widget = null }) => {
  const isEditMode = Boolean(widget);
  
  const [activeTab, setActiveTab] = useState('gauge');
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    dataKey: 'value',
    commandTopic: '',
    unit: '',
    color: 'blue',
    iconKey: 'activity',
    min: '',
    max: '',
    width: 'half',
    height: 'md'
  });

  useEffect(() => {
    if (isOpen && widget) {
      setActiveTab(widget.type);
      setFormData({
        title: widget.title || '',
        topic: widget.topic || '',
        dataKey: widget.dataKey || 'value',
        commandTopic: widget.commandTopic || '',
        unit: widget.unit || '',
        color: widget.color || 'blue',
        iconKey: widget.iconKey || 'activity',
        min: widget.min !== undefined ? widget.min : '',
        max: widget.max !== undefined ? widget.max : '',
        width: widget.width || 'half',
        height: widget.height || 'md'
      });
    } else if (isOpen && !widget) {
      setActiveTab('gauge');
      setFormData({
        title: '',
        topic: '',
        dataKey: 'value',
        commandTopic: '',
        unit: '',
        color: 'blue',
        iconKey: 'activity',
        min: '',
        max: '',
        width: 'half',
        height: 'md'
      });
    }
  }, [isOpen, widget]);

  if (!isOpen) return null;

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Widget title is required', {
        position: 'top-right',
        autoClose: 3000
      });
      return false;
    }

    if (!formData.topic.trim()) {
      toast.error('MQTT topic is required', {
        position: 'top-right',
        autoClose: 3000
      });
      return false;
    }

    if (activeTab === 'switch' && !formData.commandTopic.trim()) {
      toast.error('Command topic is required for switch widgets', {
        position: 'top-right',
        autoClose: 3000
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const result = await Swal.fire({
      title: isEditMode ? 'Save Changes?' : 'Add Widget?',
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">
            ${isEditMode 
              ? 'Your changes will be applied immediately to the dashboard.' 
              : 'A new widget will be added to your dashboard.'}
          </p>
          <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mt-3 text-sm space-y-1">
            <p><strong>Title:</strong> ${formData.title}</p>
            <p><strong>Type:</strong> ${activeTab}</p>
            <p class="font-mono text-xs"><strong>Topic:</strong> ${formData.topic}</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#64748b',
      confirmButtonText: isEditMode ? 'Save Changes' : 'Add Widget',
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const finalMin = formData.min !== '' ? Number(formData.min) : undefined;
        const finalMax = formData.max !== '' ? Number(formData.max) : undefined;

        const widgetData = {
          ...(widget || {}),
          type: activeTab,
          title: formData.title,
          topic: formData.topic,
          width: formData.width,
          height: formData.height,
          dataKey: formData.dataKey,
          commandTopic: formData.commandTopic,
          unit: formData.unit,
          color: formData.color,
          iconKey: formData.iconKey,
          min: finalMin,
          max: finalMax
        };

        onSave(widgetData);
        
        toast.success(
          isEditMode ? 'Widget updated successfully!' : 'Widget added successfully!',
          {
            position: 'bottom-right',
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          }
        );

        onClose();
      } catch (error) {
        console.error('Error saving widget:', error);
        toast.error('Failed to save widget. Please try again.', {
          position: 'top-right',
          autoClose: 3000
        });
      }
    }
  };

  const handleClose = async () => {
    const hasChanges = widget ? (
      formData.title !== widget.title ||
      formData.topic !== widget.topic ||
      formData.dataKey !== widget.dataKey
    ) : (
      formData.title.trim() !== '' ||
      formData.topic.trim() !== ''
    );

    if (hasChanges) {
      const result = await Swal.fire({
        title: 'Discard Changes?',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Yes, discard',
        cancelButtonText: 'Keep Editing',
        reverseButtons: true
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    onClose();
  };

  const TypeBtn = ({ id, label, icon: Icon, color }) => (
    <button
      type="button"
      onClick={() => {
        if (isEditMode) {
          toast.warning('Widget type cannot be changed after creation', {
            position: 'top-right',
            autoClose: 2000
          });
          return;
        }
        setActiveTab(id);
      }}
      disabled={isEditMode && activeTab !== id}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
        activeTab === id
          ? `border-${color}-500 bg-${color}-50 dark:bg-${color}-900/20 text-${color}-700 dark:text-${color}-400 shadow-md`
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
      } ${isEditMode && activeTab !== id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className={`mb-1 ${activeTab === id ? '' : 'opacity-50'}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              {React.createElement(WIDGET_TYPES.find(t => t.id === activeTab)?.icon || Gauge, { size: 24 })}
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {isEditMode ? 'Edit Widget' : 'Add Widget'}
              </h2>
              <p className="text-blue-100 text-sm mt-1">
                {isEditMode ? 'Modify widget configuration' : 'Configure a new dashboard widget'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors p-2">
            <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form id="widget-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                Widget Type
              </label>
              <div className="grid grid-cols-4 gap-3">
                {WIDGET_TYPES.map(type => (
                  <TypeBtn key={type.id} {...type} />
                ))}
              </div>
              {isEditMode && (
                <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 dark:text-orange-400">
                  <AlertTriangle size={14} />
                  <span>Widget type cannot be changed after creation</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    Widget Title *
                  </label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g., Motor Current"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
                </div>
                
                {activeTab !== 'switch' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Data Key *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., corriente, temperatura"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-mono text-sm" 
                      value={formData.dataKey} 
                      onChange={e => setFormData({...formData, dataKey: e.target.value})} 
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      JSON property name to extract from MQTT message
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                    MQTT Topic *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g., sol-frut/motor-4/corriente"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-mono text-sm" 
                    value={formData.topic} 
                    onChange={e => setFormData({...formData, topic: e.target.value})} 
                  />
                </div>

                {activeTab === 'switch' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Command Topic *
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g., sol-frut/motor-4/comando"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-mono text-sm" 
                      value={formData.commandTopic} 
                      onChange={e => setFormData({...formData, commandTopic: e.target.value})} 
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Topic where commands (MARCHA/PARADA) will be sent
                    </p>
                  </div>
                )}

                {activeTab === 'metric' && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                      Unit
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g., A, °C, Hz"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white" 
                      value={formData.unit} 
                      onChange={e => setFormData({...formData, unit: e.target.value})} 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2 mb-3">
                    <Layout size={14} /> Dimensions
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, width: 'half'})} 
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${
                        formData.width === 'half' 
                          ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-300'
                      }`}
                    >
                      Normal
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, width: 'full'})} 
                      className={`flex-1 py-2 text-xs font-bold rounded-lg border-2 transition-all ${
                        formData.width === 'full' 
                          ? 'bg-white dark:bg-slate-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-sm' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-blue-300'
                      }`}
                    >
                      Full Width
                    </button>
                  </div>
                  
                  {(activeTab === 'chart' || activeTab === 'metric') && (
                    <div className="grid grid-cols-4 gap-1">
                      {HEIGHT_OPTIONS.map((size) => (
                        <button 
                          key={size.value} 
                          type="button" 
                          onClick={() => setFormData({...formData, height: size.value})} 
                          className={`py-1.5 text-[10px] font-bold uppercase rounded border-2 transition-all ${
                            formData.height === size.value 
                              ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-600 dark:text-orange-400' 
                              : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-orange-300'
                          }`}
                        >
                          {size.value}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(activeTab === 'gauge' || activeTab === 'chart') && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-3">
                      Y-Axis Scale (Optional)
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Min</label>
                        <input 
                          type="number" 
                          placeholder="Auto" 
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={formData.min} 
                          onChange={e => setFormData({...formData, min: e.target.value})} 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Max</label>
                        <input 
                          type="number" 
                          placeholder="Auto" 
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none" 
                          value={formData.max} 
                          onChange={e => setFormData({...formData, max: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'metric' && (
                  <>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-3">
                        Icon
                      </label>
                      <select
                        value={formData.iconKey}
                        onChange={(e) => setFormData({...formData, iconKey: e.target.value})}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                      >
                        {ICON_OPTIONS.map(icon => (
                          <option key={icon.value} value={icon.value}>
                            {icon.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-3">
                        Color
                      </label>
                      <div className="flex gap-2">
                        {COLOR_PRESETS.map(color => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => setFormData({...formData, color: color.value})}
                            className={`w-10 h-10 rounded-lg transition-all ${
                              formData.color === color.value
                                ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800'
                                : 'opacity-50 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'chart' && (
                  <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-3">
                      Line Color
                    </label>
                    <input 
                      type="color" 
                      className="w-full h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700" 
                      value={typeof formData.color === 'string' && formData.color.startsWith('#') ? formData.color : COLOR_PRESETS.find(c => c.value === formData.color)?.hex || '#3b82f6'} 
                      onChange={e => setFormData({...formData, color: e.target.value})} 
                    />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={handleClose} 
            className="px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="widget-form" 
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
          >
            <Save size={18} />
            {isEditMode ? 'Save Changes' : 'Add Widget'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddWidgetModal;