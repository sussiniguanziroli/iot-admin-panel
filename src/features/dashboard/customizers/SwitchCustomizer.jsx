import React, { useState, useEffect } from 'react';
import { X, Save, Sliders, Power, Shield, Bell, Clock, Plus, Trash2, Code, Lock } from 'lucide-react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const SwitchCustomizer = ({ isOpen, onClose, onSave, widget }) => {
    const [customConfig, setCustomConfig] = useState({
        confirmationMode: {
            enabled: true,
            type: 'single-click',
            requireDoubleClick: false,
            holdDuration: 1000
        },
        interlocks: {
            enabled: false,
            rules: []
        },
        feedback: {
            haptic: false,
            sound: false,
            soundType: 'beep',
            visualFeedback: true
        },
        scheduling: {
            enabled: false,
            schedules: []
        },
        stateTracking: {
            enabled: true,
            showLastChanged: true,
            showChangeCount: false
        },
        errorHandling: {
            enabled: true,
            retryAttempts: 3,
            timeout: 5000,
            showErrors: true
        },
        customStates: {
            enabled: false,
            states: []
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
            title: 'Save Switch Configuration?',
            html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">Advanced switch settings will be applied.</p>
          <div class="bg-slate-50 p-3 rounded-lg mt-3 text-sm">
            <p><strong>Widget:</strong> ${widget.title}</p>
            <p class="text-xs text-slate-500 mt-1">Confirmation: ${customConfig.confirmationMode.type}</p>
            <p class="text-xs text-slate-500">Interlocks: ${customConfig.interlocks.enabled ? customConfig.interlocks.rules.length + ' rules' : 'Disabled'}</p>
          </div>
        </div>
      `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Save Configuration',
            cancelButtonText: 'Cancel',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                onSave({ ...widget, customConfig: JSON.stringify(customConfig) });
                toast.success('Switch configuration saved!', {
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

    const addInterlock = () => {
        setCustomConfig(prev => ({
            ...prev,
            interlocks: {
                ...prev.interlocks,
                rules: [
                    ...prev.interlocks.rules,
                    {
                        checkTopic: '',
                        checkDataKey: 'value',
                        condition: 'must_be_off',
                        message: 'Cannot turn on while dependent equipment is active'
                    }
                ]
            }
        }));
    };

    const removeInterlock = (index) => {
        setCustomConfig(prev => ({
            ...prev,
            interlocks: {
                ...prev.interlocks,
                rules: prev.interlocks.rules.filter((_, i) => i !== index)
            }
        }));
    };

    const updateInterlock = (index, field, value) => {
        setCustomConfig(prev => ({
            ...prev,
            interlocks: {
                ...prev.interlocks,
                rules: prev.interlocks.rules.map((rule, i) =>
                    i === index ? { ...rule, [field]: value } : rule
                )
            }
        }));
    };

    const addSchedule = () => {
        setCustomConfig(prev => ({
            ...prev,
            scheduling: {
                ...prev.scheduling,
                schedules: [
                    ...prev.scheduling.schedules,
                    {
                        action: 'turn_on',
                        time: '08:00',
                        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                        enabled: true
                    }
                ]
            }
        }));
    };

    const removeSchedule = (index) => {
        setCustomConfig(prev => ({
            ...prev,
            scheduling: {
                ...prev.scheduling,
                schedules: prev.scheduling.schedules.filter((_, i) => i !== index)
            }
        }));
    };

    const updateSchedule = (index, field, value) => {
        setCustomConfig(prev => ({
            ...prev,
            scheduling: {
                ...prev.scheduling,
                schedules: prev.scheduling.schedules.map((schedule, i) =>
                    i === index ? { ...schedule, [field]: value } : schedule
                )
            }
        }));
    };

    const addCustomState = () => {
        setCustomConfig(prev => ({
            ...prev,
            customStates: {
                ...prev.customStates,
                states: [
                    ...prev.customStates.states,
                    { value: 'loading', label: 'Loading', color: '#f59e0b', icon: 'loader' }
                ]
            }
        }));
    };

    const removeCustomState = (index) => {
        setCustomConfig(prev => ({
            ...prev,
            customStates: {
                ...prev.customStates,
                states: prev.customStates.states.filter((_, i) => i !== index)
            }
        }));
    };

    const updateCustomState = (index, field, value) => {
        setCustomConfig(prev => ({
            ...prev,
            customStates: {
                ...prev.customStates,
                states: prev.customStates.states.map((state, i) =>
                    i === index ? { ...state, [field]: value } : state
                )
            }
        }));
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Power size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Switch Widget Customizer</h2>
                            <p className="text-emerald-100 text-sm mt-1">Advanced configuration for "{widget.title}"</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors p-2">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Sliders size={20} className="text-emerald-600 dark:text-emerald-400" />
                            Confirmation Mode
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.confirmationMode.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        confirmationMode: { ...prev.confirmationMode, enabled: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Require confirmation before switching</label>
                            </div>

                            {customConfig.confirmationMode.enabled && (
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    {[
                                        { value: 'single-click', label: 'Single Click', desc: 'Show confirmation dialog' },
                                        { value: 'double-click', label: 'Double Click', desc: 'Require double click' },
                                        { value: 'hold', label: 'Hold', desc: 'Hold button to confirm' }
                                    ].map(mode => (
                                        <button
                                            key={mode.value}
                                            type="button"
                                            onClick={() => setCustomConfig(prev => ({
                                                ...prev,
                                                confirmationMode: { ...prev.confirmationMode, type: mode.value }
                                            }))}
                                            className={`p-3 rounded-lg border-2 transition-all text-left ${customConfig.confirmationMode.type === mode.value
                                                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                                }`}
                                        >
                                            <p className="font-bold text-sm text-slate-800 dark:text-white">{mode.label}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{mode.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {customConfig.confirmationMode.type === 'hold' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Hold Duration (ms)
                                    </label>
                                    <input
                                        type="number"
                                        min="500"
                                        max="5000"
                                        step="100"
                                        value={customConfig.confirmationMode.holdDuration}
                                        onChange={(e) => setCustomConfig(prev => ({
                                            ...prev,
                                            confirmationMode: { ...prev.confirmationMode, holdDuration: parseInt(e.target.value) }
                                        }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Shield size={20} className="text-emerald-600 dark:text-emerald-400" />
                                <h3 className="font-bold text-slate-800 dark:text-white">Interlocks & Safety</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customConfig.interlocks.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        interlocks: { ...prev.interlocks, enabled: e.target.checked }
                                    }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>

                        {customConfig.interlocks.enabled && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Prevent switching based on other equipment states</p>
                                {customConfig.interlocks.rules.map((rule, index) => (
                                    <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Lock size={16} className="text-emerald-600" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Interlock Rule {index + 1}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeInterlock(index)}
                                                className="ml-auto p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Check Topic</label>
                                                <input
                                                    type="text"
                                                    value={rule.checkTopic}
                                                    onChange={(e) => updateInterlock(index, 'checkTopic', e.target.value)}
                                                    placeholder="e.g., motor-2/status"
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Data Key</label>
                                                <input
                                                    type="text"
                                                    value={rule.checkDataKey}
                                                    onChange={(e) => updateInterlock(index, 'checkDataKey', e.target.value)}
                                                    placeholder="value"
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Condition</label>
                                            <select
                                                value={rule.condition}
                                                onChange={(e) => updateInterlock(index, 'condition', e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            >
                                                <option value="must_be_off">Must be OFF</option>
                                                <option value="must_be_on">Must be ON</option>
                                                <option value="equals">Equals specific value</option>
                                                <option value="not_equals">Not equals value</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Error Message</label>
                                            <input
                                                type="text"
                                                value={rule.message}
                                                onChange={(e) => updateInterlock(index, 'message', e.target.value)}
                                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addInterlock}
                                    className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Add Interlock Rule
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <Bell size={20} className="text-emerald-600 dark:text-emerald-400" />
                            Feedback & Notifications
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.feedback.haptic}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        feedback: { ...prev.feedback, haptic: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Haptic Feedback (Mobile)</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.feedback.visualFeedback}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        feedback: { ...prev.feedback, visualFeedback: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Visual Feedback (Animations)</label>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.feedback.sound}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        feedback: { ...prev.feedback, sound: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Sound Feedback</label>
                            </div>

                            {customConfig.feedback.sound && (
                                <div className="ml-6">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                        Sound Type
                                    </label>
                                    <select
                                        value={customConfig.feedback.soundType}
                                        onChange={(e) => setCustomConfig(prev => ({
                                            ...prev,
                                            feedback: { ...prev.feedback, soundType: e.target.value }
                                        }))}
                                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                    >
                                        <option value="beep">Beep</option>
                                        <option value="click">Click</option>
                                        <option value="success">Success</option>
                                        <option value="error">Error</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Clock size={20} className="text-emerald-600 dark:text-emerald-400" />
                                <h3 className="font-bold text-slate-800 dark:text-white">Scheduling (Timer)</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customConfig.scheduling.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        scheduling: { ...prev.scheduling, enabled: e.target.checked }
                                    }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>

                        {customConfig.scheduling.enabled && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Automatically turn on/off at scheduled times</p>
                                {customConfig.scheduling.schedules.map((schedule, index) => (
                                    <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-emerald-600" />
                                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Schedule {index + 1}</span>
                                            <label className="ml-auto relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={schedule.enabled}
                                                    onChange={(e) => updateSchedule(index, 'enabled', e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => removeSchedule(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Action</label>
                                                <select
                                                    value={schedule.action}
                                                    onChange={(e) => updateSchedule(index, 'action', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                >
                                                    <option value="turn_on">Turn ON</option>
                                                    <option value="turn_off">Turn OFF</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs text-slate-500 mb-1">Time</label>
                                                <input
                                                    type="time"
                                                    value={schedule.time}
                                                    onChange={(e) => updateSchedule(index, 'time', e.target.value)}
                                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-slate-500 mb-1">Days</label>
                                            <div className="flex gap-1">
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dayIndex) => {
                                                    const dayValue = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'][dayIndex];
                                                    const isSelected = schedule.days.includes(dayValue);
                                                    return (
                                                        <button
                                                            key={day}
                                                            type="button"
                                                            onClick={() => {
                                                                const newDays = isSelected
                                                                    ? schedule.days.filter(d => d !== dayValue)
                                                                    : [...schedule.days, dayValue];
                                                                updateSchedule(index, 'days', newDays);
                                                            }}
                                                            className={`flex-1 py-1 text-xs font-bold rounded border-2 transition-all ${isSelected
                                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                                                                    : 'border-slate-200 dark:border-slate-700 text-slate-400'
                                                                }`}
                                                        >
                                                            {day}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addSchedule}
                                    className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Add Schedule
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">State Tracking</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.stateTracking.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        stateTracking: { ...prev.stateTracking, enabled: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Enable State Tracking</label>
                            </div>

                            {customConfig.stateTracking.enabled && (
                                <>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={customConfig.stateTracking.showLastChanged}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                stateTracking: { ...prev.stateTracking, showLastChanged: e.target.checked }
                                            }))}
                                            className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">Show last changed time</label>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={customConfig.stateTracking.showChangeCount}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                stateTracking: { ...prev.stateTracking, showChangeCount: e.target.checked }
                                            }))}
                                            className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                        />
                                        <label className="text-sm text-slate-700 dark:text-slate-300">Show total switches count</label>
                                    </div>
                                </>
                            )}
                        </div></div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white mb-4">Error Handling</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={customConfig.errorHandling.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        errorHandling: { ...prev.errorHandling, enabled: e.target.checked }
                                    }))}
                                    className="w-4 h-4 text-emerald-600 bg-slate-100 border-slate-300 rounded focus:ring-emerald-500"
                                />
                                <label className="text-sm text-slate-700 dark:text-slate-300">Enable Advanced Error Handling</label>
                            </div>

                            {customConfig.errorHandling.enabled && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Retry Attempts
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={customConfig.errorHandling.retryAttempts}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                errorHandling: { ...prev.errorHandling, retryAttempts: parseInt(e.target.value) }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                                            Timeout (ms)
                                        </label>
                                        <input
                                            type="number"
                                            min="1000"
                                            max="30000"
                                            step="1000"
                                            value={customConfig.errorHandling.timeout}
                                            onChange={(e) => setCustomConfig(prev => ({
                                                ...prev,
                                                errorHandling: { ...prev.errorHandling, timeout: parseInt(e.target.value) }
                                            }))}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-800 dark:text-white">Custom States (Beyond ON/OFF)</h3>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={customConfig.customStates.enabled}
                                    onChange={(e) => setCustomConfig(prev => ({
                                        ...prev,
                                        customStates: { ...prev.customStates, enabled: e.target.checked }
                                    }))}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
                            </label>
                        </div>

                        {customConfig.customStates.enabled && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-500">Define additional states (e.g., loading, error, pending)</p>
                                {customConfig.customStates.states.map((state, index) => (
                                    <div key={index} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={state.value}
                                                onChange={(e) => updateCustomState(index, 'value', e.target.value)}
                                                placeholder="State value"
                                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={state.label}
                                                onChange={(e) => updateCustomState(index, 'label', e.target.value)}
                                                placeholder="Display label"
                                                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <input
                                                type="color"
                                                value={state.color}
                                                onChange={(e) => updateCustomState(index, 'color', e.target.value)}
                                                className="w-12 h-10 cursor-pointer rounded-lg border-2 border-slate-200 dark:border-slate-700"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeCustomState(index)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addCustomState}
                                    className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> Add Custom State
                                </button>
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
                                rows={12}
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
                        className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
                    >
                        <Save size={18} />
                        Save Advanced Config
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SwitchCustomizer;