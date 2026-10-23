import bcrypt from "bcrypt";
import { PoliceStation } from "../models/policeStationModel.js";

/* =========================================================
   REGISTER POLICE STATION
========================================================= */

export const registerPoliceStation = async (req, res, next) => {
    try {
        console.log("\n========== POLICE REGISTER REQUEST ==========");
        console.log("BODY:", req.body);

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

        // Registration key check
        if (
            !registrationKey ||
            registrationKey !== process.env.POLICE_REGISTRATION_KEY
        ) {
            console.log("❌ Invalid registration key");

            return res.status(403).json({
                success: false,
                message: "Invalid police registration authorization code."
            });
        }

        // Required fields check
        if (
            !stationId ||
            !name ||
            latitude === undefined ||
            longitude === undefined ||
            !password
        ) {
            console.log("❌ Required information missing");

            return res.status(400).json({
                success: false,
                message: "Required police station information is missing."
            });
        }

        // Convert latitude and longitude to number
        const stationLatitude = Number(latitude);
        const stationLongitude = Number(longitude);

        if (
            !Number.isFinite(stationLatitude) ||
            !Number.isFinite(stationLongitude)
        ) {
            console.log("❌ Invalid coordinates");

            return res.status(400).json({
                success: false,
                message: "Invalid police station coordinates."
            });
        }

        // Validate coordinate range
        if (
            stationLatitude < -90 ||
            stationLatitude > 90 ||
            stationLongitude < -180 ||
            stationLongitude > 180
        ) {
            console.log("❌ Coordinates outside valid range");

            return res.status(400).json({
                success: false,
                message: "Latitude or longitude is outside the valid range."
            });
        }

        // Password validation
        if (String(password).length < 6) {
            console.log("❌ Password too short");

            return res.status(400).json({
                success: false,
                message: "Password must contain at least 6 characters."
            });
        }

        // Clean Station ID
        const cleanStationId = String(stationId)
            .trim()
            .toUpperCase();

        console.log("Clean Station ID:", cleanStationId);

        // Check duplicate Station ID
        const existingStation = await PoliceStation.findOne({
            stationId: cleanStationId
        });

        if (existingStation) {
            console.log("❌ Station ID already registered");

            return res.status(400).json({
                success: false,
                message: "Station ID is already registered."
            });
        }

        // Check duplicate external place ID
        if (externalPlaceId && String(externalPlaceId).trim()) {
            const existingPlace = await PoliceStation.findOne({
                externalPlaceId: String(externalPlaceId).trim()
            });

            if (existingPlace) {
                console.log("❌ External Place ID already registered");

                return res.status(400).json({
                    success: false,
                    message: "This map police station is already registered."
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            String(password),
            10
        );

        console.log("✅ Password hashed successfully");

        // Create station
        const station = await PoliceStation.create({
            stationId: cleanStationId,

            externalPlaceId:
                externalPlaceId && String(externalPlaceId).trim()
                    ? String(externalPlaceId).trim()
                    : null,

            name: String(name).trim(),

            address:
                address
                    ? String(address).trim()
                    : "",

            phone:
                phone
                    ? String(phone).trim()
                    : "",

            latitude: stationLatitude,
            longitude: stationLongitude,

            password: hashedPassword,

            active: true
        });

        console.log("✅ POLICE STATION REGISTERED");
        console.log("Station ID:", station.stationId);
        console.log("MongoDB ID:", station._id);
        console.log("============================================\n");

        return res.status(201).json({
            success: true,
            message: "Police station registered successfully.",

            station: {
                _id: station._id,
                stationId: station.stationId,
                externalPlaceId: station.externalPlaceId,
                name: station.name,
                address: station.address,
                phone: station.phone,
                latitude: station.latitude,
                longitude: station.longitude,
                active: station.active
            }
        });

    } catch (error) {
        console.error("\n❌ REGISTER ERROR");
        console.error(error);
        console.error("============================================\n");

        return next(error);
    }
};


/* =========================================================
   POLICE STATION LOGIN
========================================================= */

export const loginPoliceStation = async (req, res, next) => {
    try {
        console.log("\n========== POLICE LOGIN REQUEST ==========");
        console.log("BODY:", req.body);

        const {
            stationId,
            password
        } = req.body;

        // Check required fields
        if (!stationId || !password) {
            console.log("❌ Station ID or password missing");

            return res.status(400).json({
                success: false,
                message: "Station ID and password are required."
            });
        }

        // Clean Station ID
        const cleanStationId = String(stationId)
            .trim()
            .toUpperCase();

        console.log("LOGIN STATION ID:", cleanStationId);

        // Search station
        const station = await PoliceStation.findOne({
            stationId: cleanStationId
        });

        console.log(
            "STATION FOUND:",
            station ? "YES" : "NO"
        );

        // Station not found
        if (!station) {
            console.log("❌ Station does not exist in MongoDB");
            console.log("==========================================\n");

            return res.status(401).json({
                success: false,
                message: "Invalid police station login."
            });
        }

        console.log("DATABASE STATION ID:", station.stationId);
        console.log("STATION ACTIVE:", station.active);

        // Inactive station
        if (station.active === false) {
            console.log("❌ Police station is inactive");
            console.log("==========================================\n");

            return res.status(401).json({
                success: false,
                message: "Police station account is inactive."
            });
        }

        // Make sure password exists in DB
        if (!station.password) {
            console.log("❌ No password stored for this station");
            console.log("==========================================\n");

            return res.status(401).json({
                success: false,
                message: "Police station password is not configured."
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            String(password),
            station.password
        );

        console.log("PASSWORD MATCH:", passwordMatch);

        if (!passwordMatch) {
            console.log("❌ PASSWORD DOES NOT MATCH");
            console.log("==========================================\n");

            return res.status(401).json({
                success: false,
                message: "Invalid police station login."
            });
        }

        console.log("✅ POLICE LOGIN SUCCESSFUL");
        console.log("Station:", station.name);
        console.log("Station ID:", station.stationId);
        console.log("==========================================\n");

        return res.status(200).json({
            success: true,
            message: "Police login successful.",

            station: {
                _id: station._id,
                stationId: station.stationId,
                externalPlaceId: station.externalPlaceId,
                name: station.name,
                address: station.address,
                phone: station.phone,
                latitude: station.latitude,
                longitude: station.longitude,
                active: station.active
            }
        });

    } catch (error) {
        console.error("\n❌ LOGIN ERROR");
        console.error(error);
        console.error("==========================================\n");

        return next(error);
    }
};


/* =========================================================
   GET ALL ACTIVE POLICE STATIONS
========================================================= */

export const getPoliceStations = async (req, res, next) => {
    try {
        const stations = await PoliceStation.find({
            active: true
        })
            .select("-password")
            .sort({
                name: 1
            });

        return res.status(200).json({
            success: true,
            stations
        });

    } catch (error) {
        console.error("GET POLICE STATIONS ERROR:", error);
        return next(error);
    }
};


/* =========================================================
   GET ONE POLICE STATION
========================================================= */

export const getPoliceStation = async (req, res, next) => {
    try {
        const {
            stationId
        } = req.params;

        if (!stationId) {
            return res.status(400).json({
                success: false,
                message: "Station ID is required."
            });
        }

        const cleanStationId = String(stationId)
            .trim()
            .toUpperCase();

        const station = await PoliceStation.findOne({
            stationId: cleanStationId,
            active: true
        }).select("-password");

        if (!station) {
            return res.status(404).json({
                success: false,
                message: "Police station not found."
            });
        }

        return res.status(200).json({
            success: true,
            station
        });

    } catch (error) {
        console.error("GET POLICE STATION ERROR:", error);
        return next(error);
    }
};