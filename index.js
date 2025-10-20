import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import pkg from "pg";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger/swaggerConfig.js";

// Load environment variables
dotenv.config();

const { Pool } = pkg;
const app = express();

// Middleware untuk parsing body JSON dan URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware keamanan
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);

// Routing
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

// Swagger UI mounting strategy:
// - In development (NODE_ENV !== 'production'): expose /api/docs without auth for convenience.
// - In production: only mount if SWAGGER_USER and SWAGGER_PASS are provided (protected by basic auth).
if (process.env.NODE_ENV !== "production") {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
} else if (process.env.SWAGGER_USER && process.env.SWAGGER_PASS) {
  // simple basic auth middleware for swagger
  const swaggerAuth = (req, res, next) => {
    const auth = req.headers["authorization"];
    if (!auth?.startsWith("Basic ")) {
      res.setHeader("WWW-Authenticate", 'Basic realm="API Docs"');
      return res.status(401).send("Authentication required");
    }
    const base64Credentials = auth.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString(
      "ascii"
    );
    const [user, pass] = credentials.split(":");
    if (
      user === process.env.SWAGGER_USER &&
      pass === process.env.SWAGGER_PASS
    ) {
      return next();
    }
    res.setHeader("WWW-Authenticate", 'Basic realm="API Docs"');
    return res.status(403).send("Forbidden");
  };

  app.use(
    "/api/docs",
    swaggerAuth,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
}

// Endpoint dasar (health check)
app.get("/", (req, res) => res.json({ status: "ok", time: new Date() }));

// Koneksi ke database PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tes koneksi database
pool
  .connect()
  .then(() => console.log("✅ Database connected successfully!"))
  .catch((err) => console.error("❌ Database connection error:", err.stack));

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
