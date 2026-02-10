// functions/src/callable/upgradePlan.js

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { calculateTenantUsage } = require("../helpers/calculateTenantUsage");

const db = getFirestore();

exports.upgradePlan = onCall(
  {
    region: "us-central1", // 👈 Región explícita
    invoker: "public",      // 👈 Permite acceso público
    cors: true              // 👈 Manejo de cabeceras
  },
  async (request) => {
    console.log("🚀 upgradePlan called");

    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { tenantId, planId } = request.data;
    const uid = request.auth.uid;

    if (!tenantId || !planId) {
      throw new HttpsError(
        "invalid-argument",
        "tenantId and planId are required"
      );
    }

    try {
      const userDoc = await db.collection("users").doc(uid).get();
      if (!userDoc.exists) {
        throw new HttpsError("not-found", "User not found");
      }

      const userData = userDoc.data();
      const isSuperAdmin = userData.role === "super_admin";
      const isTenantAdmin =
        userData.role === "admin" && userData.tenantId === tenantId;

      if (!isSuperAdmin && !isTenantAdmin) {
        throw new HttpsError(
          "permission-denied",
          "User does not have permission to upgrade this tenant"
        );
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
      const usage = await calculateTenantUsage(tenantId);
      const now = new Date().toISOString();

      await db.collection("tenants").doc(tenantId).update({
        plan: planId,
        limits: planData.limits,
        usage: usage,
        subscription: {
          plan: planId,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastPaymentDate: now,
          paymentMethod: tenantData.subscription?.paymentMethod || null,
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      await db.collection("audit_logs").add({
        action: "PLAN_UPGRADED",
        tenantId: tenantId,
        userId: uid,
        changes: { from: oldPlan, to: planId },
        timestamp: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        usage,
        plan: planId,
        message: `Plan upgraded from ${oldPlan} to ${planId}`,
      };
    } catch (error) {
      console.error("❌ Error upgrading plan:", error);
      // Mantenemos la estructura de error original de tu catch
      throw new HttpsError("internal", error.message);
    }
  }
);