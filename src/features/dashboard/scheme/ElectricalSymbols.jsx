import React from 'react';

// Fondo oscuro interno (coincide con el bg del SchemNode)
const BG = '#07101e';
// Stroke estándar CAD
const SW = 2.25;
// Atributos comunes estilo plotter (sin caps redondeadas)
const CAD = { strokeLinecap: 'square', strokeLinejoin: 'miter' };

// ─── Barra Colectora ──────────────────────────────────────────────────────────
export const BusbarSymbol = ({ color }) => (
  <svg viewBox="0 0 280 16" style={{ display: 'block', width: '100%', height: '100%' }}>
    <rect x="0" y="0" width="280" height="16" fill={color} />
  </svg>
);

// ─── Seccionador / Switch abierto (cuchilla girada 35°) ───────────────────────
export const SwitchOpenSymbol = ({ color }) => (
  <svg viewBox="0 0 60 110" width="48" height="88" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="30" y1="0"   x2="30" y2="32" />
      <circle cx="30" cy="38" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      <line x1="30" y1="72"  x2="30" y2="110" />
      <circle cx="30" cy="72" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      <g transform="rotate(35, 30, 72)">
        <line x1="30" y1="72" x2="30" y2="38" />
      </g>
    </g>
  </svg>
);

// ─── Switch cerrado ────────────────────────────────────────────────────────────
export const SwitchClosedSymbol = ({ color }) => (
  <svg viewBox="0 0 60 110" width="48" height="88" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="30" y1="0"   x2="30" y2="32" />
      <circle cx="30" cy="38" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      <line x1="30" y1="72"  x2="30" y2="110" />
      <circle cx="30" cy="72" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      <line x1="30" y1="44"  x2="30" y2="72" />
    </g>
  </svg>
);

// ─── Seccionador con Fusible cerrado ──────────────────────────────────────────
// (símbolo normalizado IEC: lemniscata / doble bulge sobre eje central)
export const FuseSymbol = ({ color }) => (
  <svg viewBox="0 0 60 150" width="44" height="110" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="30" y1="0"  x2="30" y2="22" />
      <circle cx="30" cy="28" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      {/* Eje central */}
      <line x1="30" y1="34" x2="30" y2="116" />
      {/* Bulge derecho (semicírculo) */}
      <path d="M 30 34 A 22 22 0 0 1 30 75" />
      {/* Bulge izquierdo (semicírculo) */}
      <path d="M 30 75 A 22 22 0 0 0 30 116" />
      <circle cx="30" cy="122" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      <line x1="30" y1="128" x2="30" y2="150" />
    </g>
  </svg>
);

// ─── Seccionador con Fusible abierto ─────────────────────────────────────────
export const FuseOpenSymbol = ({ color }) => (
  <svg viewBox="0 0 80 150" width="56" height="110" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="40" y1="0"  x2="40" y2="22" />
      <circle cx="40" cy="28" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      {/* Fusible girado 35° (abierto) */}
      <g transform="rotate(35, 40, 28)">
        <line x1="40" y1="34" x2="40" y2="116" />
        <path d="M 40 34 A 22 22 0 0 1 40 75" />
        <path d="M 40 75 A 22 22 0 0 0 40 116" />
        <circle cx="40" cy="122" r="6" fill={BG} stroke={color} strokeWidth={SW} />
      </g>
      <line x1="40" y1="122" x2="40" y2="150" />
    </g>
  </svg>
);

// ─── Seccionador a Cuernos (cruce asimétrico) ─────────────────────────────────
export const HornDisconnectorSymbol = ({ color }) => (
    <svg viewBox="0 0 60 100" width="52" height="66" style={{ display: 'block' }}>
      <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
        {/* Conductor superior — centrado en x=30 */}
        <line x1="30" y1="0"  x2="30" y2="100" strokeOpacity="0.0" />
        {/* Ramal izq: baja por el centro y cruza a la derecha abajo */}
        <path d="M 30 0 L 30 38 L 58 62 L 58 72" />
        {/* Ramal der: empieza a la derecha arriba, cruza y baja por el centro */}
        <path d="M 58 28 L 58 38 L 30 62 L 30 100" />
      </g>
    </svg>
  );

