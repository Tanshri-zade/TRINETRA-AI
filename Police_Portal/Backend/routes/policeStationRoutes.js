import express from "express";

import {
    registerPoliceStation,
    loginPoliceStation,
    getPoliceStations,
    getPoliceStation
}
from "../controllers/policeStationController.js";


const router =
    express.Router();


router.post(
    "/register",
    registerPoliceStation
);


router.post(
    "/login",
    loginPoliceStation
);


router.get(
    "/all",
    getPoliceStations
);


router.get(
    "/:stationId",
    getPoliceStation
);


export default router;