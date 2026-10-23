import mongoose from "mongoose";


const alertSchema = new mongoose.Schema(
    {
        guardianId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        wearerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        // SOS or Automatic
        type: {
            type: String,
            required: true
        },

        // Active alert stays in Emergency Alerts.
        // Acknowledged/Resolved alerts remain in history.
        status: {
            type: String,
            enum: [
                "Active",
                "Acknowledged",
                "Resolved"
            ],
            default: "Active"
        },

        // Main reason responsible for the alert
        triggeredBy: {
            type: String,
            enum: [
                "SOS",
                "High Heart Rate",
                "Voice Distress",
                "Crying Detection",
                "Geofence Alert",
                "Multiple Conditions",
                "Automatic Detection",
                "Emergency"
            ],
            default: "Emergency"
        },

        // Complete monitoring values at alert time
        heartRate: {
            type: Number,
            default: null
        },

        voiceStatus: {
            type: String,
            default: "Normal"
        },

        detectedSpeech: {
            type: String,
            default: ""
        },

        microphoneStatus: {
            type: String,
            default: "Not Available"
        },

        geofenceStatus: {
            type: String,
            default: "Inside"
        }, voiceStatus: {
            type: String,
            default: "Normal"
        },

        geofenceStatus: {
            type: String,
            default: "Inside"
        },

        sos: {
            type: Boolean,
            default: false
        },

        battery: {
            type: Number,
            default: null
        },

        gsmStatus: {
            type: String,
            default: "Not Available"
        },

        latitude: {
            type: Number,
            default: null
        },

        longitude: {
            type: Number,
            default: null
        },

        message: {
            type: String,
            default: ""
        }
    },

    {
        timestamps: true
    }
);


export const Alert =
    mongoose.model(
        "Alert",
        alertSchema
    );