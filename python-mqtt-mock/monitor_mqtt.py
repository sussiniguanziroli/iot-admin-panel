import paho.mqtt.client as mqtt
import time

# --- CREDENCIALES HIVEMQ CLOUD (Pon las tuyas) ---
BROKER = "d117b2b403d34e1cbc27488bb7782e37"
PORT = 8883
USER = "tu_usuario"
PASS = "tu_password"

# Tópicos a espiar (El # es un comodín para ver TODO bajo solfrut)
TOPIC_ROOT = "solfrut/#"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✅ Conectado al Broker. Espiando: {TOPIC_ROOT}")
        client.subscribe(TOPIC_ROOT)
    else:
        print(f"❌ Error de conexión: {rc}")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"\n📩 Tópico: {msg.topic}")
    print(f"   Contenido: '{payload}'")
    
    # Análisis rápido
    if payload.startswith("{") and payload.endswith("}"):
        print("   Formato: JSON Detectado ✅")
    else:
        print("   Formato: TEXTO PLANO Detectado ⚠️ (React necesitará ajustes)")

client = mqtt.Client("Python_Spy_Monitor")
client.username_pw_set(USER, PASS)
client.tls_set() # Importante para HiveMQ Cloud

try:
    print("Iniciando monitor...")
    client.connect(BROKER, PORT, 60)
    client.loop_forever()
except KeyboardInterrupt:
    print("\nMonitor detenido.")
except Exception as e:
    print(f"\nError crítico: {e}")