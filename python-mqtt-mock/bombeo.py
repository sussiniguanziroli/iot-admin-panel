import paho.mqtt.client as mqtt
import time
import random
import json

# --- CONFIGURACIÓN ---
BROKER = "127.0.0.1"
PORT = 1883
TOPIC_TELEMETRIA = "bombeo/santa_isabel/telemetria"
TOPIC_COMANDOS = "bombeo/santa_isabel/comandos"

# Estado interno de la simulación
motor_activo = False
amperes_actuales = 0.0

# Callbacks MQTT
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"--- BOMBA ONLINE (Broker: {BROKER}) ---")
        client.subscribe(TOPIC_COMANDOS)
    else:
        print(f"Error de conexión: {rc}")

def on_message(client, userdata, msg):
    global motor_activo
    try:
        comando = msg.payload.decode().upper()
        print(f"📝 Comando recibido: {comando}")
        
        if "MARCHA" in comando:
            motor_activo = True
            print(">>> INICIANDO SECUENCIA DE ARRANQUE <<<")
        elif "PARADA" in comando:
            motor_activo = False
            print(">>> DETENIENDO MOTOR <<<")
            
    except Exception as e:
        print(f"Error leyendo comando: {e}")

# Configuración del Cliente
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, "Simulador_Bomba_Industrial")
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    print("Simulación iniciada. Esperando comandos...")
    
    while True:
        # --- LÓGICA DE SIMULACIÓN FÍSICA ---
        if motor_activo:
            # Si el motor está activo, buscamos un consumo nominal (ej: 15 Amperes)
            # Agregamos "ruido" eléctrico normal (+- 0.5 A)
            target = 15.0 + random.uniform(-0.3, 0.5)
            
            # Simulamos la inercia (no salta de 0 a 15 instantáneo, sube suave)
            amperes_actuales = amperes_actuales * 0.8 + target * 0.2
        else:
            # Si está apagado, tiende a 0
            amperes_actuales = amperes_actuales * 0.8
            if amperes_actuales < 0.1: amperes_actuales = 0.0

        # Preparamos el paquete de datos
        payload = {
            "estado": "ON" if motor_activo and amperes_actuales > 1 else "OFF",
            "amperes": round(amperes_actuales, 2),
            "voltaje": 220 if motor_activo else 0,
            "timestamp": time.time()
        }
        
        # Publicamos
        client.publish(TOPIC_TELEMETRIA, json.dumps(payload))
        # print(f"Reportando: {payload}") # Descomentar para debug
        
        time.sleep(1) # Reporte cada segundo

except KeyboardInterrupt:
    print("\nSimulación finalizada.")
    client.loop_stop()
    client.disconnect()