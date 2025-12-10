import paho.mqtt.client as mqtt
import time
import random
import json

BROKER = "127.0.0.1"
PORT = 1883
TOPIC_DATA = "laboratorio/temperatura"
TOPIC_CMD = "laboratorio/comandos"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"--- SISTEMA ONLINE (Código: {rc}) ---")
        client.subscribe(TOPIC_CMD)
        print(f"Escuchando órdenes en: {TOPIC_CMD}")
    else:
        print(f"FALLO DE CONEXION (Código: {rc})")

def on_message(client, userdata, msg):
    try:
        orden = msg.payload.decode()
        print(f"\n🔔 ORDEN RECIBIDA: {orden}")
        
        if "ENCENDER" in orden:
            print(">>> ACTIVANDO SISTEMA DE REFRIGERACIÓN <<<")
        elif "APAGAR" in orden:
            print(">>> APAGANDO SISTEMA <<<")
            
    except Exception as e:
        print(f"Error procesando orden: {e}")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, "Python_Planta_Principal")
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    print("Sistema corriendo. Esperando órdenes o enviando datos...")
    
    while True:
        payload = {
            "temp": round(random.uniform(20.0, 35.0), 1),
            "hum": random.randint(40, 80)
        }
        client.publish(TOPIC_DATA, json.dumps(payload))
        
        time.sleep(2)

except KeyboardInterrupt:
    client.loop_stop()
    client.disconnect()