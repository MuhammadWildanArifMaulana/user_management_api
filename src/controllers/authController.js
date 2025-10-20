import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { validationResult } from "express-validator";
import { success, fail } from "../utils/response.js";

dotenv.config();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

const passwordPolicy = (password) => {
  // Minimum 8 characters, at least one uppercase, one lowercase, one number and one special char
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#\$%\^&\*])(?=.{8,})/;
  return re.test(password);
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, {
        message: "Validation failed",
        error: errors.array(),
        status: 400,
      });
    }

    const { username, email, password, role } = req.body;

    if (!passwordPolicy(password)) {
      return fail(res, {
        message: "Password does not meet complexity requirements",
        error:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
        status: 400,
      });
    }

    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );
    if (existing.rows.length)
      return fail(res, {
        message: "Email or username already used",
        status: 409,
      });

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const query = `INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, avatar_url, created_at`;
    const { rows } = await pool.query(query, [
      username,
      email,
      hashed,
      role || "user",
    ]);

    return success(res, {
      message: "User registered",
      data: rows[0],
      status: 201,
    });
  } catch (err) {
    console.error("register error:", err);
    return fail(res, {
      message: "Error registering user",
      error: err.message,
      status: 500,
    });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return fail(res, {
        message: "Validation failed",
        error: errors.array(),
        status: 400,
      });
    }

    const { email, password } = req.body;

    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (!rows.length)
      return fail(res, { message: "User not found", status: 404 });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return fail(res, { message: "Invalid credentials", status: 401 });

    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    });

    return success(res, { message: "Login successful", data: { token } });
  } catch (err) {
    console.error("login error:", err);
    return fail(res, {
      message: "Login failed",
      error: err.message,
      status: 500,
    });
  }
};
