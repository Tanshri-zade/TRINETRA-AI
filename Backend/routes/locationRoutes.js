import express from "express";

import {
    updateLocation,
    getLatestLocation
}
from "../controllers/locationController.js";


const router = express.Router();


// ESP32 / DEVICE SENDS LOCATION

router.post(
    "/update",
    updateLocation
);


// FRONTEND GETS LATEST LOCATION

router.get(
    "/latest/:wearerId",
    getLatestLocation
);


export default router;