import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { fail } from "../utils/response.js";
dotenv.config();

export const verifyToken = (req, res, next) => {
  try {
    const authHeader =
      req.headers["authorization"] || req.headers["Authorization"];
    const token = authHeader?.split(" ")[1];
    if (!token) return fail(res, { message: "Token missing", status: 401 });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err)
        return fail(res, { message: "Invalid or expired token", status: 401 });
      req.user = decoded;
      next();
    });
  } catch (err) {
    console.error(err);
    return fail(res, { message: "Auth middleware error", error: err.message });
  }
};

// helper middleware: allow only owner or admin
export const allowOnlyOwnerOrAdmin = (req, res, next) => {
  const { id: userId } = req.user || {};
  const targetId = Number(req.params.id); // routes should provide :id
  if (!userId) return fail(res, { message: "Unauthenticated", status: 401 });

  if (Number(userId) === Number(targetId) || req.user.role === "admin") {
    return next();
  }
  return fail(res, {
    message: "Forbidden: can only manage your own profile",
    status: 403,
  });
};
