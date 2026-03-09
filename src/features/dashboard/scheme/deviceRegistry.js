import { Zap, Box, Droplets, Factory, Shield, Cpu, Radio, Gauge, Thermometer, Wind, Flame, Activity, Power, Settings, Waves, GitBranch, Plug } from 'lucide-react';

export const DEVICE_REGISTRY = {
  generic:     { label: 'Genérico',      icon: Cpu,         color: '#64748b', ring: '#475569' },
  substation:  { label: 'Subestación',   icon: Zap,         color: '#f59e0b', ring: '#d97706' },
  recloser:    { label: 'Reconectador',  icon: Shield,      color: '#3b82f6', ring: '#2563eb' },
  transformer: { label: 'Transformador', icon: Box,         color: '#8b5cf6', ring: '#7c3aed' },
  motor:       { label: 'Motor',         icon: Droplets,    color: '#10b981', ring: '#059669' },
  load:        { label: 'Carga',         icon: Factory,     color: '#6366f1', ring: '#4f46e5' },
  sensor:      { label: 'Sensor',        icon: Radio,       color: '#06b6d4', ring: '#0891b2' },
  meter:       { label: 'Medidor',       icon: Gauge,       color: '#ec4899', ring: '#db2777' },
  thermostat:  { label: 'Termostato',    icon: Thermometer, color: '#ef4444', ring: '#dc2626' },
  fan:         { label: 'Ventilador',    icon: Wind,        color: '#14b8a6', ring: '#0d9488' },
  boiler:      { label: 'Caldera',       icon: Flame,       color: '#f97316', ring: '#ea580c' },
  analyzer:    { label: 'Analizador',    icon: Activity,    color: '#a855f7', ring: '#9333ea' },
  breaker:     { label: 'Disyuntor',     icon: Power,       color: '#f43f5e', ring: '#e11d48' },
  plc:         { label: 'PLC',           icon: Settings,    color: '#0ea5e9', ring: '#0284c7' },
  pump:        { label: 'Bomba',         icon: Waves,       color: '#22d3ee', ring: '#06b6d4' },
  valve:       { label: 'Válvula',       icon: GitBranch,   color: '#84cc16', ring: '#65a30d' },
  socket:      { label: 'Tomacorriente', icon: Plug,        color: '#fb923c', ring: '#f97316' },
};

export const getDeviceConfig = (deviceType) =>
  DEVICE_REGISTRY[deviceType] || DEVICE_REGISTRY.generic;