import dotenv from "dotenv";

import app from "./app.js";

import { dbConnection } from "./database/dbConnection.js";


dotenv.config({
    path: "./config/config.env"
});


const PORT =
    process.env.PORT || 4000;


const startServer = async () => {

    try {

        console.log(
            "Connecting to database..."
        );


        await dbConnection();


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Server running on port ${PORT} (0.0.0.0)`
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Server startup failed:",
            error
        );


        process.exit(1);

    }

};


startServer();