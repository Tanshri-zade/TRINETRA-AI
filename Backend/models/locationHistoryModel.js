import mongoose from "mongoose";


const locationHistorySchema =
    new mongoose.Schema(
        {
            wearerId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                index: true
            },

            latitude: {
                type: Number,
                required: true
            },

            longitude: {
                type: Number,
                required: true
            },

            deviceId: {
                type: String,
                default: null
            },

            arrivedAt: {
                type: Date,
                required: true,
                default: Date.now
            },

            lastSeenAt: {
                type: Date,
                required: true,
                default: Date.now
            },

            leftAt: {
                type: Date,
                default: null
            },

            durationSeconds: {
                type: Number,
                default: 0
            },

            isCurrent: {
                type: Boolean,
                default: true
            }
        },
        {
            timestamps: true
        }
    );


locationHistorySchema.index({
    wearerId: 1,
    isCurrent: 1,
    updatedAt: -1
});


export const LocationHistory =
    mongoose.model(
        "LocationHistory",
        locationHistorySchema
    );