// ─── Disyuntor / Breaker (cuadrado con ×) ─────────────────────────────────────
export const BreakerSymbol = ({ color }) => (
  <svg viewBox="0 0 56 80" width="48" height="68" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="28" y1="0"  x2="28" y2="16" />
      <rect x="8" y="16" width="40" height="40" fill={BG} />
      <line x1="12" y1="20" x2="44" y2="52" />
      <line x1="44" y1="20" x2="12" y2="52" />
      <line x1="28" y1="56" x2="28" y2="80" />
    </g>
  </svg>
);

// ─── Reconectador automático (círculo + R estilo plotter CAD) ─────────────────
export const RecloserSymbol = ({ color }) => (
  <svg viewBox="0 0 100 130" width="80" height="104" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="50" y1="0"  x2="50" y2="20" />
      <circle cx="50" cy="65" r="42" fill={BG} />
      <line x1="50" y1="107" x2="50" y2="130" />
      {/* R estilo plotter: tallo + bucle + pierna diagonal */}
      <line x1="38" y1="46" x2="38" y2="82" />
      <path d="M 38 46 L 52 46 L 58 51 L 58 59 L 52 64 L 38 64" />
      <line x1="48" y1="64" x2="60" y2="82" />
    </g>
  </svg>
);

// ─── Transformador Trifásico Δ–Y (delta primario, estrella secundario) ─────────
export const TransformerSymbol = ({ color }) => (
    <svg viewBox="0 0 120 240" width="72" height="108" style={{ display: 'block' }}>
      <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
  
        {/* Conductor entrada (primario) */}
        <path d="M 60 10 L 60 45" />
  
        {/* Círculo superior */}
        <circle cx="60" cy="80" r="35" />
  
        {/* Círculo inferior — intersecta al superior */}
        <circle cx="60" cy="130" r="35" />
  
        {/* Delta (primario) */}
        <path d="M 60 68 L 73 90 L 47 90 Z" />
  
        {/* Estrella (secundario) */}
        <path d="M 60 130 L 60 115" />
        <path d="M 60 130 L 73 143" />
        <path d="M 60 130 L 47 143" />
  
        {/* Conductor salida */}
        <path d="M 60 165 L 60 220" />

        
        
      {/* Ramal neutro → tierra */}
      <path d="M 60 130 L 120 130 L 120 170" />

      {/* Tierra escalonada */}
      <path d="M 100 170 L 140 170" />
      <path d="M 106 178 L 134 178" />
      <path d="M 112 186 L 128 186" />
      <path d="M 118 194 L 122 194" />
    </g>
    </svg>
  );
// ─── Transformador de Corriente (TC) ─────────────────────────────────────────
// Círculo alrededor de la línea principal con curva de acople
export const CurrentTransformerSymbol = ({ color }) => (
  <svg viewBox="0 0 60 60" width="52" height="52" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      {/* Línea pasante (atenuada) */}
      <line x1="30" y1="0" x2="30" y2="60"
        strokeOpacity="0.35" strokeDasharray="3 3" />
      <circle cx="30" cy="30" r="24" fill={BG} />
      {/* Curva de acople (abrazadera izquierda) */}
      <path d="M 30 6 A 30 30 0 0 0 30 54" />
    </g>
    <text x="30" y="34" textAnchor="middle" dominantBaseline="middle"
      style={{ fontSize: 12, fontWeight: 800, fill: color, fontFamily: 'monospace' }}>
      TC
    </text>
  </svg>
);

