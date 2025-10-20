import express from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
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
 *       201:
 *         description: Created
 */
router.post(
  "/register",
  [
    body("username").notEmpty().withMessage("username is required"),
    body("email").isEmail().withMessage("valid email is required"),
    body("password").isString().withMessage("password is required"),
  ],
  register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user and return JWT
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post(
  "/login",
  [body("email").isEmail(), body("password").notEmpty()],
  login
);

export default router;
