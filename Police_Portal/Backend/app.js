import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { errorMiddleware } from "./error/error.js";

import policeAlertRouter from "./routes/policeAlertRoutes.js";
import policeStationRouter from "./routes/policeStationRoutes.js";


/* =========================================================
   ENVIRONMENT CONFIGURATION
========================================================= */

dotenv.config({
    path: "./config/config.env"
});


const app = express();


/* =========================================================
   CORS
========================================================= */

app.use(
    cors({

        origin: function (
            origin,
            callback
        ) {

            /*
                Allow requests without origin
                Example: Postman
            */
            if (!origin) {

                return callback(
                    null,
                    true
                );

            }


            /*
                Allow localhost
                on any frontend port
            */
            const localhostAllowed =
                /^http:\/\/localhost:\d+$/
                    .test(origin);


            /*
                Allow 127.0.0.1
                on any frontend port
            */
            const localIpAllowed =
                /^http:\/\/127\.0\.0\.1:\d+$/
                    .test(origin);


            /*
                Allow deployed Police Portal frontend
            */
            const deployedFrontendAllowed =
                process.env.FRONTEND_URL &&
                origin ===
                    process.env.FRONTEND_URL;


            if (
                localhostAllowed ||
                localIpAllowed ||
                deployedFrontendAllowed
            ) {

                return callback(
                    null,
                    true
                );

            }


            console.log(
                "CORS blocked origin:",
                origin
            );


            return callback(
                new Error(
                    "CORS blocked this origin"
                )
            );

        },


        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"
        ],


        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ],


        credentials: true

    })
);


/* =========================================================
   BODY PARSERS
========================================================= */

app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended: true
    })
);


/* =========================================================
   TEST ROUTE
========================================================= */

app.get(
    "/api/test",
    (req, res) => {

        res.status(200).json({

            success: true,

            message:
                "Police Portal Backend Connected Successfully"

        });

    }
);


/* =========================================================
   POLICE PORTAL ROUTES
========================================================= */


/*
    Police Emergency Alerts

    POST /api/v1/police-alert/send

    GET  /api/v1/police-alert/station/:policeStationId

    PUT  /api/v1/police-alert/accept/:alertId

    PUT  /api/v1/police-alert/resolve/:alertId
*/

app.use(
    "/api/v1/police-alert",
    policeAlertRouter
);


/*
    Police Station

    POST /api/v1/police-stations/register

    POST /api/v1/police-stations/login

    GET  /api/v1/police-stations/all

    GET  /api/v1/police-stations/:stationId
*/

app.use(
    "/api/v1/police-stations",
    policeStationRouter
);


/* =========================================================
   404 - ROUTE NOT FOUND
========================================================= */

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message:
                "Police Portal API route not found."

        });

    }
);


/* =========================================================
   ERROR MIDDLEWARE
========================================================= */

app.use(
    errorMiddleware
);


export default app;