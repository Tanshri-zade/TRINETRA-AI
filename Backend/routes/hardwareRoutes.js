import express from "express";
import { receiveHardwareTelemetry, hardwareHealth, getLatestHardwareTelemetry } from "../controllers/hardwareController.js";
const router=express.Router();
router.get("/health",hardwareHealth);
router.get("/latest",getLatestHardwareTelemetry);
router.post("/telemetry",receiveHardwareTelemetry);
export default router;
