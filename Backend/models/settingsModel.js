import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
    {
        guardianId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Guardian",
            required: true,
            unique: true
        },

        theme: {
            type: String,
            enum: ["system", "light", "dark"],
            default: "system"
        },

        language: {
            type: String,
            enum: ["en", "hi", "mr"],
            default: "en"
        },

        emergencyContact: {

            name: {
                type: String,
                default: ""
            },

            number: {
                type: String,
                default: ""
            }
        },

        notifications: {

            emergencyAlerts: {
                type: Boolean,
                default: true
            },

            geofenceAlerts: {
                type: Boolean,
                default: true
            },

            voiceAlerts: {
                type: Boolean,
                default: true
            },

            tamperAlerts: {
                type: Boolean,
                default: true
            },

            lowBatteryAlerts: {
                type: Boolean,
                default: true
            }
        },

        safety: {

            defaultSafeZoneRadius: {
                type: Number,
                enum: [100, 250, 500, 1000],
                default: 100
            },

            policeConfirmation: {
                type: Boolean,
                default: true
            },

            locationSharing: {
                type: Boolean,
                default: true
            },

            minBpm: {
                type: Number,
                default: 50
            },

            maxBpm: {
                type: Number,
                default: 120
            },


        },

        privacy: {

            locationHistory: {
                type: Boolean,
                default: true
            },

            alertHistory: {
                type: Boolean,
                default: true
            }
        }
    },
    {
        timestamps: true
    }
);

export const Settings =
    mongoose.model(
        "Settings",
        settingsSchema
    );