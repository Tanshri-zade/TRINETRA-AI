import mongoose from "mongoose";

const wearerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    type: {
        type: String,
        enum: ["woman", "child"],
        required: true
    },

    deviceId: {
        type: String,
        default: null
    }

});


const guardianSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    mobile: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    wearers: {
        type: [wearerSchema],
        default: []
    }

});


export const Guardian =
    mongoose.model("Guardian", guardianSchema);