#!/usr/bin/env python3
"""
=============================================================================
SIMULADOR PLANTA EMBOTELLADORA COCACOLA
=============================================================================
Simula 4 motores industriales + reconectador con medición eléctrica.

MOTORES:
- Línea 1: Embotelladora Principal (50 HP)
- Línea 2: Transportadora de Botellas (30 HP)  
- Utilities: Compresor de Aire (75 HP)
- Utilities: Sistema de Enfriamiento (60 HP)

RECONECTADOR:
- Medición trifásica L1, L2, L3
- Protecciones: Sobrecorriente, Sobretensión, Bajatensión, Desequilibrio
- Control remoto CLOSE/TRIP

PATRONES REALISTAS:
✅ Turno día (06:00-18:00): 100% producción
✅ Turno noche (18:00-06:00): 40-60% producción
✅ Fin de semana: 30% producción (mantenimiento)
✅ Temperatura ambiente afecta enfriador
✅ Presión de aire varía con demanda

TOPICS MQTT:
- cocacola/linea1/embotelladora/telemetria
- cocacola/linea1/embotelladora/comandos
- cocacola/linea2/transportadora/telemetria  
- cocacola/linea2/transportadora/comandos
- cocacola/utilidades/compresor/telemetria
- cocacola/utilidades/compresor/comandos
- cocacola/utilidades/enfriador/telemetria
- cocacola/utilidades/enfriador/comandos
- cocacola/electrico/reco1/telemetria
- cocacola/electrico/reco1/comandos

USO:
    python simulador_cocacola.py

AUTOR: Claude + CocaCola Team
FECHA: 2026-02-24
=============================================================================
"""

import paho.mqtt.client as mqtt
import time
import random
import json
import math
from datetime import datetime

BROKER = "d117b2b403d34e1cbc27488bb7782e37.s1.eu.hivemq.cloud"
PORT = 8883
USERNAME = "sussiniguanziroli"
PASSWORD = "SolFrut2025"

TOPICS = {
    "embotelladora": {
        "data": "cocacola/linea1/embotelladora/telemetria",
        "cmd": "cocacola/linea1/embotelladora/comandos"
    },
    "transportadora": {
        "data": "cocacola/linea2/transportadora/telemetria",
        "cmd": "cocacola/linea2/transportadora/comandos"
    },
    "compresor": {
        "data": "cocacola/utilidades/compresor/telemetria",
        "cmd": "cocacola/utilidades/compresor/comandos"
    },
    "enfriador": {
        "data": "cocacola/utilidades/enfriador/telemetria",
        "cmd": "cocacola/utilidades/enfriador/comandos"
    },
    "reco": {
        "data": "cocacola/electrico/reco1/telemetria",
        "cmd": "cocacola/electrico/reco1/comandos"
    }
}

