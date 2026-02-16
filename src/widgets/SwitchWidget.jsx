import React, { useState, useEffect, useRef } from 'react';
import { Power, ToggleLeft, Lock } from 'lucide-react';
import BaseWidget from './BaseWidget';
import { useMqtt } from '../features/mqtt/context/MqttContext';
import { useDashboard } from '../features/dashboard/context/DashboardContext';
import { usePermissions } from '../shared/hooks/usePermissions';
import { useWidgetAccess } from '../shared/hooks/useWidgetAccess';
import { useAuditLog } from '../shared/hooks/useAuditLog';
import { ACTION_TYPES, ACTION_CATEGORIES } from '../services/AdminService';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { parsePayload } from '../shared/utils/payloadParser';

const SwitchWidget = ({ 
  id, title, topic, commandTopic, dataKey = 'relay1', 
  commandFormat = 'text', onCommand = 'ON', offCommand = 'OFF', 
  onPayloadJSON, offPayloadJSON, customConfig, onEdit, onCustomize,
  payloadParsingMode, jsonPath, jsParserFunction, fallbackValue,
  machineId
}) => {
  const { can, isSuperAdmin, isAdmin } = usePermissions();
  const { log } = useAuditLog();
  const { machines, activeLocation, getWidgetData, setWidgetData } = useDashboard();
  
  const [isOn, setIsOn] = useState(() => getWidgetData('switch', id) || false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const hasSubscribed = useRef(false);
  const [advancedSettings, setAdvancedSettings] = useState({});

  useEffect(() => {
    if (customConfig) {
      try {
        const parsed = typeof customConfig === 'string' ? JSON.parse(customConfig) : customConfig;
        setAdvancedSettings(parsed);
      } catch(e) { 
        console.error('[SwitchWidget] Error parsing advanced config:', e);
      }
    }
  }, [customConfig]);

  const widgetData = {
    type: 'switch',
    accessControl: advancedSettings.accessControl,
    id,
    title
  };

  const { hasAccess, message: accessMessage, isAdminOverride } = useWidgetAccess(widgetData);
  
  const { subscribeToTopic, publishMessage, lastMessage } = useMqtt();

  useEffect(() => {
    if (topic && !hasSubscribed.current) {
      subscribeToTopic(topic);
      hasSubscribed.current = true;
    }
  }, [topic, subscribeToTopic]);

  useEffect(() => {
    if (lastMessage && lastMessage.topic === topic) {
      try {
        let serverValue = parsePayload(lastMessage.payload, {
          payloadParsingMode: payloadParsingMode || 'simple',
          dataKey: dataKey || 'relay1',
          jsonPath: jsonPath || '',
          jsParserFunction: jsParserFunction || '',
          fallbackValue: null
        });

        if (serverValue !== undefined && serverValue !== null) {
          const valString = String(serverValue).toUpperCase();
          const newState = (
            valString === 'ON' || 
            valString === '1' || 
            valString === 'TRUE' ||
            valString === 'HIGH' ||
            valString === 'MARCHA' ||
            valString === 'ACTIVE' ||
            valString === 'CLOSED'
          );
          
          setIsOn(newState);
          setLastUpdated(lastMessage.timestamp.toLocaleTimeString());
          setWidgetData('switch', id, newState);
        }
      } catch (e) {
        console.error('[SwitchWidget] Error processing message:', e);
      }
    }
  }, [lastMessage, topic, id, dataKey, payloadParsingMode, jsonPath, jsParserFunction, fallbackValue, setWidgetData]);

  useEffect(() => {
    if (!advancedSettings?.interlocks?.enabled) return;

    const interlockTopics = advancedSettings.interlocks.rules
      .map(rule => rule.checkTopic)
      .filter(topic => topic && topic.trim() !== '');

    interlockTopics.forEach(topic => {
      console.log(`[Interlock] Subscribing to: ${topic}`);
      subscribeToTopic(topic);
    });

    return () => {
      console.log('[Interlock] Cleanup - topics remain subscribed for other widgets');
    };
  }, [advancedSettings?.interlocks, subscribeToTopic]);

  const validateInterlocks = async () => {
    if (!advancedSettings?.interlocks?.enabled) {
      return { valid: true, message: null };
    }

    const rules = advancedSettings.interlocks.rules || [];
    
    for (const rule of rules) {
      if (!rule.checkTopic || !rule.checkDataKey) continue;

      try {
        const isCurrentTopic = lastMessage?.topic === rule.checkTopic;

        if (!isCurrentTopic) {
          console.warn(`[Interlock] No data available for topic: ${rule.checkTopic}`);
          continue;
        }

        const checkValue = parsePayload(lastMessage.payload, {
          payloadParsingMode: 'simple',
          dataKey: rule.checkDataKey,
          jsonPath: '',
          jsParserFunction: '',
          fallbackValue: null
        });

        if (checkValue === null || checkValue === undefined) {
          console.warn(`[Interlock] Could not parse value from ${rule.checkTopic}`);
          continue;
        }

        const checkValueStr = String(checkValue).toUpperCase();
        const isCheckOn = (
          checkValueStr === 'ON' || 
          checkValueStr === '1' || 
          checkValueStr === 'TRUE' ||
          checkValueStr === 'HIGH'
        );

        let conditionMet = true;

        switch(rule.condition) {
          case 'must_be_off':
            conditionMet = !isCheckOn;
            break;
          case 'must_be_on':
            conditionMet = isCheckOn;
            break;
          case 'equals':
            conditionMet = checkValue === rule.expectedValue;
            break;
          case 'not_equals':
            conditionMet = checkValue !== rule.expectedValue;
            break;
          default:
            conditionMet = true;
        }

        if (!conditionMet) {
          console.log(`[Interlock] Condition NOT met for ${rule.checkTopic}:`, {
            checkValue,
            isCheckOn,
            condition: rule.condition
          });
          
          return {
            valid: false,
            message: rule.message || 'Interlock condition not met'
          };
        }

        console.log(`[Interlock] Condition MET for ${rule.checkTopic}`);

      } catch (error) {
        console.error('[Interlock] Validation error:', error);
      }
    }

    return { valid: true, message: null };
  };

  const toggle = async () => {
    if (!hasAccess) {
      toast.error(accessMessage || '🔒 No tiene permiso para controlar este equipo', {
        position: 'top-right',
        autoClose: 4000,
        theme: 'colored'
      });

      await log(
        'SWITCH_ACCESS_DENIED',
        ACTION_CATEGORIES.DEVICE_CONTROL,
        `${title} - Acceso Denegado`,
        {
          widgetId: id,
          widgetTitle: title,
          machineId,
          reason: accessMessage,
          userRole: can.role,
          accessControlEnabled: advancedSettings.accessControl?.enabled
        }
      );
      return;
    }

    if (!isOn) {
      const interlockCheck = await validateInterlocks();
      
      if (!interlockCheck.valid) {
        toast.error(`🔒 ${interlockCheck.message}`, {
          position: 'top-right',
          autoClose: 5000,
          theme: 'colored'
        });

        await log(
          'SWITCH_INTERLOCK_BLOCKED',
          ACTION_CATEGORIES.DEVICE_CONTROL,
          `${title} - Interlock Blocked`,
          {
            widgetId: id,
            widgetTitle: title,
            machineId,
            interlockMessage: interlockCheck.message,
            interlockRules: advancedSettings.interlocks?.rules
          }
        );
        return;
      }
    }

    let payload;
    let payloadDescription;

    if (commandFormat === 'json') {
      payload = isOn ? offPayloadJSON : onPayloadJSON;
      payloadDescription = JSON.stringify(payload);
    } else if (commandFormat === 'number') {
      payload = isOn ? offCommand : onCommand;
      payloadDescription = payload;
    } else {
      payload = isOn ? offCommand : onCommand;
      payloadDescription = payload;
    }

    const actionText = isOn ? 'TURN OFF' : 'TURN ON';
    const actionType = isOn ? ACTION_TYPES.CONTROL_RELAY_OFF : ACTION_TYPES.CONTROL_RELAY_ON;
    
    const machineName = machines.find(m => m.id === machineId)?.name || 'Unknown Machine';
    const locationName = activeLocation?.name || 'Unknown Location';
    
    const result = await Swal.fire({
      title: `${actionText}?`,
      html: `
        <div class="text-left space-y-2">
          <p class="text-slate-600">You are about to <strong>${actionText.toLowerCase()}</strong> this equipment.</p>
          <div class="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mt-3 text-sm space-y-1">
            <p class="font-mono text-xs"><strong>Device:</strong> ${title}</p>
            <p class="font-mono text-xs"><strong>Machine:</strong> ${machineName}</p>
            <p class="font-mono text-xs"><strong>Location:</strong> ${locationName}</p>
            <p class="font-mono text-xs"><strong>Topic:</strong> ${commandTopic}</p>
            <p class="font-mono text-xs"><strong>Payload:</strong> <code class="bg-slate-200 dark:bg-slate-900 px-1 py-0.5 rounded">${payloadDescription}</code></p>
            ${isAdminOverride ? '<p class="text-xs text-indigo-600 mt-2">🔓 <strong>Admin Override Active</strong></p>' : ''}
          </div>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: isOn ? '#ef4444' : '#10b981',
      cancelButtonColor: '#64748b',
      confirmButtonText: `Yes, ${actionText.toLowerCase()}!`,
      cancelButtonText: 'Cancel',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const messageToSend = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
        
        console.log(`[SwitchWidget] Publishing to: ${commandTopic}`);
        console.log(`[SwitchWidget] Payload:`, messageToSend);
        
        publishMessage(commandTopic, messageToSend);
        
        await log(
          actionType,
          ACTION_CATEGORIES.DEVICE_CONTROL,
          `${title} (${machineName})`,
          {
            widgetId: id,
            widgetTitle: title,
            widgetType: 'switch',
            machineId,
            machineName,
            locationName,
            locationId: activeLocation?.id,
            previousState: isOn ? 'ON' : 'OFF',
            newState: isOn ? 'OFF' : 'ON',
            topic: commandTopic,
            payload: messageToSend,
            dataKey,
            commandFormat,
            isAdminOverride,
            accessControlEnabled: advancedSettings.accessControl?.enabled
          }
        );
        
        toast.success(`✅ ${actionText} command sent`, {
          position: 'bottom-right',
          autoClose: 2000
        });
      } catch (error) {
        console.error('Error sending command:', error);
        toast.error('Failed to send command', { position: 'top-right' });
        
        await log(
          'CONTROL_RELAY_ERROR',
          ACTION_CATEGORIES.DEVICE_CONTROL,
          `${title} (${machineName}) - ERROR`,
          {
            widgetId: id,
            widgetTitle: title,
            machineId,
            machineName,
            locationName,
            error: error.message,
            attemptedAction: actionText
          }
        );
      }
    }
  };

  const showAccessBadge = advancedSettings.accessControl?.enabled && !hasAccess;
  const showAdminOverride = advancedSettings.accessControl?.enabled && isAdminOverride;

  return (
    <BaseWidget 
      id={id} 
      title={title} 
      icon={ToggleLeft} 
      lastUpdated={lastUpdated} 
      onEdit={onEdit} 
      onCustomize={onCustomize}
    >
      <div className="flex flex-col items-center justify-center py-6">
        
        {showAccessBadge && (
          <div className="mb-3 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center gap-1.5 border border-orange-200 dark:border-orange-900/30">
            <Lock size={12} className="text-orange-600 dark:text-orange-400" />
            <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
              Restricted Access
            </span>
          </div>
        )}

        {showAdminOverride && (
          <div className="mb-3 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-900/30">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              🔓 Admin Override
            </span>
          </div>
        )}

        <button
          onClick={toggle}
          disabled={!hasAccess}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border-4 relative ${
            isOn 
              ? 'bg-emerald-500 border-emerald-100 dark:border-emerald-900 text-white shadow-emerald-200 dark:shadow-emerald-900/50' 
              : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-300 dark:text-slate-600'
          } ${!hasAccess ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
        >
          <Power size={36} />
          
          {!hasAccess && (
            <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1.5 rounded-full shadow-lg">
              <Lock size={14} />
            </div>
          )}
        </button>

        <span className={`mt-3 text-sm font-bold tracking-wide ${
          isOn ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-300 dark:text-slate-600'
        }`}>
          {isOn ? 'ON' : 'OFF'}
        </span>
        
        {advancedSettings?.stateTracking?.enabled && advancedSettings?.stateTracking?.showLastChanged && lastUpdated && (
          <span className="text-[10px] text-slate-400 mt-1">Changed: {lastUpdated}</span>
        )}

        {!hasAccess && accessMessage && (
          <p className="mt-3 text-xs text-orange-600 dark:text-orange-400 text-center max-w-[220px] font-medium px-2">
            🔒 {accessMessage}
          </p>
        )}
      </div>
    </BaseWidget>
  );
};

export default SwitchWidget;