import mongoose from "mongoose";

const policeAlertSchema = new mongoose.Schema(
    {
        /* =========================
           SOURCE DETAILS
        ========================= */

        guardianId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        wearerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },


        /* =========================
           GUARDIAN DETAILS
        ========================= */

        guardianName: {
            type: String,
            default: ""
        },

        guardianPhone: {
            type: String,
            default: ""
        },

        guardianEmail: {
            type: String,
            default: ""
        },


        /* =========================
           WEARER DETAILS
        ========================= */

        wearerName: {
            type: String,
            required: true
        },

        wearerType: {
            type: String,
            enum: ["woman", "child"],
            required: true
        },

        deviceId: {
            type: String,
            default: null
        },


        /* =========================
           POLICE STATION DETAILS
        ========================= */

        policeStationId: {
            type: String,
            required: true
        },

        externalPlaceId: {
            type: String,
            default: null
        },

        policeStationName: {
            type: String,
            default: ""
        },

        policeStationAddress: {
            type: String,
            default: ""
        },

        policeStationPhone: {
            type: String,
            default: ""
        },


        /* =========================
           EMERGENCY LOCATION
        ========================= */

        latitude: {
            type: Number,
            required: true
        },

        longitude: {
            type: Number,
            required: true
        },

        distanceKm: {
            type: Number,
            default: null
        },


        /* =========================
           ALERT DETAILS
        ========================= */

        alertType: {
            type: String,
            default: "Emergency Alert"
        },

        recommended: {
            type: Boolean,
            default: false
        },

        repeatAlertCount: {
            type: Number,
            default: 1
        },

        lastAlertAt: {
            type: Date,
            default: Date.now
        },


        /* =========================
           POLICE RESPONSE STATUS
        ========================= */

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