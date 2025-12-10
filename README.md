# IoT Industrial Dashboard

Un sistema de monitoreo y control SCADA basado en web, diseñado para visualizar telemetría industrial en tiempo real y gestionar activos mediante el protocolo MQTT.

Este proyecto implementa una arquitectura **Serverless-Dashboard**, donde la persistencia de la configuración vive en el cliente (navegador) y la comunicación es directa entre el Frontend y el Broker MQTT vía WebSockets, eliminando la latencia de APIs intermedias.

## 🚀 Funcionalidades Principales

### 1. Visualización y Control en Tiempo Real

- **Conectividad MQTT nativa**: Comunicación directa mediante WebSockets (`ws://`) para actualizaciones instantáneas.

- **Widgets Dinámicos**:
  - **Medidores (Gauges)**: Visualización de variables analógicas con rangos (Min/Max) configurables.
  - **Gráficos Históricos (Charts)**: Curvas de tendencia en tiempo real con buffer local, escalas automáticas o fijas, y soporte para ancho completo.
  - **Métricas (KPIs)**: Indicadores numéricos de alto impacto con iconografía contextual y códigos de color.
  - **Interruptores (Switches)**: Control bidireccional para enviar comandos (ON/OFF) a actuadores remotos.

### 2. Interfaz Altamente Personalizable

- **Sistema Drag & Drop**: Organización fluida de widgets mediante arrastrar y soltar (impulsado por `@dnd-kit`).
- **Layout Responsivo**: Grilla inteligente que adapta widgets de ancho completo o media columna según el dispositivo.
- **Gestión Multi-Sector**: Organización por pestañas (Tabs) para monitorear múltiples máquinas o sectores de planta independientemente.
- **Modo Edición**: Interfaz segura donde las herramientas de modificación (borrar, mover, agregar) solo están disponibles bajo demanda.

### 3. Portabilidad y Persistencia

- **Sin Base de Datos**: La configuración del tablero (widgets, máquinas, tópicos) se persiste automáticamente en LocalStorage.
- **Sistema de Perfiles JSON**: Capacidad de **Exportar e Importar** la configuración completa del sistema para realizar backups, clonar entornos o distribuir configuraciones estandarizadas a operarios.

## 🛠 Stack Tecnológico

### Frontend

- **Core**: React 18 + Vite
- **Estilos**: Tailwind CSS (Diseño "Mobile-First" y utilitario)
- **Gráficos**: Recharts (Visualización de datos vectoriales)
- **Iconografía**: Lucide React
- **Drag & Drop**: @dnd-kit/core & @dnd-kit/sortable
- **Comunicación**: Librería mqtt (MQTT.js) sobre WebSockets

### Backend (Simulación)

- **Python**: Script de simulación de física industrial (inercias, ruido eléctrico, curvas de calentamiento)
- **Paho-MQTT**: Cliente MQTT para la publicación de telemetría simulada

## ⚙️ Arquitectura del Sistema

El flujo de datos sigue el patrón **Pub/Sub**:

1. **Dispositivos** (Simulados en Python): Publican payloads JSON en tópicos como `planta/sector/telemetria` via TCP (Puerto 1883).
2. **Broker MQTT** (Mosquitto): Gestiona los mensajes y actúa como puente entre el protocolo TCP y WebSockets.
3. **Cliente Web** (React): Se suscribe a los tópicos configurados via WebSockets (Puerto 9001), parsea el JSON y renderiza la UI reactivamente.

## 📦 Instalación y Despliegue

### Prerrequisitos

- Node.js (v16 o superior)
- Python (3.x)
- Broker MQTT (Mosquitto recomendado) configurado con WebSockets habilitado

### 1. Configuración del Broker (Mosquitto)

Asegúrate de que tu archivo `mosquitto.conf` permita WebSockets y conexiones anónimas (para entornos de desarrollo local):
```conf
# Puerto estándar para dispositivos
listener 1883
allow_anonymous true

# Puerto WebSockets para el Dashboard
listener 9001
protocol websockets
allow_anonymous true
```

### 2. Iniciar el Frontend
```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev
```

### 3. Iniciar el Simulador de Planta
```bash
# Instalar cliente MQTT para Python
pip install paho-mqtt

# Ejecutar simulación completa
python bombeo_full.py
```

## 🔧 Uso del Dashboard

1. **Modo Edición**: Activa el botón "Editar" en la barra superior (icono de lápiz) para habilitar los controles de diseño.

2. **Agregar Máquina**: Crea nuevas pestañas para diferentes zonas usando el botón `+` en la barra de pestañas.

3. **Agregar Widget**: Selecciona entre Gauge, Switch, Chart o Métrica.
   - Define el **Topic MQTT** de lectura (ej: `bombeo/telemetria`)
   - Define la **JSON Key** (la variable dentro del payload, ej: `temp`, `amperes`)
   - Personaliza colores, dimensiones y escalas

4. **Guardar/Cargar**: Usa el menú de configuración (icono de engranaje) para exportar tu tablero a un archivo `.json` y compartirlo.

## 📄 Licencia

Este proyecto es de código abierto y está disponible para uso educativo y de desarrollo.
