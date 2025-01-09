const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("path");

// Vercel Serverless Function Setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for simplicity (adjust for security in production)
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/chatroom", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  profilePicture: String,
});
const User = mongoose.model("User", userSchema);

// Multer for File Uploads
const storage = multer.diskStorage({
  destination: "./uploads",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// API Routes
app.post("/api/register", upload.single("profilePicture"), async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    await User.create({ username, password: hashedPassword, profilePicture });
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: "Username already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (user && (await bcrypt.compare(password, user.password))) {
    res.json({ username, profilePicture: user.profilePicture });
  } else {
    res.status(400).json({ error: "Invalid username or password" });
  }
});

// Socket.io Chat Logic
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Export Server for Vercel
module.exports = app;
