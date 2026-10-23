import mongoose from "mongoose";

const policeStationSchema =
    new mongoose.Schema(
        {
            stationId: {
                type: String,
                required: true,
                unique: true,
                trim: true
            },

            externalPlaceId: {
                type: String,
                default: null
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

            password: {
                type: String,
                required: true
            },

            active: {
                type: Boolean,
                default: true
            }
        },
        {
            timestamps: true
        }
    );


export const PoliceStation =
    mongoose.model(
        "PoliceStation",
        policeStationSchema
    );