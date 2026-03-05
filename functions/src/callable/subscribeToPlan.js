const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { MercadoPagoConfig, PreApproval } = require("mercadopago");

const mpAccessToken = defineSecret("MP_ACCESS_TOKEN");
const db = getFirestore();

exports.subscribeToPlan = onCall(
    {
        region: "us-central1",
        invoker: "public",
        cors: true,
        secrets: [mpAccessToken]
    },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

        const { tenantId, planId, payerEmail } = request.data;
        const uid = request.auth.uid;

        if (!tenantId || !planId || !payerEmail) {
            throw new HttpsError("invalid-argument", "Faltan campos requeridos");
        }

        const userDoc = await db.collection("users").doc(uid).get();
        if (!userDoc.exists) throw new HttpsError("not-found", "User not found");

        const userData = userDoc.data();
        if (userData.role !== "super_admin" && (userData.role !== "admin" || userData.tenantId !== tenantId)) {
            throw new HttpsError("permission-denied", "Denied");
        }

        const planDoc = await db.collection("plans").doc(planId).get();
        if (!planDoc.exists) throw new HttpsError("not-found", "Plan not found");
        const planData = planDoc.data();

        const tenantRef = db.collection("tenants").doc(tenantId);
        const tenantDoc = await tenantRef.get();
        if (!tenantDoc.exists) throw new HttpsError("not-found", "Tenant not found");

        const tenantData = tenantDoc.data();
        const oldPlan = tenantData.plan || "unknown";

        const resolvedToken = mpAccessToken.value().trim();
        const client = new MercadoPagoConfig({ accessToken: resolvedToken });
        const preApprovalClient = new PreApproval(client);

        let gatewaySubscriptionId = null;
        let initPoint = null;

        try {
            const created = await preApprovalClient.create({
                body: {
                    reason: `Suscripcion Panel SCADA - ${planId}`,
                    auto_recurring: {
                        frequency: 1,
                        frequency_type: "months",
                        transaction_amount: planData.price,
                        currency_id: "ARS"
                    },
                    back_url: "https://iot-admin-panel.netlify.app/app/billing",
                    payer_email: payerEmail,
                    status: "pending"
                }
            });
            gatewaySubscriptionId = created.id;
            initPoint = created.init_point;

            console.log("PreApproval created:", gatewaySubscriptionId);
        } catch (err) {
            console.error("MP Error:", err?.message, "status:", err?.status, JSON.stringify(err?.cause ?? {}));
            throw new HttpsError("internal", "Error al crear la suscripción: " + err?.message);
        }

        await tenantRef.update({
            "subscription.plan": planId,
            "subscription.status": "pending",
            "subscription.gateway": "mercadopago",
            "subscription.gatewaySubscriptionId": gatewaySubscriptionId,
            "subscription.payerEmail": payerEmail,
            updatedAt: FieldValue.serverTimestamp()
        });

        await db.collection("audit_logs").add({
            action: "PLAN_SUBSCRIBE_INITIATED",
            tenantId,
            userId: uid,
            changes: { from: oldPlan, to: planId },
            timestamp: FieldValue.serverTimestamp()
        });

        return { success: true, initPoint, subscriptionId: gatewaySubscriptionId };
    }
);