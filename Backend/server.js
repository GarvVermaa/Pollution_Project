import express from "express";
import cors from "cors";
import analysisRoutes from "./routes/analysis.js";
import "dotenv/config";
import waterRoutes from "./routes/water.js";
import soilRoutes from "./routes/soil.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ── CORS Configuration ────────────────────────────────────────────────
// SECURITY FIX: Default to restrictive CORS instead of allowing any origin
// Only allow explicitly configured origins or localhost development URLs
const allowedOrigins = process.env.FRONTEND_URL
 ? [process.env.FRONTEND_URL, "http://127.0.0.1:5500", "http://localhost:5500", "http://localhost:3000"]
 : ["http://localhost:5500", "http://localhost:3000", "http://127.0.0.1:5500"];

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
      callback(new Error("CORS not allowed from this origin"));
    }
  },
  credentials: true
}));
app.use(express.json());

// ── Routes ──
app.use("/api", analysisRoutes);
app.use("/api/water", waterRoutes);
app.use("/api/soil", soilRoutes);

// ── Health check ──
app.get("/api/health", (req, res) => {
 res.json({ status: "ok", message: "Vayu backend is running" });
});

// ── Centralized Error Handling Middleware ────────────────────────────
// SECURITY FIX: Catch-all error handler to prevent server crashes
app.use((err, req, res, next) => {
 console.error("❌ Server error:", {
   timestamp: new Date().toISOString(),
   url: req.url,
   method: req.method,
   error: err.message,
   stack: err.stack
 });

 // Don't leak stack traces in production
 const isDev = process.env.NODE_ENV === 'development';
 
 res.status(err.status || 500).json({
   status: "error",
   message: err.message || "Internal server error",
   ...(isDev && { stack: err.stack })
 });
});

// ── 404 Handler ───────────────────────────────────────────────────────
app.use("*", (req, res) => {
 res.status(404).json({
   status: "error",
   message: `Route ${req.method} ${req.originalUrl} not found`
 });
});

app.listen(PORT, () => {
 console.log(`Backend running at http://localhost:${PORT}`);
 console.log(`Health check: http://localhost:${PORT}/api/health`);
 console.log(`Past data: http://localhost:${PORT}/api/past/city/Delhi`);
 console.log(`Live AQI: http://localhost:${PORT}/api/present/city/Delhi`);
 console.log(`ML Forecast: http://localhost:${PORT}/api/future/city/Delhi`);
});