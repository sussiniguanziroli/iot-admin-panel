const { initializeApp } = require("firebase-admin/app");

initializeApp();

exports.calculateTenantUsage = require('./src/helpers/calculateTenantUsage').calculateTenantUsage;
exports.onTenantPlanUpdate = require('./src/triggers/onTenantPlanUpdate').onTenantPlanUpdate;
exports.upgradePlan = require('./src/callable/upgradePlan').upgradePlan;
exports.queryTelemetry = require('./src/callable/queryTelemetry').queryTelemetry;