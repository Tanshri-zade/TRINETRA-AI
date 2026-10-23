import mongoose from "mongoose";


const monitoringSchema =
    new mongoose.Schema(
        {
            guardianId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },

            wearerId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                unique: true
            },

            profile: {
                type: String,
                required: true
            },

            heartRate: {
                type: Number,
                default: null
            },

            latitude: {
                type: Number,
                default: null
            },

            longitude: {
                type: Number,
                default: null
            },

            geofenceStatus: {
                type: String,
                default: "Inside"
            },

            // Current voice analysis result
            voiceStatus: {
                type: String,
                default: "Normal"
            },

            // Actual speech detected from wearer
            detectedSpeech: {
                type: String,
                default: ""
            },

            // Wristband microphone status
            microphoneStatus: {
                type: String,
                default: "Disconnected"
            },

            battery: {
                type: Number,
                default: null
            },

            gsmStatus: {
                type: String,
                default: "Disconnected"
            },

            sos: {
                type: Boolean,
                default: false
            },

            safetyStatus: {
                type: String,
                default: "Safe"
            }
        },
        {
            timestamps: true
        }
    );


export const Monitoring =
    mongoose.model(
        "Monitoring",
        monitoringSchema
    );