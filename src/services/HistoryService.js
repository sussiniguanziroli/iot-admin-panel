/**
 * Servicio de Datos Históricos
 * * HOY: Devuelve datos falsos para que el gráfico no se rompa.
 * MAÑANA: Aquí pondrás la llamada a tu Google Cloud Function -> BigQuery.
 */

export const fetchHistoricalData = async (deviceId, metricKey, timeRange = '24h') => {
    // Simulamos latencia de red
    await new Promise(resolve => setTimeout(resolve, 800));

    console.log(`[BigQuery Mock] Fetching ${metricKey} for ${deviceId} range: ${timeRange}`);

    // Generar datos dummy realistas
    const now = new Date();
    const dataPoints = [];
    const pointsCount = 50; 

    for (let i = pointsCount; i > 0; i--) {
        const time = new Date(now.getTime() - (i * 1000 * 60 * 15)); // Cada 15 min
        
        // Simular una curva con algo de ruido
        let baseValue = 25; // Amperes base
        if (i > 10 && i < 30) baseValue = 35; // Pico de consumo simulado
        
        const randomNoise = (Math.random() - 0.5) * 5;
        
        dataPoints.push({
            timestamp: time.toISOString(),
            value: Number((baseValue + randomNoise).toFixed(2))
        });
    }

    return dataPoints;
};