class MotorState:
    def __init__(self, name, hp, corriente_nominal, corriente_max):
        self.name = name
        self.hp = hp
        self.running = False
        self.corriente_nominal = corriente_nominal
        self.corriente_max = corriente_max
        self.corriente_actual = 0.0
        self.velocidad = 0.0  # RPM %
        self.temperatura = 25.0  # °C
        self.vibracion = 0.0  # mm/s
        self.horas_operacion = random.randint(1000, 5000)
        self.tiempo_arranque = 0
        
    def arrancar(self):
        print(f"   🟢 [{self.name}] MARCHA")
        self.running = True
        self.tiempo_arranque = time.time()
        
    def detener(self):
        print(f"   🔴 [{self.name}] PARADA")
        self.running = False
        self.corriente_actual = 0.0
        self.velocidad = 0.0
        
    def get_factor_turno(self):
        """Retorna factor de carga según turno y día"""
        now = datetime.now()
        hour = now.hour
        is_weekend = now.weekday() >= 5
        
        if is_weekend:
            return 0.3  # 30% fin de semana
        elif 6 <= hour < 18:
            return 1.0  # 100% turno día
        else:
            return random.uniform(0.4, 0.6)  # 40-60% turno noche
            
    def actualizar_corriente(self):
        if not self.running:
            self.corriente_actual = 0.0
            self.velocidad = 0.0
            self.temperatura = max(25, self.temperatura - 0.5)
            return
            
        tiempo_encendido = time.time() - self.tiempo_arranque
        factor_turno = self.get_factor_turno()
        
        # Arranque suave (0-5 seg)
        if tiempo_encendido < 5.0:
            progreso = tiempo_encendido / 5.0
            self.corriente_actual = self.corriente_nominal * 1.5 * progreso
            self.velocidad = 100 * progreso
        else:
            # Operación normal con variaciones por turno
            base = self.corriente_nominal * factor_turno
            variacion = random.uniform(-0.03, 0.03)
            self.corriente_actual = base * (1 + variacion)
            self.velocidad = 100 * factor_turno * (1 + variacion * 0.5)
            
        # Temperatura sube con carga
        temp_objetivo = 45 + (factor_turno * 20)
        if self.temperatura < temp_objetivo:
            self.temperatura += 0.2
        else:
            self.temperatura = temp_objetivo + random.uniform(-2, 2)
            
        # Vibración proporcional a velocidad
        self.vibracion = (self.velocidad / 100) * random.uniform(1.5, 2.5)
        
        self.corriente_actual = min(self.corriente_actual, self.corriente_max)
        
    def to_json(self):
        return {
            "estado": "ON" if self.running else "OFF",
            "corriente": round(self.corriente_actual, 2),
            "velocidad": round(self.velocidad, 1),
            "temperatura": round(self.temperatura, 1),
            "vibracion": round(self.vibracion, 2),
            "horas_operacion": self.horas_operacion,
            "timestamp": datetime.now().isoformat()
        }

class CompresorState(MotorState):
    def __init__(self):
        super().__init__("COMPRESOR AIRE", 75, 95.0, 140.0)
        self.presion = 0.0  # bar
        
    def actualizar_corriente(self):
        super().actualizar_corriente()
        if self.running:
            # Presión objetivo según turno
            factor = self.get_factor_turno()
            presion_objetivo = 7.0 + (factor * 1.5)
            
            # Ciclo de carga/descarga
            ciclo = math.sin(time.time() / 30) * 0.3
            self.presion = presion_objetivo + ciclo
        else:
            self.presion = max(0, self.presion - 0.05)
            
    def to_json(self):
        data = super().to_json()
        data["presion"] = round(self.presion, 2)
        return data

class EnfriadorState(MotorState):
    def __init__(self):
        super().__init__("ENFRIADOR", 60, 75.0, 110.0)
        self.temp_entrada = 25.0
        self.temp_salida = 4.0
        
    def actualizar_corriente(self):
        super().actualizar_corriente()
        
        # Temperatura ambiente (más alta de día)
        hour = datetime.now().hour
        if 10 <= hour < 18:
            temp_ambiente = random.uniform(28, 35)
        else:
            temp_ambiente = random.uniform(18, 25)
            
        if self.running:
            factor = self.get_factor_turno()
            self.temp_entrada = temp_ambiente + (factor * 3)
            self.temp_salida = 4.0 + random.uniform(-0.5, 0.5)
            
            # Carga térmica afecta corriente
            delta_t = self.temp_entrada - self.temp_salida
            factor_carga = delta_t / 25.0
            self.corriente_actual *= factor_carga
        else:
            self.temp_entrada = temp_ambiente
            self.temp_salida = min(25, self.temp_salida + 0.3)
            
    def to_json(self):
        data = super().to_json()
        data["temp_entrada"] = round(self.temp_entrada, 1)
        data["temp_salida"] = round(self.temp_salida, 1)
        return data