// ─── Transformador de Tensión (TT) ────────────────────────────────────────────
export const VoltageTransformerSymbol = ({ color }) => (
  <svg viewBox="0 0 60 110" width="48" height="88" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="30" y1="0"  x2="30" y2="18" />
      <circle cx="30" cy="34" r="16" fill={BG} />
      <circle cx="30" cy="66" r="16" fill={BG} />
      {/* Tierra escalonada */}
      <line x1="30" y1="82" x2="30" y2="88" />
      <line x1="14" y1="88" x2="46" y2="88" />
      <line x1="18" y1="95" x2="42" y2="95" />
      <line x1="22" y1="102" x2="38" y2="102" />
    </g>
    <text x="30" y="34" textAnchor="middle" dominantBaseline="middle"
      style={{ fontSize: 10, fontWeight: 800, fill: color, fontFamily: 'monospace' }}>
      TV
    </text>
    <text x="30" y="66" textAnchor="middle" dominantBaseline="middle"
      style={{ fontSize: 10, fontWeight: 800, fill: color, fontFamily: 'monospace' }}>
      TI
    </text>
  </svg>
);

// ─── Capacitor (placas rect — simbología CAD exacta) ──────────────────────────
export const CapacitorSymbol = ({ color }) => (
  <svg viewBox="0 0 60 100" width="48" height="80" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="30" y1="0"  x2="30" y2="44" />
      <line x1="30" y1="56" x2="30" y2="100" />
    </g>
    {/* Placas sólidas */}
    <rect x="8"  y="44" width="44" height="6"  fill={color} />
    <rect x="8"  y="50" width="44" height="6"  fill={color} />
  </svg>
);

// ─── Descargador de Sobretensión / Pararrayos ─────────────────────────────────
// Adaptado a vertical: electrodos enfrentados dentro del cuerpo
export const ArresterSymbol = ({ color }) => (
  <svg viewBox="0 0 60 130" width="48" height="104" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="30" y1="0"  x2="30" y2="26" />
      <rect x="8"  y="26" width="44" height="52" fill={BG} />
      <line x1="30" y1="78"  x2="30" y2="92" />
      {/* Tierra escalonada */}
      <line x1="12" y1="92"  x2="48" y2="92" />
      <line x1="17" y1="100" x2="43" y2="100" />
      <line x1="22" y1="108" x2="38" y2="108" />
    </g>
    {/* Electrodos enfrentados (flecha arriba + flecha abajo) */}
    <g fill={color}>
      <polygon points="30,36 18,54 42,54" />
      <polygon points="30,68 18,50 42,50" />
    </g>
  </svg>
);

// ─── Equipo de Medición / Medidor (cúpula + M) ───────────────────────────────
export const EnergyMeterSymbol = ({ color }) => (
    <svg viewBox="0 0 70 70" width="60" height="60" style={{ display: 'block' }}>
      <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
        <path d="M 14 60 L 14 38 A 21 21 0 0 1 56 38 L 56 60 Z" fill={BG} />
      </g>
      <text x="35" y="54" textAnchor="middle" dominantBaseline="auto"
        style={{ fontSize: 26, fontWeight: 700, fill: color, fontFamily: 'sans-serif' }}>
        M
      </text>
    </svg>
  );

// ─── Motor Trifásico (M 3~) ────────────────────────────────────────────────────
export const MotorSymbol = ({ color }) => (
  <svg viewBox="0 0 80 80" width="68" height="68" style={{ display: 'block' }}>
    <circle cx="40" cy="40" r="36" fill={BG}
      stroke={color} strokeWidth={SW} />
    <text x="40" y="36" textAnchor="middle" dominantBaseline="middle"
      style={{ fontSize: 22, fontWeight: 700, fill: color, fontFamily: 'sans-serif' }}>
      M
    </text>
    <text x="26" y="57" textAnchor="middle" dominantBaseline="middle"
      style={{ fontSize: 14, fontWeight: 700, fill: color, fontFamily: 'sans-serif' }}>
      3
    </text>
    <path d="M 33 58 Q 36 53 39 58 T 45 58"
      stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
  </svg>
);

