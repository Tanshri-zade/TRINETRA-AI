import bcrypt from "bcrypt";

import {
    PoliceStation
}
from "../models/policeStationModel.js";


// Register police station

export const registerPoliceStation =
    async (req, res, next) => {

        try {

            const {
                stationId,
                externalPlaceId,
                name,
                address,
                phone,
                latitude,
                longitude,
                password,
                registrationKey
            } = req.body;


            if (
                !registrationKey ||
                registrationKey !==
                    process.env.POLICE_REGISTRATION_KEY
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Invalid police registration authorization code."
                });

            }


            if (
                !stationId ||
                !name ||
                latitude === undefined ||
                longitude === undefined ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Required police station information is missing."
                });

            }


            const stationLatitude =
                Number(latitude);


            const stationLongitude =
                Number(longitude);


            if (
                !Number.isFinite(
                    stationLatitude
                ) ||
                !Number.isFinite(
                    stationLongitude
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid police station coordinates."
                });

            }


            if (
                stationLatitude < -90 ||
                stationLatitude > 90 ||
                stationLongitude < -180 ||
                stationLongitude > 180
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Latitude or longitude is outside the valid range."
                });

            }


            if (
                password.length < 6
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Password must contain at least 6 characters."
                });

            }


            const cleanStationId =
                stationId
                    .trim()
                    .toUpperCase();


            const existingStation =
                await PoliceStation.findOne({
                    stationId:
                        cleanStationId
                });


            if (existingStation) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Station ID is already registered."
                });

            }


            if (externalPlaceId) {

                const existingPlace =
                    await PoliceStation.findOne({
                        externalPlaceId:
                            externalPlaceId.trim()
                    });


                if (existingPlace) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "This map police station is already registered."
                    });

                }

            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            const station =
                await PoliceStation.create({

                    stationId:
                        cleanStationId,

                    externalPlaceId:
                        externalPlaceId
                            ? externalPlaceId.trim()
                            : null,

                    name:
                        name.trim(),

                    address:
                        address
                            ? address.trim()
                            : "",

                    phone:
                        phone
                            ? phone.trim()
                            : "",

                    latitude:
                        stationLatitude,

                    longitude:
                        stationLongitude,

                    password:
                        hashedPassword,

                    active:
                        true

                });


            res.status(201).json({

                success: true,

                message:
                    "Police station registered successfully.",

                station: {

                    _id:
                        station._id,

                    stationId:
                        station.stationId,

                    externalPlaceId:
                        station.externalPlaceId,

                    name:
                        station.name,

                    address:
                        station.address,

                    phone:
                        station.phone,

                    latitude:
                        station.latitude,

                    longitude:
                        station.longitude,

                    active:
                        station.active

                }

            });

        }

        catch (error) {

            next(error);

        }

    };


// Police station login

export const loginPoliceStation =
    async (req, res, next) => {

        try {

            const {
                stationId,
                password
            } = req.body;


            if (
                !stationId ||
                !password
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Station ID and password are required."
                });

            }


            const cleanStationId =
                stationId
                    .trim()
                    .toUpperCase();


            const station =
                await PoliceStation.findOne({
                    stationId:
                        cleanStationId
                });


            if (
                !station ||
                station.active === false
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid police station login."
                });

            }


            const passwordMatch =
                await bcrypt.compare(
                    password,
                    station.password
                );


            if (!passwordMatch) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid police station login."
                });

            }


            res.status(200).json({

                success: true,

                message:
                    "Police login successful.",

                station: {

                    _id:
                        station._id,

                    stationId:
                        station.stationId,

                    externalPlaceId:
                        station.externalPlaceId,

                    name:
                        station.name,

                    address:
                        station.address,

                    phone:
                        station.phone,

                    latitude:
                        station.latitude,

                    longitude:
                        station.longitude,

                    active:
                        station.active

                }

            });

        }

        catch (error) {

            next(error);

        }

    };


// Get all active police stations

export const getPoliceStations =
    async (req, res, next) => {

        try {

            const stations =
                await PoliceStation.find({
                    active: true
                })
                .select("-password")
                .sort({
                    name: 1
                });


            res.status(200).json({

                success: true,

                stations

            });

        }

        catch (error) {

            next(error);

        }

    };


// Get one police station

export const getPoliceStation =
    async (req, res, next) => {

        try {

            const {
                stationId
            } = req.params;


            const cleanStationId =
                stationId
                    .trim()
                    .toUpperCase();


            const station =
                await PoliceStation.findOne({

                    stationId:
                        cleanStationId,

                    active:
                        true

                })
                .select("-password");


            if (!station) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Police station not found."
                });

            }


            res.status(200).json({

                success: true,

                station

            });

        }

        catch (error) {

            next(error);

        }

    };