import express from "express";

import {
    registerPoliceStation,
    loginPoliceStation,
    getPoliceStations,
    getPoliceStation
}
from "../controllers/policeStationController.js";

import {
    getNearbyPoliceStations
}
from "../controllers/nearbyPoliceController.js";


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


// Get all nearby real police stations
router.get(
    "/nearby",
    getNearbyPoliceStations
);


router.get(
    "/:stationId",
    getPoliceStation
);


export default router;