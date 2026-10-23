import mongoose from "mongoose";


const policeAlertSchema =
    new mongoose.Schema(
        {

            /* =========================================
               GUARDIAN INFORMATION
            ========================================= */

            guardianId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Guardian",
                required: true
            },

            guardianName: {
                type: String,
                default: "",
                trim: true
            },

            guardianPhone: {
                type: String,
                default: "",
                trim: true
            },

            guardianEmail: {
                type: String,
                default: "",
                trim: true
            },


            /* =========================================
               WEARER INFORMATION
            ========================================= */

            wearerId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },

            wearerName: {
                type: String,
                required: true,
                trim: true
            },

            wearerType: {
                type: String,

                enum: [
                    "woman",
                    "child"
                ],

                required: true
            },

            deviceId: {
                type: String,
                default: null,
                trim: true
            },


            /* =========================================
               POLICE STATION INFORMATION
            ========================================= */

            policeStationId: {
                type: String,
                required: true,
                trim: true
            },

            externalPlaceId: {
                type: String,
                default: null
            },

            policeStationName: {
                type: String,
                default: "",
                trim: true
            },

            policeStationAddress: {
                type: String,
                default: "",
                trim: true
            },

            policeStationPhone: {
                type: String,
                default: "",
                trim: true
            },


            /* =========================================
               LOCATION
            ========================================= */

            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            },


            /* =========================================
               ALERT INFORMATION
            ========================================= */

            alertType: {
                type: String,
                default: "Emergency Alert",
                trim: true
            },

            distanceKm: {
                type: Number,
                default: null
            },

            recommended: {
                type: Boolean,
                default: false
            },


            /* =========================================
               REPEATED ALERT INFORMATION
            ========================================= */

            repeatAlertCount: {
                type: Number,
                default: 1
            },

            lastAlertAt: {
                type: Date,
                default: Date.now
            },


            /* =========================================
               STATUS
            ========================================= */

            status: {
                type: String,

                enum: [
                    "Pending",
                    "Accepted",
                    "Resolved"
                ],

                default: "Pending"
            },

            acceptedAt: {
                type: Date,
                default: null
            },

            resolvedAt: {
                type: Date,
                default: null
            }

        },

        {
            timestamps: true
        }
    );


export const PoliceAlert =
    mongoose.models.PoliceAlert ||
    mongoose.model(
        "PoliceAlert",
        policeAlertSchema
    );


export default PoliceAlert;