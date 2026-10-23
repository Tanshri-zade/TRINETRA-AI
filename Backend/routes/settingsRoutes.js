import express from "express";

import {
    getSettings,
    updateSettings
}
from "../controllers/settingsController.js";


const router =
    express.Router();


// Get guardian settings

router.get(
    "/:guardianId",
    getSettings
);


// Update guardian settings

router.put(
    "/:guardianId",
    updateSettings
);


export default router;