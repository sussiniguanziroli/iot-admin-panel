const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { calculateTenantUsage } = require("../helpers/calculateTenantUsage");

const db = getFirestore();

exports.upgradePlan = onCall(
  {
    region: "us-central1",
    invoker: "public",
    cors: true
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { tenantId, planId, bypassPayment } = request.data;
    const uid = request.auth.uid;

    if (!tenantId || !planId) {
      throw new HttpsError("invalid-argument", "tenantId and planId are required");
    }

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();
      const isSuperAdmin = userData.role === "super_admin";
      const isTenantAdmin = userData.role === "admin" && userData.tenantId === tenantId;

      if (!isSuperAdmin && !isTenantAdmin) {
        throw new HttpsError("permission-denied", "User does not have permission");
      }

      if (bypassPayment && !isSuperAdmin) {
        throw new HttpsError("permission-denied", "Only Super Admins can bypass payment");
      }

      const planDoc = await db.collection("plans").doc(planId).get();
      if (!planDoc.exists) {
        throw new HttpsError("not-found", `Plan ${planId} not found`);
      }

      const planData = planDoc.data();
      const tenantDoc = await db.collection("tenants").doc(tenantId).get();
      if (!tenantDoc.exists) {
        throw new HttpsError("not-found", `Tenant ${tenantId} not found`);
      }

      const tenantData = tenantDoc.data();
      const oldPlan = tenantData.plan || "unknown";
      const sub = tenantData.subscription || {};

      if (!bypassPayment) {
        if (!sub.gatewaySubscriptionId || sub.gateway !== 'mercadopago') {
          throw new HttpsError("failed-precondition", "No active Mercado Pago subscription found");
        }

        console.log(`MP API Call: Update sub ${sub.gatewaySubscriptionId} to amount ${planData.price}`);
      }

      const usage = await calculateTenantUsage(tenantId);
      const now = new Date().toISOString();
      
      const nextBilling = sub.nextBillingDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      await db.collection("tenants").doc(tenantId).update({
        plan: planId,
        limits: planData.limits,
        usage: usage,
        subscription: {
          ...sub,
          plan: planId,
          status: "active",
          nextBillingDate: nextBilling,
          lastPaymentDate: bypassPayment ? now : sub.lastPaymentDate,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      await db.collection("audit_logs").add({
        action: "PLAN_UPGRADED",
        tenantId: tenantId,
        userId: uid,
        changes: { 
          from: oldPlan, 
          to: planId,
          bypassedPayment: bypassPayment === true 
        },
        timestamp: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        usage,
        plan: planId,
        message: `Plan upgraded from ${oldPlan} to ${planId}`,
      };
    } catch (error) {
      console.error(error);
      throw new HttpsError("internal", error.message);
    }
  }
);