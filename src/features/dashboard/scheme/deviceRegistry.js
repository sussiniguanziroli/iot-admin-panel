import {
    Zap, Box, Droplets, Factory, Shield, Cpu, Radio, Gauge,
    Activity, Power, Settings, Waves, GitBranch, Plug, Battery,
    ZapOff, Minus, AlertTriangle, Circle, RefreshCw, Scissors,
    Wind, Thermometer, Flame,
  } from 'lucide-react';
  
  // ── Categorías ────────────────────────────────────────────────────────────────
  export const DEVICE_CATEGORIES = {
    distribution: { label: 'Distribución', order: 0 },
    protection:   { label: 'Protección',   order: 1 },
    measurement:  { label: 'Medición',     order: 2 },
    power:        { label: 'Potencia',     order: 3 },
    load:         { label: 'Cargas',       order: 4 },
  };
  
  // ── Registro completo ─────────────────────────────────────────────────────────
  export const DEVICE_REGISTRY = {
  
    // ── Distribución ──────────────────────────────────────────────────────────
    busbar: {
      label: 'Barra',           icon: Minus,         color: '#94a3b8', ring: '#64748b',
      category: 'distribution', interactive: false,  nodeType: 'busbarNode',
      description: 'Barra colectora de distribución',
    },
    substation: {
      label: 'Subestación',     icon: Zap,           color: '#94a3b8', ring: '#64748b',
      category: 'distribution', interactive: true,
      description: 'Subestación de transformación',
    },
    generic: {
      label: 'Genérico',        icon: Cpu,           color: '#64748b', ring: '#475569',
      category: 'distribution', interactive: true,
      description: 'Elemento genérico',
    },
  
    // ── Protección ────────────────────────────────────────────────────────────
    recloser: {
      label: 'Reconectador',    icon: Shield,        color: '#94a3b8', ring: '#64748b',
      category: 'protection',   interactive: true,
      description: 'Reconectador automático de línea',
    },
    breaker: {
      label: 'Disyuntor',       icon: Power,         color: '#94a3b8', ring: '#64748b',
      category: 'protection',   interactive: true,
      description: 'Interruptor automático de potencia',
    },
    disconnector: {
      label: 'Seccionador',     icon: Scissors,      color: '#64748b', ring: '#475569',
      category: 'protection',   interactive: false,
      description: 'Seccionador de aislamiento (NAP) — abierto',
    },
    disconnector_closed: {
      label: 'Secc. cerrado',   icon: Scissors,      color: '#64748b', ring: '#475569',
      category: 'protection',   interactive: false,
      description: 'Seccionador de aislamiento — cerrado',
    },
    fuse: {
      label: 'Fusible',         icon: ZapOff,        color: '#64748b', ring: '#475569',
      category: 'protection',   interactive: false,
      description: 'Seccionador con fusible — cerrado',
    },
    fuse_open: {
      label: 'Fusible abierto', icon: ZapOff,        color: '#64748b', ring: '#475569',
      category: 'protection',   interactive: false,
      description: 'Seccionador con fusible — abierto',
    },
    horn_disconnector: {
      label: 'Sec. cuernos',    icon: Scissors,      color: '#64748b', ring: '#475569',
      category: 'protection',   interactive: false,
      description: 'Seccionador a cuernos 33kV',
    },
    arrester: {
      label: 'Pararrayos',      icon: AlertTriangle, color: '#64748b', ring: '#475569',
      category: 'protection',   interactive: false,
      description: 'Descargador de sobretensión',
    },
  
    // ── Medición ──────────────────────────────────────────────────────────────
    energy_meter: {
      label: 'Medidor EM',      icon: Gauge,         color: '#94a3b8', ring: '#64748b',
      category: 'measurement',  interactive: true,
      description: 'Medidor de energía (kWh / kVAr)',
    },
    current_transformer: {
      label: 'TC',              icon: Circle,        color: '#64748b', ring: '#475569',
      category: 'measurement',  interactive: false,
      description: 'Transformador de corriente (TC / TA)',
    },
    voltage_transformer: {
      label: 'TT',              icon: Circle,        color: '#64748b', ring: '#475569',
      category: 'measurement',  interactive: false,
      description: 'Transformador de tensión (TT / TP)',
    },
    analyzer: {
      label: 'Analizador',      icon: Activity,      color: '#94a3b8', ring: '#64748b',
      category: 'measurement',  interactive: true,
      description: 'Analizador de redes / calidad de energía',
    },
    plc: {
      label: 'PLC',             icon: Settings,      color: '#94a3b8', ring: '#64748b',
      category: 'measurement',  interactive: true,
      description: 'Controlador lógico programable',
    },
    sensor: {
      label: 'Sensor',          icon: Radio,         color: '#64748b', ring: '#475569',
      category: 'measurement',  interactive: true,
      description: 'Sensor de campo',
    },
  
    // ── Potencia ──────────────────────────────────────────────────────────────
    transformer: {
      label: 'Transformador',   icon: Box,           color: '#94a3b8', ring: '#64748b',
      category: 'power',        interactive: true,
      description: 'Transformador de potencia trifásico Δ–Y',
    },
    generator: {
      label: 'Generador',       icon: RefreshCw,     color: '#94a3b8', ring: '#64748b',
      category: 'power',        interactive: true,
      description: 'Generador / Alternador',
    },
    capacitor: {
      label: 'Capacitor',       icon: Battery,       color: '#64748b', ring: '#475569',
      category: 'power',        interactive: false,
      description: 'Banco de capacitores / Compensación reactiva',
    },
    soft_starter: {
      label: 'Arranc. suave',   icon: Zap,           color: '#94a3b8', ring: '#64748b',
      category: 'power',        interactive: true,
      description: 'Arrancador suave (Soft Starter)',
    },
    freq_converter: {
      label: 'Conv. frec.',     icon: RefreshCw,     color: '#94a3b8', ring: '#64748b',
      category: 'power',        interactive: true,
      description: 'Convertidor de frecuencias / VFD',
    },
  
    // ── Cargas ────────────────────────────────────────────────────────────────
    motor: {
      label: 'Motor',           icon: Droplets,      color: '#94a3b8', ring: '#64748b',
      category: 'load',         interactive: true,
      description: 'Motor eléctrico trifásico',
    },
    pump: {
      label: 'Bomba',           icon: Waves,         color: '#94a3b8', ring: '#64748b',
      category: 'load',         interactive: true,
      description: 'Bomba / Motor de bomba',
    },
    load: {
      label: 'Carga',           icon: Factory,       color: '#64748b', ring: '#475569',
      category: 'load',         interactive: true,
      description: 'Carga genérica',
    },
    fan: {
      label: 'Ventilador',      icon: Wind,          color: '#64748b', ring: '#475569',
      category: 'load',         interactive: true,
      description: 'Ventilador / Extractor',
    },
    thermostat: {
      label: 'Termostato',      icon: Thermometer,   color: '#64748b', ring: '#475569',
      category: 'load',         interactive: true,
      description: 'Termostato / Control de temperatura',
    },
    boiler: {
      label: 'Caldera',         icon: Flame,         color: '#64748b', ring: '#475569',
      category: 'load',         interactive: true,
      description: 'Caldera / Resistencia',
    },
    valve: {
      label: 'Válvula',         icon: GitBranch,     color: '#64748b', ring: '#475569',
      category: 'load',         interactive: true,
      description: 'Válvula motorizada',
    },
    socket: {
      label: 'Tomacorriente',   icon: Plug,          color: '#64748b', ring: '#475569',
      category: 'load',         interactive: true,
      description: 'Tomacorriente / Punto de carga',
    },
  };
  
  // ── Helpers ───────────────────────────────────────────────────────────────────
  
  export const getDeviceConfig = (deviceType) =>
    DEVICE_REGISTRY[deviceType] ?? DEVICE_REGISTRY.generic;
  
  // Retorna { [categoryKey]: [{ key, ...config }] } ordenado por category.order
  export const getDevicesByCategory = () => {
    const result = {};
    Object.entries(DEVICE_REGISTRY).forEach(([key, val]) => {
      const cat = val.category ?? 'distribution';
      if (!result[cat]) result[cat] = [];
      result[cat].push({ key, ...val });
    });
    return result;
  };