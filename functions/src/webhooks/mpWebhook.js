const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { MercadoPagoConfig, PreApproval } = require("mercadopago");

const mpAccessToken = defineSecret("MP_ACCESS_TOKEN");
const db = getFirestore();

exports.mpWebhook = onRequest(
  {
    region: "us-central1",
    secrets: [mpAccessToken]
  },
  async (req, res) => {
    res.sendStatus(200);

    if (req.method !== "POST") return;

    const type = req.query.type || req.body?.type;
    const dataId = req.query["data.id"] || req.body?.data?.id;

    console.log("=== MP WEBHOOK RECEIVED ===");
    console.log("type:", type, "dataId:", dataId, "action:", req.body?.action);

    if (!type || !dataId) {
      console.warn("Missing type or dataId, skipping");
      return;
    }

    if (type !== "subscription_preapproval") {
      console.warn("Unhandled type:", type, "- skipping");
      return;
    }

    try {
      const resolvedToken = mpAccessToken.value().trim();
      const client = new MercadoPagoConfig({ accessToken: resolvedToken });
      const preApprovalClient = new PreApproval(client);

      console.log("Fetching preapproval from MP, id:", dataId);
      const preapproval = await preApprovalClient.get({ id: dataId });
      
      console.log("PreApproval fetched:", JSON.stringify({
        id: preapproval.id,
        status: preapproval.status,
        payer_email: preapproval.payer_email,
        last_modified: preapproval.last_modified
      }));
      

      const tenantsRef = db.collection("tenants");
      const snapshot = await tenantsRef
        .where("subscription.gatewaySubscriptionId", "==", preapproval.id)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn("No tenant found for preapproval id:", preapproval.id);
        return;
      }

      const tenantDoc = snapshot.docs[0];
      const tenantId = tenantDoc.id;
      const tenantData = tenantDoc.data();
      const planId = tenantData.subscription?.plan;

      console.log("Tenant found:", tenantId, "plan:", planId, "preapproval status:", preapproval.status);

      

      const now = new Date().toISOString();
      const nextBilling = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      if (preapproval.status === "authorized") {
        const planDoc = await db.collection("plans").doc(planId).get();
        if (!planDoc.exists) {
          console.error("Plan not found for planId:", planId);
          return;
        }
        const planData = planDoc.data();

        await db.collection("tenants").doc(tenantId).update({
          plan: planId,
          limits: planData.limits,
          "subscription.status": "active",
          "subscription.currentPeriodStart": now,
          "subscription.currentPeriodEnd": nextBilling,
          "subscription.nextBillingDate": nextBilling,
          "subscription.lastPaymentDate": now,
          "subscription.paymentMethod.brand": preapproval.payment_method_id || "unknown",
          "subscription.paymentMethod.last4": preapproval.card?.last_four_digits || "0000",
          updatedAt: FieldValue.serverTimestamp()
        });

        await db.collection("tenants").doc(tenantId).collection("invoices").add({
          gatewayPaymentId: String(preapproval.id),
          gatewaySubscriptionId: preapproval.id,
          amount: preapproval.auto_recurring?.transaction_amount || 0,
          currency: preapproval.auto_recurring?.currency_id || "ARS",
          status: "approved",
          date: now,
          method: preapproval.payment_method_id || "unknown"
        });

        console.log("Preapproval authorized - tenant activated:", tenantId, "plan:", planId);

      } else if (preapproval.status === "cancelled" || preapproval.status === "paused") {
        await db.collection("tenants").doc(tenantId).update({
          "subscription.status": "past_due",
          updatedAt: FieldValue.serverTimestamp()
        });

        console.warn("Preapproval cancelled/paused for tenant:", tenantId, "status:", preapproval.status);
      } else {
        console.log("Preapproval status not actionable:", preapproval.status, "- no update");
      }

    } catch (error) {
      console.error("mpWebhook error:", error?.message, JSON.stringify(error?.cause ?? {}), error);
    }
  }
);