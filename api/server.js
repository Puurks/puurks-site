const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Database Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use the DATABASE_URL environment variable
  ssl: {
    rejectUnauthorized: false, // Required for some hosted databases
  },
});

// Create Users Table if Not Exists
(async () => {
  const client = await pool.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      profile_picture TEXT
    );
  `);
  client.release();
})();

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
    const result = await pool.query(
      "INSERT INTO users (username, password, profile_picture) VALUES ($1, $2, $3) RETURNING id",
      [username, hashedPassword, profilePicture]
    );
    res.status(201).json({ message: "User registered successfully", id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Username already exists" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);

  if (result.rows.length > 0) {
    const user = result.rows[0];
    if (await bcrypt.compare(password, user.password)) {
      res.json({ username: user.username, profilePicture: user.profile_picture });
    } else {
      res.status(400).json({ error: "Invalid username or password" });
    }
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
