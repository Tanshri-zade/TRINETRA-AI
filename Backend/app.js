import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { errorMiddleware } from "./error/error.js";

import guardianRouter from "./routes/guardianRoute.js";
import locationRouter from "./routes/locationRoutes.js";
import safeZoneRouter from "./routes/safeZoneRoutes.js";
import alertRouter from "./routes/alertRoutes.js";
import policeAlertRouter from "./routes/policeAlertRoutes.js";
import deviceStatusRouter from "./routes/deviceStatusRoutes.js";
import settingsRouter from "./routes/settingsRoutes.js";
import voiceRouter from "./routes/voiceRoutes.js";
import monitoringRouter from "./routes/monitoringRoutes.js";
import policeStationRouter from "./routes/policeStationRoutes.js";
import hardwareRouter from "./routes/hardwareRoutes.js";


dotenv.config({
    path: "./config/config.env"
});


const app = express();


app.use(
    cors({
        origin: function (origin, callback) {

            // Postman / server-to-server / curl / hardware requests without Origin header
            if (!origin) {
                return callback(null, true);
            }

            const cleanOrigin = origin.replace(/\/+$/, "");

            const configuredOrigins = [
                process.env.FRONTEND_URL ? process.env.FRONTEND_URL.replace(/\/+$/, "") : null,
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://localhost:5500",
                "http://localhost:5501",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5500",
                "http://127.0.0.1:5501"
            ].filter(Boolean);

            const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/.test(cleanOrigin);

            if (configuredOrigins.includes(cleanOrigin) || isLocalhost) {
                return callback(null, true);
            }

            return callback(
                new Error(
                    `CORS blocked for origin: ${origin}`
                )
            );
        },


        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS"
        ],


        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "Cache-Control",
            "Pragma"
        ],


        credentials: true
    })
);


app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended: true
    })
);


app.get(
    "/api/test",
    (req, res) => {

        res.status(200).json({
            success: true,
            message:
                "Frontend and Backend Connected Successfully"
        });

    }
);


app.use(
    "/api/v1/guardian",
    guardianRouter
);


app.use(
    "/api/v1/location",
    locationRouter
);


app.use(
    "/api/v1/safe-zone",
    safeZoneRouter
);


app.use(
    "/api/v1/alert",
    alertRouter
);


app.use(
    "/api/v1/alerts",
    alertRouter
);


app.use(
    "/api/v1/police-alert",
    policeAlertRouter
);


app.use(
    "/api/v1/police-alerts",
    policeAlertRouter
);


app.use(
    "/api/v1/device-status",
    deviceStatusRouter
);


app.use(
    "/api/v1/settings",
    settingsRouter
);


app.use(
    "/api/v1/voice",
    voiceRouter
);


app.use(
    "/api/v1/monitoring",
    monitoringRouter
);


app.use(
    "/api/v1/police-stations",
    policeStationRouter
);

app.use(
    "/api/v1/hardware",
    hardwareRouter
);


app.use(
    errorMiddleware
);


export default app;