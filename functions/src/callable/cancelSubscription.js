const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { MercadoPagoConfig, PreApproval } = require("mercadopago");

const mpAccessToken = defineSecret("MP_ACCESS_TOKEN");
const db = getFirestore();

exports.cancelSubscription = onCall(
  {
    region: "us-central1",
    invoker: "public",
    cors: true,
    secrets: [mpAccessToken]
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { tenantId } = request.data;
    const uid = request.auth.uid;

    if (!tenantId) throw new HttpsError("invalid-argument", "tenantId requerido");

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) throw new HttpsError("not-found", "User not found");

    const userData = userDoc.data();
    if (userData.role !== "super_admin" && (userData.role !== "admin" || userData.tenantId !== tenantId)) {
      throw new HttpsError("permission-denied", "Denied");
    }

    const tenantRef = db.collection("tenants").doc(tenantId);
    const tenantDoc = await tenantRef.get();
    if (!tenantDoc.exists) throw new HttpsError("not-found", "Tenant not found");

    const tenantData = tenantDoc.data();
    const sub = tenantData.subscription || {};

    if (!sub.gatewaySubscriptionId) {
      throw new HttpsError("failed-precondition", "No hay suscripción activa para cancelar");
    }

    try {
      const resolvedToken = mpAccessToken.value().trim();
      const client = new MercadoPagoConfig({ accessToken: resolvedToken });
      const preApprovalClient = new PreApproval(client);

      await preApprovalClient.update({
        id: sub.gatewaySubscriptionId,
        body: { status: "cancelled" }
      });

      console.log("MP PreApproval cancelled:", sub.gatewaySubscriptionId);
    } catch (err) {
      console.error("MP cancel error:", err?.message, "status:", err?.status);
      throw new HttpsError("internal", "Error al cancelar en MercadoPago: " + err?.message);
    }

    const now = new Date().toISOString();

    await tenantRef.update({
      plan: "free",
      "subscription.status": "cancelled",
      "subscription.cancelledAt": now,
      "subscription.gatewaySubscriptionId": null,
      "subscription.paymentMethod": null,
      "subscription.payerEmail": null,
      updatedAt: FieldValue.serverTimestamp()
    });

    await db.collection("audit_logs").add({
      action: "SUBSCRIPTION_CANCELLED",
      tenantId,
      userId: uid,
      changes: { from: sub.plan, to: "free" },
      timestamp: FieldValue.serverTimestamp()
    });

    console.log("Subscription cancelled for tenant:", tenantId);

    return { success: true };
  }
);