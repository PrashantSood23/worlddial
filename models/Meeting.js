const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    scheduledTime: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number, // Duration in minutes
        required: true,
    },
    meetingLink: {
        type: String,
        required: true,
        unique: true,
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
}, { timestamps: true });

module.exports = mongoose.model("Meeting", MeetingSchema);
