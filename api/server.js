const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

// Configure the database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// Middleware to parse JSON and log incoming requests
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Test endpoint for health check
app.get("/api/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json({ status: "ok", time: result.rows[0].now });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ status: "error", message: "Database connection failed" });
  }
});

// Register user
app.post("/api/register", async (req, res) => {
  const { username, password, profile_picture } = req.body;

  if (!username || !password) {
    console.error("Missing username or password in request body.");
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (username, password, profile_picture)
       VALUES ($1, $2, $3) RETURNING id`,
      [username, password, profile_picture || null]
    );

    console.log(`User registered: ${username} (ID: ${result.rows[0].id})`);
    res.status(201).json({ message: "User registered successfully!", userId: result.rows[0].id });
  } catch (err) {
    console.error("Error inserting user into database:", err);
    if (err.code === "23505") {
      res.status(409).json({ error: "Username already exists." });
    } else {
      res.status(500).json({ error: "Failed to register user." });
    }
  }
});

// Login user
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    console.error("Missing username or password in request body.");
    return res.status(400).json({ error: "Username and password are required." });
  }

  try {
    const result = await pool.query(
      `SELECT id, profile_picture FROM users WHERE username = $1 AND password = $2`,
      [username, password]
    );

    if (result.rows.length === 0) {
      console.log(`Login failed for user: ${username}`);
      return res.status(401).json({ error: "Invalid username or password." });
    }

    console.log(`User logged in: ${username} (ID: ${result.rows[0].id})`);
    res.status(200).json({ message: "Login successful!", user: result.rows[0] });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Failed to log in." });
  }
});

// Handle chat messages (simplified for now)
app.post("/api/chat", async (req, res) => {
  const { username, message } = req.body;

  if (!username || !message) {
    console.error("Missing username or message in request body.");
    return res.status(400).json({ error: "Username and message are required." });
  }

  console.log(`Message from ${username}: ${message}`);
  res.status(200).json({ message: "Message received." });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
