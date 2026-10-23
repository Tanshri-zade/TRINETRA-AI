import mongoose from "mongoose";


export const dbConnection = async () => {

    try {

        const connection =
            await mongoose.connect(
                process.env.MONGO_URI,
                {
                    dbName: "Trinetra-AI",
                    serverSelectionTimeoutMS: 30000,
                    connectTimeoutMS: 30000
                }
            );


        console.log(
            "Database connected successfully"
        );


        return connection;

    }

    catch (error) {

        console.error(
            "Database connection failed:",
            error.message
        );


        throw error;

    }

};


export default dbConnection;