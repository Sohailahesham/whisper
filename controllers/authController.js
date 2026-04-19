import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function signup(req, res, next) {
  // TODO:
  // Hint: validate already ran (see routes). Pull { username, email, password, displayName } from req.body.
  // Check duplicate email/username -> 409. Hash password with User.hashPassword, create user,
  // signToken(user), respond 201 { token, user }. toJSON strips passwordHash automatically.
  // Mongo duplicate-key errors (err.code === 11000) must also become 409.
  // See: docs/API.md "POST /api/auth/signup", tester/tests/auth.test.js
  try {
    const { username, email, password, displayName } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      throw new HttpError(
        409,
        existing.email === email
          ? "Email already in use"
          : "Username already taken",
      );
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username,
      email,
      passwordHash,
      displayName,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: user.toJSON() });
  } catch (err) {
    if (err.code === 11000) {
      return next(new HttpError(409, "Email or username already in use"));
    }
    next(err);
  }
}

export async function login(req, res, next) {
  // TODO:
  // Hint: find user by email. If missing OR comparePassword fails, 401 with a GENERIC message
  // (don't leak which half was wrong). On success return { token, user }.
  // See: docs/API.md "POST /api/auth/login", tester/tests/auth.test.js
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const valid = user && (await user.comparePassword(password));
    if (!valid) {
      throw new HttpError(401, "Invalid credentials");
    }

    const token = signToken(user);
    res.json({ token, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  // TODO:cl
  // Hint: authenticate middleware has already attached the user — just return it.
  // See: docs/API.md "GET /api/auth/me", tester/tests/auth.test.js
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");
    return res.json(user);
  } catch (error) {
    next(error);
  }
}
