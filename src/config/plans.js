// src/config/plans.js

export const PLANS = {
    free: {
      id: 'free',
      name: 'Free Tier',
      displayName: 'Starter',
      price: 0,
      currency: 'USD',
      interval: 'month',
      description: 'Perfect for testing and small deployments',
      
      limits: {
        // Locations & Equipment
        maxLocations: 1,
        maxWidgetsPerLocation: 10,
        maxWidgetsTotal: 10,
        maxDevicesPerLocation: 5,
        
        // Users
        maxUsers: 3,
        
        // MQTT & Communication
        maxMqttMessagesPerDay: 1000,
        maxMqttTopicsSubscribed: 5,
        
        // Dashboards
        maxDashboards: 1,
        maxWidgetTypes: 2, // solo metric cards y gauges
        
        // Data Storage (LO MÁS CARO)
        dataRetentionDays: 7,           // Solo 1 semana de históricos
        maxHistoricalDataPoints: 10000,  // ~10K puntos de datos guardados
        aggregationInterval: 'hourly',   // Solo promedios por hora
        
        // Features
        features: {
          customBranding: false,
          advancedAnalytics: false,
          dataExport: false,
          apiAccess: false,
          prioritySupport: false,
          mqttAuditor: false,
          multipleLocations: false,
          customWidgets: false,
          sla: null
        }
      }
    },
    
    professional: {
      id: 'professional',
      name: 'Professional',
      displayName: 'Pro',
      price: 99,
      currency: 'USD',
      interval: 'month',
      description: 'For growing operations with multiple sites',
      
      limits: {
        // Locations & Equipment
        maxLocations: 10,
        maxWidgetsPerLocation: 100,
        maxWidgetsTotal: 500,
        maxDevicesPerLocation: 50,
        
        // Users
        maxUsers: 25,
        
        // MQTT & Communication
        maxMqttMessagesPerDay: 100000,
        maxMqttTopicsSubscribed: 100,
        
        // Dashboards
        maxDashboards: 20,
        maxWidgetTypes: 999, // todos los tipos
        
        // Data Storage
        dataRetentionDays: 90,           // 3 meses de históricos
        maxHistoricalDataPoints: 1000000, // ~1M puntos
        aggregationInterval: 'minute',    // Datos por minuto
        
        // Features
        features: {
          customBranding: true,
          advancedAnalytics: true,
          dataExport: true,
          apiAccess: true,
          prioritySupport: false,
          mqttAuditor: true,
          multipleLocations: true,
          customWidgets: true,
          sla: "99%"
        }
      }
    },
    
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      displayName: 'Enterprise',
      price: 499,
      currency: 'USD',
      interval: 'month',
      description: 'Unlimited scale for industrial operations',
      
      limits: {
        // Locations & Equipment
        maxLocations: 999,
        maxWidgetsPerLocation: 999,
        maxWidgetsTotal: 9999,
        maxDevicesPerLocation: 999,
        
        // Users
        maxUsers: 999,
        
        // MQTT & Communication
        maxMqttMessagesPerDay: 10000000,
        maxMqttTopicsSubscribed: 999,
        
        // Dashboards
        maxDashboards: 999,
        maxWidgetTypes: 999,
        
        // Data Storage (PREMIUM - LO MÁS CARO)
        dataRetentionDays: 730,            // 2 años de históricos
        maxHistoricalDataPoints: 100000000, // ~100M puntos
        aggregationInterval: 'second',      // Datos en tiempo real (1 seg)
        enableRawDataStorage: true,         // Guardar payloads crudos
        
        // Features
        features: {
          customBranding: true,
          advancedAnalytics: true,
          dataExport: true,
          apiAccess: true,
          prioritySupport: true,
          mqttAuditor: true,
          multipleLocations: true,
          customWidgets: true,
          dedicatedSupport: true,
          customIntegrations: true,
          onPremiseDeployment: true,
          sla: "99.9%"
        }
      }
    }
  };
  
  // Helper para obtener plan
  export const getPlanById = (planId) => {
    return PLANS[planId] || PLANS.free;
  };
  
  // Helper para verificar si puede hacer algo
  export const canPerformAction = (tenant, action) => {
    const plan = getPlanById(tenant.subscription?.plan || 'free');
    const usage = tenant.usage || {};
    
    switch(action) {
      case 'CREATE_LOCATION':
        return usage.locations < plan.limits.maxLocations;
      
      case 'CREATE_WIDGET':
        return usage.widgetsTotal < plan.limits.maxWidgetsTotal;
      
      case 'INVITE_USER':
        return usage.users < plan.limits.maxUsers;
      
      case 'USE_MQTT_AUDITOR':
        return plan.limits.features.mqttAuditor;
      
      case 'EXPORT_DATA':
        return plan.limits.features.dataExport;
      
      default:
        return true;
    }
  };