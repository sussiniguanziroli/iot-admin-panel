import paho.mqtt.client as mqtt
import time
import random
import json
import math

# --- CONFIGURACIÓN ---
BROKER = "127.0.0.1"
PORT = 1883

# --- TÓPICOS DISPONIBLES PARA TU DASHBOARD ---
# 1. Sector Bomba
TOPIC_BOMBA_DATA = "bombeo/santa_isabel/telemetria"
TOPIC_BOMBA_CMD  = "bombeo/santa_isabel/comandos"

# 2. Sector Planta General (Datos ambientales y servicios)
TOPIC_PLANTA_DATA = "planta/general/telemetria"
TOPIC_LUCES_CMD   = "planta/luces/comandos"

# ESTADO INTERNO (MEMORIA DEL SISTEMA)
bomba_activa = False
luces_activas = False

# Variables físicas simuladas
amperes = 0.0
voltaje = 220.0
temp_motor = 35.0
presion = 0.0
nivel_tanque = 2500 # Litros
tick_counter = 0

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"--- 🏭 SIMULADOR INDUSTRIAL ONLINE (Broker: {BROKER}) ---")
        client.subscribe([(TOPIC_BOMBA_CMD, 0), (TOPIC_LUCES_CMD, 0)])
        print("👂 Escuchando comandos de control...")
    else:
        print(f"Error de conexión: {rc}")

def on_message(client, userdata, msg):
    global bomba_activa, luces_activas
    try:
        topic = msg.topic
        payload = msg.payload.decode().upper()
        print(f"🕹️ COMANDO RECIBIDO en [{topic}]: {payload}")

        if topic == TOPIC_BOMBA_CMD:
            if "MARCHA" in payload: bomba_activa = True
            elif "PARADA" in payload: bomba_activa = False
            
        if topic == TOPIC_LUCES_CMD:
            if "MARCHA" in payload: luces_activas = True # Usamos MARCHA/PARADA para estandarizar
            elif "PARADA" in payload: luces_activas = False
            
    except Exception as e:
        print(f"Error procesando comando: {e}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, "Simulador_Planta_Full")
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    print("\nGenerando datos de telemetría...")
    
    while True:
        tick_counter += 0.1
        
        # 1. SIMULACIÓN FÍSICA BOMBA
        if bomba_activa:
            # Amperaje sube a ~18A con ruido
            target_amp = 18.5 + random.uniform(-0.5, 0.5)
            amperes = amperes * 0.9 + target_amp * 0.1
            # Motor se calienta
            if temp_motor < 95: temp_motor += 0.2
            # Presión sube
            presion = presion * 0.9 + 4.5 * 0.1
            # Tanque se vacía
            nivel_tanque -= 2
        else:
            # Cae a 0
            amperes = amperes * 0.8
            if amperes < 0.1: amperes = 0.0
            # Motor se enfría
            if temp_motor > 25: temp_motor -= 0.1
            # Presión cae
            presion = presion * 0.8
            # Tanque se llena (recuperación)
            nivel_tanque += 1

        # Limites tanque
        if nivel_tanque < 0: nivel_tanque = 0
        if nivel_tanque > 5000: nivel_tanque = 5000

        # Voltaje oscila natural (220V +/- 2V)
        voltaje = 220 + math.sin(tick_counter) * 2 + random.uniform(-1, 1)

        # Variables ambientales (Ondas suaves para gráficos lindos)
        temp_amb = 24 + math.sin(tick_counter * 0.5) * 3
        humedad = 60 + math.cos(tick_counter * 0.5) * 5

        # --- PAQUETE 1: BOMBA ---
        payload_bomba = {
            "estado": "ON" if bomba_activa else "OFF",
            "amperes": round(amperes, 2),
            "voltaje": round(voltaje, 1),
            "temp": round(temp_motor, 1),    # Temperatura Motor
            "presion": round(presion, 2),    # Bares
            "vibracion": round(random.uniform(0, 1.5) if bomba_activa else 0, 2)
        }

        # --- PAQUETE 2: PLANTA GENERAL ---
        payload_planta = {
            "estado": "ON" if luces_activas else "OFF", # Para el switch de luces
            "temp_amb": round(temp_amb, 1),
            "humedad": round(humedad, 0),
            "nivel_tanque": int(nivel_tanque), # Litros
            "consumo_kwh": round((amperes * voltaje)/1000, 2)
        }

        # PUBLICAR
        client.publish(TOPIC_BOMBA_DATA, json.dumps(payload_bomba))
        client.publish(TOPIC_PLANTA_DATA, json.dumps(payload_planta))
        
        time.sleep(1)

except KeyboardInterrupt:
    client.loop_stop()
    client.disconnect()
    print("\n🛑 Simulador detenido.")