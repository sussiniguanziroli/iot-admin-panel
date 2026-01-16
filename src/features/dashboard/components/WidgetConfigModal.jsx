import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Zap, Activity, Box, Droplets, Thermometer, Gauge as GaugeIcon, ToggleLeft, AlertTriangle, Code } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { validateJsParser } from '../../../shared/utils/payloadParser';

const WIDGET_TYPES = [
    { value: 'metric', label: 'Metric Card', icon: Zap, description: 'Display single value' },
    { value: 'chart', label: 'Line Chart', icon: Activity, description: 'Historical data graph' },
    { value: 'gauge', label: 'Gauge', icon: GaugeIcon, description: 'Circular progress indicator' },
    { value: 'switch', label: 'Control Switch', icon: ToggleLeft, description: 'ON/OFF control' }
];

const ICON_OPTIONS = [
    { value: 'zap', label: 'Lightning', icon: Zap },
    { value: 'activity', label: 'Activity', icon: Activity },
    { value: 'box', label: 'Box', icon: Box },
    { value: 'droplets', label: 'Droplets', icon: Droplets },
    { value: 'thermometer', label: 'Thermometer', icon: Thermometer }
];

const COLOR_OPTIONS = [
    { value: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { value: 'green', label: 'Green', class: 'bg-emerald-500' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
    { value: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { value: 'red', label: 'Red', class: 'bg-rose-500' }
];

const HEIGHT_OPTIONS = [
    { value: 'sm', label: 'Small (160px)' },
    { value: 'md', label: 'Medium (256px)' },
    { value: 'lg', label: 'Large (384px)' },
    { value: 'xl', label: 'Extra Large (500px)' }
];

const WidgetConfigModal = ({ isOpen, onClose, onSave, widget = null, machineId }) => {
    const isEditMode = Boolean(widget);

    const [formData, setFormData] = useState({
        type: 'metric',
        title: '',
        topic: '',
        commandTopic: '',
        dataKey: 'value',
        unit: '',
        color: 'blue',
        iconKey: 'activity',
        height: 'md',
        min: '',
        max: '',
        commandFormat: 'text',
        onCommand: 'ON',
        offCommand: 'OFF',
        onPayloadJSON: '',
        offPayloadJSON: '',
        advancedConfig: '',
        payloadParsingMode: 'simple',
        jsonPath: '',
        jsParserFunction: '',
        fallbackValue: '--'
    });

    useEffect(() => {
        if (widget) {
            setFormData({
                type: widget.type,
                title: widget.title,
                topic: widget.topic || '',
                commandTopic: widget.commandTopic || '',
                dataKey: widget.dataKey || 'value',
                unit: widget.unit || '',
                color: widget.color || 'blue',
                iconKey: widget.iconKey || 'activity',
                height: widget.height || 'md',
                min: widget.min !== undefined ? widget.min : '',
                max: widget.max !== undefined ? widget.max : '',
                commandFormat: widget.commandFormat || 'text',
                onCommand: widget.onCommand || 'ON',
                offCommand: widget.offCommand || 'OFF',
                onPayloadJSON: widget.onPayloadJSON ? JSON.stringify(widget.onPayloadJSON, null, 2) : '',
                offPayloadJSON: widget.offPayloadJSON ? JSON.stringify(widget.offPayloadJSON, null, 2) : '',
                advancedConfig: widget.advancedConfig || '',
                payloadParsingMode: widget.payloadParsingMode || 'simple',
                jsonPath: widget.jsonPath || '',
                jsParserFunction: widget.jsParserFunction || '',
                fallbackValue: widget.fallbackValue || '--'
            });
        } else {
            setFormData({
                type: 'metric',
                title: '',
                topic: '',
                commandTopic: '',
                dataKey: 'value',
                unit: '',
                color: 'blue',
                iconKey: 'activity',
                height: 'md',
                min: '',
                max: '',
                commandFormat: 'text',
                onCommand: 'ON',
                offCommand: 'OFF',
                onPayloadJSON: '',
                offPayloadJSON: '',
                advancedConfig: '',
                payloadParsingMode: 'simple',
                jsonPath: '',
                jsParserFunction: '',
                fallbackValue: '--'
            });
        }
    }, [widget, isOpen]);

    if (!isOpen) return null;

    const validateForm = () => {
        if (!formData.title.trim()) {
            toast.error('Widget title is required', { position: 'top-right', autoClose: 3000 });
            return false;
        }

        if (!formData.topic.trim()) {
            toast.error('MQTT topic is required', { position: 'top-right', autoClose: 3000 });
            return false;
        }

        if (formData.type === 'switch' && !formData.commandTopic.trim()) {
            toast.error('Command topic is required for switch widgets', { position: 'top-right', autoClose: 3000 });
            return false;
        }

        if (formData.payloadParsingMode === 'simple' && !formData.dataKey.trim()) {
            toast.error('Data key is required for simple parsing mode', { position: 'top-right', autoClose: 3000 });
            return false;
        }

        if (formData.payloadParsingMode === 'json-path' && !formData.jsonPath.trim()) {
            toast.error('JSON Path is required when using JSON Path mode', { position: 'top-right', autoClose: 3000 });
            return false;
        }

        if (formData.payloadParsingMode === 'javascript') {
            if (!formData.jsParserFunction.trim()) {
                toast.error('JavaScript parser function is required', { position: 'top-right', autoClose: 3000 });
                return false;
            }

            const validation = validateJsParser(formData.jsParserFunction);
            if (!validation.valid) {
                toast.error(`Invalid JavaScript: ${validation.error}`, { position: 'top-right', autoClose: 4000 });
                return false;
            }
        }

        if (formData.type === 'switch' && formData.commandFormat === 'json') {
            try {
                if (formData.onPayloadJSON) JSON.parse(formData.onPayloadJSON);
                if (formData.offPayloadJSON) JSON.parse(formData.offPayloadJSON);
            } catch (e) {
                toast.error('Invalid JSON in command payloads', { position: 'top-right', autoClose: 3000 });
                return false;
            }
        }

        if (formData.advancedConfig) {
            try {
                JSON.parse(formData.advancedConfig);
            } catch (e) {
                toast.error('Invalid JSON in Advanced Config', { position: 'top-right', autoClose: 3000 });
                return false;
            }
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
            <p><strong>Type:</strong> ${formData.type}</p>
            <p class="font-mono text-xs"><strong>Topic:</strong> ${formData.topic}</p>
            <p class="text-xs text-slate-500"><strong>Parsing:</strong> ${formData.payloadParsingMode}</p>
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
                const widgetData = {
                    ...formData,
                    id: widget?.id || `widget-${Date.now()}`,
                    machineId: machineId || widget?.machineId,
                    onPayloadJSON: formData.onPayloadJSON ? JSON.parse(formData.onPayloadJSON) : null,
                    offPayloadJSON: formData.offPayloadJSON ? JSON.parse(formData.offPayloadJSON) : null
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

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
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

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Settings size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {isEditMode ? 'Edit Widget' : 'Add New Widget'}
                            </h2>
                            <p className="text-blue-100 text-sm mt-1">
                                {isEditMode ? 'Modify widget configuration' : 'Configure a new dashboard widget'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white transition-colors p-2"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
                    <div className="p-6 space-y-6">

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Widget Type
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {WIDGET_TYPES.map(type => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => handleChange('type', type.value)}
                                            disabled={isEditMode}
                                            className={`p-4 rounded-xl border-2 transition-all text-left ${formData.type === type.value
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                                                } ${isEditMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            <div className="flex items-center gap-3 mb-2">
                                                <Icon size={20} className="text-blue-600 dark:text-blue-400" />
                                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                                    {type.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {type.description}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                            {isEditMode && (
                                <div className="flex items-center gap-2 mt-2 text-xs text-orange-600 dark:text-orange-400">
                                    <AlertTriangle size={14} />
                                    <span>Widget type cannot be changed after creation</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Widget Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="e.g., Motor Current"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    MQTT Topic (Subscribe) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.topic}
                                    onChange={(e) => handleChange('topic', e.target.value)}
                                    placeholder="e.g., sol-frut/motor-4/data"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-mono text-sm"
                                />
                            </div>
                        </div>

                        {formData.type !== 'switch' && (
                            <details className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/30">
                                <summary className="cursor-pointer font-bold text-sm text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                    <Code size={16} />
                                    Payload Parsing Configuration
                                    <span className="ml-auto text-xs font-normal opacity-70">How to extract data from MQTT messages</span>
                                </summary>
                                <div className="mt-4 space-y-4">

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">
                                            Parsing Mode
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { value: 'simple', label: 'Simple Key', desc: 'Extract one field' },
                                                { value: 'json-path', label: 'JSON Path', desc: 'Navigate nested data' },
                                                { value: 'javascript', label: 'JavaScript', desc: 'Custom logic' }
                                            ].map(mode => (
                                                <button
                                                    key={mode.value}
                                                    type="button"
                                                    onClick={() => handleChange('payloadParsingMode', mode.value)}
                                                    className={`p-3 rounded-lg border-2 transition-all text-left ${formData.payloadParsingMode === mode.value
                                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 text-indigo-700 dark:text-indigo-400'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                                                        }`}
                                                >
                                                    <p className="font-bold text-sm">{mode.label}</p>
                                                    <p className="text-[10px] opacity-70 mt-1">{mode.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {formData.payloadParsingMode === 'simple' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                Data Key *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.dataKey}
                                                onChange={(e) => handleChange('dataKey', e.target.value)}
                                                placeholder="e.g., corriente, temperatura, value"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded-lg mt-2">
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    <strong>Example:</strong> If payload is <code className="bg-white dark:bg-slate-800 px-1 rounded">{'{"corriente": 15.2}'}</code>, use <code className="bg-white dark:bg-slate-800 px-1 rounded">corriente</code>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.payloadParsingMode === 'json-path' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                JSON Path Expression *
                                            </label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.jsonPath}
                                                onChange={(e) => handleChange('jsonPath', e.target.value)}
                                                placeholder="e.g., motor.sensores.corriente"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded-lg mt-2 space-y-1">
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    <strong>Nested:</strong> <code className="bg-white dark:bg-slate-800 px-1 rounded">motor.sensores.corriente</code>
                                                </p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    <strong>Arrays:</strong> <code className="bg-white dark:bg-slate-800 px-1 rounded">motores[0].corriente</code>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {formData.payloadParsingMode === 'javascript' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                JavaScript Parser Function *
                                            </label>
                                            <textarea
                                                required
                                                value={formData.jsParserFunction}
                                                onChange={(e) => handleChange('jsParserFunction', e.target.value)}
                                                placeholder="// The 'payload' variable contains the MQTT message&#10;// Return the value you want to display&#10;&#10;return payload.corriente;"
                                                rows={8}
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-2 rounded-lg mt-2 space-y-1">
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    <strong>Average:</strong> <code className="bg-white dark:bg-slate-800 px-1 rounded">return (payload.L1 + payload.L2 + payload.L3) / 3;</code>
                                                </p>
                                                <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    <strong>Conditional:</strong> <code className="bg-white dark:bg-slate-800 px-1 rounded">return payload.status === 'ON' ? 1 : 0;</code>
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Fallback Value (if parsing fails)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.fallbackValue}
                                            onChange={(e) => handleChange('fallbackValue', e.target.value)}
                                            placeholder="e.g., --, N/A, 0"
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>

                                </div>
                            </details>
                        )}

                        {formData.type === 'switch' && (
                            <>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Command Topic (Publish) *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.commandTopic}
                                        onChange={(e) => handleChange('commandTopic', e.target.value)}
                                        placeholder="e.g., sol-frut/motor-4/comando"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white font-mono text-sm"
                                    />
                                </div>

                                <details className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/30">
                                    <summary className="cursor-pointer font-bold text-sm text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                                        <Code size={16} />
                                        State Reading Configuration (Subscribe)
                                    </summary>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                Data Key for Switch State
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.dataKey}
                                                onChange={(e) => handleChange('dataKey', e.target.value)}
                                                placeholder="e.g., relay1, estado, status"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">
                                                The widget will check this key to determine if the switch is ON or OFF
                                            </p>
                                        </div>
                                    </div>
                                </details>

                                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
                                        Command Format (Publish)
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 mb-4">
                                        {[
                                            { value: 'text', label: 'Text' },
                                            { value: 'number', label: 'Number' },
                                            { value: 'custom', label: 'Custom Text' },
                                            { value: 'json', label: 'JSON' }
                                        ].map(format => (
                                            <button
                                                key={format.value}
                                                type="button"
                                                onClick={() => handleChange('commandFormat', format.value)}
                                                className={`py-2 px-3text-xs font-bold rounded-lg border-2 transition-all ${formData.commandFormat === format.value
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-300'
                                                    }`}
                                            >
                                                {format.label}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.commandFormat !== 'json' ? (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                    ON Command
                                                </label>
                                                <input
                                                    type={formData.commandFormat === 'number' ? 'number' : 'text'}
                                                    value={formData.onCommand}
                                                    onChange={(e) => handleChange('onCommand', e.target.value)}
                                                    placeholder={formData.commandFormat === 'text' ? 'ON' : formData.commandFormat === 'number' ? '1' : 'MARCHA'}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                    OFF Command
                                                </label>
                                                <input
                                                    type={formData.commandFormat === 'number' ? 'number' : 'text'}
                                                    value={formData.offCommand}
                                                    onChange={(e) => handleChange('offCommand', e.target.value)}
                                                    placeholder={formData.commandFormat === 'text' ? 'OFF' : formData.commandFormat === 'number' ? '0' : 'PARADA'}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                    ON Payload (JSON)
                                                </label>
                                                <textarea
                                                    value={formData.onPayloadJSON}
                                                    onChange={(e) => handleChange('onPayloadJSON', e.target.value)}
                                                    placeholder='{"relay1": 1}'
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                                    OFF Payload (JSON)
                                                </label>
                                                <textarea
                                                    value={formData.offPayloadJSON}
                                                    onChange={(e) => handleChange('offPayloadJSON', e.target.value)}
                                                    placeholder='{"relay1": 0}'
                                                    rows={3}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {formData.type === 'metric' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Unit
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => handleChange('unit', e.target.value)}
                                        placeholder="e.g., A, °C, Hz"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Icon
                                    </label>
                                    <select
                                        value={formData.iconKey}
                                        onChange={(e) => handleChange('iconKey', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer"
                                    >
                                        {ICON_OPTIONS.map(icon => (
                                            <option key={icon.value} value={icon.value}>
                                                {icon.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Color
                                    </label>
                                    <div className="flex gap-2">
                                        {COLOR_OPTIONS.map(color => (
                                            <button
                                                key={color.value}
                                                type="button"
                                                onClick={() => handleChange('color', color.value)}
                                                className={`w-10 h-10 rounded-lg ${color.class} transition-all ${formData.color === color.value
                                                    ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-offset-slate-800'
                                                    : 'opacity-50 hover:opacity-100'
                                                    }`}
                                                title={color.label}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.type === 'chart' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Chart Height
                                    </label>
                                    <select
                                        value={formData.height}
                                        onChange={(e) => handleChange('height', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer"
                                    >
                                        {HEIGHT_OPTIONS.map(height => (
                                            <option key={height.value} value={height.value}>
                                                {height.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Min Value
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.min}
                                        onChange={(e) => handleChange('min', e.target.value)}
                                        placeholder="Auto"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Max Value
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.max}
                                        onChange={(e) => handleChange('max', e.target.value)}
                                        placeholder="Auto"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        {formData.type === 'gauge' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Min Value
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.min}
                                        onChange={(e) => handleChange('min', e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                        Max Value
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.max}
                                        onChange={(e) => handleChange('max', e.target.value)}
                                        placeholder="100"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <details className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl">
                            <summary className="px-4 py-3 cursor-pointer font-bold text-sm text-orange-700 dark:text-orange-400 flex items-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors rounded-xl">
                                <Code size={16} />
                                Advanced Override (JSON)
                                <span className="ml-auto text-xs font-normal opacity-70">For complex configurations</span>
                            </summary>
                            <div className="p-4 pt-2">
                                <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
                                    Override all widget behavior with custom JSON. This takes precedence over all other settings.
                                </p>
                                <textarea
                                    value={formData.advancedConfig}
                                    onChange={(e) => handleChange('advancedConfig', e.target.value)}
                                    placeholder='{"customBehavior": "...", "transformations": {...}}'
                                    rows={6}
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
                            type="submit"
                            className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all"
                        >
                            <Save size={18} />
                            {isEditMode ? 'Save Changes' : 'Add Widget'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default WidgetConfigModal;