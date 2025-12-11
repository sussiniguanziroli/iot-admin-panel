#!/usr/bin/env python3
"""
=============================================================================
SIMULADOR EXEMYS REALISTA - SOLFRUT ESTACIÓN DE BOMBEO
=============================================================================
Simula el comportamiento exacto del PLC Exemys para desarrollo/testing.

CARACTERÍSTICAS:
- ✅ Conecta a HiveMQ Cloud (mismo broker que React)
- ✅ Simula Motors 4, 5, 6 + Reconectador 101
- ✅ Control Marcha/Parada con pulsos momentáneos (TODOS LOS MOTORES)
- ✅ Curvas de corriente realistas
- ✅ Simulación de fallas aleatorias
- ✅ Estados basados en entradas digitales (DI)

TOPICS MQTT:
- solfrut/motores/m4/telemetria
- solfrut/motores/m4/comandos    (comandos: MARCHA / PARADA) ✅ NUEVO
- solfrut/motores/m5/telemetria  
- solfrut/motores/m5/comandos    (comandos: MARCHA / PARADA)
- solfrut/motores/m6/telemetria
- solfrut/motores/m6/comandos    (comandos: MARCHA / PARADA)
- solfrut/reco1/estado
- solfrut/reco1/comandos         (comandos: CLOSE / TRIP)

USO:
    python simulador_solfrut.py

AUTOR: Claude + Tu Equipo SolFrut
FECHA: 2025-12-11
=============================================================================
"""

import paho.mqtt.client as mqtt
import time
import random
import json
import math
from datetime import datetime

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURACIÓN HIVEMQ CLOUD
# ═══════════════════════════════════════════════════════════════════════════
BROKER = "d117b2b403d34e1cbc27488bb7782e37.s1.eu.hivemq.cloud"
PORT = 8883  # SSL/TLS
USERNAME = "sussiniguanziroli"
PASSWORD = "SolFrut2025"

# ═══════════════════════════════════════════════════════════════════════════
# TOPICS MQTT (Coinciden con perfil_exemys_solfrut.json)
# ═══════════════════════════════════════════════════════════════════════════
TOPICS = {
    "m4": {
        "data": "solfrut/motores/m4/telemetria",
        "cmd": "solfrut/motores/m4/comandos"  # ✅ NUEVO
    },
    "m5": {
        "data": "solfrut/motores/m5/telemetria",
        "cmd": "solfrut/motores/m5/comandos"
    },
    "m6": {
        "data": "solfrut/motores/m6/telemetria",
        "cmd": "solfrut/motores/m6/comandos"
    },
    "reco": {
        "data": "solfrut/reco1/estado",
        "cmd": "solfrut/reco1/comandos"
    }
}

# ═══════════════════════════════════════════════════════════════════════════
# ESTADO INTERNO DEL SISTEMA
# ═══════════════════════════════════════════════════════════════════════════
class MotorState:
    """Simula un motor con sus entradas/salidas digitales y analógicas"""
    def __init__(self, name, corriente_nominal, corriente_max):
        self.name = name
        self.running = False  # DI (funcionando)
        self.falla = False    # DI (falla)
        self.corriente_nominal = corriente_nominal
        self.corriente_max = corriente_max
        self.corriente_actual = 0.0
        self.tiempo_arranque = 0
        self.do_marcha = False  # DO (salida marcha)
        self.do_parada = False  # DO (salida parada)
        
    def arrancar(self):
        """Simula pulso en DO_MARCHA"""
        print(f"   🟢 [{self.name}] DO_MARCHA activado (pulso 500ms)")
        self.do_marcha = True
        self.do_parada = False
        self.running = True
        self.tiempo_arranque = time.time()
        self.falla = False
        
    def detener(self):
        """Simula pulso en DO_PARADA"""
        print(f"   🔴 [{self.name}] DO_PARADA activado (pulso 500ms)")
        self.do_parada = True
        self.do_marcha = False
        self.running = False
        self.corriente_actual = 0.0
        
    def simular_falla(self):
        """Dispara una falla aleatoria (1% de probabilidad cada ciclo)"""
        if self.running and random.random() < 0.01:
            self.falla = True
            self.running = False
            self.corriente_actual = 0.0
            print(f"   ⚠️  [{self.name}] ¡FALLA DETECTADA! Motor detenido.")
            
    def actualizar_corriente(self):
        """Simula curva de arranque + operación normal"""
        if not self.running:
            self.corriente_actual = 0.0
            return
            
        tiempo_encendido = time.time() - self.tiempo_arranque
        
        # FASE 1: Arranque (0-3 seg) - Pico de corriente
        if tiempo_encendido < 3.0:
            pico = self.corriente_nominal * 1.8  # 180% nominal
            self.corriente_actual = pico * (tiempo_encendido / 3.0)
            
        # FASE 2: Operación normal con variación
        else:
            variacion = random.uniform(-0.05, 0.05)  # ±5%
            self.corriente_actual = self.corriente_nominal * (1 + variacion)
            
        # Limitar al máximo
        self.corriente_actual = min(self.corriente_actual, self.corriente_max)
        
    def to_json(self):
        """Genera payload JSON para MQTT"""
        return {
            "estado": "ON" if self.running else "OFF",
            "falla": "SI" if self.falla else "NO",
            "corriente": round(self.corriente_actual, 2),
            "timestamp": datetime.now().isoformat()
        }

