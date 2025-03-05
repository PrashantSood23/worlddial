const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header("Authorization");

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
        req.user = decoded.userId;  // Attach user ID to request
        next();
    } catch (err) {
        res.status(401).json({ msg: "Token is not valid" });
    }
};