class ReconectadorState:
    def __init__(self):
        self.cerrado = True
        self.v_l1 = 220.0
        self.v_l2 = 220.0
        self.v_l3 = 220.0
        self.frecuencia = 50.0
        self.corriente_total = 0.0
        self.protecciones = {
            "sobrecorriente": False,
            "sobretension": False,
            "bajatension": False,
            "desequilibrio": False
        }
        
    def actualizar(self, motores):
        if not self.cerrado:
            self.v_l1 = self.v_l2 = self.v_l3 = 0.0
            self.corriente_total = 0.0
            return
            
        # Tensión nominal con variaciones pequeñas
        base_v = 220.0 + random.uniform(-2, 2)
        self.v_l1 = base_v + random.uniform(-1, 1)
        self.v_l2 = base_v + random.uniform(-1, 1)
        self.v_l3 = base_v + random.uniform(-1, 1)
        
        # Frecuencia estable
        self.frecuencia = 50.0 + random.uniform(-0.1, 0.1)
        
        # Corriente total = suma de motores en marcha
        self.corriente_total = sum(m.corriente_actual for m in motores.values())
        
        # Protecciones
        self.protecciones["sobrecorriente"] = self.corriente_total > 350
        self.protecciones["sobretension"] = max(self.v_l1, self.v_l2, self.v_l3) > 240
        self.protecciones["bajatension"] = min(self.v_l1, self.v_l2, self.v_l3) < 200
        
        voltajes = [self.v_l1, self.v_l2, self.v_l3]
        promedio = sum(voltajes) / 3
        desequilibrio = max(abs(v - promedio) for v in voltajes)
        self.protecciones["desequilibrio"] = desequilibrio > 5
        
        # Trip automático si hay protección activa
        if any(self.protecciones.values()):
            print(f"   ⚠️  [RECONECTADOR] PROTECCIÓN ACTIVADA: {self.protecciones}")
            self.abrir()
            
    def cerrar(self):
        self.cerrado = True
        print("   🟢 [RECONECTADOR] CLOSE")
        
    def abrir(self):
        self.cerrado = False
        print("   🔴 [RECONECTADOR] TRIP")
        
    def to_json(self):
        return {
            "estado": "CLOSED" if self.cerrado else "OPEN",
            "voltaje_L1": round(self.v_l1, 1),
            "voltaje_L2": round(self.v_l2, 1),
            "voltaje_L3": round(self.v_l3, 1),
            "frecuencia": round(self.frecuencia, 2),
            "corriente_total": round(self.corriente_total, 1),
            "sobrecorriente": self.protecciones["sobrecorriente"],
            "sobretension": self.protecciones["sobretension"],
            "bajatension": self.protecciones["bajatension"],
            "desequilibrio": self.protecciones["desequilibrio"],
            "timestamp": datetime.now().isoformat()
        }

# Instancias
motores = {
    "embotelladora": MotorState("EMBOTELLADORA L1", 50, 62.5, 90.0),
    "transportadora": MotorState("TRANSPORTADORA L2", 30, 37.5, 55.0),
    "compresor": CompresorState(),
    "enfriador": EnfriadorState()
}

reconectador = ReconectadorState()

# Arranque inicial
motores["embotelladora"].arrancar()
motores["transportadora"].arrancar()
motores["compresor"].arrancar()
motores["enfriador"].arrancar()

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print("=" * 80)
        print("🥤 SIMULADOR COCACOLA - PLANTA EMBOTELLADORA")
        print("=" * 80)
        print(f"📡 Broker: {BROKER}")
        print(f"⏰ Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        client.subscribe([
            (TOPICS["embotelladora"]["cmd"], 0),
            (TOPICS["transportadora"]["cmd"], 0),
            (TOPICS["compresor"]["cmd"], 0),
            (TOPICS["enfriador"]["cmd"], 0),
            (TOPICS["reco"]["cmd"], 0)
        ])
        print("📥 Suscrito a comandos")
        print("=" * 80)
    else:
        print(f"❌ Fallo conexión: {rc}")

