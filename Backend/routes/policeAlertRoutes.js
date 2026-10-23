import express from "express";

import {
    sendPoliceAlert,
    getPoliceStationAlerts,
    acceptPoliceAlert,
    resolvePoliceAlert
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


export default router;