import mongoose from "mongoose";


const locationSchema =
    new mongoose.Schema({

        wearerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true
        },

        latitude: {
            type: Number,
            required: true
        },

        longitude: {
            type: Number,
            required: true
        },

        insideSafeZone: {
            type: Boolean,
            default: null
        },

        deviceId: {
            type: String,
            default: null
        }

    },
    {
        timestamps: true
    });


export const Location =
    mongoose.model(
        "Location",
        locationSchema
    );