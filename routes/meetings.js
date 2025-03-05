const express = require("express");
const authMiddleware = require("../middleware/auth"); // 🔒 Protect routes
const Meeting = require("../models/Meeting");

const router = express.Router();

// ✅ Create a Meeting
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { title, scheduledTime, duration } = req.body;

        if (!title || !scheduledTime || !duration) {
            return res.status(400).json({ msg: "All fields are required!" });
        }

        const meetingLink = `https://yourdomain.com/meeting/${Date.now()}`;

        const meeting = new Meeting({
            title,
            host: req.user.userId, // From authMiddleware
            scheduledTime,
            duration,
            meetingLink,
            participants: [req.user.userId], // Auto-add host
        });

        await meeting.save();
        res.json({ msg: "Meeting created successfully!", meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Get all Meetings for a User
router.get("/my-meetings", authMiddleware, async (req, res) => {
    try {
        const meetings = await Meeting.find({ host: req.user.userId });
        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Join a Meeting
router.post("/join/:meetingId", authMiddleware, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        if (!meeting) return res.status(404).json({ msg: "Meeting not found!" });

        if (!meeting.participants.includes(req.user.userId)) {
            meeting.participants.push(req.user.userId);
            await meeting.save();
        }

        res.json({ msg: "Joined the meeting!", meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

// ✅ Delete a Meeting (Only Host)
router.delete("/delete/:meetingId", authMiddleware, async (req, res) => {
    try {
        const meeting = await Meeting.findById(req.params.meetingId);
        if (!meeting) return res.status(404).json({ msg: "Meeting not found!" });

        if (meeting.host.toString() !== req.user.userId) {
            return res.status(403).json({ msg: "Unauthorized to delete this meeting!" });
        }

        await meeting.deleteOne();
        res.json({ msg: "Meeting deleted successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
