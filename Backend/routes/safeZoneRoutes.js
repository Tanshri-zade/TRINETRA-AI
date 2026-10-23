import express from "express";

import {
    saveSafeZone,
    getSafeZone
}
from "../controllers/safeZoneController.js";


const router = express.Router();


// SAVE / UPDATE SAFE ZONE

router.post(
    "/save",
    saveSafeZone
);


// GET SAVED SAFE ZONE

router.get(
    "/:wearerId",
    getSafeZone
);


export default router;