import express from "express";

import {
    sendPoliceAlert,
    getPoliceStationAlerts,
    acceptPoliceAlert,
    resolvePoliceAlert,
    deletePoliceAlert,
    deleteAllResolvedPoliceAlerts
}
from "../controllers/policeAlertController.js";


const router = express.Router();


// Send alert

router.post(
    "/send",
    sendPoliceAlert
);


// Get alerts for police station

router.get(
    "/station/:policeStationId",
    getPoliceStationAlerts
);


// Accept alert

router.put(
    "/accept/:alertId",
    acceptPoliceAlert
);


// Resolve alert

router.put(
    "/resolve/:alertId",
    resolvePoliceAlert
);


// Delete individual resolved alert

router.delete(
    "/delete/:alertId",
    deletePoliceAlert
);


// Delete all resolved alerts of police station

router.delete(
    "/delete-resolved/:policeStationId",
    deleteAllResolvedPoliceAlerts
);


export default router;

