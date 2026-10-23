import express from "express";

import {
    updateMonitoring,
    getLatestMonitoring
} from "../controllers/monitoringController.js";


const router =
    express.Router();


router.post(
    "/update",
    updateMonitoring
);


router.get(
    "/latest/:wearerId",
    getLatestMonitoring
);


export default router;