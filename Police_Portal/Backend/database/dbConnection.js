import mongoose from 'mongoose';

export const dbConnection = () => {
    mongoose
    .connect(process.env.MONGO_URI, {
        dbName: "Trinetra-AI"
    })
        .then(() => {
            console.log("Database connected successfully");
        }).catch(err => {
            console.log(`Some error occurred while connecting to the database: ${err}`);
        })
};

export default dbConnection;
