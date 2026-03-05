const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const db = getFirestore();

exports.onTenantPlanUpdate = onDocumentUpdated(
  "tenants/{tenantId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (!before || !after) return;

    const planChanged = before.plan !== after.plan;
    if (!planChanged) return;

    console.log(`Plan changed for ${event.params.tenantId}: ${before.plan} → ${after.plan}`);

    await db.collection("audit_logs").add({
      action: "PLAN_CHANGE_DETECTED",
      tenantId: event.params.tenantId,
      changes: { from: before.plan, to: after.plan },
      timestamp: FieldValue.serverTimestamp()
    });
  }
);