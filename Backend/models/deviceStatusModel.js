import mongoose from "mongoose";

const deviceStatusSchema = new mongoose.Schema(
    {
        wearerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            unique: true
        },

        deviceId: {
            type: String,
            default: null
        },

        battery: {
            type: Number,
            default: null
        },

        heartRate: {
            type: Number,
            default: null
        },

        gpsStatus: {
            type: String,
            default: "Not Available"
        },

        gsmStatus: {
            type: String,
            default: "Not Available"
        },

        microphoneStatus: {
            type: String,
            default: "Not Available"
        },

        sosButtonStatus: {
            type: String,
            default: "Not Available"
        },

        tamperStatus: {
            type: String,
            default: "Not Available"
        },

        lastSeen: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


export const DeviceStatus =
    mongoose.model(
        "DeviceStatus",
        deviceStatusSchema
    );