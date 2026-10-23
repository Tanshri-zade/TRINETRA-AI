import express from "express";

import {
    updateDeviceStatus,
    getDeviceStatus
}
from "../controllers/deviceStatusController.js";


const router = express.Router();


// Update device status

router.post(
    "/update",
    updateDeviceStatus
);


// Get latest device status

router.get(
    "/:wearerId",
    getDeviceStatus
);


export default router;