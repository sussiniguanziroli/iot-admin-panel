const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { MercadoPagoConfig, PreApproval } = require("mercadopago");
const { calculateTenantUsage } = require("../helpers/calculateTenantUsage");

const mpAccessToken = defineSecret("MP_ACCESS_TOKEN");
const db = getFirestore();

exports.upgradePlan = onCall(
  {
    region: "us-central1",
    invoker: "public",
    cors: true,
    secrets: [mpAccessToken]
  },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Auth required");

    const { tenantId, planId, bypassPayment } = request.data;
    const uid = request.auth.uid;

    if (!tenantId || !planId) throw new HttpsError("invalid-argument", "tenantId and planId are required");

    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) throw new HttpsError("not-found", "User not found");

    const userData = userDoc.data();
    const isSuperAdmin = userData.role === "super_admin";
    const isTenantAdmin = userData.role === "admin" && userData.tenantId === tenantId;

    if (!isSuperAdmin && !isTenantAdmin) throw new HttpsError("permission-denied", "Denied");
    if (bypassPayment && !isSuperAdmin) throw new HttpsError("permission-denied", "Only Super Admins can bypass payment");

    const planDoc = await db.collection("plans").doc(planId).get();
    if (!planDoc.exists) throw new HttpsError("not-found", `Plan ${planId} not found`);
    const planData = planDoc.data();

    const tenantDoc = await db.collection("tenants").doc(tenantId).get();
    if (!tenantDoc.exists) throw new HttpsError("not-found", "Tenant not found");

    const tenantData = tenantDoc.data();
    const oldPlan = tenantData.plan || "unknown";
    const sub = tenantData.subscription || {};
    const existingSubscriptionId = sub.gatewaySubscriptionId || null;

    if (!bypassPayment) {
      if (!existingSubscriptionId) {
        throw new HttpsError("failed-precondition", "El tenant no tiene una suscripción activa. Usá subscribeToPlan primero.");
      }

      try {
        const resolvedToken = mpAccessToken.value().trim();
        const client = new MercadoPagoConfig({ accessToken: resolvedToken });
        const preApprovalClient = new PreApproval(client);

        await preApprovalClient.update({
          id: existingSubscriptionId,
          body: {
            reason: `Suscripcion Panel SCADA - ${planId}`,
            auto_recurring: {
              transaction_amount: planData.price
            }
          }
        });

        console.log("PreApproval updated for upgrade:", existingSubscriptionId, "->", planId);
      } catch (err) {
        console.error("MP upgrade error:", err?.message, JSON.stringify(err?.cause ?? {}));
        throw new HttpsError("internal", "Error al actualizar la suscripción en MercadoPago: " + err?.message);
      }
    }

    const usage = await calculateTenantUsage(tenantId);
    const now = new Date().toISOString();
    const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await db.collection("tenants").doc(tenantId).update({
      plan: planId,
      limits: planData.limits,
      usage,
      "subscription.plan": planId,
      "subscription.status": "active",
      "subscription.gatewaySubscriptionId": existingSubscriptionId,
      "subscription.currentPeriodStart": now,
      "subscription.currentPeriodEnd": nextBilling,
      "subscription.nextBillingDate": nextBilling,
      "subscription.lastPaymentDate": bypassPayment ? now : (sub.lastPaymentDate || now),
      updatedAt: FieldValue.serverTimestamp()
    });

    await db.collection("audit_logs").add({
      action: "PLAN_UPGRADED",
      tenantId,
      userId: uid,
      changes: { from: oldPlan, to: planId, bypassedPayment: bypassPayment === true },
      timestamp: FieldValue.serverTimestamp()
    });

    return {
      success: true,
      usage,
      plan: planId,
      message: `Plan upgraded from ${oldPlan} to ${planId}`
    };
  }
);