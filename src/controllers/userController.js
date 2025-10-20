import pool from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";
import bcrypt from "bcryptjs";
import { success, fail } from "../utils/response.js";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

export const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, username, email, role, avatar_url, created_at, updated_at FROM users ORDER BY id"
    );
    return success(res, { data: rows });
  } catch (err) {
    console.error("getUsers error:", err);
    return fail(res, { message: "Failed to fetch users", error: err.message });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "SELECT id, username, email, role, avatar_url, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );
    if (!rows.length)
      return fail(res, { message: "User not found", status: 404 });
    return success(res, { data: rows[0] });
  } catch (err) {
    console.error("getUser error:", err);
    return fail(res, { message: "Failed to fetch user", error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (username) {
      fields.push(`username = $${idx++}`);
      values.push(username);
    }
    if (email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!re.test(String(email).toLowerCase()))
        return fail(res, { message: "Invalid email format", status: 400 });
      fields.push(`email = $${idx++}`);
      values.push(email);
    }
    if (password) {
      if (password.length < 8)
        return fail(res, {
          message: "Password must be at least 8 characters",
          status: 400,
        });
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      fields.push(`password = $${idx++}`);
      values.push(hashed);
    }

    if (!fields.length)
      return fail(res, { message: "No valid fields to update", status: 400 });

    const query = `UPDATE users SET ${fields.join(
      ", "
    )}, updated_at = NOW() WHERE id = $${idx} RETURNING id, username, email, role, avatar_url, created_at, updated_at`;
    values.push(id);

    const { rows } = await pool.query(query, values);
    if (!rows.length)
      return fail(res, { message: "User not found", status: 404 });

    return success(res, { message: "Profile updated", data: rows[0] });
  } catch (err) {
    console.error("updateUser error:", err);
    if (err.code === "23505")
      return fail(res, {
        message: "Username or email already in use",
        status: 409,
      });
    return fail(res, { message: "Update failed", error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      "DELETE FROM users WHERE id = $1 RETURNING id",
      [id]
    );
    if (!rows.length)
      return fail(res, { message: "User not found", status: 404 });
    return success(res, { message: "User deleted", data: rows[0] });
  } catch (err) {
    console.error("deleteUser error:", err);
    return fail(res, { message: "Delete failed", error: err.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file)
      return fail(res, { message: "No file uploaded", status: 400 });

    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "avatars", resource_type: "image" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await uploadStream();
    const userId = req.user.id;

    await pool.query(
      "UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2",
      [result.secure_url, userId]
    );
    return success(res, {
      message: "Avatar uploaded",
      data: { url: result.secure_url },
    });
  } catch (err) {
    console.error("uploadAvatar error:", err);
    return fail(res, { message: "Upload failed", error: err.message });
  }
};