# Instancias de motores
motores = {
    "m4": MotorState("MOTOR 4", 22.5, 40.0),  # ✅ AHORA CONTROLABLE
    "m5": MotorState("MOTOR 5", 15.0, 40.0),  
    "m6": MotorState("MOTOR 6", 32.0, 50.0)   
}

# Estado del reconectador
reconectador = {
    "cerrado": True  # True=CLOSED, False=TRIP
}

# ✅ Motor 4 arranca apagado (ahora se controla remotamente)
# motores["m4"].arrancar()  # COMENTADO - ahora se controla por MQTT

# ═══════════════════════════════════════════════════════════════════════════
# CALLBACKS MQTT
# ═══════════════════════════════════════════════════════════════════════════
def on_connect(client, userdata, flags, rc, properties=None):
    """Callback al conectar exitosamente"""
    if rc == 0:
        print("=" * 80)
        print("✅ CONECTADO A HIVEMQ CLOUD")
        print("=" * 80)
        print(f"📡 Broker: {BROKER}")
        print(f"🔐 Usuario: {USERNAME}")
        print(f"⏰ Hora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Suscribirse a topics de comandos (✅ INCLUYE M4)
        client.subscribe([
            (TOPICS["m4"]["cmd"], 0),  # ✅ NUEVO
            (TOPICS["m5"]["cmd"], 0),
            (TOPICS["m6"]["cmd"], 0),
            (TOPICS["reco"]["cmd"], 0)
        ])
        print("📥 Suscrito a topics de comandos:")
        print(f"   - {TOPICS['m4']['cmd']}")  # ✅ NUEVO
        print(f"   - {TOPICS['m5']['cmd']}")
        print(f"   - {TOPICS['m6']['cmd']}")
        print(f"   - {TOPICS['reco']['cmd']}")
        print("=" * 80)
    else:
        print(f"❌ Fallo en conexión: código {rc}")

def on_message(client, userdata, msg):
    """Callback al recibir un comando MQTT"""
    try:
        comando = msg.payload.decode().upper().strip()
        topic = msg.topic
        
        print(f"\n📥 COMANDO RECIBIDO [{datetime.now().strftime('%H:%M:%S')}]")
        print(f"   Topic: {topic}")
        print(f"   Payload: {comando}")
        
        # ───────────────────────────────────────────────────────────────────
        # MOTOR 4 - COMANDOS ✅ NUEVO
        # ───────────────────────────────────────────────────────────────────
        if topic == TOPICS["m4"]["cmd"]:
            if "MARCHA" in comando:
                motores["m4"].arrancar()
            elif "PARADA" in comando:
                motores["m4"].detener()
                
        # ───────────────────────────────────────────────────────────────────
        # MOTOR 5 - COMANDOS
        # ───────────────────────────────────────────────────────────────────
        elif topic == TOPICS["m5"]["cmd"]:
            if "MARCHA" in comando:
                motores["m5"].arrancar()
            elif "PARADA" in comando:
                motores["m5"].detener()
                
        # ───────────────────────────────────────────────────────────────────
        # MOTOR 6 - COMANDOS
        # ───────────────────────────────────────────────────────────────────
        elif topic == TOPICS["m6"]["cmd"]:
            if "MARCHA" in comando:
                motores["m6"].arrancar()
            elif "PARADA" in comando:
                motores["m6"].detener()
                
        # ───────────────────────────────────────────────────────────────────
        # RECONECTADOR - COMANDOS
        # ───────────────────────────────────────────────────────────────────
        elif topic == TOPICS["reco"]["cmd"]:
            if "CLOSE" in comando or "MARCHA" in comando:
                reconectador["cerrado"] = True
                print(f"   🟢 [RECONECTADOR] CLOSE ejecutado")
            elif "TRIP" in comando or "PARADA" in comando:
                reconectador["cerrado"] = False
                # Detener todos los motores al abrir reconectador
                for motor in motores.values():
                    if motor.running:
                        motor.detener()
                print(f"   🔴 [RECONECTADOR] TRIP ejecutado - Motores detenidos")
                
    except Exception as e:
        print(f"❌ Error procesando comando: {e}")

# ═══════════════════════════════════════════════════════════════════════════
# INICIALIZACIÓN MQTT
# ═══════════════════════════════════════════════════════════════════════════
print("\n🚀 Iniciando Simulador Exemys SolFrut...")
print(f"🔌 Conectando a {BROKER}:{PORT}...\n")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "Exemys_Simulator_SolFrut")
client.username_pw_set(USERNAME, PASSWORD)
client.tls_set()  # Habilitar SSL/TLS
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    # ═══════════════════════════════════════════════════════════════════════
    # LOOP PRINCIPAL - SIMULACIÓN
    # ═══════════════════════════════════════════════════════════════════════
    ciclo = 0
    print("🔄 Entrando en loop de simulación (Ctrl+C para detener)...\n")
    
    while True:
        ciclo += 1
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        # ───────────────────────────────────────────────────────────────────
        # ACTUALIZAR ESTADO DE CADA MOTOR
        # ───────────────────────────────────────────────────────────────────
        for motor_id, motor in motores.items():
            motor.actualizar_corriente()
            motor.simular_falla()
            
            # Publicar telemetría
            payload = json.dumps(motor.to_json())
            client.publish(TOPICS[motor_id]["data"], payload)
            
        # ───────────────────────────────────────────────────────────────────
        # RECONECTADOR
        # ───────────────────────────────────────────────────────────────────
        reco_payload = json.dumps({
            "estado": "ON" if reconectador["cerrado"] else "OFF",
            "timestamp": datetime.now().isoformat()
        })
        client.publish(TOPICS["reco"]["data"], reco_payload)
        
        # ───────────────────────────────────────────────────────────────────
        # LOG EN CONSOLA (cada 5 ciclos para no saturar)
        # ───────────────────────────────────────────────────────────────────
        if ciclo % 5 == 0:
            print(f"[{timestamp}] Ciclo #{ciclo}")
            print(f"   M4: {motores['m4'].corriente_actual:5.2f}A | Estado: {motores['m4'].running}")
            print(f"   M5: {motores['m5'].corriente_actual:5.2f}A | Estado: {motores['m5'].running}")
            print(f"   M6: {motores['m6'].corriente_actual:5.2f}A | Estado: {motores['m6'].running}")
            print(f"   Reco: {'CLOSED' if reconectador['cerrado'] else 'TRIP'}")
            print()
        
        time.sleep(2)  # Publicar cada 2 segundos
        
except KeyboardInterrupt:
    print("\n\n🛑 Simulación detenida por usuario")
    client.loop_stop()
    client.disconnect()
    print("✅ Desconexión limpia. ¡Hasta luego!")

except Exception as e:
    print(f"\n❌ ERROR CRÍTICO: {e}")
    client.loop_stop()
    client.disconnect()