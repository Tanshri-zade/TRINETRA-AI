import express from "express";

import {
    createAlert,
    checkAlert,
    getLatestAlert,
    getActiveAlerts,
    acknowledgeAlert,
    getAlertHistory,
    deleteAlert,
    deleteAlertHistory,
    deleteWearerAlertHistory
}
from "../controllers/alertController.js";


const router = express.Router();


router.post(
    "/check",
    checkAlert
);


router.post(
    "/create",
    createAlert
);


// Get all active alerts of guardian
router.get(
    "/active/:guardianId",
    getActiveAlerts
);


router.get(
    "/latest/:wearerId",
    getLatestAlert
);


router.put(
    "/acknowledge/:alertId",
    acknowledgeAlert
);


router.get(
    "/history/:wearerId",
    getAlertHistory
);


router.delete(
    "/history/wearer/:wearerId",
    deleteWearerAlertHistory
);


router.delete(
    "/history/all/:guardianId",
    deleteAlertHistory
);


router.delete(
    "/:alertId",
    deleteAlert
);


export default router;