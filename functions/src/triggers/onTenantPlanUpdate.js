// functions/src/triggers/onTenantPlanUpdate.js

const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { calculateTenantUsage } = require("../helpers/calculateTenantUsage");

const db = getFirestore();

exports.onTenantPlanUpdate = onDocumentUpdated(
  "tenants/{tenantId}",
  async (event) => {
    const tenantId = event.params.tenantId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (!before || !after) {
      console.log("⚠️ Document created or deleted, skipping");
      return;
    }

    const planChanged = before.plan !== after.plan;

    if (!planChanged) {
      console.log("⏭️ Plan unchanged, skipping usage recalculation");
      return;
    }

    console.log(`🔄 Plan changed: ${before.plan} → ${after.plan}`);

    try {
      const usage = await calculateTenantUsage(tenantId);

      await db.collection("tenants").doc(tenantId).update({
        usage,
        updatedAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Usage recalculated for tenant: ${tenantId}`);
    } catch (error) {
      console.error(`❌ Error updating usage:`, error);
      throw error;
    }
  }
);