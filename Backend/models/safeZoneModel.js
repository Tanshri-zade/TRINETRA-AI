import mongoose from "mongoose";


const safeZoneSchema = new mongoose.Schema(
    {

        guardianId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        wearerId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },

        latitude: {
            type: Number,
            required: true
        },

        longitude: {
            type: Number,
            required: true
        },

        name: {
            type: String,
            default: "Home",
            trim: true
        },

        radius: {
            type: Number,
            required: true,
            min: 50,
            max: 5000
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


// One safe zone per wearer

safeZoneSchema.index(
    {
        guardianId: 1,
        wearerId: 1
    },
    {
        unique: true
    }
);


export const SafeZone =
    mongoose.model(
        "SafeZone",
        safeZoneSchema
    );