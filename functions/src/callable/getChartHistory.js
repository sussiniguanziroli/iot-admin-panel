const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { BigQuery } = require("@google-cloud/bigquery");

const db = getFirestore();
const bigquery = new BigQuery({
    projectId: "iot-admin-panel",
    location: "us-central1"
});

const DATASET = "iot_data";
const REALTIME_TABLE = "realtime_telemetry";
const MAX_DAYS = 7;
const MAX_ROWS = 100000;

exports.getChartHistory = onCall(
    {
        region: "us-central1",
        cors: ["https://iot-admin-panel.netlify.app", "http://localhost:5173"]
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const uid = request.auth.uid;
        const { tenantId, locationId, topic, dataKey, days = 7 } = request.data;

        if (!tenantId || !locationId || !topic || !dataKey) {
            throw new HttpsError("invalid-argument", "tenantId, locationId, topic y dataKey son requeridos");
        }

        if (days > MAX_DAYS) {
            throw new HttpsError("invalid-argument", `Máximo ${MAX_DAYS} días para datos realtime`);
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

        const table = `\`iot-admin-panel.${DATASET}.${REALTIME_TABLE}\``;

        const query = `
            SELECT
                CAST(timestamp AS STRING) AS timestamp,
                SAFE_CAST(value AS FLOAT64) AS value
            FROM ${table}
            WHERE tenant_id = @tenantId
              AND location_id = @locationId
              AND topic = @topic
              AND data_key = @dataKey
              AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)
              AND value IS NOT NULL
              AND SAFE_CAST(value AS FLOAT64) IS NOT NULL
            ORDER BY timestamp ASC
            LIMIT ${MAX_ROWS}
        `;

        const [rows] = await bigquery.query({
            query,
            params: { tenantId, locationId, topic, dataKey, days }
        });

        return {
            rows: rows.map(row => ({
                timestamp: row.timestamp,
                value: row.value
            })),
            meta: {
                topic,
                dataKey,
                days,
                rowCount: rows.length,
                capped: rows.length === MAX_ROWS
            }
        };
    }
);