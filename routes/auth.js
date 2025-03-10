const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const User = require("../models/User");
const dotenv = require("dotenv");
const authMiddleware = require("../middleware/auth"); // ✅ Import auth middleware

dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Test Route
router.get("/test", (req, res) => {
    res.json({ msg: "Auth route is working!" });
});

// ✅ Register Route
router.post(
    "/register",
    [
        check("name", "Name is required").not().isEmpty(),
        check("email", "Valid email is required").isEmail(),
        check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (user) return res.status(400).json({ msg: "User already exists" });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            user = new User({ name, email, password: hashedPassword });
            await user.save();

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
            res.json({ token, msg: "User registered successfully!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Server error" });
        }
    }
);

// ✅ Login Route
router.post(
    "/login",
    [
        check("email", "Valid email is required").isEmail(),
        check("password", "Password is required").exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            if (!user) return res.status(400).json({ msg: "Invalid credentials" });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

            const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });
            res.json({ token, msg: "Login successful!" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Server error" });
        }
    }
);

// ✅ Protected Route (Requires Token)
router.get("/protected", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user).select("-password"); // Exclude password from response
        if (!user) return res.status(404).json({ msg: "User not found" });

        res.json({ msg: "This is a protected route", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Server error" });
    }
});

module.exports = router;
