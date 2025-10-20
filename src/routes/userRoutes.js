import express from "express";
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadAvatar,
} from "../controllers/userController.js";
import { verifyToken, allowOnlyOwnerOrAdmin } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Get all users (protected)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/", verifyToken, getUsers);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by id (protected)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/:id", verifyToken, getUser);

// only owner or admin can update/delete
/**
 * @openapi
 * /api/users/{id}:
 *   put:
 *     summary: Update user (owner or admin)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.put("/:id", verifyToken, allowOnlyOwnerOrAdmin, updateUser);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (owner or admin)
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */
router.delete("/:id", verifyToken, allowOnlyOwnerOrAdmin, deleteUser);

// upload avatar (multipart/form-data: field name 'file')
/**
 * @openapi
 * /api/users/avatar:
 *   post:
 *     summary: Upload avatar (protected)
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: OK
 */
router.post("/avatar", verifyToken, upload.single("file"), uploadAvatar);

export default router;