// ─── Generador / Alternador (G ~) ─────────────────────────────────────────────
export const GeneratorSymbol = ({ color }) => (
  <svg viewBox="0 0 80 80" width="68" height="68" style={{ display: 'block' }}>
    <circle cx="40" cy="40" r="36" fill={BG}
      stroke={color} strokeWidth={SW} />
    <text x="40" y="36" textAnchor="middle" dominantBaseline="middle"
      style={{ fontSize: 22, fontWeight: 700, fill: color, fontFamily: 'sans-serif' }}>
      G
    </text>
    <path d="M 24 57 Q 28 52 32 57 Q 36 62 40 57 Q 44 52 48 57 Q 52 62 56 57"
      stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
  </svg>
);

// ─── Arrancador Suave / Soft Starter ─────────────────────────────────────────
// Gabinete con dos tiristores SCR antiparalelo (back-to-back)
export const SoftStarterSymbol = ({ color }) => (
  <svg viewBox="0 0 80 100" width="68" height="85" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      {/* Gabinete */}
      <rect x="10" y="20" width="60" height="60" fill={BG} />
      {/* Conductores sup/inf */}
      <line x1="40" y1="0"  x2="40" y2="30" />
      <line x1="40" y1="70" x2="40" y2="100" />
      {/* Ramales horizontales internos */}
      <line x1="22" y1="30" x2="58" y2="30" />
      <line x1="22" y1="70" x2="58" y2="70" />

      {/* Tiristor izquierdo (apunta hacia abajo) */}
      <line x1="22" y1="30" x2="22" y2="39" />
      <polygon points="18,39 26,39 22,51" fill={BG} stroke={color} strokeWidth={SW}
        strokeLinejoin="miter" />
      <line x1="18" y1="51" x2="26" y2="51" />
      <line x1="14" y1="45" x2="22" y2="45" />  {/* Gate */}
      <line x1="22" y1="51" x2="22" y2="70" />

      {/* Tiristor derecho (apunta hacia arriba) */}
      <line x1="58" y1="70" x2="58" y2="61" />
      <polygon points="54,61 62,61 58,49" fill={BG} stroke={color} strokeWidth={SW}
        strokeLinejoin="miter" />
      <line x1="54" y1="49" x2="62" y2="49" />
      <line x1="58" y1="55" x2="66" y2="55" />  {/* Gate */}
      <line x1="58" y1="49" x2="58" y2="30" />
    </g>
    {/* Nodos de empalme internos */}
    <circle cx="40" cy="30" r="3.5" fill={color} />
    <circle cx="40" cy="70" r="3.5" fill={color} />
  </svg>
);

// ─── Convertidor de Frecuencias / VFD ────────────────────────────────────────
// Cuadrado con bisectriz diagonal y símbolo CA en cada mitad
export const FreqConverterSymbol = ({ color }) => (
  <svg viewBox="0 0 80 100" width="68" height="85" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="40" y1="0"  x2="40" y2="20" />
      <rect x="10" y="20" width="60" height="60" fill={BG} />
      {/* Bisectriz diagonal (de inf-izq a sup-der) */}
      <line x1="10" y1="80" x2="70" y2="20" />
      <line x1="40" y1="80" x2="40" y2="100" />
    </g>
    {/* CA triángulo superior izquierdo */}
    <path d="M 18 50 Q 21 45 24 50 T 30 50"
      stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    {/* CA triángulo inferior derecho */}
    <path d="M 50 70 Q 53 65 56 70 T 62 70"
      stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
  </svg>
);

