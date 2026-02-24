const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { BigQuery } = require("@google-cloud/bigquery");

const db = getFirestore();
const bigquery = new BigQuery({ 
    projectId: "iot-admin-panel",
    location: "us-central1" 
});

const DATASET = "iot_data";
const LONGTERM_TABLE = "raw_telemetry";
const MAX_DAYS = 60;

const GRANULARITY_MAP = {
    "24h":  "HOUR",
    "7d":   "DAY",
    "30d":  "DAY",
    "custom": "DAY"
};

exports.queryTelemetry = onCall(
    {
        region: "us-central1",
        invoker: "public",
        cors: true,
        cors: ["https://iot-admin-panel.netlify.app", "http://localhost:5173"]
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const uid = request.auth.uid;
        const { tenantId, locationId, machineId, dataKey, timeRange, dateFrom, dateTo } = request.data;

        if (!tenantId || !dataKey) {
            throw new HttpsError("invalid-argument", "tenantId y dataKey son requeridos");
        }

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) {
            throw new HttpsError("not-found", "Usuario no encontrado");
        }

        const userData = userDoc.data();
        const isSuperAdmin = userData.role === "super_admin";
        const isTenantMember = userData.tenantId === tenantId;

        if (!isSuperAdmin && !isTenantMember) {
            throw new HttpsError("permission-denied", "Sin acceso a este tenant");
        }

        let startDate, endDate;
        const now = new Date();

        if (timeRange === "24h") {
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            endDate = now;
        } else if (timeRange === "7d") {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
        } else if (timeRange === "30d") {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            endDate = now;
        } else if (timeRange === "custom" && dateFrom && dateTo) {
            startDate = new Date(dateFrom);
            endDate = new Date(dateTo);
            const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
            if (diffDays > MAX_DAYS) {
                throw new HttpsError("invalid-argument", `Rango máximo: ${MAX_DAYS} días`);
            }
        } else {
            throw new HttpsError("invalid-argument", "timeRange inválido");
        }

        const granularity = GRANULARITY_MAP[timeRange] || "DAY";
        const table = `\`${DATASET}.${LONGTERM_TABLE}\``;

        const conditions = [
            `tenant_id = @tenantId`,
            `data_key = @dataKey`,
            `timestamp >= @startDate`,
            `timestamp <= @endDate`,
            `DATE(timestamp) >= DATE(@startDate)`,
            `DATE(timestamp) <= DATE(@endDate)`
        ];

        if (locationId) conditions.push(`location_id = @locationId`);
        if (machineId && machineId !== "all") conditions.push(`machine_id = @machineId`);

        const whereClause = conditions.join(" AND ");

        const timeSeriesQuery = `
            SELECT
                TIMESTAMP_TRUNC(timestamp, ${granularity}) AS bucket,
                machine_id,
                AVG(SAFE_CAST(value AS FLOAT64)) AS avg_value,
                MAX(SAFE_CAST(value AS FLOAT64)) AS max_value,
                MIN(SAFE_CAST(value AS FLOAT64)) AS min_value,
                COUNT(*) AS sample_count
            FROM ${table}
            WHERE ${whereClause}
            GROUP BY bucket, machine_id
            ORDER BY bucket ASC
        `;

        const summaryQuery = `
            SELECT
                machine_id,
                AVG(SAFE_CAST(value AS FLOAT64)) AS avg_value,
                MAX(SAFE_CAST(value AS FLOAT64)) AS max_value,
                MIN(SAFE_CAST(value AS FLOAT64)) AS min_value,
                COUNT(*) AS sample_count
            FROM ${table}
            WHERE ${whereClause}
            GROUP BY machine_id
            ORDER BY avg_value DESC
        `;

        const queryParams = {
            tenantId,
            dataKey,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            ...(locationId && { locationId }),
            ...(machineId && machineId !== "all" && { machineId })
        };

        const options = {
            params: queryParams,
        };

        const [[timeSeriesRows], [summaryRows]] = await Promise.all([
            bigquery.query({ query: timeSeriesQuery, ...options }),
            bigquery.query({ query: summaryQuery, ...options })
        ]);

        const timeSeries = timeSeriesRows.map(row => ({
            bucket: row.bucket?.value || row.bucket,
            machine_id: row.machine_id,
            avg: row.avg_value !== null ? parseFloat(row.avg_value.toFixed(3)) : null,
            max: row.max_value !== null ? parseFloat(row.max_value.toFixed(3)) : null,
            min: row.min_value !== null ? parseFloat(row.min_value.toFixed(3)) : null,
            samples: row.sample_count
        }));

        const summary = summaryRows.map(row => ({
            machine_id: row.machine_id,
            avg: row.avg_value !== null ? parseFloat(row.avg_value.toFixed(3)) : null,
            max: row.max_value !== null ? parseFloat(row.max_value.toFixed(3)) : null,
            min: row.min_value !== null ? parseFloat(row.min_value.toFixed(3)) : null,
            samples: row.sample_count
        }));

        return {
            timeSeries,
            summary,
            meta: {
                tenantId,
                locationId: locationId || null,
                machineId: machineId || "all",
                dataKey,
                granularity,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalRows: timeSeries.length
            }
        };
    }
);