def on_message(client, userdata, msg):
    try:
        comando = msg.payload.decode().upper().strip()
        topic = msg.topic
        
        print(f"\n📥 [{datetime.now().strftime('%H:%M:%S')}] {topic} → {comando}")
        
        if topic == TOPICS["embotelladora"]["cmd"]:
            if "MARCHA" in comando:
                motores["embotelladora"].arrancar()
            elif "PARADA" in comando:
                motores["embotelladora"].detener()
                
        elif topic == TOPICS["transportadora"]["cmd"]:
            if "MARCHA" in comando:
                motores["transportadora"].arrancar()
            elif "PARADA" in comando:
                motores["transportadora"].detener()
                
        elif topic == TOPICS["compresor"]["cmd"]:
            if "MARCHA" in comando:
                motores["compresor"].arrancar()
            elif "PARADA" in comando:
                motores["compresor"].detener()
                
        elif topic == TOPICS["enfriador"]["cmd"]:
            if "MARCHA" in comando:
                motores["enfriador"].arrancar()
            elif "PARADA" in comando:
                motores["enfriador"].detener()
                
        elif topic == TOPICS["reco"]["cmd"]:
            if "CLOSE" in comando or "MARCHA" in comando:
                reconectador.cerrar()
            elif "TRIP" in comando or "PARADA" in comando or "OPEN" in comando:
                reconectador.abrir()
                for motor in motores.values():
                    motor.detener()
                    
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n🚀 Iniciando simulador CocaCola...")
print(f"🔌 Conectando a {BROKER}:{PORT}...\n")

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, "CocaCola_Simulator")
client.username_pw_set(USERNAME, PASSWORD)
client.tls_set()
client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(BROKER, PORT, 60)
    client.loop_start()
    
    ciclo = 0
    print("🔄 Loop de simulación iniciado (Ctrl+C para detener)...\n")
    
    while True:
        ciclo += 1
        timestamp = datetime.now().strftime('%H:%M:%S')
        
        # Actualizar motores
        for motor_id, motor in motores.items():
            motor.actualizar_corriente()
            if motor.running:
                motor.horas_operacion += 1/1800  # Incremento por ciclo
            
            payload = json.dumps(motor.to_json())
            client.publish(TOPICS[motor_id]["data"], payload)
            
        # Actualizar reconectador
        reconectador.actualizar(motores)
        reco_payload = json.dumps(reconectador.to_json())
        client.publish(TOPICS["reco"]["data"], reco_payload)
        
        # Log cada 10 ciclos
        if ciclo % 10 == 0:
            print(f"\n[{timestamp}] Ciclo #{ciclo} | Turno: {motores['embotelladora'].get_factor_turno()*100:.0f}%")
            print(f"   Embotelladora: {motores['embotelladora'].corriente_actual:6.2f}A | {motores['embotelladora'].velocidad:5.1f}% RPM")
            print(f"   Transportadora: {motores['transportadora'].corriente_actual:6.2f}A | {motores['transportadora'].velocidad:5.1f}% RPM")
            print(f"   Compresor:      {motores['compresor'].corriente_actual:6.2f}A | {motores['compresor'].presion:4.1f} bar")
            print(f"   Enfriador:      {motores['enfriador'].corriente_actual:6.2f}A | {motores['enfriador'].temp_salida:4.1f}°C")
            print(f"   Reconectador:   {reconectador.corriente_total:6.1f}A | {reconectador.estado}")
            print(f"   Tensiones:      L1={reconectador.v_l1:.1f}V L2={reconectador.v_l2:.1f}V L3={reconectador.v_l3:.1f}V")
        
        time.sleep(2)
        
except KeyboardInterrupt:
    print("\n\n🛑 Simulación detenida")
    client.loop_stop()
    client.disconnect()
    print("✅ Desconexión limpia")

except Exception as e:
    print(f"\n❌ ERROR: {e}")
    client.loop_stop()
    client.disconnect()