// ─── Carga Genérica (triángulo + tierra) ──────────────────────────────────────
export const LoadSymbol = ({ color }) => (
  <svg viewBox="0 0 60 90" width="52" height="78" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <line x1="30" y1="0"  x2="30" y2="14" />
      <polygon points="30,14 6,56 54,56" fill={BG} stroke={color} strokeWidth={SW} />
      <line x1="6"  y1="60" x2="54" y2="60" strokeWidth={3.5} />
      <line x1="12" y1="68" x2="48" y2="68" />
    </g>
  </svg>
);

// ─── Subestación ──────────────────────────────────────────────────────────────
export const SubstationSymbol = ({ color }) => (
  <svg viewBox="0 0 80 80" width="68" height="68" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <rect x="4" y="4" width="72" height="72" fill={BG} />
      <circle cx="26" cy="40" r="17" />
      <circle cx="54" cy="40" r="17" />
      <line x1="40" y1="6" x2="40" y2="74"
        strokeOpacity="0.28" strokeDasharray="4 3" />
    </g>
  </svg>
);

// ─── Analizador de Redes ──────────────────────────────────────────────────────
export const AnalyzerSymbol = ({ color }) => (
  <svg viewBox="0 0 80 60" width="72" height="54" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <rect x="4" y="4" width="72" height="52" fill={BG} />
      <polyline points="10,46 20,30 32,38 44,18 56,26 68,12"
        strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

// ─── PLC ──────────────────────────────────────────────────────────────────────
export const PLCSymbol = ({ color }) => (
  <svg viewBox="0 0 80 60" width="72" height="54" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <rect x="4" y="4" width="72" height="52" fill={BG} />
      {[22, 40, 58].map(x => (
        <React.Fragment key={x}>
          <circle cx={x} cy="22" r="5" />
          <circle cx={x} cy="38" r="5" />
          <line x1={x} y1="17" x2={x} y2="4"  strokeOpacity="0.45" />
          <line x1={x} y1="43" x2={x} y2="56" strokeOpacity="0.45" />
        </React.Fragment>
      ))}
    </g>
  </svg>
);

// ─── Genérico / Sensor ────────────────────────────────────────────────────────
export const GenericSymbol = ({ color }) => (
  <svg viewBox="0 0 60 60" width="52" height="52" style={{ display: 'block' }}>
    <g stroke={color} strokeWidth={SW} fill="none" {...CAD}>
      <rect x="6" y="6" width="48" height="48" fill={BG} />
      <circle cx="30" cy="30" r="13" />
    </g>
  </svg>
);

// ─── MAPA deviceType → componente ─────────────────────────────────────────────
export const SYMBOL_MAP = {
  busbar:               BusbarSymbol,
  fuse:                 FuseSymbol,
  fuse_open:            FuseOpenSymbol,
  disconnector:         SwitchOpenSymbol,
  disconnector_closed:  SwitchClosedSymbol,
  horn_disconnector:    HornDisconnectorSymbol,
  breaker:              BreakerSymbol,
  recloser:             RecloserSymbol,
  transformer:          TransformerSymbol,
  current_transformer:  CurrentTransformerSymbol,
  voltage_transformer:  VoltageTransformerSymbol,
  capacitor:            CapacitorSymbol,
  arrester:             ArresterSymbol,
  energy_meter:         EnergyMeterSymbol,
  meter:                EnergyMeterSymbol,
  motor:                MotorSymbol,
  pump:                 MotorSymbol,
  generator:            GeneratorSymbol,
  load:                 LoadSymbol,
  substation:           SubstationSymbol,
  analyzer:             AnalyzerSymbol,
  plc:                  PLCSymbol,
  sensor:               GenericSymbol,
  generic:              GenericSymbol,
  soft_starter:         SoftStarterSymbol,
  freq_converter:       FreqConverterSymbol,
  fan:                  GenericSymbol,
  valve:                SwitchOpenSymbol,
  socket:               GenericSymbol,
  thermostat:           GenericSymbol,
  boiler:               GenericSymbol,
};

export const getSymbol = (deviceType) =>
  SYMBOL_MAP[deviceType] ?? GenericSymbol;