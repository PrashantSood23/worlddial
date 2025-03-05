const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",  // Change this to your frontend URL after deployment
        methods: ["GET", "POST"]
    }
});

app.use(cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// ✅ WebRTC Signaling with Socket.IO
io.on("connection", (socket) => {
    console.log("⚡ New user connected:", socket.id);

    socket.on("join-room", ({ roomId, userId }) => {
        socket.join(roomId);
        socket.to(roomId).emit("user-connected", userId);

        socket.on("disconnect", () => {
            socket.to(roomId).emit("user-disconnected", userId);
            // 📨 Handle chat messages
            socket.on("send-message", ({ roomId, message, sender }) => {
              io.to(roomId).emit("receive-message", { message, sender });
           });
        });
    });

    socket.on("offer", (data) => {
        socket.to(data.roomId).emit("offer", data);
    });

    socket.on("answer", (data) => {
        socket.to(data.roomId).emit("answer", data);
    });

    socket.on("ice-candidate", (data) => {
        socket.to(data.roomId).emit("ice-candidate", data);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});

// ✅ API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/meetings", require("./routes/meetings"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
