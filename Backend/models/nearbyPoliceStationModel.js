import mongoose from "mongoose";

const nearbyPoliceStationSchema =
    new mongoose.Schema(
        {
            osmId: {
                type: String,
                required: true,
                unique: true,
                trim: true
            },

            name: {
                type: String,
                required: true,
                trim: true
            },

            address: {
                type: String,
                default: ""
            },

            phone: {
                type: String,
                default: ""
            },

            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            },

            source: {
                type: String,
                default: "OpenStreetMap"
            },

            lastUpdated: {
                type: Date,
                default: Date.now
            }
        },
        {
            timestamps: true
        }
    );


// Helps when working with station coordinates
nearbyPoliceStationSchema.index({
    latitude: 1,
    longitude: 1
});


export const NearbyPoliceStation =
    mongoose.model(
        "NearbyPoliceStation",
        nearbyPoliceStationSchema
    );