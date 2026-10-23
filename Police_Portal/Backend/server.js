import dotenv from "dotenv";

import app from "./app.js";

import { dbConnection } from "./database/dbConnection.js";


dotenv.config({
    path: "./config/config.env"
});


const PORT =
    process.env.PORT || 5000;


const startServer = async () => {

    try {

        console.log(
            "Connecting to Police database..."
        );


        await dbConnection();


        app.listen(
            PORT,
            "0.0.0.0",
            () => {

                console.log(
                    `Police server running on port ${PORT}`
                );

            }
        );

    }

    catch (error) {

        console.error(
            "Police server startup failed:",
            error
        );


        process.exit(1);

    }

};


startServer();