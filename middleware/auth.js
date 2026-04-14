import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { HttpError } from "./errorHandler.js";

export async function authenticate(req, _res, next) {
  // TODO:
  // Hint: read Authorization: Bearer <token>. Verify with jwt.verify(token, JWT_SECRET).
  // Load User.findById(payload.sub). Attach to req.user. Any failure -> 401.
  // See: docs/API.md "Authentication", tester/tests/auth.test.js
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new HttpError(401, "Missing or malformed Authorization header");
    }

    const token = header.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) throw new HttpError(401, "User no longer exists");

    req.user = user;
    next();
  } catch (err) {
    if (
      err instanceof jwt.JsonWebTokenError
      || err instanceof jwt.TokenExpiredError
    ) {
      return next(new HttpError(401, "Invalid or expired token"));
    }
    next(err);
  }
}

export function signToken(user) {
  // TODO:
  // Hint: jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN || '7d' })
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
