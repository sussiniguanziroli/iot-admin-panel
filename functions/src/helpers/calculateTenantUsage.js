// functions/src/helpers/calculateUsage.js

const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const db = getFirestore();

async function calculateTenantUsage(tenantId) {
  console.log(`📊 Calculating usage for tenant: ${tenantId}`);

  try {
    const locationsSnapshot = await db
      .collection("tenants")
      .doc(tenantId)
      .collection("locations")
      .get();

    let totalWidgets = 0;
    let totalDashboards = 0;

    locationsSnapshot.forEach((locDoc) => {
      const layout = locDoc.data().layout || {};
      const widgets = layout.widgets || [];
      const machines = layout.machines || [];

      totalWidgets += widgets.length;
      totalDashboards += machines.length;
    });

    const usersSnapshot = await db
      .collection("users")
      .where("tenantId", "==", tenantId)
      .get();

    const usage = {
      locations: locationsSnapshot.size,
      users: usersSnapshot.size,
      widgetsTotal: totalWidgets,
      dashboards: totalDashboards,
      mqttMessagesToday: 0,
      mqttTopicsSubscribed: 0,
      lastCalculated: FieldValue.serverTimestamp(),
      dailyStats: {
        date: new Date().toISOString().split("T")[0],
        mqttMessages: 0,
        dataPointsStored: 0,
      },
    };

    console.log(`✅ Usage calculated:`, usage);
    return usage;
  } catch (error) {
    console.error(`❌ Error calculating usage:`, error);
    throw error;
  }
}

module.exports = { calculateTenantUsage };